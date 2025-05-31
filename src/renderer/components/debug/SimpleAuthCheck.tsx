import React, { useState } from 'react';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

export const SimpleAuthCheck: React.FC = () => {
  const [authState, setAuthState] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkAuth = async () => {
    setLoading(true);
    try {
      console.log('🔍 Starting simple auth check...');
      
      // Step 1: Check if user exists
      let userResult = null;
      try {
        const user = await getCurrentUser();
        userResult = {
          success: true,
          data: user,
          error: null
        };
        console.log('✅ getCurrentUser succeeded:', user);
      } catch (error) {
        userResult = {
          success: false,
          data: null,
          error: (error as any).message
        };
        console.log('❌ getCurrentUser failed:', error);
      }

      // Step 2: Check session
      let sessionResult = null;
      try {
        const session = await fetchAuthSession({ forceRefresh: false });
        sessionResult = {
          success: true,
          hasTokens: !!session.tokens,
          hasAccessToken: !!session.tokens?.accessToken,
          hasIdToken: !!session.tokens?.idToken,
          error: null
        };
        console.log('✅ fetchAuthSession succeeded:', sessionResult);
      } catch (error) {
        sessionResult = {
          success: false,
          hasTokens: false,
          hasAccessToken: false,
          hasIdToken: false,
          error: (error as any).message
        };
        console.log('❌ fetchAuthSession failed:', error);
      }

      setAuthState({
        timestamp: new Date().toISOString(),
        user: userResult,
        session: sessionResult,
        recommendation: userResult.success 
          ? '✅ User is authenticated' 
          : '❌ User needs to log in'
      });

    } catch (error) {
      console.error('💥 Auth check failed:', error);
      setAuthState({
        timestamp: new Date().toISOString(),
        error: (error as any).message,
        recommendation: '❌ Something went wrong during auth check'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="p-6 border rounded-lg"
      style={{
        backgroundColor: 'var(--color-secondary-50)',
        borderColor: 'var(--border-color)'
      }}
    >
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>🔍 Authentication Check</h3>
      
      <button
        onClick={checkAuth}
        disabled={loading}
        className="px-4 py-2 rounded-md disabled:opacity-50 mb-4 transition-colors"
        style={{
          backgroundColor: 'var(--color-primary-600)',
          color: 'var(--color-text-on-primary)'
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.backgroundColor = 'var(--color-primary-700)';
          }
        }}
        onMouseLeave={(e) => {
          if (!loading) {
            e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
          }
        }}
      >
        {loading ? 'Checking...' : 'Check Authentication State'}
      </button>

      {authState && (
        <div 
          className="mt-4 p-4 border rounded-md"
          style={{
            backgroundColor: 'var(--surface-color)',
            borderColor: 'var(--border-color)'
          }}
        >
          <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Results:</h4>
          <div className="space-y-2 text-sm">
            <div><strong>Time:</strong> {authState.timestamp}</div>
            <div><strong>Recommendation:</strong> {authState.recommendation}</div>
            
            {authState.user && (
              <div>
                <strong>getCurrentUser():</strong> 
                <span style={{ color: authState.user.success ? 'var(--color-success-600)' : 'var(--color-error-600)' }}>
                  {authState.user.success ? ' ✅ Success' : ' ❌ Failed'}
                </span>
                {authState.user.error && <div className="ml-4" style={{ color: 'var(--color-error-600)' }}>Error: {authState.user.error}</div>}
              </div>
            )}
            
            {authState.session && (
              <div>
                <strong>fetchAuthSession():</strong>
                <span style={{ color: authState.session.success ? 'var(--color-success-600)' : 'var(--color-error-600)' }}>
                  {authState.session.success ? ' ✅ Success' : ' ❌ Failed'}
                </span>
                {authState.session.success && (
                  <div className="ml-4" style={{ color: 'var(--text-secondary)' }}>
                    <div>Has Tokens: {authState.session.hasTokens ? '✅' : '❌'}</div>
                    <div>Has Access Token: {authState.session.hasAccessToken ? '✅' : '❌'}</div>
                    <div>Has ID Token: {authState.session.hasIdToken ? '✅' : '❌'}</div>
                  </div>
                )}
                {authState.session.error && <div className="ml-4" style={{ color: 'var(--color-error-600)' }}>Error: {authState.session.error}</div>}
              </div>
            )}

            {authState.error && (
              <div style={{ color: 'var(--color-error-600)' }}>
                <strong>General Error:</strong> {authState.error}
              </div>
            )}
          </div>

          <div 
            className="mt-4 p-3 border rounded-md"
            style={{
              backgroundColor: 'var(--color-warning-50)',
              borderColor: 'var(--color-warning-200)'
            }}
          >
            <p className="text-sm" style={{ color: 'var(--color-warning-800)' }}>
              <strong>What this means:</strong><br/>
              {authState.user?.success 
                ? "✅ You are logged in and authentication is working. If Settings was failing, it might be a different issue."
                : "❌ You need to log in first. The app will show a login form where you can enter your credentials."
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}; 