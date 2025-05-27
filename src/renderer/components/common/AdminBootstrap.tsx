import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useApiOperations } from '../../hooks/useApiOperations';
import { useDataLoader } from '../../hooks/useDataLoader';
import { fetchAuthSession } from 'aws-amplify/auth';
import { decodeJWTPayload } from '../../utils/jwt';
import { ShieldCheckIcon, UserPlusIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const AdminBootstrap: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { updateUser } = useApiOperations();
  const { loadUsers, loadCurrentUser } = useDataLoader();
  const [isFixing, setIsFixing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bootstrapResults, setBootstrapResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setBootstrapResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const currentUser = state.user;
  const usersCount = state.users.length;
  const currentUserInList = currentUser ? state.users.find(u => u.id === currentUser.id) : null;

  // Diagnose the current state
  const diagnoseUserState = () => {
    addResult('🔍 Diagnosing user account state...');
    
    if (!currentUser) {
      addResult('❌ No current user found - authentication issue');
      return;
    }

    addResult(`✅ Current user authenticated: ${currentUser.name} (${currentUser.email})`);
    addResult(`📊 Current user role: ${currentUser.role}`);
    addResult(`📋 Total users in list: ${usersCount}`);
    
    if (currentUserInList) {
      addResult(`✅ Current user found in users list with role: ${currentUserInList.role}`);
    } else {
      addResult(`⚠️ Current user NOT found in users list`);
    }

    // Check if there are any users at all
    if (usersCount === 0) {
      addResult('❌ No users loaded from backend - this is the main issue');
      addResult('💡 Recommendation: Check backend /users endpoint and user permissions');
    } else {
      addResult(`✅ Users are being loaded from backend (${usersCount} users)`);
      const adminUsers = state.users.filter(u => u.role === 'admin');
      const managerUsers = state.users.filter(u => u.role === 'manager');
      const employeeUsers = state.users.filter(u => u.role === 'employee');
      
      addResult(`📊 User breakdown: ${adminUsers.length} admins, ${managerUsers.length} managers, ${employeeUsers.length} employees`);
    }
  };

  // Fix current user role
  const fixCurrentUserRole = async () => {
    if (!currentUser) {
      addResult('❌ Cannot fix role - no current user found');
      return;
    }

    setIsFixing(true);
    try {
      addResult('🔧 Attempting to update current user role to admin...');
      
      // Update the user's role to admin
      await updateUser(currentUser.id, { role: 'admin' });
      
      // Update the current user in context
      dispatch({
        type: 'SET_USER',
        payload: {
          ...currentUser,
          role: 'admin'
        }
      });

      addResult('✅ Successfully updated current user role to admin');
      addResult('🔄 Refreshing user data...');
      
      // Refresh both current user and users list
      await loadCurrentUser();
      await loadUsers();
      
      addResult('✅ User data refreshed successfully');
      
    } catch (error: any) {
      addResult(`❌ Failed to fix user role: ${error.message}`);
    } finally {
      setIsFixing(false);
    }
  };

  // Refresh all user data
  const refreshUserData = async () => {
    setIsRefreshing(true);
    try {
      addResult('🔄 Refreshing all user data...');
      
      // Load current user first
      await loadCurrentUser();
      addResult('✅ Current user data refreshed');
      
      // Then load all users
      await loadUsers();
      addResult('✅ Users list refreshed');
      
      // Re-diagnose after refresh
      setTimeout(() => {
        diagnoseUserState();
      }, 1000);
      
    } catch (error: any) {
      addResult(`❌ Failed to refresh user data: ${error.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Test current user API response format
  const testCurrentUserAPI = async () => {
    addResult('🔍 Testing getCurrentUser API response format...');
    
    try {
      // Get the session and token info
      const session = await fetchAuthSession({ forceRefresh: false });
      const accessToken = session.tokens?.accessToken?.toString();
      const idToken = session.tokens?.idToken?.toString();
      
      addResult(`📋 AccessToken available: ${accessToken ? 'Yes' : 'No'}`);
      addResult(`📋 IdToken available: ${idToken ? 'Yes' : 'No'}`);
      
      // Get user ID from token
      const token = accessToken || idToken;
      if (token) {
        const tokenPayload = decodeJWTPayload(token);
        const userId = tokenPayload?.sub;
        addResult(`📋 User ID from token: ${userId}`);
        
        if (userId) {
          // Make direct API call to see raw response
          const apiUrl = `https://k60bobrd9h.execute-api.us-east-1.amazonaws.com/dev/users/${userId}`;
          addResult(`🌐 Testing direct API call to: ${apiUrl}`);
          
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken || idToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          addResult(`📡 Response status: ${response.status} ${response.statusText}`);
          
          if (response.ok) {
            const data = await response.json();
            addResult(`✅ Raw API response received`);
            addResult(`📊 Response type: ${typeof data}`);
            addResult(`📊 Response keys: ${data ? Object.keys(data).join(', ') : 'none'}`);
            addResult(`📊 Full response: ${JSON.stringify(data, null, 2)}`);
          } else {
            const errorText = await response.text();
            addResult(`❌ API error: ${errorText}`);
          }
        }
      }
      
    } catch (error: any) {
      addResult(`❌ Test failed: ${error.message}`);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Admin Bootstrap & User Management Fix</h3>
      
      {/* Current State Overview */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Current State</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-blue-700 font-medium">Current User:</span>
            <p className="text-blue-900">{currentUser?.name || 'Not authenticated'}</p>
          </div>
          <div>
            <span className="text-blue-700 font-medium">Current Role:</span>
            <p className="text-blue-900 capitalize">{currentUser?.role || 'Unknown'}</p>
          </div>
          <div>
            <span className="text-blue-700 font-medium">Users Loaded:</span>
            <p className="text-blue-900">{usersCount} users</p>
          </div>
          <div>
            <span className="text-blue-700 font-medium">In Users List:</span>
            <p className="text-blue-900">{currentUserInList ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>

      {/* Issue Detection */}
      {usersCount === 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-red-800">No Users Loaded</h4>
              <p className="text-sm text-red-700 mt-1">
                The real user management API is now deployed, but no users are being loaded. This could be due to:
              </p>
              <ul className="text-sm text-red-700 mt-2 list-disc list-inside">
                <li>Authentication token issues (should use AccessToken, not IdToken)</li>
                <li>User role permissions (only Admin/Manager can list users)</li>
                <li>API response format changes</li>
                <li>Network connectivity issues</li>
              </ul>
              <div className="mt-3 p-2 bg-red-100 rounded text-xs text-red-800">
                <strong>API Endpoint:</strong> GET https://k60bobrd9h.execute-api.us-east-1.amazonaws.com/dev/users
              </div>
            </div>
          </div>
        </div>
      )}

      {currentUser?.role !== 'admin' && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Role Issue Detected</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Your account ({currentUser?.email}) has role "{currentUser?.role}" but should be "admin" to manage users.
              </p>
              <p className="text-sm text-yellow-700 mt-2">
                <strong>Note:</strong> The real API now enforces role-based access control. Only Admin and Manager roles can list users.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={diagnoseUserState}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
        >
          <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
          Diagnose Issues
        </button>

        <button
          onClick={refreshUserData}
          disabled={isRefreshing}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowPathIcon className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh User Data'}
        </button>

        <button
          onClick={testCurrentUserAPI}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
        >
          <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
          Test Current User API
        </button>

        {currentUser && currentUser.role !== 'admin' && (
          <button
            onClick={fixCurrentUserRole}
            disabled={isFixing}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShieldCheckIcon className="h-4 w-4 mr-2" />
            {isFixing ? 'Fixing...' : 'Fix My Role to Admin'}
          </button>
        )}
      </div>

      {/* Results */}
      {bootstrapResults.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Diagnostic Results</h4>
          <div className="bg-gray-50 rounded-md p-3 max-h-64 overflow-y-auto">
            {bootstrapResults.map((result, index) => (
              <div key={index} className="text-sm font-mono text-gray-800 mb-1">
                {result}
              </div>
            ))}
          </div>
          <button
            onClick={() => setBootstrapResults([])}
            className="mt-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Clear Results
          </button>
        </div>
      )}

      {/* Backend Investigation Guide */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Real API Troubleshooting Steps</h4>
        <div className="text-sm text-gray-600 space-y-2">
          <div className="p-2 bg-green-100 rounded text-green-800">
            <strong>✅ API Status:</strong> User Management API is deployed and operational
          </div>
          <ol className="list-decimal list-inside space-y-1">
            <li>Verify authentication token type (should use AccessToken, not IdToken)</li>
            <li>Check user role in Cognito (Admin/Manager required for user list)</li>
            <li>Test API endpoint directly: <code className="bg-gray-200 px-1 rounded">GET /users</code></li>
            <li>Check browser network tab for API response details</li>
            <li>Verify JWT token contains correct user ID and permissions</li>
          </ol>
          <div className="mt-3 p-2 bg-blue-100 rounded text-blue-800 text-xs">
            <strong>API Base URL:</strong> https://k60bobrd9h.execute-api.us-east-1.amazonaws.com/dev<br/>
            <strong>Auth Method:</strong> Bearer AccessToken (not IdToken)<br/>
            <strong>Response Format:</strong> {`{ success: true, data: { users: [...] } }`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBootstrap; 