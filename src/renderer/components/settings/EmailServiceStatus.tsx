import React, { useState, useEffect } from 'react';
import { 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface EmailServiceStatusProps {
  className?: string;
  showDetails?: boolean;
}

type ServiceStatus = 'operational' | 'degraded' | 'outage' | 'unknown';

export const EmailServiceStatus: React.FC<EmailServiceStatusProps> = ({ 
  className = '',
  showDetails = false 
}) => {
  const [status, setStatus] = useState<ServiceStatus>('unknown');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [errorCount, setErrorCount] = useState(0);

  // Monitor email service health by tracking recent errors
  useEffect(() => {
    // Listen for email service errors from other components
    const handleEmailError = (event: CustomEvent) => {
      const error = event.detail;
      if (error && error.message && error.message.includes('500')) {
        setErrorCount(prev => prev + 1);
        setStatus('degraded');
        setLastChecked(new Date());
      }
    };

    // Listen for successful email operations
    const handleEmailSuccess = (event: CustomEvent) => {
      setStatus('operational');
      setErrorCount(0);
      setLastChecked(new Date());
    };

    window.addEventListener('email-service-error', handleEmailError as EventListener);
    window.addEventListener('email-service-success', handleEmailSuccess as EventListener);

    return () => {
      window.removeEventListener('email-service-error', handleEmailError as EventListener);
      window.removeEventListener('email-service-success', handleEmailSuccess as EventListener);
    };
  }, []);

  // Auto-reset status after some time if no new errors
  useEffect(() => {
    if (status === 'degraded' && errorCount > 0) {
      const timer = setTimeout(() => {
        setStatus('unknown');
        setErrorCount(0);
      }, 5 * 60 * 1000); // Reset after 5 minutes

      return () => clearTimeout(timer);
    }
  }, [status, errorCount]);

  const getStatusConfig = (status: ServiceStatus) => {
    switch (status) {
      case 'operational':
        return {
          color: 'text-green-600 bg-green-50 border-green-200',
          icon: CheckCircleIcon,
          text: 'Email Service Operational',
          description: 'All email services are working normally'
        };
      case 'degraded':
        return {
          color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
          icon: ExclamationTriangleIcon,
          text: 'Email Service Issues',
          description: 'Email service is experiencing some issues. Emails may be delayed.'
        };
      case 'outage':
        return {
          color: 'text-red-600 bg-red-50 border-red-200',
          icon: ExclamationTriangleIcon,
          text: 'Email Service Outage',
          description: 'Email service is currently unavailable. Please try again later.'
        };
      default:
        return {
          color: 'text-gray-600 bg-gray-50 border-gray-200',
          icon: ClockIcon,
          text: 'Email Service Status Unknown',
          description: 'Unable to determine email service status'
        };
    }
  };

  // Don't show anything if status is unknown and we haven't detected any issues
  if (status === 'unknown' && errorCount === 0) {
    return null;
  }

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className={`${className}`}>
      <div className={`p-3 rounded-lg border ${statusConfig.color}`}>
        <div className="flex items-start space-x-2">
          <StatusIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium">{statusConfig.text}</p>
            {showDetails && (
              <>
                <p className="text-sm mt-1">{statusConfig.description}</p>
                {lastChecked && (
                  <p className="text-xs mt-2 opacity-75">
                    Last checked: {lastChecked.toLocaleTimeString()}
                  </p>
                )}
                {status === 'degraded' && (
                  <div className="mt-2 text-sm">
                    <p className="font-medium">What you can do:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Wait a few minutes and try again</li>
                      <li>Check your spam/junk folder for emails</li>
                      <li>Contact support if issues persist</li>
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to dispatch email service events
export const dispatchEmailServiceEvent = (type: 'error' | 'success', details?: any) => {
  const event = new CustomEvent(`email-service-${type}`, { detail: details });
  window.dispatchEvent(event);
}; 