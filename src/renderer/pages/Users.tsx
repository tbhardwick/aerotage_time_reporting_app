import React, { useState } from 'react';
import { UserList } from '../components/users/UserList';
import { UserForm } from '../components/users/UserForm';

export const Users: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);

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
    setShowCreateForm(false);
    setEditingUserId(null);
    setViewingUserId(null);
  };

  const handleSaveUser = () => {
    // The form handles the actual saving, we just need to refresh
    handleCloseForm();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <UserList
          onCreateUser={handleCreateUser}
          onEditUser={handleEditUser}
          onViewUser={handleViewUser}
        />

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
    </div>
  );
};

export default Users; 