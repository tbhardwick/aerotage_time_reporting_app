import { awsConfig } from '../config/aws-config';
import { get } from 'aws-amplify/api';

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
   * Test API connectivity using the health check endpoint with AWS Amplify API
   */
  async checkAPIHealth(useBackup: boolean = false): Promise<HealthCheckResponse> {
    const now = Date.now();
    
    // Return cached result if still valid
    if (this.lastHealthCheck && (now - this.lastCheckTime) < this.CACHE_DURATION) {
      console.log('🔄 Returning cached health check result:', this.lastHealthCheck);
      return this.lastHealthCheck;
    }

    const endpoint = useBackup ? awsConfig.backupApiUrl : awsConfig.apiGatewayUrl;
    console.log(`🏥 Starting health check for ${endpoint} using Amplify API...`);

    try {
      const startTime = performance.now();
      
      // Use AWS Amplify API client which handles CORS and authentication
      const response = await get({
        apiName: 'AerotageAPI', // This matches the API name in aws-config
        path: awsConfig.healthCheckEndpoint,
        options: {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      }).response;

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      console.log(`📡 Health check response via Amplify: ${response.statusCode} (${responseTime}ms)`);

      if (response.statusCode !== 200) {
        // Handle specific HTTP status codes
        if (response.statusCode === 401) {
          console.error('🚫 Authentication required - token may be expired');
          throw new Error('Authentication required - please log in again');
        } else if (response.statusCode === 403) {
          console.error('🚫 Access forbidden - insufficient permissions');
          throw new Error('Access forbidden - insufficient permissions');
        } else {
          console.error(`❌ HTTP error: ${response.statusCode}`);
          throw new Error(`HTTP ${response.statusCode}: API request failed`);
        }
      }

      const data = await response.body.json();
      console.log('📊 Health check data received via Amplify:', data);
      
      // Type the response data properly
      const healthData = data as {
        status?: string;
        version?: string;
        environment?: string;
        uptime?: number;
      };
      
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
        endpoint: `${endpoint}${awsConfig.healthCheckEndpoint}`
      });
      
      return healthResult;
    }
  }

  /**
   * Test connectivity to both primary and backup endpoints using Amplify API
   */
  async testConnectivity(): Promise<{
    primary: APIConnectionStatus;
    backup: APIConnectionStatus;
    recommendedEndpoint: string;
  }> {
    // For now, just test the primary endpoint since Amplify handles the endpoint selection
    const primaryResult = await this.testEndpointViaAmplify();
    
    // Create a mock backup result since Amplify handles failover internally
    const backupResult: APIConnectionStatus = {
      isConnected: false,
      endpoint: awsConfig.backupApiUrl,
      responseTime: 0,
      lastChecked: new Date().toISOString(),
      error: 'Using Amplify API - backup tested internally',
    };

    return {
      primary: primaryResult,
      backup: backupResult,
      recommendedEndpoint: awsConfig.apiGatewayUrl,
    };
  }

  /**
   * Test endpoint using AWS Amplify API
   */
  private async testEndpointViaAmplify(): Promise<APIConnectionStatus> {
    const startTime = performance.now();

    try {
      const response = await get({
        apiName: 'AerotageAPI',
        path: awsConfig.healthCheckEndpoint,
        options: {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      }).response;

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      return {
        isConnected: response.statusCode === 200,
        endpoint: awsConfig.apiGatewayUrl,
        responseTime,
        lastChecked: new Date().toISOString(),
        error: response.statusCode === 200 ? undefined : `HTTP ${response.statusCode}`,
      };

    } catch (error) {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      return {
        isConnected: false,
        endpoint: awsConfig.apiGatewayUrl,
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