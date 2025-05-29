import React, { useState } from 'react';
import { UserList } from '../components/users/UserList';
import { UserForm } from '../components/users/UserForm';
import { InvitationForm } from '../components/users/InvitationForm';
import { InvitationList } from '../components/users/InvitationList';
import { AdminEmailChangeManagement } from '../components/settings';
import { useAppContext } from '../context/AppContext';
import { 
  UserPlusIcon, 
  PaperAirplaneIcon, 
  UsersIcon, 
  EnvelopeIcon,
  UserIcon,
  PhoneIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  AtSymbolIcon
} from '@heroicons/react/24/outline';

export const Users: React.FC = () => {
  const { state } = useAppContext();
  const [showInvitationForm, setShowInvitationForm] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'invitations' | 'email-changes'>('users');
  const [invitationListKey, setInvitationListKey] = useState(0);

  // Check if current user is admin or manager
  const isAdminOrManager = state.user?.role === 'admin' || state.user?.role === 'manager';

  const handleInviteUser = () => {
    setShowInvitationForm(true);
  };

  const handleCreateUser = () => {
    setShowCreateForm(true);
  };

  const handleEditUser = (userId: string) => {
    setEditingUserId(userId);
  };

  const handleViewUser = (userId: string) => {
    setViewingUserId(userId);
  };

  const handleCloseForm = () => {
    setShowInvitationForm(false);
    setShowCreateForm(false);
    setEditingUserId(null);
    setViewingUserId(null);
  };

  const handleSaveUser = () => {
    // The form handles the actual saving, we just need to refresh
    handleCloseForm();
  };

  const handleInvitationSuccess = () => {
    // Force refresh of invitation list and switch to invitations tab
    setInvitationListKey(prev => prev + 1);
    setActiveTab('invitations');
  };

  const handleTabSwitch = (tab: 'users' | 'invitations' | 'email-changes') => {
    if (tab === 'invitations' && activeTab !== 'invitations') {
      // Refresh invitation list when switching to invitations tab
      setInvitationListKey(prev => prev + 1);
    }
    setActiveTab(tab);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>User Management</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Manage users, send invitations, and handle email change requests
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => handleTabSwitch('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent'
              }`}
              style={{
                color: activeTab === 'users' ? '#2563eb' : 'var(--text-secondary)'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'users') {
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'users') {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.borderColor = 'transparent';
                }
              }}
            >
              <UsersIcon className="h-5 w-5 inline mr-2" />
              Active Users
            </button>
            <button
              onClick={() => handleTabSwitch('invitations')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'invitations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent'
              }`}
              style={{
                color: activeTab === 'invitations' ? '#2563eb' : 'var(--text-secondary)'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'invitations') {
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'invitations') {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.borderColor = 'transparent';
                }
              }}
            >
              <EnvelopeIcon className="h-5 w-5 inline mr-2" />
              Invitations
            </button>
            {isAdminOrManager && (
              <button
                onClick={() => handleTabSwitch('email-changes')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'email-changes'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent'
                }`}
                style={{
                  color: activeTab === 'email-changes' ? '#2563eb' : 'var(--text-secondary)'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'email-changes') {
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'email-changes') {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.borderColor = 'transparent';
                  }
                }}
              >
                <AtSymbolIcon className="h-5 w-5 inline mr-2" />
                Email Changes
              </button>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Team Members</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Manage existing users and their permissions</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleInviteUser}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                  Invite User
                </button>
                <button
                  onClick={handleCreateUser}
                  className="inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  style={{
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--surface-color)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--border-color)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface-color)';
                  }}
                >
                  <UserPlusIcon className="h-4 w-4 mr-2" />
                  Create User Manually
                </button>
              </div>
            </div>

            <UserList
              onEditUser={handleEditUser}
              onViewUser={handleViewUser}
            />
          </div>
        )}

        {activeTab === 'invitations' && (
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>User Invitations</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Track and manage pending user invitations</p>
              </div>
              <button
                onClick={handleInviteUser}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                Send New Invitation
              </button>
            </div>

            <InvitationList key={invitationListKey} />
          </div>
        )}

        {activeTab === 'email-changes' && isAdminOrManager && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Email Change Requests</h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Review and manage user email change requests</p>
            </div>
            <AdminEmailChangeManagement />
          </div>
        )}

        {/* Invitation Form Modal */}
        {showInvitationForm && (
          <InvitationForm
            onClose={handleCloseForm}
            onSuccess={handleInvitationSuccess}
          />
        )}

        {/* Create User Modal */}
        {showCreateForm && (
          <UserForm
            onClose={handleCloseForm}
            onSave={handleSaveUser}
          />
        )}

        {/* Edit User Modal */}
        {editingUserId && (
          <UserForm
            userId={editingUserId}
            onClose={handleCloseForm}
            onSave={handleSaveUser}
          />
        )}

        {/* View User Modal - User Profile Display */}
        {viewingUserId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-4 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md" style={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)' }}>
              {(() => {
                const user = state.users.find((u: any) => u.id === viewingUserId);
                if (!user) {
                  return (
                    <div className="text-center py-8">
                      <p style={{ color: 'var(--text-secondary)' }}>User not found.</p>
                      <button
                        onClick={handleCloseForm}
                        className="mt-4 px-4 py-2 rounded-md"
                        style={{
                          backgroundColor: 'var(--border-color)',
                          color: 'var(--text-primary)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--text-secondary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--border-color)';
                        }}
                      >
                        Close
                      </button>
                    </div>
                  );
                }

                return (
                  <>
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <div className="flex items-center space-x-4">
                        <div className="h-16 w-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--border-color)' }}>
                          <span className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>
                            {user.name ? user.name.split(' ').map((n: string) => n[0]).join('') : user.email ? user.email[0].toUpperCase() : '?'}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>{user.name || 'No Name'}</h3>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
                          <div className="flex items-center mt-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.role === 'admin' ? 'bg-red-100 text-red-800' :
                              user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </span>
                            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleCloseForm}
                        style={{ color: 'var(--text-secondary)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--text-primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                      >
                        <span className="sr-only">Close</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* User Details */}
                    <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left Column - Basic Information */}
                      <div className="space-y-6">
                        {/* Personal Information */}
                        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--border-color)' }}>
                          <h4 className="text-sm font-medium mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                            <UserIcon className="h-4 w-4 mr-2" />
                            Personal Information
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
                              <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>{user.name || 'Not provided'}</p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Email</label>
                              <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>{user.email}</p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Job Title</label>
                              <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>{user.jobTitle || 'Not provided'}</p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Department</label>
                              <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>{user.department || 'Not provided'}</p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Start Date</label>
                              <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                                {user.startDate ? new Date(user.startDate).toLocaleDateString() : 'Not provided'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Contact Information */}
                        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--border-color)' }}>
                          <h4 className="text-sm font-medium mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                            <PhoneIcon className="h-4 w-4 mr-2" />
                            Contact Information
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Phone</label>
                              <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>{user.contactInfo?.phone || 'Not provided'}</p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Address</label>
                              <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>{user.contactInfo?.address || 'Not provided'}</p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Emergency Contact</label>
                              <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>{user.contactInfo?.emergencyContact || 'Not provided'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Role & Settings */}
                      <div className="space-y-6">
                        {/* Role & Team */}
                        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--border-color)' }}>
                          <h4 className="text-sm font-medium mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                            <ShieldCheckIcon className="h-4 w-4 mr-2" />
                            Role & Team
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Role</label>
                              <p className="mt-1 text-sm capitalize" style={{ color: 'var(--text-primary)' }}>{user.role}</p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Team</label>
                              <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                                {user.teamId ? state.teams.find((t: any) => t.id === user.teamId)?.name || 'Unknown Team' : 'No Team'}
                              </p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Hourly Rate</label>
                              <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                                {user.hourlyRate ? `$${user.hourlyRate}/hour` : 'Not set'}
                              </p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Status</label>
                              <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {user.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Permissions */}
                        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--border-color)' }}>
                          <h4 className="text-sm font-medium mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                            <ShieldCheckIcon className="h-4 w-4 mr-2" />
                            Permissions
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Features</label>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {user.permissions?.features?.map((feature: string) => (
                                  <span key={feature} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {feature}
                                  </span>
                                )) || <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>No features assigned</span>}
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Project Access</label>
                              <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                                {user.permissions?.projects?.length || 0} project(s) assigned
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Preferences */}
                        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--border-color)' }}>
                          <h4 className="text-sm font-medium mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                            <Cog6ToothIcon className="h-4 w-4 mr-2" />
                            Preferences
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Theme</label>
                              <p className="mt-1 text-sm capitalize" style={{ color: 'var(--text-primary)' }}>{user.preferences?.theme || 'Not set'}</p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Notifications</label>
                              <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                                {user.preferences?.notifications ? 'Enabled' : 'Disabled'}
                              </p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Timezone</label>
                              <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>{user.preferences?.timezone || 'Not set'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center pt-6 mt-6" style={{ borderTop: '1px solid var(--border-color)' }}>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <p>Created: {user.createdAt ? new Date(user.createdAt).toLocaleString() : 'Unknown'}</p>
                        <p>Last Updated: {user.updatedAt ? new Date(user.updatedAt).toLocaleString() : 'Unknown'}</p>
                        {user.lastLogin && <p>Last Login: {new Date(user.lastLogin).toLocaleString()}</p>}
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={handleCloseForm}
                          className="px-4 py-2 rounded-md text-sm font-medium"
                          style={{
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            backgroundColor: 'var(--surface-color)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--border-color)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--surface-color)';
                          }}
                        >
                          Close
                        </button>
                        <button
                          onClick={() => {
                            handleCloseForm();
                            handleEditUser(user.id);
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                        >
                          Edit User
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
    </div>
  );
};

export default Users; 