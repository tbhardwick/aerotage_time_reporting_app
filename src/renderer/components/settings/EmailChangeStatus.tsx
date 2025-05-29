import React from 'react';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  EnvelopeIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { EmailChangeRequest } from '../../services/emailChangeService';

interface EmailChangeStatusProps {
  request: EmailChangeRequest;
  onCancelRequest?: (requestId: string) => Promise<void>;
  onResendVerification?: (requestId: string, emailType: 'current' | 'new') => Promise<void>;
}

export const EmailChangeStatus: React.FC<EmailChangeStatusProps> = ({ 
  request, 
  onCancelRequest,
  onResendVerification 
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending_verification':
        return {
          color: 'text-yellow-600 bg-yellow-100 border-yellow-200',
          icon: EnvelopeIcon,
          text: 'Pending Email Verification',
          description: 'Please check your email addresses for verification links'
        };
      case 'pending_approval':
        return {
          color: 'text-blue-600 bg-blue-100 border-blue-200',
          icon: ClockIcon,
          text: 'Pending Admin Approval',
          description: 'Your request is being reviewed by an administrator'
        };
      case 'approved':
        return {
          color: 'text-green-600 bg-green-100 border-green-200',
          icon: ShieldCheckIcon,
          text: 'Approved - Processing Change',
          description: 'Your email change has been approved and is being processed'
        };
      case 'rejected':
        return {
          color: 'text-red-600 bg-red-100 border-red-200',
          icon: XCircleIcon,
          text: 'Request Rejected',
          description: 'Your email change request was not approved'
        };
      case 'completed':
        return {
          color: 'text-green-600 bg-green-100 border-green-200',
          icon: CheckCircleIcon,
          text: 'Email Change Completed',
          description: 'Your email address has been successfully updated'
        };
      case 'cancelled':
        return {
          color: 'text-gray-600 bg-gray-100 border-gray-200',
          icon: XCircleIcon,
          text: 'Request Cancelled',
          description: 'This email change request was cancelled'
        };
      default:
        return {
          color: 'text-gray-600 bg-gray-100 border-gray-200',
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
          <div className={`p-2 rounded-full ${statusConfig.color}`}>
            <StatusIcon className="h-5 w-5" />
          </div>
          <div>
            <h4 style={{ color: 'var(--text-primary)' }} className="text-lg font-medium">Email Change Request</h4>
            <p style={{ color: 'var(--text-secondary)' }} className="text-sm">{statusConfig.description}</p>
          </div>
        </div>
        <span className={`px-3 py-1 text-sm font-medium rounded-full border ${statusConfig.color}`}>
          {statusConfig.text}
        </span>
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
          <div className="space-y-2">
            <div style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }} className="flex items-center justify-between p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  request.verificationStatus?.currentEmailVerified ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
                <span style={{ color: 'var(--text-secondary)' }} className="text-sm">Current Email ({request.currentEmail})</span>
              </div>
              <div className="flex items-center space-x-2">
                {request.verificationStatus?.currentEmailVerified ? (
                  <CheckCircleIcon className="h-4 w-4 text-green-600" />
                ) : (
                  <ClockIcon className="h-4 w-4 text-yellow-600" />
                )}
                <span style={{ color: 'var(--text-tertiary)' }} className="text-xs">
                  {request.verificationStatus?.currentEmailVerified ? 'Verified' : 'Pending'}
                </span>
                {!request.verificationStatus?.currentEmailVerified && onResendVerification && (
                  <button
                    onClick={() => onResendVerification(request.id, 'current')}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Resend
                  </button>
                )}
              </div>
            </div>
            <div style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }} className="flex items-center justify-between p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  request.verificationStatus?.newEmailVerified ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
                <span style={{ color: 'var(--text-secondary)' }} className="text-sm">New Email ({request.newEmail})</span>
              </div>
              <div className="flex items-center space-x-2">
                {request.verificationStatus?.newEmailVerified ? (
                  <CheckCircleIcon className="h-4 w-4 text-green-600" />
                ) : (
                  <ClockIcon className="h-4 w-4 text-yellow-600" />
                )}
                <span style={{ color: 'var(--text-tertiary)' }} className="text-xs">
                  {request.verificationStatus?.newEmailVerified ? 'Verified' : 'Pending'}
                </span>
                {!request.verificationStatus?.newEmailVerified && onResendVerification && (
                  <button
                    onClick={() => onResendVerification(request.id, 'new')}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
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
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span style={{ color: 'var(--text-secondary)' }}>Request submitted:</span>
            <span style={{ color: 'var(--text-primary)' }}>{formatDate(request.requestedAt)}</span>
          </div>
          {request.verifiedAt && (
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span style={{ color: 'var(--text-secondary)' }}>Emails verified:</span>
              <span style={{ color: 'var(--text-primary)' }}>{formatDate(request.verifiedAt)}</span>
            </div>
          )}
          {request.approvedAt && (
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span style={{ color: 'var(--text-secondary)' }}>Admin approved:</span>
              <span style={{ color: 'var(--text-primary)' }}>{formatDate(request.approvedAt)}</span>
            </div>
          )}
          {request.rejectedAt && (
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span style={{ color: 'var(--text-secondary)' }}>Request rejected:</span>
              <span style={{ color: 'var(--text-primary)' }}>{formatDate(request.rejectedAt)}</span>
            </div>
          )}
          {request.completedAt && (
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span style={{ color: 'var(--text-secondary)' }}>Change completed:</span>
              <span style={{ color: 'var(--text-primary)' }}>{formatDate(request.completedAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Estimated Completion */}
      {request.estimatedCompletionTime && request.status !== 'completed' && request.status !== 'rejected' && request.status !== 'cancelled' && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <ClockIcon className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Estimated Completion:</span>
            <span className="text-sm text-blue-800">{formatDate(request.estimatedCompletionTime)}</span>
          </div>
        </div>
      )}

      {/* Rejection Reason */}
      {request.status === 'rejected' && request.rejectionReason && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">Rejection Reason:</p>
              <p className="text-sm text-red-800 mt-1">{request.rejectionReason}</p>
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
            className="px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
          >
            Resend Verification
          </button>
        )}
        {canCancelRequest() && onCancelRequest && (
          <button
            onClick={() => onCancelRequest(request.id)}
            className="px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100"
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