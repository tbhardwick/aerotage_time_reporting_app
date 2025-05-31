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
      return {
        backgroundColor: 'var(--color-warning-50)',
        color: 'var(--color-warning-800)'
      };
    case 'accepted':
      return {
        backgroundColor: 'var(--color-success-50)',
        color: 'var(--color-success-800)'
      };
    case 'expired':
      return {
        backgroundColor: 'var(--color-error-50)',
        color: 'var(--color-error-800)'
      };
    case 'cancelled':
      return {
        backgroundColor: 'var(--surface-secondary)',
        color: 'var(--text-secondary)'
      };
    default:
      return {
        backgroundColor: 'var(--surface-secondary)',
        color: 'var(--text-secondary)'
      };
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
      <div className="shadow rounded-lg" style={{ backgroundColor: 'var(--surface-color)' }}>
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-center h-32">
            <svg className="animate-spin h-8 w-8" style={{ color: 'var(--color-primary-600)' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="ml-2" style={{ color: 'var(--text-secondary)' }}>Loading invitations...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shadow rounded-lg" style={{ backgroundColor: 'var(--surface-color)' }}>
      <div className="px-4 py-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium flex items-center" style={{ color: 'var(--text-primary)' }}>
              <EnvelopeIcon className="h-5 w-5 mr-2" style={{ color: 'var(--color-primary-600)' }} />
              User Invitations
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Manage pending and completed user invitations
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2"
              style={{
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--background-color)',
                color: 'var(--text-primary)',
                '--tw-ring-color': 'var(--color-primary-600)'
              } as React.CSSProperties}
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
              className="inline-flex items-center px-3 py-2 shadow-sm text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
              style={{
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                backgroundColor: 'var(--surface-color)',
                '--tw-ring-color': 'var(--color-primary-600)'
              } as React.CSSProperties}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-secondary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-color)';
              }}
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div 
            className="mb-6 border rounded-md p-4"
            style={{
              backgroundColor: 'var(--color-error-50)',
              borderColor: 'var(--color-error-200)'
            }}
          >
            <div className="flex">
              <ExclamationTriangleIcon 
                className="h-5 w-5 mt-0.5"
                style={{ color: 'var(--color-error-400)' }}
              />
              <div className="ml-3 flex-1">
                <h3 
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-error-800)' }}
                >
                  {error.includes('Backend API is not available') ? 'Backend Not Available' : 'Error Loading Invitations'}
                </h3>
                <div 
                  className="mt-2 text-sm"
                  style={{ color: 'var(--color-error-700)' }}
                >
                  <p>{error}</p>
                  {error.includes('Backend API is not available') && (
                    <div 
                      className="mt-3 border rounded-md p-3"
                      style={{
                        backgroundColor: 'var(--color-warning-50)',
                        borderColor: 'var(--color-warning-200)'
                      }}
                    >
                      <div style={{ color: 'var(--color-warning-800)' }}>
                        <p className="font-medium">📋 Development Status:</p>
                        <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                          <li>Frontend invitation system: ✅ Complete</li>
                          <li>Backend API endpoints: ⏳ Pending deployment</li>
                          <li>AWS infrastructure: ⏳ Pending setup</li>
                        </ul>
                        <p className="mt-3 text-sm">
                          <strong>Next steps:</strong> Contact the backend team to deploy the user invitation API endpoints.
                          Reference: <code 
                            className="px-1 rounded text-xs"
                            style={{
                              backgroundColor: 'var(--color-warning-100)',
                              color: 'var(--color-warning-800)'
                            }}
                          >
                            USER_INVITATION_API_REQUIREMENTS.md
                          </code>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <button
                    onClick={fetchInvitations}
                    className="text-sm px-3 py-1 rounded-md transition-colors"
                    style={{
                      backgroundColor: 'var(--color-error-100)',
                      color: 'var(--color-error-800)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-error-200)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-error-100)';
                    }}
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
            <EnvelopeIcon className="mx-auto h-12 w-12" style={{ color: 'var(--text-secondary)' }} />
            <h3 className="mt-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>No invitations found</h3>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {selectedStatus === 'all' 
                ? 'No user invitations have been sent yet.'
                : `No ${selectedStatus} invitations found.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInvitations.map((invitation) => (
              <div key={invitation.id} className="rounded-lg p-4 transition-colors" style={{ border: '1px solid var(--border-color)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--border-color)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex-shrink-0">
                        <UserIcon className="h-6 w-6" style={{ color: 'var(--text-secondary)' }} />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{invitation.email}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={getStatusColor(invitation.status)}
                          >
                            {getStatusIcon(invitation.status)}
                            <span className="ml-1 capitalize">{invitation.status}</span>
                          </span>
                          <span 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: 'var(--color-primary-100)',
                              color: 'var(--color-primary-800)'
                            }}
                          >
                            <ShieldCheckIcon className="h-3 w-3 mr-1" />
                            {invitation.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
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
                        <span 
                          className={isExpired(invitation.expiresAt) ? 'font-medium' : ''}
                          style={isExpired(invitation.expiresAt) ? { color: 'var(--color-error-600)' } : {}}
                        >
                          {formatDate(invitation.expiresAt)}
                        </span>
                      </div>
                    </div>

                    {invitation.personalMessage && (
                      <div 
                        className="border rounded-md p-3 mb-3"
                        style={{
                          backgroundColor: 'var(--color-primary-50)',
                          borderColor: 'var(--color-primary-200)'
                        }}
                      >
                        <p 
                          className="text-sm"
                          style={{ color: 'var(--color-primary-800)' }}
                        >
                          <span className="font-medium">Personal Message:</span> {invitation.personalMessage}
                        </p>
                      </div>
                    )}

                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
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
                          className="inline-flex items-center px-3 py-1.5 shadow-sm text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
                          style={{
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            backgroundColor: 'var(--surface-color)',
                            '--tw-ring-color': 'var(--color-primary-500)'
                          } as React.CSSProperties}
                          onMouseEnter={(e) => {
                            if (!e.currentTarget.disabled) {
                              e.currentTarget.style.backgroundColor = 'var(--border-color)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!e.currentTarget.disabled) {
                              e.currentTarget.style.backgroundColor = 'var(--surface-color)';
                            }
                          }}
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
                          className="inline-flex items-center px-3 py-1.5 shadow-sm text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
                          style={{
                            border: '1px solid var(--color-error-300)',
                            color: 'var(--color-error-700)',
                            backgroundColor: 'var(--color-error-50)',
                            '--tw-ring-color': 'var(--color-error-500)'
                          } as React.CSSProperties}
                          onMouseEnter={(e) => {
                            if (!e.currentTarget.disabled) {
                              e.currentTarget.style.backgroundColor = 'var(--color-error-100)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!e.currentTarget.disabled) {
                              e.currentTarget.style.backgroundColor = 'var(--color-error-50)';
                            }
                          }}
                          title="Cancel invitation"
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