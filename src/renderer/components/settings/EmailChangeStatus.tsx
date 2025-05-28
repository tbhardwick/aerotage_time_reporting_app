import React from 'react';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  EnvelopeIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

export interface EmailChangeRequest {
  id: string;
  currentEmail: string;
  newEmail: string;
  status: 'pending_verification' | 'pending_approval' | 'approved' | 'rejected' | 'completed';
  reason: string;
  customReason?: string;
  requestedAt: string;
  verifiedAt?: string;
  approvedAt?: string;
  completedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  verificationStatus: {
    currentEmailVerified: boolean;
    newEmailVerified: boolean;
  };
  estimatedCompletionTime?: string;
}

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
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${statusConfig.color}`}>
            <StatusIcon className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-lg font-medium text-gray-900">Email Change Request</h4>
            <p className="text-sm text-gray-600">{statusConfig.description}</p>
          </div>
        </div>
        <span className={`px-3 py-1 text-sm font-medium rounded-full border ${statusConfig.color}`}>
          {statusConfig.text}
        </span>
      </div>

      {/* Request Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="space-y-2">
          <div>
            <span className="text-sm font-medium text-gray-500">From:</span>
            <p className="text-sm text-gray-900 font-mono">{request.currentEmail}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">To:</span>
            <p className="text-sm text-gray-900 font-mono">{request.newEmail}</p>
          </div>
        </div>
        <div className="space-y-2">
          <div>
            <span className="text-sm font-medium text-gray-500">Reason:</span>
            <p className="text-sm text-gray-900">{getReasonDisplay(request.reason, request.customReason)}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Requested:</span>
            <p className="text-sm text-gray-900">{formatDate(request.requestedAt)}</p>
          </div>
        </div>
      </div>

      {/* Verification Status */}
      {request.status === 'pending_verification' && (
        <div className="space-y-3">
          <h5 className="text-sm font-medium text-gray-900">Email Verification Status</h5>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  request.verificationStatus.currentEmailVerified ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
                <span className="text-sm text-gray-700">Current Email ({request.currentEmail})</span>
              </div>
              <div className="flex items-center space-x-2">
                {request.verificationStatus.currentEmailVerified ? (
                  <CheckCircleIcon className="h-4 w-4 text-green-600" />
                ) : (
                  <ClockIcon className="h-4 w-4 text-yellow-600" />
                )}
                <span className="text-xs text-gray-500">
                  {request.verificationStatus.currentEmailVerified ? 'Verified' : 'Pending'}
                </span>
                {!request.verificationStatus.currentEmailVerified && onResendVerification && (
                  <button
                    onClick={() => onResendVerification(request.id, 'current')}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Resend
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  request.verificationStatus.newEmailVerified ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
                <span className="text-sm text-gray-700">New Email ({request.newEmail})</span>
              </div>
              <div className="flex items-center space-x-2">
                {request.verificationStatus.newEmailVerified ? (
                  <CheckCircleIcon className="h-4 w-4 text-green-600" />
                ) : (
                  <ClockIcon className="h-4 w-4 text-yellow-600" />
                )}
                <span className="text-xs text-gray-500">
                  {request.verificationStatus.newEmailVerified ? 'Verified' : 'Pending'}
                </span>
                {!request.verificationStatus.newEmailVerified && onResendVerification && (
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
        <h5 className="text-sm font-medium text-gray-900">Request Timeline</h5>
        <div className="space-y-2">
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span className="text-gray-600">Request submitted:</span>
            <span className="text-gray-900">{formatDate(request.requestedAt)}</span>
          </div>
          {request.verifiedAt && (
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-gray-600">Emails verified:</span>
              <span className="text-gray-900">{formatDate(request.verifiedAt)}</span>
            </div>
          )}
          {request.approvedAt && (
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-gray-600">Admin approved:</span>
              <span className="text-gray-900">{formatDate(request.approvedAt)}</span>
            </div>
          )}
          {request.rejectedAt && (
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span className="text-gray-600">Request rejected:</span>
              <span className="text-gray-900">{formatDate(request.rejectedAt)}</span>
            </div>
          )}
          {request.completedAt && (
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-gray-600">Change completed:</span>
              <span className="text-gray-900">{formatDate(request.completedAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Estimated Completion */}
      {request.estimatedCompletionTime && request.status !== 'completed' && request.status !== 'rejected' && (
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
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        {canResendVerification() && onResendVerification && (
          <button
            onClick={() => {
              if (!request.verificationStatus.currentEmailVerified) {
                onResendVerification(request.id, 'current');
              } else if (!request.verificationStatus.newEmailVerified) {
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