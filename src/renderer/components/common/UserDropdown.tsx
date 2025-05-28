import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { signOut } from 'aws-amplify/auth';
import {
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  BellIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';

interface UserDropdownProps {
  className?: string;
  onMenuItemClick?: () => void; // For mobile menu closing
}

export const UserDropdown: React.FC<UserDropdownProps> = ({ 
  className = '', 
  onMenuItemClick 
}) => {
  const { state } = useAppContext();
  const { user } = state;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleLogout = async () => {
    try {
      // Use the new backend logout endpoint for proper cleanup
      try {
        const { fetchAuthSession } = await import('aws-amplify/auth');
        const { profileApi } = await import('../../services/profileApi');
        
        // Get current session for API call
        const session = await fetchAuthSession({ forceRefresh: false });
        const token = session.tokens?.accessToken?.toString();
        
        if (token) {
          console.log('🚪 Calling backend logout endpoint...');
          await profileApi.logout();
          console.log('✅ Backend logout successful - session cleaned up');
        }
      } catch (logoutError) {
        // Don't block logout if backend logout fails
        console.warn('⚠️ Backend logout failed, continuing with Cognito logout:', logoutError);
      }
      
      // Clear local session data
      localStorage.removeItem('currentSessionId');
      localStorage.removeItem('loginTime');
      
      // Only clear remembered username if user has disabled the preference
      // This allows users who want convenience to keep their email remembered
      const rememberPreference = localStorage.getItem('rememberUsername');
      if (rememberPreference === 'false') {
        localStorage.removeItem('rememberedUsername');
      }
      // If rememberUsername is 'true' or null (default), keep the remembered email
      
      // Sign out from Cognito
      await signOut();
      
      // Reload the page to reset the app state
      window.location.reload();
    } catch (error) {
      console.error('Error signing out:', error);
      // Force reload even if logout fails
      window.location.reload();
    }
  };

  const handleMenuItemClick = () => {
    setIsOpen(false);
    onMenuItemClick?.();
  };

  const getUserDisplayName = () => {
    if (user?.name) {
      return user.name;
    }
    if (user?.email) {
      // Extract name from email if no name is set
      const emailName = user.email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    return 'User';
  };

  const getUserInitials = () => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'text-red-600 bg-red-50';
      case 'manager':
        return 'text-blue-600 bg-blue-50';
      case 'employee':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatRole = (role?: string) => {
    if (!role) return 'User';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* User Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 w-full"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar */}
        <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
          {getUserInitials()}
        </div>
        
        {/* User Info */}
        <div className="flex-1 text-left min-w-0">
          <div className="text-sm font-medium text-white truncate">
            {getUserDisplayName()}
          </div>
          <div className="text-xs text-gray-400 truncate">
            {formatRole(user?.role)}
          </div>
        </div>
        
        {/* Chevron */}
        <ChevronDownIcon 
          className={`h-4 w-4 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-lg font-medium text-gray-700">
                  {getUserInitials()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {getUserDisplayName()}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {user?.email}
                </p>
                <div className="flex items-center mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user?.role)}`}>
                    <ShieldCheckIcon className="h-3 w-3 mr-1" />
                    {formatRole(user?.role)}
                  </span>
                  {user?.isActive && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-green-600 bg-green-50">
                      Active
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {/* Settings */}
            <Link
              to="/settings"
              onClick={handleMenuItemClick}
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
            >
              <Cog6ToothIcon className="h-4 w-4 mr-3 text-gray-400" />
              Settings
            </Link>

            {/* Divider */}
            <div className="border-t border-gray-200 my-1"></div>

            {/* Help & Support */}
            <button
              onClick={() => {
                handleMenuItemClick();
                // TODO: Open help modal or navigate to help page
                console.log('Help & Support clicked');
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
            >
              <QuestionMarkCircleIcon className="h-4 w-4 mr-3 text-gray-400" />
              Help & Support
            </button>

            {/* Divider */}
            <div className="border-t border-gray-200 my-1"></div>

            {/* Sign Out */}
            <button
              onClick={() => {
                handleMenuItemClick();
                handleLogout();
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors duration-200"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3 text-red-400" />
              Sign Out
            </button>
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <p className="text-xs text-gray-500">
              Aerotage Time Reporting v1.0
            </p>
          </div>
        </div>
      )}
    </div>
  );
}; 