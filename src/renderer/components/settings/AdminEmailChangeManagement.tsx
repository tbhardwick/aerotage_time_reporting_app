import React, { useState, useEffect } from 'react';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  UserIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { emailChangeService, EmailChangeRequest, EmailChangeRequestFilters } from '../../services/emailChangeService';

interface AdminEmailChangeManagementProps {
  className?: string;
}

const AdminEmailChangeManagement: React.FC<AdminEmailChangeManagementProps> = ({ className = '' }) => {
  const [requests, setRequests] = useState<EmailChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<EmailChangeRequestFilters>({
    limit: 20,
    offset: 0,
    sortBy: 'requestedAt',
    sortOrder: 'desc'
  });
  const [selectedRequest, setSelectedRequest] = useState<EmailChangeRequest | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [filters]);

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Loading email change requests with filters:', filters);
      const response = await emailChangeService.getRequests(filters);
      console.log('📧 Loaded email change requests:', response);
      setRequests(response.requests);
    } catch (error) {
      console.error('Failed to load email change requests:', error);
      setError(error instanceof Error ? error.message : 'Failed to load email change requests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending_verification':
        return {
          color: 'text-yellow-600 bg-yellow-100 border-yellow-200',
          icon: EnvelopeIcon,
          text: 'Pending Verification'
        };
      case 'pending_approval':
        return {
          color: 'text-blue-600 bg-blue-100 border-blue-200',
          icon: ClockIcon,
          text: 'Pending Approval'
        };
      case 'approved':
        return {
          color: 'text-green-600 bg-green-100 border-green-200',
          icon: ShieldCheckIcon,
          text: 'Approved'
        };
      case 'rejected':
        return {
          color: 'text-red-600 bg-red-100 border-red-200',
          icon: XCircleIcon,
          text: 'Rejected'
        };
      case 'completed':
        return {
          color: 'text-green-600 bg-green-100 border-green-200',
          icon: CheckCircleIcon,
          text: 'Completed'
        };
      case 'cancelled':
        return {
          color: 'text-gray-600 bg-gray-100 border-gray-200',
          icon: XCircleIcon,
          text: 'Cancelled'
        };
      default:
        return {
          color: 'text-gray-600 bg-gray-100 border-gray-200',
          icon: ClockIcon,
          text: 'Unknown'
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

  const handleApprove = async () => {
    if (!selectedRequest) return;

    setActionLoading(true);
    try {
      console.log('✅ Approving email change request:', selectedRequest.id);
      await emailChangeService.approveRequest(selectedRequest.id, approvalNotes || undefined);
      console.log('✅ Email change request approved successfully');
      
      // Refresh the list
      await loadRequests();
      
      // Close modal and reset state
      setShowApprovalModal(false);
      setSelectedRequest(null);
      setApprovalNotes('');
      
    } catch (error) {
      console.error('Failed to approve email change request:', error);
      setError(error instanceof Error ? error.message : 'Failed to approve request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) return;

    setActionLoading(true);
    try {
      console.log('❌ Rejecting email change request:', selectedRequest.id);
      await emailChangeService.rejectRequest(selectedRequest.id, rejectionReason);
      console.log('✅ Email change request rejected successfully');
      
      // Refresh the list
      await loadRequests();
      
      // Close modal and reset state
      setShowRejectionModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
      
    } catch (error) {
      console.error('Failed to reject email change request:', error);
      setError(error instanceof Error ? error.message : 'Failed to reject request');
    } finally {
      setActionLoading(false);
    }
  };

  const canApprove = (request: EmailChangeRequest) => {
    return request.status === 'pending_approval';
  };

  const canReject = (request: EmailChangeRequest) => {
    return ['pending_approval', 'pending_verification'].includes(request.status);
  };

  if (loading && requests.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading email change requests...</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Email Change Requests</h3>
          <p className="text-sm text-gray-600">Manage user email change requests</p>
        </div>
        <button
          onClick={loadRequests}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as any || undefined, offset: 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="pending_verification">Pending Verification</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={filters.sortBy || 'requestedAt'}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any, offset: 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="requestedAt">Request Date</option>
              <option value="status">Status</option>
              <option value="reason">Reason</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
            <select
              value={filters.sortOrder || 'desc'}
              onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value as any, offset: 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
          <EnvelopeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No email change requests found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const statusConfig = getStatusConfig(request.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`p-2 rounded-full ${statusConfig.color}`}>
                        <StatusIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">Email Change Request</h4>
                        <p className="text-sm text-gray-600">Request ID: {request.id}</p>
                      </div>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full border ${statusConfig.color}`}>
                        {statusConfig.text}
                      </span>
                    </div>

                    {/* Request Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <UserIcon className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-500">User ID:</span>
                          <span className="text-sm text-gray-900">{request.userId}</span>
                        </div>
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
                        <div className="flex items-center space-x-2">
                          <CalendarIcon className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-500">Requested:</span>
                          <span className="text-sm text-gray-900">{formatDate(request.requestedAt)}</span>
                        </div>
                        {request.estimatedCompletionTime && (
                          <div className="flex items-center space-x-2">
                            <ClockIcon className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-500">Est. Completion:</span>
                            <span className="text-sm text-gray-900">{formatDate(request.estimatedCompletionTime)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Verification Status */}
                    {request.status === 'pending_verification' && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <h5 className="text-sm font-medium text-gray-900 mb-2">Verification Status:</h5>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              request.verificationStatus.currentEmailVerified ? 'bg-green-500' : 'bg-yellow-500'
                            }`} />
                            <span className="text-sm text-gray-700">Current Email</span>
                            <span className="text-xs text-gray-500">
                              {request.verificationStatus.currentEmailVerified ? 'Verified' : 'Pending'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              request.verificationStatus.newEmailVerified ? 'bg-green-500' : 'bg-yellow-500'
                            }`} />
                            <span className="text-sm text-gray-700">New Email</span>
                            <span className="text-xs text-gray-500">
                              {request.verificationStatus.newEmailVerified ? 'Verified' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Rejection Reason */}
                    {request.status === 'rejected' && request.rejectionReason && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-red-900">Rejection Reason:</p>
                            <p className="text-sm text-red-800 mt-1">{request.rejectionReason}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2 ml-4">
                    {canApprove(request) && (
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowApprovalModal(true);
                        }}
                        className="px-3 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100"
                      >
                        Approve
                      </button>
                    )}
                    {canReject(request) && (
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowRejectionModal(true);
                        }}
                        className="px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowApprovalModal(false)} />
            <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Approve Email Change Request</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to approve this email change from{' '}
                  <span className="font-mono">{selectedRequest.currentEmail}</span> to{' '}
                  <span className="font-mono">{selectedRequest.newEmail}</span>?
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Approval Notes (Optional)
                  </label>
                  <textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add any notes about this approval..."
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowApprovalModal(false)}
                    disabled={actionLoading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Approving...' : 'Approve'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowRejectionModal(false)} />
            <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Reject Email Change Request</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Please provide a reason for rejecting this email change request.
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Explain why this request is being rejected..."
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowRejectionModal(false)}
                    disabled={actionLoading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={actionLoading || !rejectionReason.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEmailChangeManagement; 