import React, { useState, useEffect } from 'react';
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import { profileApi } from '../../services/profileApi';
import { apiClient } from '../../services/api-client';
import { decodeJWTPayload } from '../../utils/jwt';

interface AuthDebuggerProps {
  onClose?: () => void;
}

export const AuthDebugger: React.FC<AuthDebuggerProps> = ({ onClose }) => {
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const session = await fetchAuthSession({ forceRefresh: false });
      const user = await getCurrentUser();
      
      const idToken = session.tokens?.idToken?.toString();
      const accessToken = session.tokens?.accessToken?.toString();
      
      let idTokenPayload = null;
      let accessTokenPayload = null;
      
      if (idToken) {
        idTokenPayload = decodeJWTPayload(idToken);
      }
      
      if (accessToken) {
        accessTokenPayload = decodeJWTPayload(accessToken);
      }

      setAuthStatus({
        user,
        session: {
          hasTokens: !!session.tokens,
          hasIdToken: !!session.tokens?.idToken,
          hasAccessToken: !!session.tokens?.accessToken,
          idTokenLength: idToken?.length || 0,
          accessTokenLength: accessToken?.length || 0,
        },
        idTokenPayload,
        accessTokenPayload,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setAuthStatus({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const testApiCall = async (apiName: string, apiCall: () => Promise<any>) => {
    const startTime = Date.now();
    try {
      const result = await apiCall();
      const endTime = Date.now();
      
      setTestResults(prev => [{
        apiName,
        success: true,
        result,
        duration: endTime - startTime,
        timestamp: new Date().toISOString()
      }, ...prev.slice(0, 9)]);
    } catch (error) {
      const endTime = Date.now();
      
      setTestResults(prev => [{
        apiName,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorDetails: error,
        duration: endTime - startTime,
        timestamp: new Date().toISOString()
      }, ...prev.slice(0, 9)]);
    }
  };

  const runTestSuite = async () => {
    setTestResults([]);
    
    // Test getting current user first to get userId
    let userId = null;
    try {
      const user = await apiClient.getCurrentUser();
      userId = user.id;
      
      setTestResults(prev => [{
        apiName: 'getCurrentUser',
        success: true,
        result: { id: user.id, email: user.email, name: user.name },
        timestamp: new Date().toISOString()
      }, ...prev]);
    } catch (error) {
      setTestResults(prev => [{
        apiName: 'getCurrentUser',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, ...prev]);
      return;
    }

    if (!userId) {
      console.error('Cannot run test suite without userId');
      return;
    }

    // Test profile API calls
    await testApiCall('profileApi.getUserProfile', () => profileApi.getUserProfile(userId));
    await testApiCall('profileApi.getUserPreferences', () => profileApi.getUserPreferences(userId));
    await testApiCall('profileApi.getUserSessions', () => profileApi.getUserSessions(userId));
    
    // Test main API calls
    await testApiCall('apiClient.getTimeEntries', () => apiClient.getTimeEntries());
    await testApiCall('apiClient.getProjects', () => apiClient.getProjects());
    await testApiCall('apiClient.getClients', () => apiClient.getClients());
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">🔐 Authentication Debugger</h2>
          {onClose && (
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* Debug Status */}
          <div className="bg-green-100 p-3 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">🚫 Debug Mode Active</h3>
            <p className="text-green-700 text-sm">
              Automatic logout is DISABLED for debugging. Authentication errors will be logged but won't trigger logout.
              Check browser console for detailed error logs.
            </p>
          </div>

          {/* Auth Status */}
          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Authentication Status</h3>
              <button 
                onClick={checkAuthStatus}
                disabled={loading}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Checking...' : 'Refresh'}
              </button>
            </div>
            
            {authStatus && (
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(authStatus, null, 2)}
              </pre>
            )}
          </div>

          {/* Test Suite */}
          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">API Test Suite</h3>
              <button 
                onClick={runTestSuite}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
              >
                Run Tests
              </button>
            </div>
            
            {testResults.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-auto">
                {testResults.map((result, index) => (
                  <div 
                    key={index}
                    className={`p-2 rounded text-xs ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-medium">{result.apiName}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${result.success ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                        {result.success ? '✅ SUCCESS' : '❌ FAILED'}
                      </span>
                    </div>
                    
                    {result.duration && (
                      <div className="text-gray-600 mt-1">Duration: {result.duration}ms</div>
                    )}
                    
                    {result.error && (
                      <div className="text-red-700 mt-2 font-mono">{result.error}</div>
                    )}
                    
                    {result.success && result.result && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-gray-600">View Result</summary>
                        <pre className="bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-20">
                          {JSON.stringify(result.result, null, 2)}
                        </pre>
                      </details>
                    )}
                    
                    {!result.success && result.errorDetails && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-red-600">View Error Details</summary>
                        <pre className="bg-red-100 p-2 rounded mt-1 overflow-auto max-h-20">
                          {JSON.stringify(result.errorDetails, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">💡 Debugging Tips</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Check browser console for detailed authentication logs</li>
              <li>• Run the test suite to identify which API calls are failing</li>
              <li>• Authentication errors will be logged but won't trigger logout</li>
              <li>• Look for 401/403 response codes in failing API calls</li>
              <li>• Verify token payload contains correct user ID and email</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}; 