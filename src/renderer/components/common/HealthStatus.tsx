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
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--color-primary-600)]"></div>
      );
    }

    if (!healthStatus) {
      return <XCircleIcon className="h-4 w-4 text-[var(--color-text-tertiary)]" />;
    }

    switch (healthStatus.status) {
      case 'healthy':
        return <CheckCircleIcon className="h-4 w-4 text-[var(--color-success-500)]" />;
      case 'unhealthy':
        return <XCircleIcon className="h-4 w-4 text-[var(--color-error-500)]" />;
      default:
        return <ExclamationTriangleIcon className="h-4 w-4 text-[var(--color-warning-500)]" />;
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
    if (loading) return 'text-[var(--color-primary-600)]';
    if (!healthStatus) return 'text-[var(--color-text-tertiary)]';
    
    switch (healthStatus.status) {
      case 'healthy':
        return 'text-[var(--color-success-600)]';
      case 'unhealthy':
        return 'text-[var(--color-error-600)]';
      default:
        return 'text-[var(--color-warning-600)]';
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
    <div className={`bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-[var(--color-text-primary)]">API Health Status</h3>
        <button
          onClick={checkHealth}
          disabled={loading}
          className="inline-flex items-center px-3 py-1 border border-[var(--color-border)] shadow-sm text-sm leading-4 font-medium rounded-md text-[var(--color-text-secondary)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-secondary)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary-500)] disabled:opacity-50"
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
            <span className="text-sm text-[var(--color-text-tertiary)]">
              Last checked: {lastChecked.toLocaleTimeString()}
            </span>
          )}
        </div>

        {healthStatus && (
          <div className="text-sm text-[var(--color-text-secondary)]">
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
          <div className="mt-4 border-t border-[var(--color-border)] pt-4">
            <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Endpoint Status</h4>
            <div className="space-y-2">
              {/* Primary Endpoint */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {connectivity.primary.isConnected ? (
                    <CheckCircleIcon className="h-4 w-4 text-[var(--color-success-500)]" />
                  ) : (
                    <XCircleIcon className="h-4 w-4 text-[var(--color-error-500)]" />
                  )}
                  <span className="text-sm text-[var(--color-text-secondary)]">Primary</span>
                </div>
                <div className="text-sm text-[var(--color-text-tertiary)]">
                  {connectivity.primary.isConnected ? (
                    <span className="text-[var(--color-success-600)]">
                      {formatResponseTime(connectivity.primary.responseTime)}
                    </span>
                  ) : (
                    <span className="text-[var(--color-error-600)]">Failed</span>
                  )}
                </div>
              </div>

              {/* Backup Endpoint */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {connectivity.backup.isConnected ? (
                    <CheckCircleIcon className="h-4 w-4 text-[var(--color-success-500)]" />
                  ) : (
                    <XCircleIcon className="h-4 w-4 text-[var(--color-error-500)]" />
                  )}
                  <span className="text-sm text-[var(--color-text-secondary)]">Backup</span>
                </div>
                <div className="text-sm text-[var(--color-text-tertiary)]">
                  {connectivity.backup.isConnected ? (
                    <span className="text-[var(--color-success-600)]">
                      {formatResponseTime(connectivity.backup.responseTime)}
                    </span>
                  ) : (
                    <span className="text-[var(--color-error-600)]">Failed</span>
                  )}
                </div>
              </div>

              {/* Recommended Endpoint */}
              <div className="mt-2 p-2 bg-[var(--color-primary-50)] rounded-md">
                <p className="text-sm text-[var(--color-primary-800)]">
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