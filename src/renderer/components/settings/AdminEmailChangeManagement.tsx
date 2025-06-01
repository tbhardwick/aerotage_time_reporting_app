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
          style: {
            color: 'var(--color-warning-800)',
            backgroundColor: 'var(--color-warning-50)',
            borderColor: 'var(--color-warning-200)'
          },
          icon: EnvelopeIcon,
          text: 'Pending Verification'
        };
      case 'pending_approval':
        return {
          style: {
            color: 'var(--color-primary-800)',
            backgroundColor: 'var(--color-primary-50)',
            borderColor: 'var(--color-primary-200)'
          },
          icon: ClockIcon,
          text: 'Pending Approval'
        };
      case 'approved':
        return {
          style: {
            color: 'var(--color-success-800)',
            backgroundColor: 'var(--color-success-50)',
            borderColor: 'var(--color-success-200)'
          },
          icon: ShieldCheckIcon,
          text: 'Approved'
        };
      case 'rejected':
        return {
          style: {
            color: 'var(--color-error-800)',
            backgroundColor: 'var(--color-error-50)',
            borderColor: 'var(--color-error-200)'
          },
          icon: XCircleIcon,
          text: 'Rejected'
        };
      case 'completed':
        return {
          style: {
            color: 'var(--color-success-800)',
            backgroundColor: 'var(--color-success-50)',
            borderColor: 'var(--color-success-200)'
          },
          icon: CheckCircleIcon,
          text: 'Completed'
        };
      case 'cancelled':
        return {
          style: {
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--surface-secondary)',
            borderColor: 'var(--border-color)'
          },
          icon: XCircleIcon,
          text: 'Cancelled'
        };
      default:
        return {
          style: {
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--surface-secondary)',
            borderColor: 'var(--border-color)'
          },
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
        <div 
          className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
          style={{ borderColor: 'var(--color-primary-600)' }}
        ></div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading email change requests...</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
            {isAdmin ? 'Email Change Requests (Admin View)' : 'My Email Change Requests'}
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {isAdmin 
              ? 'Manage all user email change requests - you can approve your own requests'
              : 'View your email change requests - admin approval required'
            }
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {isAdmin && (
            <div 
              className="text-xs px-2 py-1 rounded border"
              style={{
                color: 'var(--color-primary-800)',
                backgroundColor: 'var(--color-primary-50)',
                borderColor: 'var(--color-primary-200)'
              }}
            >
              Admin: Can approve own requests
            </div>
          )}
          <button
            onClick={loadRequests}
            disabled={loading}
            className="px-4 py-2 rounded-lg disabled:opacity-50 transition-colors duration-200"
            style={{
              backgroundColor: 'var(--color-primary-600)',
              color: 'var(--color-text-on-primary)'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
              }
            }}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div 
        className="p-4 rounded-lg border"
        style={{
          backgroundColor: 'var(--surface-color)',
          borderColor: 'var(--border-color)'
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label 
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--text-primary)' }}
            >
              Status
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as any || undefined, offset: 0 })}
              className="w-full px-3 py-2 border rounded-md focus:ring-2"
              style={{
                backgroundColor: 'var(--background-color)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
                '--tw-ring-color': 'var(--color-primary-600)'
              } as React.CSSProperties}
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
            <label 
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--text-primary)' }}
            >
              Sort By
            </label>
            <select
              value={filters.sortBy || 'requestedAt'}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any, offset: 0 })}
              className="w-full px-3 py-2 border rounded-md focus:ring-2"
              style={{
                backgroundColor: 'var(--background-color)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
                '--tw-ring-color': 'var(--color-primary-600)'
              } as React.CSSProperties}
            >
              <option value="requestedAt">Request Date</option>
              <option value="status">Status</option>
              <option value="reason">Reason</option>
            </select>
          </div>
          <div>
            <label 
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--text-primary)' }}
            >
              Order
            </label>
            <select
              value={filters.sortOrder || 'desc'}
              onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value as any, offset: 0 })}
              className="w-full px-3 py-2 border rounded-md focus:ring-2"
              style={{
                backgroundColor: 'var(--background-color)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
                '--tw-ring-color': 'var(--color-primary-600)'
              } as React.CSSProperties}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div 
          className="p-4 border rounded-lg"
          style={{
            backgroundColor: 'var(--color-error-50)',
            borderColor: 'var(--color-error-200)'
          }}
        >
          <p className="text-sm" style={{ color: 'var(--color-error-800)' }}>{error}</p>
        </div>
      )}

      {/* Business Logic Info */}
      {!isAdmin && (
        <div 
          className="p-4 border rounded-lg"
          style={{
            backgroundColor: 'var(--color-primary-50)',
            borderColor: 'var(--color-primary-200)'
          }}
        >
          <div className="flex items-start space-x-2">
            <ShieldCheckIcon 
              className="h-5 w-5 flex-shrink-0 mt-0.5" 
              style={{ color: 'var(--color-primary-600)' }}
            />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-primary-900)' }}>Admin Approval Required</p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-primary-800)' }}>
                Email change requests require approval from an administrator. You can view your request status here, but cannot approve or reject requests.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Requests List */}
      {requests.length === 0 ? (
        <div 
          className="text-center py-8 rounded-lg border"
          style={{
            backgroundColor: 'var(--surface-color)',
            borderColor: 'var(--border-color)'
          }}
        >
          <EnvelopeIcon 
            className="h-12 w-12 mx-auto mb-4" 
            style={{ color: 'var(--text-tertiary)' }}
          />
          <p style={{ color: 'var(--text-secondary)' }}>
            {isAdmin 
              ? 'No email change requests found in the system'
              : 'You have no email change requests'
            }
          </p>
          {!isAdmin && (
            <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>
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
              <div 
                key={request.id} 
                className="border rounded-lg p-6"
                style={{
                  backgroundColor: 'var(--surface-color)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                                          {/* Header */}
                      <div className="flex items-center space-x-3 mb-4">
                        <div 
                          className="p-2 rounded-full border"
                          style={statusConfig.style}
                        >
                          <StatusIcon className="h-5 w-5" />
                        </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Email Change Request</h4>
                          {isSelfApproval(request) && (
                            <span 
                              className="px-2 py-1 text-xs font-medium rounded-full"
                              style={{
                                backgroundColor: 'var(--color-primary-50)',
                                color: 'var(--color-primary-800)'
                              }}
                            >
                              Your Request
                            </span>
                          )}
                        </div>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Request ID: {request.id}</p>
                        {isAdmin && request.userId && (
                          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>User ID: {request.userId}</p>
                        )}
                      </div>
                                              <span 
                          className="px-3 py-1 text-sm font-medium rounded-full border"
                          style={statusConfig.style}
                        >
                          {statusConfig.text}
                        </span>
                    </div>

                    {/* Request Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <UserIcon className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
                          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>From:</span>
                          <p className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>{request.currentEmail}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>To:</span>
                          <p className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>{request.newEmail}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Reason:</span>
                          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{getReasonDisplay(request.reason, request.customReason)}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CalendarIcon className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
                          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Requested:</span>
                          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{formatDate(request.requestedAt)}</span>
                        </div>
                        {request.estimatedCompletionTime && (
                          <div className="flex items-center space-x-2">
                            <ClockIcon className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
                            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Est. Completion:</span>
                            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{formatDate(request.estimatedCompletionTime)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Verification Status */}
                    {request.status === 'pending_verification' && (
                      <div 
                        className="mb-4 p-3 rounded-lg"
                        style={{
                          backgroundColor: 'var(--surface-secondary)',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        <h5 className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Verification Status:</h5>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor: request.verificationStatus.currentEmailVerified 
                                  ? 'var(--color-success-600)' 
                                  : 'var(--color-warning-600)'
                              }}
                            />
                            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Current Email</span>
                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              {request.verificationStatus.currentEmailVerified ? 'Verified' : 'Pending'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor: request.verificationStatus.newEmailVerified 
                                  ? 'var(--color-success-600)' 
                                  : 'var(--color-warning-600)'
                              }}
                            />
                            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>New Email</span>
                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              {request.verificationStatus.newEmailVerified ? 'Verified' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Rejection Reason */}
                    {request.status === 'rejected' && request.rejectionReason && (
                      <div 
                        className="mb-4 p-3 border rounded-lg"
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
                            <p className="text-sm font-medium" style={{ color: 'var(--color-error-800)' }}>Rejection Reason:</p>
                            <p className="text-sm mt-1" style={{ color: 'var(--color-error-800)' }}>{request.rejectionReason}</p>
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
                        className="px-3 py-2 text-sm font-medium border rounded-md transition-colors"
                        style={{
                          color: 'var(--color-success-800)',
                          backgroundColor: 'var(--color-success-50)',
                          borderColor: 'var(--color-success-200)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--color-success-100)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--color-success-50)';
                        }}
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
                        className="px-3 py-2 text-sm font-medium border rounded-md transition-colors"
                        style={{
                          color: 'var(--color-error-800)',
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
            <div className="fixed inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onClick={() => setShowApprovalModal(false)} />
            <div 
              className="relative w-full max-w-md rounded-lg shadow-xl"
              style={{ backgroundColor: 'var(--surface-color)' }}
            >
              <div className="p-6">
                <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
                  {isSelfApproval(selectedRequest) ? 'Approve Your Email Change Request' : 'Approve Email Change Request'}
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  {isSelfApproval(selectedRequest) 
                    ? `Are you sure you want to approve your own email change from ${selectedRequest.currentEmail} to ${selectedRequest.newEmail}?`
                    : `Are you sure you want to approve this email change from ${selectedRequest.currentEmail} to ${selectedRequest.newEmail}?`
                  }
                </p>
                {isSelfApproval(selectedRequest) && (
                  <div 
                    className="mb-4 p-3 border rounded-lg"
                    style={{
                      backgroundColor: 'var(--color-primary-50)',
                      borderColor: 'var(--color-primary-200)'
                    }}
                  >
                    <p className="text-sm" style={{ color: 'var(--color-primary-800)' }}>
                      <strong>Self-Approval:</strong> As an admin, you can approve your own email change requests.
                    </p>
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                    Approval Notes (Optional)
                  </label>
                  <textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-offset-2"
                    style={{
                      backgroundColor: 'var(--background-color)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                      '--tw-ring-color': 'var(--color-primary-600)'
                    } as React.CSSProperties}
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
                    className="px-4 py-2 text-sm font-medium border rounded-md disabled:opacity-50 transition-colors"
                    style={{
                      color: 'var(--button-secondary-text)',
                      backgroundColor: 'var(--button-secondary-bg)',
                      borderColor: 'var(--border-color)'
                    }}
                    onMouseEnter={(e) => {
                      if (!actionLoading) {
                        e.currentTarget.style.backgroundColor = 'var(--button-secondary-hover)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!actionLoading) {
                        e.currentTarget.style.backgroundColor = 'var(--button-secondary-bg)';
                      }
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="px-4 py-2 text-sm font-medium border border-transparent rounded-md disabled:opacity-50 transition-colors"
                    style={{
                      color: 'var(--color-text-on-success)',
                      backgroundColor: 'var(--color-success-600)'
                    }}
                    onMouseEnter={(e) => {
                      if (!actionLoading) {
                        e.currentTarget.style.backgroundColor = 'var(--color-success-hover)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!actionLoading) {
                        e.currentTarget.style.backgroundColor = 'var(--color-success-600)';
                      }
                    }}
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
            <div className="fixed inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onClick={() => setShowRejectionModal(false)} />
            <div 
              className="relative w-full max-w-md rounded-lg shadow-xl"
              style={{ backgroundColor: 'var(--surface-color)' }}
            >
              <div className="p-6">
                <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Reject Email Change Request</h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Please provide a reason for rejecting this email change request.
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-offset-2"
                    style={{
                      backgroundColor: 'var(--background-color)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                      '--tw-ring-color': 'var(--color-primary-600)'
                    } as React.CSSProperties}
                    placeholder="Explain why this request is being rejected..."
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowRejectionModal(false)}
                    disabled={actionLoading}
                    className="px-4 py-2 text-sm font-medium border rounded-md disabled:opacity-50 transition-colors"
                    style={{
                      color: 'var(--button-secondary-text)',
                      backgroundColor: 'var(--button-secondary-bg)',
                      borderColor: 'var(--border-color)'
                    }}
                    onMouseEnter={(e) => {
                      if (!actionLoading) {
                        e.currentTarget.style.backgroundColor = 'var(--button-secondary-hover)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!actionLoading) {
                        e.currentTarget.style.backgroundColor = 'var(--button-secondary-bg)';
                      }
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={actionLoading || !rejectionReason.trim()}
                    className="px-4 py-2 text-sm font-medium border border-transparent rounded-md disabled:opacity-50 transition-colors"
                    style={{
                      color: 'var(--color-text-on-error)',
                      backgroundColor: 'var(--color-error-600)'
                    }}
                    onMouseEnter={(e) => {
                      if (!actionLoading && rejectionReason.trim()) {
                        e.currentTarget.style.backgroundColor = 'var(--color-error-hover)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!actionLoading && rejectionReason.trim()) {
                        e.currentTarget.style.backgroundColor = 'var(--color-error-600)';
                      }
                    }}
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