import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { apiClient, UserInvitation, InvitationFilters } from '../../services/api-client';
import {
  EnvelopeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  TrashIcon,
  CalendarIcon,
  UserIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

interface InvitationListProps {
  onRefresh?: () => void;
}

const getStatusColor = (status: UserInvitation['status']) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'accepted':
      return 'bg-green-100 text-green-800';
    case 'expired':
      return 'bg-red-100 text-red-800';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: UserInvitation['status']) => {
  switch (status) {
    case 'pending':
      return <ClockIcon className="h-4 w-4" />;
    case 'accepted':
      return <CheckCircleIcon className="h-4 w-4" />;
    case 'expired':
      return <ExclamationTriangleIcon className="h-4 w-4" />;
    case 'cancelled':
      return <XCircleIcon className="h-4 w-4" />;
    default:
      return <ClockIcon className="h-4 w-4" />;
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const isExpired = (expiresAt: string) => {
  return new Date(expiresAt) < new Date();
};

export const InvitationList: React.FC<InvitationListProps> = ({ onRefresh }) => {
  const { state, dispatch } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  // Fetch invitations on component mount and when filters change
  useEffect(() => {
    fetchInvitations();
  }, [selectedStatus]);

  const fetchInvitations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const filters: InvitationFilters = {};
      if (selectedStatus !== 'all') {
        filters.status = selectedStatus as any;
      }

      const invitations = await apiClient.getUserInvitations(filters);
      
      console.log('✅ Invitations fetched:', invitations?.length || 0, 'invitations');
      
      dispatch({
        type: 'SET_USER_INVITATIONS',
        payload: invitations,
      });
    } catch (err) {
      console.error('❌ Error fetching invitations:', err instanceof Error ? err.message : err);
      
      let errorMessage = 'Failed to fetch invitations';
      
      // Check for specific error types
      if (err instanceof Error) {
        if (err.message.includes('NetworkError') || err.message.includes('ERR_NAME_NOT_RESOLVED')) {
          errorMessage = 'Backend API is not available. The user invitation endpoints may not be deployed yet.';
        } else if (err.message.includes('Authentication required')) {
          errorMessage = 'Authentication required. Please sign in again.';
        } else if (err.message.includes('403') || err.message.includes('Forbidden')) {
          errorMessage = 'You do not have permission to view invitations.';
        } else if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          errorMessage = 'Authentication failed. Please sign in again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (invitation: UserInvitation) => {
    const actionKey = `resend-${invitation.id}`;
    setActionLoading({ ...actionLoading, [actionKey]: true });
    
    try {
      console.log('🔄 Resending invitation:', invitation.id);
      await apiClient.resendInvitation(invitation.id, { extendExpiration: true });
      
      // Update the invitation in context
      dispatch({
        type: 'UPDATE_USER_INVITATION',
        payload: {
          id: invitation.id,
          updates: {
            resentCount: invitation.resentCount + 1,
            lastResentAt: new Date().toISOString(),
            // The backend should return updated expiration, but we'll fetch fresh data
          },
        },
      });
      
      // Refresh the list to get updated data
      await fetchInvitations();
      
      console.log('✅ Invitation resent successfully');
    } catch (err) {
      console.error('❌ Error resending invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to resend invitation');
    } finally {
      setActionLoading({ ...actionLoading, [actionKey]: false });
    }
  };

  const handleCancel = async (invitation: UserInvitation) => {
    const actionKey = `cancel-${invitation.id}`;
    setActionLoading({ ...actionLoading, [actionKey]: true });
    
    try {
      console.log('❌ Cancelling invitation:', invitation.id);
      await apiClient.cancelInvitation(invitation.id);
      
      // Update the invitation in context
      dispatch({
        type: 'UPDATE_USER_INVITATION',
        payload: {
          id: invitation.id,
          updates: { status: 'cancelled' },
        },
      });
      
      console.log('✅ Invitation cancelled successfully');
    } catch (err) {
      console.error('❌ Error cancelling invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel invitation');
    } finally {
      setActionLoading({ ...actionLoading, [actionKey]: false });
    }
  };

  const filteredInvitations = state.userInvitations.filter(invitation => {
    if (selectedStatus === 'all') return true;
    return invitation.status === selectedStatus;
  });

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-center h-32">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="ml-2 text-gray-600">Loading invitations...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <EnvelopeIcon className="h-5 w-5 mr-2 text-blue-500" />
              User Invitations
            </h3>
            <p className="text-sm text-gray-500">
              Manage pending and completed user invitations
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
            

            
            {/* Refresh Button */}
            <button
              onClick={fetchInvitations}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5" />
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">
                  {error.includes('Backend API is not available') ? 'Backend Not Available' : 'Error Loading Invitations'}
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                  {error.includes('Backend API is not available') && (
                    <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                      <div className="text-yellow-800">
                        <p className="font-medium">📋 Development Status:</p>
                        <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                          <li>Frontend invitation system: ✅ Complete</li>
                          <li>Backend API endpoints: ⏳ Pending deployment</li>
                          <li>AWS infrastructure: ⏳ Pending setup</li>
                        </ul>
                        <p className="mt-3 text-sm">
                          <strong>Next steps:</strong> Contact the backend team to deploy the user invitation API endpoints.
                          Reference: <code className="bg-yellow-100 px-1 rounded text-xs">USER_INVITATION_API_REQUIREMENTS.md</code>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <button
                    onClick={fetchInvitations}
                    className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-md transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invitations List */}
        {filteredInvitations.length === 0 ? (
          <div className="text-center py-12">
            <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No invitations found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {selectedStatus === 'all' 
                ? 'No user invitations have been sent yet.'
                : `No ${selectedStatus} invitations found.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInvitations.map((invitation) => (
              <div key={invitation.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex-shrink-0">
                        <UserIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{invitation.email}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}>
                            {getStatusIcon(invitation.status)}
                            <span className="ml-1 capitalize">{invitation.status}</span>
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <ShieldCheckIcon className="h-3 w-3 mr-1" />
                            {invitation.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                      {invitation.jobTitle && (
                        <div>
                          <span className="font-medium">Job Title:</span> {invitation.jobTitle}
                        </div>
                      )}
                      {invitation.department && (
                        <div>
                          <span className="font-medium">Department:</span> {invitation.department}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Sent:</span> {formatDate(invitation.createdAt)}
                      </div>
                      <div>
                        <span className="font-medium">Expires:</span> 
                        <span className={isExpired(invitation.expiresAt) ? 'text-red-600 font-medium' : ''}>
                          {formatDate(invitation.expiresAt)}
                        </span>
                      </div>
                    </div>

                    {invitation.personalMessage && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
                        <p className="text-sm text-blue-800">
                          <span className="font-medium">Personal Message:</span> {invitation.personalMessage}
                        </p>
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      Resent {invitation.resentCount} times
                      {invitation.lastResentAt && (
                        <span> • Last resent: {formatDate(invitation.lastResentAt)}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 ml-4">
                    <div className="flex space-x-2">
                      {invitation.status === 'pending' && !isExpired(invitation.expiresAt) && (
                        <button
                          onClick={() => handleResend(invitation)}
                          disabled={actionLoading[`resend-${invitation.id}`] || invitation.resentCount >= 3}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                          title={invitation.resentCount >= 3 ? 'Maximum resends reached' : 'Resend invitation'}
                        >
                          {actionLoading[`resend-${invitation.id}`] ? (
                            <svg className="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <ArrowPathIcon className="h-3 w-3 mr-1" />
                          )}
                          Resend
                        </button>
                      )}

                      {invitation.status === 'pending' && (
                        <button
                          onClick={() => handleCancel(invitation)}
                          disabled={actionLoading[`cancel-${invitation.id}`]}
                          className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          {actionLoading[`cancel-${invitation.id}`] ? (
                            <svg className="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <TrashIcon className="h-3 w-3 mr-1" />
                          )}
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 