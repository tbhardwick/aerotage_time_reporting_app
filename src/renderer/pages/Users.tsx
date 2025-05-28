import React, { useState } from 'react';
import { UserList } from '../components/users/UserList';
import { UserForm } from '../components/users/UserForm';
import { InvitationForm } from '../components/users/InvitationForm';
import { InvitationList } from '../components/users/InvitationList';
import { useAppContext } from '../context/AppContext';
import { 
  UserPlusIcon, 
  PaperAirplaneIcon, 
  UsersIcon, 
  EnvelopeIcon,
  UserIcon,
  PhoneIcon,
  ShieldCheckIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

export const Users: React.FC = () => {
  const { state } = useAppContext();
  const [showInvitationForm, setShowInvitationForm] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'invitations'>('users');
  const [invitationListKey, setInvitationListKey] = useState(0);

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

  const handleTabSwitch = (tab: 'users' | 'invitations') => {
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
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage users and send invitations to new team members
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => handleTabSwitch('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UsersIcon className="h-5 w-5 inline mr-2" />
              Active Users
            </button>
            <button
              onClick={() => handleTabSwitch('invitations')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'invitations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <EnvelopeIcon className="h-5 w-5 inline mr-2" />
              Invitations
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Team Members</h2>
                <p className="text-sm text-gray-600">Manage existing users and their permissions</p>
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
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                <h2 className="text-lg font-medium text-gray-900">User Invitations</h2>
                <p className="text-sm text-gray-600">Track and manage pending user invitations</p>
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
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-4 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
              {(() => {
                const user = state.users.find((u: any) => u.id === viewingUserId);
                if (!user) {
                  return (
                    <div className="text-center py-8">
                      <p className="text-gray-600">User not found.</p>
                      <button
                        onClick={handleCloseForm}
                        className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                      >
                        Close
                      </button>
                    </div>
                  );
                }

                return (
                  <>
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 border-b">
                      <div className="flex items-center space-x-4">
                        <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-xl font-medium text-gray-700">
                            {user.name ? user.name.split(' ').map((n: string) => n[0]).join('') : user.email ? user.email[0].toUpperCase() : '?'}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xl font-medium text-gray-900">{user.name || 'No Name'}</h3>
                          <p className="text-sm text-gray-500">{user.email}</p>
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
                        className="text-gray-400 hover:text-gray-600"
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
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                            <UserIcon className="h-4 w-4 mr-2" />
                            Personal Information
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</label>
                              <p className="mt-1 text-sm text-gray-900">{user.name || 'Not provided'}</p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Email</label>
                              <p className="mt-1 text-sm text-gray-900">{user.email}</p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Job Title</label>
                              <p className="mt-1 text-sm text-gray-900">{user.jobTitle || 'Not provided'}</p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Department</label>
                              <p className="mt-1 text-sm text-gray-900">{user.department || 'Not provided'}</p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</label>
                              <p className="mt-1 text-sm text-gray-900">
                                {user.startDate ? new Date(user.startDate).toLocaleDateString() : 'Not provided'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Contact Information */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                            <PhoneIcon className="h-4 w-4 mr-2" />
                            Contact Information
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</label>
                              <p className="mt-1 text-sm text-gray-900">{user.contactInfo?.phone || 'Not provided'}</p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Address</label>
                              <p className="mt-1 text-sm text-gray-900">{user.contactInfo?.address || 'Not provided'}</p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Emergency Contact</label>
                              <p className="mt-1 text-sm text-gray-900">{user.contactInfo?.emergencyContact || 'Not provided'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Role & Settings */}
                      <div className="space-y-6">
                        {/* Role & Team */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                            <ShieldCheckIcon className="h-4 w-4 mr-2" />
                            Role & Team
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Role</label>
                              <p className="mt-1 text-sm text-gray-900 capitalize">{user.role}</p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Team</label>
                              <p className="mt-1 text-sm text-gray-900">
                                {user.teamId ? state.teams.find((t: any) => t.id === user.teamId)?.name || 'Unknown Team' : 'No Team'}
                              </p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Hourly Rate</label>
                              <p className="mt-1 text-sm text-gray-900">
                                {user.hourlyRate ? `$${user.hourlyRate}/hour` : 'Not set'}
                              </p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Status</label>
                              <p className="mt-1 text-sm text-gray-900">
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
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                            <ShieldCheckIcon className="h-4 w-4 mr-2" />
                            Permissions
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Features</label>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {user.permissions?.features?.map((feature: string) => (
                                  <span key={feature} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {feature}
                                  </span>
                                )) || <span className="text-sm text-gray-500">No features assigned</span>}
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Project Access</label>
                              <p className="mt-1 text-sm text-gray-900">
                                {user.permissions?.projects?.length || 0} project(s) assigned
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Preferences */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                            <Cog6ToothIcon className="h-4 w-4 mr-2" />
                            Preferences
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Theme</label>
                              <p className="mt-1 text-sm text-gray-900 capitalize">{user.preferences?.theme || 'Not set'}</p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Notifications</label>
                              <p className="mt-1 text-sm text-gray-900">
                                {user.preferences?.notifications ? 'Enabled' : 'Disabled'}
                              </p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Timezone</label>
                              <p className="mt-1 text-sm text-gray-900">{user.preferences?.timezone || 'Not set'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center pt-6 border-t mt-6">
                      <div className="text-xs text-gray-500">
                        <p>Created: {user.createdAt ? new Date(user.createdAt).toLocaleString() : 'Unknown'}</p>
                        <p>Last Updated: {user.updatedAt ? new Date(user.updatedAt).toLocaleString() : 'Unknown'}</p>
                        {user.lastLogin && <p>Last Login: {new Date(user.lastLogin).toLocaleString()}</p>}
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={handleCloseForm}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
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