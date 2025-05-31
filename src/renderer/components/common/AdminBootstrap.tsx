import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useApiOperations } from '../../hooks/useApiOperations';
import { useDataLoader } from '../../hooks/useDataLoader';
import { fetchAuthSession } from 'aws-amplify/auth';
import { decodeJWTPayload } from '../../utils/jwt';
import { awsConfig } from '../../config/aws-config';
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
          const apiUrl = `${awsConfig.apiGatewayUrl}/users/${userId}`;
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
    <div className="rounded-lg shadow p-6" style={{ backgroundColor: 'var(--surface-color)' }}>
      <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Admin Bootstrap & User Management Fix</h3>
      
      {/* Current State Overview */}
      <div 
        className="mb-6 p-4 rounded-lg"
        style={{
          backgroundColor: 'var(--color-primary-50)',
          border: '1px solid var(--color-primary-200)'
        }}
      >
        <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--color-primary-900)' }}>Current State</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium" style={{ color: 'var(--color-primary-700)' }}>Current User:</span>
            <p style={{ color: 'var(--color-primary-900)' }}>{currentUser?.name || 'Not authenticated'}</p>
          </div>
          <div>
            <span className="font-medium" style={{ color: 'var(--color-primary-700)' }}>Current Role:</span>
            <p className="capitalize" style={{ color: 'var(--color-primary-900)' }}>{currentUser?.role || 'Unknown'}</p>
          </div>
          <div>
            <span className="font-medium" style={{ color: 'var(--color-primary-700)' }}>Users Loaded:</span>
            <p style={{ color: 'var(--color-primary-900)' }}>{usersCount} users</p>
          </div>
          <div>
            <span className="font-medium" style={{ color: 'var(--color-primary-700)' }}>In Users List:</span>
            <p style={{ color: 'var(--color-primary-900)' }}>{currentUserInList ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>

      {/* Issue Detection */}
      {usersCount === 0 && (
        <div 
          className="mb-6 p-4 rounded-lg"
          style={{
            backgroundColor: 'var(--color-error-50)',
            border: '1px solid var(--color-error-200)'
          }}
        >
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 mt-0.5 mr-3" style={{ color: 'var(--color-error-400)' }} />
            <div>
              <h4 className="text-sm font-medium" style={{ color: 'var(--color-error-800)' }}>No Users Loaded</h4>
              <p className="text-sm mt-1" style={{ color: 'var(--color-error-700)' }}>
                The real user management API is now deployed, but no users are being loaded. This could be due to:
              </p>
              <ul className="text-sm mt-2 list-disc list-inside" style={{ color: 'var(--color-error-700)' }}>
                <li>Authentication token issues (should use AccessToken, not IdToken)</li>
                <li>User role permissions (only Admin/Manager can list users)</li>
                <li>API response format changes</li>
                <li>Network connectivity issues</li>
              </ul>
              <div 
                className="mt-3 p-2 rounded text-xs"
                style={{
                  backgroundColor: 'var(--color-error-100)',
                  color: 'var(--color-error-800)'
                }}
              >
                <strong>API Endpoint:</strong> GET {awsConfig.apiGatewayUrl}/users
              </div>
            </div>
          </div>
        </div>
      )}

      {currentUser?.role !== 'admin' && (
        <div 
          className="mb-6 p-4 rounded-lg"
          style={{
            backgroundColor: 'var(--color-warning-50)',
            border: '1px solid var(--color-warning-200)'
          }}
        >
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 mt-0.5 mr-3" style={{ color: 'var(--color-warning-400)' }} />
            <div>
              <h4 className="text-sm font-medium" style={{ color: 'var(--color-warning-800)' }}>Role Issue Detected</h4>
              <p className="text-sm mt-1" style={{ color: 'var(--color-warning-700)' }}>
                Your account ({currentUser?.email}) has role "{currentUser?.role}" but should be "admin" to manage users.
              </p>
              <p className="text-sm mt-2" style={{ color: 'var(--color-warning-700)' }}>
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
          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors"
          style={{
            color: 'var(--color-primary-700)',
            backgroundColor: 'var(--color-primary-100)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-primary-200)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-primary-100)';
          }}
        >
          <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
          Diagnose Issues
        </button>

        <button
          onClick={refreshUserData}
          disabled={isRefreshing}
          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{
            color: 'var(--color-text-on-primary)',
            backgroundColor: 'var(--color-primary-600)'
          }}
          onMouseEnter={(e) => {
            if (!isRefreshing) {
              e.currentTarget.style.backgroundColor = 'var(--color-primary-700)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isRefreshing) {
              e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
            }
          }}
        >
          <ArrowPathIcon className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh User Data'}
        </button>

        <button
          onClick={testCurrentUserAPI}
          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors"
          style={{
            color: 'var(--color-text-on-secondary)',
            backgroundColor: 'var(--color-secondary-600)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-secondary-700)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-secondary-600)';
          }}
        >
          <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
          Test Current User API
        </button>

        {currentUser && currentUser.role !== 'admin' && (
          <button
            onClick={fixCurrentUserRole}
            disabled={isFixing}
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{
              color: 'var(--color-text-on-success)',
              backgroundColor: 'var(--color-success-600)'
            }}
            onMouseEnter={(e) => {
              if (!isFixing) {
                e.currentTarget.style.backgroundColor = 'var(--color-success-700)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isFixing) {
                e.currentTarget.style.backgroundColor = 'var(--color-success-600)';
              }
            }}
          >
            <ShieldCheckIcon className="h-4 w-4 mr-2" />
            {isFixing ? 'Fixing...' : 'Fix My Role to Admin'}
          </button>
        )}
      </div>

      {/* Results */}
      {bootstrapResults.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Diagnostic Results</h4>
          <div 
            className="rounded-md p-3 max-h-64 overflow-y-auto"
            style={{ backgroundColor: 'var(--color-secondary-50)' }}
          >
            {bootstrapResults.map((result, index) => (
              <div key={index} className="text-sm font-mono mb-1" style={{ color: 'var(--text-primary)' }}>
                {result}
              </div>
            ))}
          </div>
          <button
            onClick={() => setBootstrapResults([])}
            className="mt-2 text-sm transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            Clear Results
          </button>
        </div>
      )}

      {/* Backend Investigation Guide */}
      <div 
        className="mt-6 p-4 rounded-lg"
        style={{ backgroundColor: 'var(--color-secondary-50)' }}
      >
        <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Real API Troubleshooting Steps</h4>
        <div className="text-sm space-y-2" style={{ color: 'var(--text-secondary)' }}>
          <div 
            className="p-2 rounded"
            style={{
              backgroundColor: 'var(--color-success-100)',
              color: 'var(--color-success-800)'
            }}
          >
            <strong>✅ API Status:</strong> User Management API is deployed and operational
          </div>
          <ol className="list-decimal list-inside space-y-1">
            <li>Verify authentication token type (should use AccessToken, not IdToken)</li>
            <li>Check user role in Cognito (Admin/Manager required for user list)</li>
            <li>Test API endpoint directly: <code 
              className="px-1 rounded"
              style={{
                backgroundColor: 'var(--color-secondary-200)',
                color: 'var(--text-primary)'
              }}
            >GET /users</code></li>
            <li>Check browser network tab for API response details</li>
            <li>Verify JWT token contains correct user ID and permissions</li>
          </ol>
          <div 
            className="mt-3 p-2 rounded text-xs"
            style={{
              backgroundColor: 'var(--color-primary-100)',
              color: 'var(--color-primary-800)'
            }}
          >
            <strong>API Base URL:</strong> {awsConfig.apiGatewayUrl}<br/>
            <strong>Auth Method:</strong> Bearer AccessToken (not IdToken)<br/>
            <strong>Response Format:</strong> {`{ success: true, data: { users: [...] } }`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBootstrap; 