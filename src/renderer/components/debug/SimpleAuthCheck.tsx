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
    <div className="p-6 border border-gray-300 rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">🔍 Authentication Check</h3>
      
      <button
        onClick={checkAuth}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 mb-4"
      >
        {loading ? 'Checking...' : 'Check Authentication State'}
      </button>

      {authState && (
        <div className="mt-4 p-4 bg-white border rounded-md">
          <h4 className="font-semibold text-gray-800 mb-2">Results:</h4>
          <div className="space-y-2 text-sm">
            <div><strong>Time:</strong> {authState.timestamp}</div>
            <div><strong>Recommendation:</strong> {authState.recommendation}</div>
            
            {authState.user && (
              <div>
                <strong>getCurrentUser():</strong> 
                <span className={authState.user.success ? 'text-green-600' : 'text-red-600'}>
                  {authState.user.success ? ' ✅ Success' : ' ❌ Failed'}
                </span>
                {authState.user.error && <div className="text-red-600 ml-4">Error: {authState.user.error}</div>}
              </div>
            )}
            
            {authState.session && (
              <div>
                <strong>fetchAuthSession():</strong>
                <span className={authState.session.success ? 'text-green-600' : 'text-red-600'}>
                  {authState.session.success ? ' ✅ Success' : ' ❌ Failed'}
                </span>
                {authState.session.success && (
                  <div className="ml-4 text-gray-600">
                    <div>Has Tokens: {authState.session.hasTokens ? '✅' : '❌'}</div>
                    <div>Has Access Token: {authState.session.hasAccessToken ? '✅' : '❌'}</div>
                    <div>Has ID Token: {authState.session.hasIdToken ? '✅' : '❌'}</div>
                  </div>
                )}
                {authState.session.error && <div className="text-red-600 ml-4">Error: {authState.session.error}</div>}
              </div>
            )}

            {authState.error && (
              <div className="text-red-600">
                <strong>General Error:</strong> {authState.error}
              </div>
            )}
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
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