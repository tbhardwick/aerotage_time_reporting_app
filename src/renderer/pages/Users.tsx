import React, { useState } from 'react';
import { UserList } from '../components/users/UserList';
import { UserForm } from '../components/users/UserForm';
import { InvitationForm } from '../components/users/InvitationForm';
import { InvitationList } from '../components/users/InvitationList';
import { 
  UserPlusIcon, 
  PaperAirplaneIcon, 
  UsersIcon, 
  EnvelopeIcon 
} from '@heroicons/react/24/outline';

export const Users: React.FC = () => {
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
              onCreateUser={handleCreateUser}
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

        {/* View User Modal - TODO: Implement UserProfile component */}
        {viewingUserId && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-between pb-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">User Profile</h3>
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
              <div className="mt-4">
                <p className="text-gray-600">
                  User profile view will be implemented in the next iteration.
                  For now, use the Edit button to view/modify user details.
                </p>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleCloseForm}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default Users; 