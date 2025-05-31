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
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto w-full mx-4" style={{ backgroundColor: 'var(--surface-color)' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>🔐 Authentication Debugger</h2>
          {onClose && (
            <button 
              onClick={onClose}
              className="transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              ✕
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* Debug Status */}
          <div 
            className="p-3 rounded-lg"
            style={{
              backgroundColor: 'var(--color-success-50)',
              border: '1px solid var(--color-success-200)'
            }}
          >
            <h3 className="font-semibold mb-2" style={{ color: 'var(--color-success-800)' }}>🚫 Debug Mode Active</h3>
            <p className="text-sm" style={{ color: 'var(--color-success-700)' }}>
              Automatic logout is DISABLED for debugging. Authentication errors will be logged but won't trigger logout.
              Check browser console for detailed error logs.
            </p>
          </div>

          {/* Auth Status */}
          <div className="rounded-lg p-4" style={{ border: '1px solid var(--border-color)' }}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Authentication Status</h3>
              <button 
                onClick={checkAuthStatus}
                disabled={loading}
                className="px-3 py-1 rounded text-sm disabled:opacity-50 transition-colors"
                style={{
                  backgroundColor: 'var(--color-primary-500)',
                  color: 'var(--color-text-on-primary)'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary-500)';
                  }
                }}
              >
                {loading ? 'Checking...' : 'Refresh'}
              </button>
            </div>
            
            {authStatus && (
              <pre 
                className="p-3 rounded text-xs overflow-auto max-h-40"
                style={{
                  backgroundColor: 'var(--color-secondary-100)',
                  color: 'var(--text-primary)'
                }}
              >
                {JSON.stringify(authStatus, null, 2)}
              </pre>
            )}
          </div>

          {/* Test Suite */}
          <div className="rounded-lg p-4" style={{ border: '1px solid var(--border-color)' }}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>API Test Suite</h3>
              <button 
                onClick={runTestSuite}
                className="px-3 py-1 rounded text-sm transition-colors"
                style={{
                  backgroundColor: 'var(--color-success-500)',
                  color: 'var(--color-text-on-success)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-success-600)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-success-500)';
                }}
              >
                Run Tests
              </button>
            </div>
            
            {testResults.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-auto">
                {testResults.map((result, index) => (
                  <div 
                    key={index}
                    className="p-2 rounded text-xs"
                    style={{
                      backgroundColor: result.success ? 'var(--color-success-50)' : 'var(--color-error-50)',
                      border: `1px solid ${result.success ? 'var(--color-success-200)' : 'var(--color-error-200)'}`
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-medium">{result.apiName}</span>
                      <span 
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{
                          backgroundColor: result.success ? 'var(--color-success-200)' : 'var(--color-error-200)',
                          color: result.success ? 'var(--color-success-800)' : 'var(--color-error-800)'
                        }}
                      >
                        {result.success ? '✅ SUCCESS' : '❌ FAILED'}
                      </span>
                    </div>
                    
                    {result.duration && (
                      <div className="mt-1" style={{ color: 'var(--text-secondary)' }}>Duration: {result.duration}ms</div>
                    )}
                    
                    {result.error && (
                      <div className="mt-2 font-mono" style={{ color: 'var(--color-error-700)' }}>{result.error}</div>
                    )}
                    
                                          {result.success && result.result && (
                        <details className="mt-2">
                          <summary className="cursor-pointer" style={{ color: 'var(--text-secondary)' }}>View Result</summary>
                          <pre 
                            className="p-2 rounded mt-1 overflow-auto max-h-20"
                            style={{
                              backgroundColor: 'var(--color-secondary-100)',
                              color: 'var(--text-primary)'
                            }}
                          >
                            {JSON.stringify(result.result, null, 2)}
                          </pre>
                        </details>
                      )}
                      
                      {!result.success && result.errorDetails && (
                        <details className="mt-2">
                          <summary className="cursor-pointer" style={{ color: 'var(--color-error-600)' }}>View Error Details</summary>
                          <pre 
                            className="p-2 rounded mt-1 overflow-auto max-h-20"
                            style={{
                              backgroundColor: 'var(--color-error-100)',
                              color: 'var(--color-error-800)'
                            }}
                          >
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
          <div 
            className="p-4 rounded-lg"
            style={{
              backgroundColor: 'var(--color-primary-50)',
              border: '1px solid var(--color-primary-200)'
            }}
          >
            <h3 className="font-semibold mb-2" style={{ color: 'var(--color-primary-800)' }}>💡 Debugging Tips</h3>
            <ul className="text-sm space-y-1" style={{ color: 'var(--color-primary-700)' }}>
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