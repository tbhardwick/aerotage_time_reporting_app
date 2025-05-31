import React from 'react';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { EmailChangeRequest } from '../../services/emailChangeService';

interface EmailChangeStatusProps {
  request: EmailChangeRequest;
  onCancelRequest?: (requestId: string) => Promise<void>;
  onResendVerification?: (requestId: string, emailType: 'current' | 'new') => Promise<void>;
  onRefreshStatus?: () => Promise<void>;
  lastUpdated?: Date;
}

export const EmailChangeStatus: React.FC<EmailChangeStatusProps> = ({ 
  request, 
  onCancelRequest,
  onResendVerification,
  onRefreshStatus,
  lastUpdated
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending_verification':
        return {
          style: {
            color: 'var(--color-warning-800)',
            backgroundColor: 'var(--color-warning-50)',
            borderColor: 'var(--color-warning-200)'
          },
          icon: EnvelopeIcon,
          text: 'Pending Email Verification',
          description: 'Please check your email addresses for verification links'
        };
      case 'pending_approval':
        return {
          style: {
            color: 'var(--color-primary-800)',
            backgroundColor: 'var(--color-primary-50)',
            borderColor: 'var(--color-primary-200)'
          },
          icon: ClockIcon,
          text: 'Pending Admin Approval',
          description: 'Your request is being reviewed by an administrator'
        };
      case 'approved':
        return {
          style: {
            color: 'var(--color-success-800)',
            backgroundColor: 'var(--color-success-50)',
            borderColor: 'var(--color-success-200)'
          },
          icon: ShieldCheckIcon,
          text: 'Approved - Processing Change',
          description: 'Your email change has been approved and is being processed'
        };
      case 'rejected':
        return {
          style: {
            color: 'var(--color-error-800)',
            backgroundColor: 'var(--color-error-50)',
            borderColor: 'var(--color-error-200)'
          },
          icon: XCircleIcon,
          text: 'Request Rejected',
          description: 'Your email change request was not approved'
        };
      case 'completed':
        return {
          style: {
            color: 'var(--color-success-800)',
            backgroundColor: 'var(--color-success-50)',
            borderColor: 'var(--color-success-200)'
          },
          icon: CheckCircleIcon,
          text: 'Email Change Completed',
          description: 'Your email address has been successfully updated'
        };
      case 'cancelled':
        return {
          style: {
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--surface-secondary)',
            borderColor: 'var(--border-color)'
          },
          icon: XCircleIcon,
          text: 'Request Cancelled',
          description: 'This email change request was cancelled'
        };
      default:
        return {
          style: {
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--surface-secondary)',
            borderColor: 'var(--border-color)'
          },
          icon: ClockIcon,
          text: 'Unknown Status',
          description: 'Status information unavailable'
        };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getReasonDisplay = (reason: string, customReason?: string) => {
    const reasonMap: { [key: string]: string } = {
      'name_change': 'Name Change',
      'company_change': 'Company Email Change',
      'personal_preference': 'Personal Preference',
      'security_concern': 'Security Concern',
      'other': customReason || 'Other'
    };
    return reasonMap[reason] || reason;
  };

  const canCancelRequest = () => {
    return ['pending_verification', 'pending_approval'].includes(request.status);
  };

  const canResendVerification = () => {
    return request.status === 'pending_verification';
  };

  const statusConfig = getStatusConfig(request.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }} className="rounded-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div 
            className="p-2 rounded-full border"
            style={statusConfig.style}
          >
            <StatusIcon className="h-5 w-5" />
          </div>
          <div>
            <h4 style={{ color: 'var(--text-primary)' }} className="text-lg font-medium">Email Change Request</h4>
            <p style={{ color: 'var(--text-secondary)' }} className="text-sm">{statusConfig.description}</p>
            {lastUpdated && (
              <p style={{ color: 'var(--text-tertiary)' }} className="text-xs mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span 
            className="px-3 py-1 text-sm font-medium rounded-full border"
            style={statusConfig.style}
          >
            {statusConfig.text}
          </span>
          {onRefreshStatus && (
            <button
              onClick={onRefreshStatus}
              className="p-2 rounded-full transition-colors duration-200"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.backgroundColor = 'var(--surface-secondary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Refresh status"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Request Details */}
      <div style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg">
        <div className="space-y-2">
          <div>
            <span style={{ color: 'var(--text-secondary)' }} className="text-sm font-medium">From:</span>
            <p style={{ color: 'var(--text-primary)' }} className="text-sm font-mono">{request.currentEmail}</p>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)' }} className="text-sm font-medium">To:</span>
            <p style={{ color: 'var(--text-primary)' }} className="text-sm font-mono">{request.newEmail}</p>
          </div>
        </div>
        <div className="space-y-2">
          <div>
            <span style={{ color: 'var(--text-secondary)' }} className="text-sm font-medium">Reason:</span>
            <p style={{ color: 'var(--text-primary)' }} className="text-sm">{getReasonDisplay(request.reason, request.customReason)}</p>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)' }} className="text-sm font-medium">Requested:</span>
            <p style={{ color: 'var(--text-primary)' }} className="text-sm">{formatDate(request.requestedAt)}</p>
          </div>
        </div>
      </div>

      {/* Verification Status */}
      {request.status === 'pending_verification' && (
        <div className="space-y-3">
          <h5 style={{ color: 'var(--text-primary)' }} className="text-sm font-medium">Email Verification Status</h5>
          
          {/* Email Service Notice */}
          <div 
            className="p-3 border rounded-lg"
            style={{
              backgroundColor: 'var(--color-primary-50)',
              borderColor: 'var(--color-primary-200)'
            }}
          >
            <div className="flex items-start space-x-2">
              <InformationCircleIcon 
                className="h-5 w-5 flex-shrink-0 mt-0.5" 
                style={{ color: 'var(--color-primary-600)' }}
              />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-primary-900)' }}>Email Verification Help</p>
                <div className="text-sm mt-1" style={{ color: 'var(--color-primary-800)' }}>
                  <p>• Check your inbox and spam/junk folders for verification emails</p>
                  <p>• Verification emails may take a few minutes to arrive</p>
                  <p>• If you don't receive emails after 10 minutes, try the resend button</p>
                  <p>• If resend fails with a server error, the email service may be temporarily down</p>
                  <p>• Status updates automatically every 30 seconds or when you return to this page</p>
                  <p>• Use the refresh button (↻) above to manually check for updates</p>
                  <p>• Contact support if you continue having issues receiving emails</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }} className="flex items-center justify-between p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: request.verificationStatus?.currentEmailVerified 
                      ? 'var(--color-success-600)' 
                      : 'var(--color-warning-600)'
                  }}
                />
                <span style={{ color: 'var(--text-secondary)' }} className="text-sm">Current Email ({request.currentEmail})</span>
              </div>
              <div className="flex items-center space-x-2">
                {request.verificationStatus?.currentEmailVerified ? (
                  <CheckCircleIcon 
                    className="h-4 w-4" 
                    style={{ color: 'var(--color-success-600)' }}
                  />
                ) : (
                  <ClockIcon 
                    className="h-4 w-4" 
                    style={{ color: 'var(--color-warning-600)' }}
                  />
                )}
                <span style={{ color: 'var(--text-tertiary)' }} className="text-xs">
                  {request.verificationStatus?.currentEmailVerified ? 'Verified' : 'Pending'}
                </span>
                {!request.verificationStatus?.currentEmailVerified && onResendVerification && (
                  <button
                    onClick={() => onResendVerification(request.id, 'current')}
                    className="text-xs underline transition-colors"
                    style={{ color: 'var(--color-primary-600)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--color-primary-800)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--color-primary-600)';
                    }}
                  >
                    Resend
                  </button>
                )}
              </div>
            </div>
            <div style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }} className="flex items-center justify-between p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: request.verificationStatus?.newEmailVerified 
                      ? 'var(--color-success-600)' 
                      : 'var(--color-warning-600)'
                  }}
                />
                <span style={{ color: 'var(--text-secondary)' }} className="text-sm">New Email ({request.newEmail})</span>
              </div>
              <div className="flex items-center space-x-2">
                {request.verificationStatus?.newEmailVerified ? (
                  <CheckCircleIcon 
                    className="h-4 w-4" 
                    style={{ color: 'var(--color-success-600)' }}
                  />
                ) : (
                  <ClockIcon 
                    className="h-4 w-4" 
                    style={{ color: 'var(--color-warning-600)' }}
                  />
                )}
                <span style={{ color: 'var(--text-tertiary)' }} className="text-xs">
                  {request.verificationStatus?.newEmailVerified ? 'Verified' : 'Pending'}
                </span>
                {!request.verificationStatus?.newEmailVerified && onResendVerification && (
                  <button
                    onClick={() => onResendVerification(request.id, 'new')}
                    className="text-xs underline transition-colors"
                    style={{ color: 'var(--color-primary-600)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--color-primary-800)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--color-primary-600)';
                    }}
                  >
                    Resend
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-3">
        <h5 style={{ color: 'var(--text-primary)' }} className="text-sm font-medium">Request Timeline</h5>
                  <div className="space-y-2">
          <div className="flex items-center space-x-3 text-sm">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: 'var(--color-primary-500)' }}
            />
            <span style={{ color: 'var(--text-secondary)' }}>Request submitted:</span>
            <span style={{ color: 'var(--text-primary)' }}>{formatDate(request.requestedAt)}</span>
          </div>
          {request.verifiedAt && (
            <div className="flex items-center space-x-3 text-sm">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: 'var(--color-success-500)' }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>Emails verified:</span>
              <span style={{ color: 'var(--text-primary)' }}>{formatDate(request.verifiedAt)}</span>
            </div>
          )}
          {request.approvedAt && (
            <div className="flex items-center space-x-3 text-sm">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: 'var(--color-success-500)' }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>Admin approved:</span>
              <span style={{ color: 'var(--text-primary)' }}>{formatDate(request.approvedAt)}</span>
            </div>
          )}
          {request.rejectedAt && (
            <div className="flex items-center space-x-3 text-sm">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: 'var(--color-error-500)' }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>Request rejected:</span>
              <span style={{ color: 'var(--text-primary)' }}>{formatDate(request.rejectedAt)}</span>
            </div>
          )}
          {request.completedAt && (
            <div className="flex items-center space-x-3 text-sm">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: 'var(--color-success-500)' }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>Change completed:</span>
              <span style={{ color: 'var(--text-primary)' }}>{formatDate(request.completedAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Estimated Completion */}
      {request.estimatedCompletionTime && request.status !== 'completed' && request.status !== 'rejected' && request.status !== 'cancelled' && (
        <div 
          className="p-3 border rounded-lg"
          style={{
            backgroundColor: 'var(--color-primary-50)',
            borderColor: 'var(--color-primary-200)'
          }}
        >
          <div className="flex items-center space-x-2">
            <ClockIcon 
              className="h-4 w-4" 
              style={{ color: 'var(--color-primary-600)' }}
            />
            <span className="text-sm font-medium" style={{ color: 'var(--color-primary-900)' }}>Estimated Completion:</span>
            <span className="text-sm" style={{ color: 'var(--color-primary-800)' }}>{formatDate(request.estimatedCompletionTime)}</span>
          </div>
        </div>
      )}

      {/* Rejection Reason */}
      {request.status === 'rejected' && request.rejectionReason && (
        <div 
          className="p-4 border rounded-lg"
          style={{
            backgroundColor: 'var(--color-error-50)',
            borderColor: 'var(--color-error-200)'
          }}
        >
          <div className="flex items-start space-x-2">
            <ExclamationTriangleIcon 
              className="h-5 w-5 flex-shrink-0 mt-0.5" 
              style={{ color: 'var(--color-error-600)' }}
            />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-error-900)' }}>Rejection Reason:</p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-error-800)' }}>{request.rejectionReason}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ borderTop: '1px solid var(--border-color)' }} className="flex justify-end space-x-3 pt-4">
        {canResendVerification() && onResendVerification && (
          <button
            onClick={() => {
              if (!request.verificationStatus?.currentEmailVerified) {
                onResendVerification(request.id, 'current');
              } else if (!request.verificationStatus?.newEmailVerified) {
                onResendVerification(request.id, 'new');
              }
            }}
            className="px-3 py-2 text-sm font-medium border rounded-md transition-colors"
            style={{
              color: 'var(--color-primary-700)',
              backgroundColor: 'var(--color-primary-50)',
              borderColor: 'var(--color-primary-200)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary-100)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary-50)';
            }}
          >
            Resend Verification
          </button>
        )}
        {canCancelRequest() && onCancelRequest && (
          <button
            onClick={() => onCancelRequest(request.id)}
            className="px-3 py-2 text-sm font-medium border rounded-md transition-colors"
            style={{
              color: 'var(--color-error-700)',
              backgroundColor: 'var(--color-error-50)',
              borderColor: 'var(--color-error-200)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-error-100)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-error-50)';
            }}
          >
            Cancel Request
          </button>
        )}
      </div>
    </div>
  );
};

// Re-export the EmailChangeRequest type for backward compatibility
export type { EmailChangeRequest }; 