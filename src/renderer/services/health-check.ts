import { awsConfig } from '../config/aws-config';

export interface HealthCheckResponse {
  success: boolean;
  status: 'healthy' | 'unhealthy' | 'unknown';
  timestamp: string;
  version?: string;
  environment?: string;
  uptime?: number;
  message?: string;
}

export interface APIConnectionStatus {
  isConnected: boolean;
  endpoint: string;
  responseTime: number;
  lastChecked: string;
  error?: string;
}

class HealthCheckService {
  private lastHealthCheck: HealthCheckResponse | null = null;
  private lastCheckTime: number = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds cache

  /**
   * Test API connectivity using the public health check endpoint
   */
  async checkAPIHealth(useBackup: boolean = false): Promise<HealthCheckResponse> {
    const now = Date.now();
    
    // Return cached result if still valid
    if (this.lastHealthCheck && (now - this.lastCheckTime) < this.CACHE_DURATION) {
      console.log('🔄 Returning cached health check result:', this.lastHealthCheck);
      return this.lastHealthCheck;
    }

    const endpoint = useBackup ? awsConfig.backupApiUrl : awsConfig.apiGatewayUrl;
    const healthUrl = `${endpoint}${awsConfig.healthCheckEndpoint}`;

    console.log(`🏥 Starting health check for ${endpoint}...`);

    try {
      const startTime = performance.now();
      
      // Use simple fetch since the endpoint is now public (no authentication required)
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      console.log(`📡 Health check response: ${response.status} ${response.statusText} (${responseTime}ms)`);

      if (!response.ok) {
        console.error(`❌ HTTP error: ${response.status} ${response.statusText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 Health check data received:', data);
      
      // Handle the standard API format with success boolean and data object
      const healthData = data.success && data.data ? data.data : data;
      
      const healthResult: HealthCheckResponse = {
        success: true,
        status: healthData.status === 'healthy' ? 'healthy' : 'unknown',
        timestamp: new Date().toISOString(),
        version: healthData.version,
        environment: healthData.environment,
        uptime: healthData.uptime,
        message: `API is healthy (${responseTime}ms response time)`,
      };

      // Cache the result
      this.lastHealthCheck = healthResult;
      this.lastCheckTime = now;

      console.log(`✅ Health check passed for ${endpoint}:`, healthResult);
      return healthResult;

    } catch (error) {
      const healthResult: HealthCheckResponse = {
        success: false,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };

      console.error(`❌ Health check failed for ${endpoint}:`, error);
      console.error('🔍 Health check error details:', {
        errorType: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        endpoint: healthUrl
      });
      
      return healthResult;
    }
  }

  /**
   * Test connectivity to both primary and backup endpoints
   */
  async testConnectivity(): Promise<{
    primary: APIConnectionStatus;
    backup: APIConnectionStatus;
    recommendedEndpoint: string;
  }> {
    const results = await Promise.allSettled([
      this.testEndpoint(awsConfig.apiGatewayUrl),
      this.testEndpoint(awsConfig.backupApiUrl),
    ]);

    const primary: APIConnectionStatus = results[0].status === 'fulfilled' 
      ? results[0].value 
      : {
          isConnected: false,
          endpoint: awsConfig.apiGatewayUrl,
          responseTime: 0,
          lastChecked: new Date().toISOString(),
          error: results[0].status === 'rejected' ? results[0].reason?.message : 'Unknown error',
        };

    const backup: APIConnectionStatus = results[1].status === 'fulfilled' 
      ? results[1].value 
      : {
          isConnected: false,
          endpoint: awsConfig.backupApiUrl,
          responseTime: 0,
          lastChecked: new Date().toISOString(),
          error: results[1].status === 'rejected' ? results[1].reason?.message : 'Unknown error',
        };

    // Determine recommended endpoint
    let recommendedEndpoint = awsConfig.apiGatewayUrl; // Default to primary
    
    if (!primary.isConnected && backup.isConnected) {
      recommendedEndpoint = awsConfig.backupApiUrl;
    } else if (primary.isConnected && backup.isConnected) {
      // Both are working, prefer the faster one
      recommendedEndpoint = primary.responseTime <= backup.responseTime 
        ? awsConfig.apiGatewayUrl 
        : awsConfig.backupApiUrl;
    }

    return {
      primary,
      backup,
      recommendedEndpoint,
    };
  }

  /**
   * Test a specific endpoint for connectivity
   */
  private async testEndpoint(endpoint: string): Promise<APIConnectionStatus> {
    const healthUrl = `${endpoint}${awsConfig.healthCheckEndpoint}`;
    const startTime = performance.now();

    try {
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout for connectivity test
      });

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      return {
        isConnected: response.ok,
        endpoint,
        responseTime,
        lastChecked: new Date().toISOString(),
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
      };

    } catch (error) {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      return {
        isConnected: false,
        endpoint,
        responseTime,
        lastChecked: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Clear cached health check results
   */
  clearCache(): void {
    this.lastHealthCheck = null;
    this.lastCheckTime = 0;
  }

  /**
   * Get the last cached health check result
   */
  getLastHealthCheck(): HealthCheckResponse | null {
    return this.lastHealthCheck;
  }

  /**
   * Check if the cached result is still valid
   */
  isCacheValid(): boolean {
    return this.lastHealthCheck !== null && 
           (Date.now() - this.lastCheckTime) < this.CACHE_DURATION;
  }
}

// Export singleton instance
export const healthCheckService = new HealthCheckService();

// Export utility functions for easy use
export const checkAPIHealth = (useBackup?: boolean) => healthCheckService.checkAPIHealth(useBackup);
export const testAPIConnectivity = () => healthCheckService.testConnectivity();
export const clearHealthCheckCache = () => healthCheckService.clearCache(); 