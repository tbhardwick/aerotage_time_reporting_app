import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
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
  const { state } = useAppContext();
  const { user } = state;
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
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  // Check if current user is admin
  const isAdmin = user?.role === 'admin';
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    loadRequests();
  }, [filters, user?.role]);

  const loadRequests = async () => {
    if (!user?.id) return;

    // Prevent multiple simultaneous API calls
    if (isLoadingRequests) {
      console.log('⚠️ Skipping loadRequests - already loading');
      return;
    }

    setIsLoadingRequests(true);
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 [AdminEmailChangeManagement] Loading email change requests with filters:', filters);
      console.log('🔍 [AdminEmailChangeManagement] User role:', user?.role);
      console.log('🔍 [AdminEmailChangeManagement] Is admin:', isAdmin);
      
      // NEW BUSINESS LOGIC:
      // - Admins can see ALL requests
      // - Regular users (managers/employees) see only their own requests
      let requestFilters = { ...filters };
      
      if (!isAdmin) {
        // Non-admin users only see their own requests
        console.log('🔍 [AdminEmailChangeManagement] Non-admin user - filtering by userId:', user.id);
        requestFilters = {
          ...filters,
          userId: user.id // Add userId filter for non-admin users
        };
      } else {
        console.log('🔍 [AdminEmailChangeManagement] Admin user - fetching ALL requests');
      }
      
      const response = await emailChangeService.getRequests(requestFilters);
      
      console.log('📧 [AdminEmailChangeManagement] Raw API response:', response);
      console.log('📧 [AdminEmailChangeManagement] Response.requests type:', typeof response.requests);
      console.log('📧 [AdminEmailChangeManagement] Response.requests length:', response.requests?.length);
      console.log('📧 [AdminEmailChangeManagement] Response.requests content:', response.requests);
      
      // Validate the response structure
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format - not an object');
      }
      
      if (!Array.isArray(response.requests)) {
        console.error('❌ [AdminEmailChangeManagement] response.requests is not an array:', response.requests);
        throw new Error('Invalid response format - requests is not an array');
      }
      
      console.log('✅ [AdminEmailChangeManagement] Setting requests state with:', response.requests);
      setRequests(response.requests);
      
      // Log the state after setting (this will show in the next render)
      console.log('📊 [AdminEmailChangeManagement] Requests state will be updated to length:', response.requests.length);
      
    } catch (error) {
      console.error('❌ [AdminEmailChangeManagement] Failed to load email change requests:', error);
      setError(error instanceof Error ? error.message : 'Failed to load email change requests');
      setRequests([]); // Ensure we have a valid array even on error
    } finally {
      setLoading(false);
      setIsLoadingRequests(false);
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
    // NEW BUSINESS LOGIC:
    // - Only admins can approve requests
    // - Admins can approve their own requests (new behavior)
    // - Admins can approve other users' requests
    // - Regular users (managers/employees) cannot approve any requests
    
    if (!isAdmin) {
      return false; // Non-admin users cannot approve any requests
    }
    
    // Admin users can approve pending requests
    return request.status === 'pending_approval';
  };

  const canReject = (request: EmailChangeRequest) => {
    // NEW BUSINESS LOGIC:
    // - Only admins can reject requests
    // - Admins can reject any pending request
    // - Regular users cannot reject any requests
    
    if (!isAdmin) {
      return false; // Non-admin users cannot reject any requests
    }
    
    // Admin users can reject pending requests
    return ['pending_approval', 'pending_verification'].includes(request.status);
  };

  const isSelfApproval = (request: EmailChangeRequest) => {
    return isAdmin && request.userId === user?.id;
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
          <h3 className="text-lg font-medium text-gray-900">
            {isAdmin ? 'Email Change Requests (Admin View)' : 'My Email Change Requests'}
          </h3>
          <p className="text-sm text-gray-600">
            {isAdmin 
              ? 'Manage all user email change requests - you can approve your own requests'
              : 'View your email change requests - admin approval required'
            }
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {isAdmin && (
            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
              Admin: Can approve own requests
            </div>
          )}
          <button
            onClick={loadRequests}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
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

      {/* Business Logic Info */}
      {!isAdmin && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <ShieldCheckIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Admin Approval Required</p>
              <p className="text-sm text-blue-800 mt-1">
                Email change requests require approval from an administrator. You can view your request status here, but cannot approve or reject requests.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
          <EnvelopeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {isAdmin 
              ? 'No email change requests found in the system'
              : 'You have no email change requests'
            }
          </p>
          {!isAdmin && (
            <p className="text-sm text-gray-500 mt-2">
              You can create an email change request from your Profile Settings
            </p>
          )}
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
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-lg font-medium text-gray-900">Email Change Request</h4>
                          {isSelfApproval(request) && (
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              Your Request
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">Request ID: {request.id}</p>
                        {isAdmin && request.userId && (
                          <p className="text-sm text-gray-500">User ID: {request.userId}</p>
                        )}
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {isSelfApproval(selectedRequest) ? 'Approve Your Email Change Request' : 'Approve Email Change Request'}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {isSelfApproval(selectedRequest) 
                    ? `Are you sure you want to approve your own email change from ${selectedRequest.currentEmail} to ${selectedRequest.newEmail}?`
                    : `Are you sure you want to approve this email change from ${selectedRequest.currentEmail} to ${selectedRequest.newEmail}?`
                  }
                </p>
                {isSelfApproval(selectedRequest) && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Self-Approval:</strong> As an admin, you can approve your own email change requests.
                    </p>
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Approval Notes (Optional)
                  </label>
                  <textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={isSelfApproval(selectedRequest) 
                      ? "Add any notes about your self-approval..."
                      : "Add any notes about this approval..."
                    }
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