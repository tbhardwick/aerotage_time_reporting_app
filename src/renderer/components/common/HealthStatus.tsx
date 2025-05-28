import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { apiClient } from '../../services/api-client';
import type { HealthCheckResponse, APIConnectionStatus } from '../../services/health-check';

interface HealthStatusProps {
  showDetails?: boolean;
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export const HealthStatus: React.FC<HealthStatusProps> = ({
  showDetails = false,
  className = '',
  autoRefresh = true, // Re-enabled now that CORS is configured
  refreshInterval = 60000, // 1 minute default
}) => {
  const [healthStatus, setHealthStatus] = useState<HealthCheckResponse | null>(null);
  const [connectivity, setConnectivity] = useState<{
    primary: APIConnectionStatus;
    backup: APIConnectionStatus;
    recommendedEndpoint: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkHealth = async () => {
    try {
      setLoading(true);
      
      // Check primary endpoint health
      const health = await apiClient.checkAPIHealth(false);
      setHealthStatus(health);
      
      // If showing details, also check connectivity
      if (showDetails) {
        const connectivityResult = await apiClient.testAPIConnectivity();
        setConnectivity(connectivityResult);
      }
      
      setLastChecked(new Date());
    } catch (error) {
      console.error('Health check failed:', error);
      setHealthStatus({
        success: false,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        message: 'Failed to check API health',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial health check
    checkHealth();

    // Set up auto-refresh if enabled
    if (autoRefresh) {
      const interval = setInterval(checkHealth, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const getStatusIcon = () => {
    if (loading) {
      return (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
      );
    }

    if (!healthStatus) {
      return <XCircleIcon className="h-4 w-4 text-gray-400" />;
    }

    switch (healthStatus.status) {
      case 'healthy':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'unhealthy':
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      default:
        return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    if (loading) return 'Checking...';
    if (!healthStatus) return 'Unknown';
    
    switch (healthStatus.status) {
      case 'healthy':
        return 'API Online';
      case 'unhealthy':
        return 'API Offline';
      default:
        return 'API Status Unknown';
    }
  };

  const getStatusColor = () => {
    if (loading) return 'text-blue-600';
    if (!healthStatus) return 'text-gray-400';
    
    switch (healthStatus.status) {
      case 'healthy':
        return 'text-green-600';
      case 'unhealthy':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  const formatResponseTime = (responseTime: number) => {
    if (responseTime < 1000) {
      return `${responseTime}ms`;
    } else {
      return `${(responseTime / 1000).toFixed(1)}s`;
    }
  };

  if (!showDetails) {
    // Simple status indicator
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {getStatusIcon()}
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>
    );
  }

  // Detailed status view
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-gray-900">API Health Status</h3>
        <button
          onClick={checkHealth}
          disabled={loading}
          className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      {/* Primary Status */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className={`font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
          {lastChecked && (
            <span className="text-sm text-gray-500">
              Last checked: {lastChecked.toLocaleTimeString()}
            </span>
          )}
        </div>

        {healthStatus && (
          <div className="text-sm text-gray-600">
            <p>{healthStatus.message}</p>
            {healthStatus.version && (
              <p>Version: {healthStatus.version}</p>
            )}
            {healthStatus.environment && (
              <p>Environment: {healthStatus.environment}</p>
            )}
          </div>
        )}

        {/* Connectivity Details */}
        {connectivity && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Endpoint Status</h4>
            <div className="space-y-2">
              {/* Primary Endpoint */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {connectivity.primary.isConnected ? (
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircleIcon className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm text-gray-700">Primary</span>
                </div>
                <div className="text-sm text-gray-500">
                  {connectivity.primary.isConnected ? (
                    <span className="text-green-600">
                      {formatResponseTime(connectivity.primary.responseTime)}
                    </span>
                  ) : (
                    <span className="text-red-600">Failed</span>
                  )}
                </div>
              </div>

              {/* Backup Endpoint */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {connectivity.backup.isConnected ? (
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircleIcon className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm text-gray-700">Backup</span>
                </div>
                <div className="text-sm text-gray-500">
                  {connectivity.backup.isConnected ? (
                    <span className="text-green-600">
                      {formatResponseTime(connectivity.backup.responseTime)}
                    </span>
                  ) : (
                    <span className="text-red-600">Failed</span>
                  )}
                </div>
              </div>

              {/* Recommended Endpoint */}
              <div className="mt-2 p-2 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Active Endpoint:</strong> {connectivity.recommendedEndpoint}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 