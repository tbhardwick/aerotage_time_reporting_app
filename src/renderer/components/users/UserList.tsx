import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import {
  MagnifyingGlassIcon,
  UserPlusIcon,
  PencilIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChevronDownIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  CogIcon,
} from '@heroicons/react/24/outline';
import { ConfirmationDialog } from '../common/ConfirmationDialog';

interface UserListProps {
  onEditUser?: (userId: string) => void;
  onViewUser?: (userId: string) => void;
}

export const UserList: React.FC<UserListProps> = ({
  onEditUser,
  onViewUser,
}) => {
  const { state, dispatch } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'manager' | 'employee'>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkConfirmation, setBulkConfirmation] = useState<{
    isOpen: boolean;
    action: 'activate' | 'deactivate' | null;
    userCount: number;
  }>({
    isOpen: false,
    action: null,
    userCount: 0,
  });
  const [statusToggleConfirmation, setStatusToggleConfirmation] = useState<{
    isOpen: boolean;
    userId: string | null;
    userName: string;
    currentStatus: boolean;
  }>({
    isOpen: false,
    userId: null,
    userName: '',
    currentStatus: false,
  });

  // Get team names for display
  const getTeamName = (teamId?: string) => {
    if (!teamId) return 'No Team';
    const team = state.teams.find(t => t.id === teamId);
    return team ? team.name : 'Unknown Team';
  };

  // Filter and search users
  const filteredUsers = useMemo(() => {
    return state.users.filter(user => {
      // Safety check: ensure user object is valid
      if (!user || typeof user !== 'object') return false;
      
      // If no search term, match all users
      const matchesSearch = !searchTerm || 
        (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.jobTitle && user.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.department && user.department.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'active' && user.isActive) ||
        (statusFilter === 'inactive' && !user.isActive);

      const matchesRole = 
        roleFilter === 'all' || user.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [state.users, searchTerm, statusFilter, roleFilter]);

  // Handle user status toggle
  const handleToggleUserStatus = (userId: string) => {
    const user = state.users.find(u => u.id === userId);
    if (user) {
      // If user is currently active and we're about to deactivate them, show confirmation
      if (user.isActive) {
        setStatusToggleConfirmation({
          isOpen: true,
          userId: user.id,
          userName: user.name || 'No Name',
          currentStatus: user.isActive,
        });
      } else {
        // Activating a user doesn't need confirmation
        dispatch({
          type: 'UPDATE_USER',
          payload: {
            id: userId,
            updates: {
              isActive: true,
              updatedAt: new Date().toISOString(),
            }
          }
        });
      }
    }
  };

  const confirmStatusToggle = () => {
    if (statusToggleConfirmation.userId) {
      dispatch({
        type: 'UPDATE_USER',
        payload: {
          id: statusToggleConfirmation.userId,
          updates: {
            isActive: !statusToggleConfirmation.currentStatus,
            updatedAt: new Date().toISOString(),
          }
        }
      });
    }
    setStatusToggleConfirmation({
      isOpen: false,
      userId: null,
      userName: '',
      currentStatus: false,
    });
  };

  // Handle bulk operations
  const handleBulkStatusUpdate = (isActive: boolean) => {
    setBulkConfirmation({
      isOpen: true,
      action: isActive ? 'activate' : 'deactivate',
      userCount: selectedUsers.length,
    });
  };

  const confirmBulkOperation = () => {
    const isActive = bulkConfirmation.action === 'activate';
    selectedUsers.forEach(userId => {
      dispatch({
        type: 'UPDATE_USER',
        payload: {
          id: userId,
          updates: {
            isActive,
            updatedAt: new Date().toISOString(),
          }
        }
      });
    });
    setSelectedUsers([]);
    setBulkConfirmation({
      isOpen: false,
      action: null,
      userCount: 0,
    });
  };

  // Format last login time
  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return 'Never';
    const date = new Date(lastLogin);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Get role badge styling
  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          backgroundColor: 'var(--color-error-50)',
          color: 'var(--color-error-800)'
        };
      case 'manager':
        return {
          backgroundColor: 'var(--color-primary-50)',
          color: 'var(--color-primary-800)'
        };
      case 'employee':
        return {
          backgroundColor: 'var(--color-success-50)',
          color: 'var(--color-success-800)'
        };
      default:
        return {
          backgroundColor: 'var(--surface-secondary)',
          color: 'var(--text-secondary)'
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>User Management</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Manage users, roles, and permissions</p>
        </div>
        <div className="flex items-center space-x-3">
          {selectedUsers.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {selectedUsers.length} selected
              </span>
              <button
                onClick={() => handleBulkStatusUpdate(true)}
                className="px-3 py-1 text-sm rounded-md transition-colors"
                style={{
                  backgroundColor: 'var(--color-success-50)',
                  color: 'var(--color-success-800)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-success-100)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-success-50)';
                }}
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkStatusUpdate(false)}
                className="px-3 py-1 text-sm rounded-md transition-colors"
                style={{
                  backgroundColor: 'var(--color-error-50)',
                  color: 'var(--color-error-800)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-error-100)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-error-50)';
                }}
              >
                Deactivate
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--border-color)' }}>
        {/* Search */}
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search users by name, email, job title, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-md focus:ring-2 focus:outline-none transition-colors"
            style={{
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--background-color)',
              color: 'var(--text-primary)',
              '--tw-ring-color': 'var(--color-primary-500)'
            } as React.CSSProperties}
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="appearance-none rounded-md px-4 py-2 pr-8 focus:ring-2 focus:outline-none transition-colors"
            style={{
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--background-color)',
              color: 'var(--text-primary)',
              '--tw-ring-color': 'var(--color-primary-500)'
            } as React.CSSProperties}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <ChevronDownIcon className="h-4 w-4 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-secondary)' }} />
        </div>

        {/* Role Filter */}
        <div className="relative">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="appearance-none rounded-md px-4 py-2 pr-8 focus:ring-2 focus:outline-none transition-colors"
            style={{
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--background-color)',
              color: 'var(--text-primary)',
              '--tw-ring-color': 'var(--color-primary-500)'
            } as React.CSSProperties}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="employee">Employee</option>
          </select>
          <ChevronDownIcon className="h-4 w-4 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-secondary)' }} />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8" style={{ color: 'var(--color-primary-600)' }} />
            <div className="ml-3">
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Total Users</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{state.users.length}</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8" style={{ color: 'var(--color-success-600)' }} />
            <div className="ml-3">
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Active Users</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {state.users.filter(u => u.isActive).length}
              </p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center">
            <ShieldCheckIcon className="h-8 w-8" style={{ color: 'var(--color-secondary-600)' }} />
            <div className="ml-3">
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Admins</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {state.users.filter(u => u.role === 'admin').length}
              </p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center">
            <CogIcon className="h-8 w-8" style={{ color: 'var(--color-warning-600)' }} />
            <div className="ml-3">
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Managers</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {state.users.filter(u => u.role === 'manager').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y" style={{ borderColor: 'var(--border-color)' }}>
            <thead style={{ backgroundColor: 'var(--background-color)' }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(filteredUsers.map(u => u.id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                    className="rounded focus:ring-2 focus:ring-offset-2 transition-colors"
                    style={{
                      borderColor: 'var(--border-color)',
                      color: 'var(--color-primary-600)',
                      '--tw-ring-color': 'var(--color-primary-600)'
                    } as React.CSSProperties}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Role & Team
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)' }}>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="transition-colors"
                  style={{
                    backgroundColor: selectedUsers.includes(user.id) ? 'var(--color-primary-50)' : 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!selectedUsers.includes(user.id)) {
                      e.currentTarget.style.backgroundColor = 'var(--border-color)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedUsers.includes(user.id)) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user.id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                        }
                      }}
                      className="rounded focus:ring-2 focus:ring-offset-2 transition-colors"
                      style={{
                        borderColor: 'var(--border-color)',
                        color: 'var(--color-primary-600)',
                        '--tw-ring-color': 'var(--color-primary-600)'
                      } as React.CSSProperties}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--border-color)' }}>
                          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {user.name ? user.name.split(' ').map(n => n[0]).join('') : user.email ? user.email[0].toUpperCase() : '?'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user.name || 'No Name'}</div>
                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{user.email || 'No Email'}</div>
                        {user.jobTitle && (
                          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{user.jobTitle}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={getRoleBadgeStyle(user.role)}
                      >
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {getTeamName(user.teamId)}
                      </div>
                      {user.department && (
                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{user.department}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleUserStatus(user.id)}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors"
                        style={{
                          backgroundColor: user.isActive ? 'var(--color-success-50)' : 'var(--color-error-50)',
                          color: user.isActive ? 'var(--color-success-800)' : 'var(--color-error-800)'
                        }}
                      >
                        {user.isActive ? (
                          <>
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircleIcon className="h-3 w-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {formatLastLogin(user.lastLogin)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onViewUser && onViewUser(user.id)}
                        className="p-1 rounded transition-colors"
                        style={{ color: 'var(--color-primary-600)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--color-primary-hover)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--color-primary-600)';
                        }}
                        title="View User"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onEditUser && onEditUser(user.id)}
                        className="p-1 rounded transition-colors"
                        style={{ color: 'var(--color-primary-600)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--color-primary-hover)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--color-primary-600)';
                        }}
                        title="Edit User"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <UserGroupIcon className="mx-auto h-12 w-12" style={{ color: 'var(--text-secondary)' }} />
            <h3 className="mt-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>No users found</h3>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {searchTerm || statusFilter !== 'all' || roleFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first user using the "Create User Manually" button above.'}
            </p>
          </div>
        )}
      </div>

      {/* Bulk Operation Confirmation Dialog */}
      {bulkConfirmation.isOpen && (
        <ConfirmationDialog
          isOpen={bulkConfirmation.isOpen}
          onClose={() => setBulkConfirmation({
            isOpen: false,
            action: null,
            userCount: 0,
          })}
          onConfirm={confirmBulkOperation}
          title={`${bulkConfirmation.action === 'activate' ? 'Activate' : 'Deactivate'} Users`}
          message={`Are you sure you want to ${bulkConfirmation.action} ${bulkConfirmation.userCount} user${bulkConfirmation.userCount > 1 ? 's' : ''}?`}
          confirmText={`${bulkConfirmation.action === 'activate' ? 'Activate' : 'Deactivate'} Users`}
          type={bulkConfirmation.action === 'deactivate' ? 'warning' : 'info'}
        />
      )}

      {/* Status Toggle Confirmation Dialog */}
      {statusToggleConfirmation.isOpen && (
        <ConfirmationDialog
          isOpen={statusToggleConfirmation.isOpen}
          onClose={() => setStatusToggleConfirmation({
            isOpen: false,
            userId: null,
            userName: '',
            currentStatus: false,
          })}
          onConfirm={confirmStatusToggle}
          title="Deactivate User"
          message={`Are you sure you want to deactivate "${statusToggleConfirmation.userName}"? They will lose access to the system until reactivated.`}
          confirmText="Deactivate User"
          type="warning"
        />
      )}
    </div>
  );
};

export default UserList; 