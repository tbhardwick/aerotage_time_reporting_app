/**
 * Session Debug Utilities
 * Helper functions to debug session termination issues
 */

import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import { profileApi } from '../services/profileApi';
import { decodeJWTPayload } from './jwt';

/**
 * Get user ID from JWT token (consistent with backend expectations)
 */
const getUserIdFromToken = async (): Promise<string> => {
  const session = await fetchAuthSession({ forceRefresh: false });
  const token = session.tokens?.idToken?.toString();
  
  if (!token) {
    throw new Error('No authentication token available');
  }
  
  const tokenPayload = decodeJWTPayload(token);
  if (!tokenPayload || !tokenPayload.sub) {
    throw new Error('Invalid token payload');
  }
  
  return tokenPayload.sub;
};

/**
 * Debug session state and token validity
 */
export const debugSessionState = async () => {
  console.group('🔍 Session Debug Analysis');
  
  try {
    // 1. Check Cognito session
    console.log('1. Checking Cognito session...');
    const session = await fetchAuthSession();
    console.log('Cognito session:', {
      hasTokens: !!session.tokens,
      hasIdToken: !!session.tokens?.idToken,
      hasAccessToken: !!session.tokens?.accessToken,
      tokenLength: session.tokens?.idToken?.toString().length
    });
    
    // 2. Check current user
    console.log('2. Checking current user...');
    const user = await getCurrentUser();
    const userId = await getUserIdFromToken();
    console.log('Current user:', {
      amplifyUserId: user.userId || user.username,
      jwtUserId: userId,
      username: user.username
    });
    
    // 3. Check backend sessions list
    console.log('3. Checking backend sessions...');
    const sessions = await profileApi.getUserSessions(userId);
    console.log('Backend sessions:', sessions.length);
    sessions.forEach((session, index) => {
      console.log(`Session ${index + 1}:`, {
        id: session.id.substring(0, 8) + '...',
        isCurrent: session.isCurrent,
        ipAddress: session.ipAddress,
        loginTime: new Date(session.loginTime).toLocaleString()
      });
    });
    
    // 4. Check localStorage
    console.log('4. Checking localStorage...');
    console.log('Stored session ID:', localStorage.getItem('currentSessionId'));
    console.log('Stored login time:', localStorage.getItem('loginTime'));
    
    // 5. Test API call
    console.log('5. Testing API call...');
    await profileApi.getUserProfile(userId);
    console.log('✅ API call successful - profile loaded');
    
    return {
      hasValidTokens: !!session.tokens?.idToken,
      backendSessionCount: sessions.length,
      apiCallWorks: true
    };
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    return {
      error: error instanceof Error ? error.message : String(error)
    };
  } finally {
    console.groupEnd();
  }
};

/**
 * Test session after termination - Updated for enhanced backend validation
 */
export const testTerminatedSession = async () => {
  console.group('🧪 Testing Terminated Session (Enhanced Backend Validation)');
  
  try {
    const user = await getCurrentUser();
    const userId = await getUserIdFromToken();
    
    console.log('🔍 Testing API calls after session termination with enhanced backend validation...');
    console.log('📄 Expected behavior: All API calls should now FAIL with 401/403 errors');
    
    // Test different API endpoints
    const tests = [
      { name: 'Get Profile', fn: () => profileApi.getUserProfile(userId) },
      { name: 'Get Security Settings', fn: () => profileApi.getSecuritySettings(userId) },
      { name: 'Get Sessions', fn: () => profileApi.getUserSessions(userId) }
    ];
    
    let allTestsFailed = true;
    
    for (const test of tests) {
      try {
        console.log(`🔧 Testing ${test.name}...`);
        await test.fn();
        console.log(`❌ ${test.name}: SUCCESS (Backend validation not working!)`);
        allTestsFailed = false;
      } catch (error: any) {
        console.log(`✅ ${test.name}: FAILED as expected`);
        
        // Check if it's the right type of error
        if (error.code === 'AUTHENTICATION_FAILED' || error.code === 'SESSION_TERMINATED') {
          console.log(`   🎯 Correct error type: ${error.code}`);
          console.log(`   📄 Error message: ${error.message}`);
        } else if (error.statusCode === 401 || error.statusCode === 403) {
          console.log(`   🎯 Correct status code: ${error.statusCode}`);
          console.log(`   📄 Error message: ${error.message}`);
        } else {
          console.log(`   ⚠️  Unexpected error type:`, error);
        }
      }
    }
    
    if (allTestsFailed) {
      console.log('🎉 All tests failed as expected - Backend session validation is working!');
    } else {
      console.log('⚠️  Some tests passed - Backend session validation may not be fully implemented');
    }
    
  } catch (error) {
    console.error('❌ Test setup failed:', error);
  } finally {
    console.groupEnd();
  }
};

/**
 * Force token refresh test
 */
export const testTokenRefresh = async () => {
  console.group('🔄 Testing Token Refresh');
  
  try {
    console.log('Getting session with force refresh...');
    const session = await fetchAuthSession({ forceRefresh: true });
    console.log('Force refresh result:', {
      hasTokens: !!session.tokens,
      tokenLength: session.tokens?.idToken?.toString().length
    });
    
    // Try API call after refresh
    const user = await getCurrentUser();
    const userId = await getUserIdFromToken();
    await profileApi.getUserProfile(userId);
    console.log('✅ API call after refresh: SUCCESS');
    
  } catch (error) {
    console.error('❌ Token refresh test failed:', error);
  } finally {
    console.groupEnd();
  }
};

/**
 * Comprehensive session validation test following backend implementation guide
 */
export const runBackendValidationTest = async () => {
  console.group('🏗️ Comprehensive Backend Session Validation Test');
  
  try {
    const user = await getCurrentUser();
    const userId = await getUserIdFromToken();
    
    console.log('📋 Running tests as specified in BACKEND_SESSION_VALIDATION_IMPLEMENTATION.md');
    console.log('👤 User ID:', userId);
    
    // Phase 1: Basic Functionality Test
    console.log('\n=== Phase 1: Basic Functionality Test ===');
    
    try {
      console.log('1️⃣ Testing current session status...');
      const sessions = await profileApi.getUserSessions(userId);
      console.log('✅ Sessions loaded successfully:', sessions.length);
      
      const currentSession = sessions.find(s => s.isCurrent);
      if (currentSession) {
        console.log('✅ Current session found:', currentSession.id.substring(0, 8) + '...');
      } else {
        console.log('⚠️  No current session marked in sessions list');
      }
    } catch (error) {
      console.log('❌ Phase 1 failed:', error);
      return;
    }
    
    try {
      console.log('2️⃣ Testing API call with active session...');
      await profileApi.getUserProfile(userId);
      console.log('✅ API call successful with active session');
    } catch (error) {
      console.log('❌ API call failed even with active session:', error);
      return;
    }
    
    // Phase 2: Session Termination Test (Note: This would need manual setup)
    console.log('\n=== Phase 2: Session Termination Test ===');
    console.log('📝 Note: This test requires manual session termination in another browser tab');
    console.log('📝 After terminating sessions in Security Settings, run:');
    console.log('📝   window.sessionDebug.testTerminatedSession()');
    
    // Phase 3: Testing Instructions
    console.log('\n=== Testing Instructions ===');
    console.log('🔧 To test session termination:');
    console.log('   1. Navigate to Settings → Security → Active Sessions');
    console.log('   2. Terminate all non-current sessions (if any)');
    console.log('   3. In another browser tab/window, log in again');
    console.log('   4. Terminate the current session from the new tab');
    console.log('   5. Return to this tab and run: window.sessionDebug.testTerminatedSession()');
    console.log('   6. All API calls should fail with 401/403 errors');
    
    // Session Debug Summary
    console.log('\n=== Session Debug Summary ===');
    const debugResult = await debugSessionState();
    console.log('📊 Debug result:', debugResult);
    
    console.log('\n🎯 Expected backend behavior:');
    console.log('   • Active sessions: API calls succeed');
    console.log('   • Terminated sessions: API calls fail with 401/403');
    console.log('   • Session validation happens on every API request');
    console.log('   • Custom Lambda authorizer validates JWT + session status');
    
  } catch (error) {
    console.error('❌ Comprehensive test failed:', error);
  } finally {
    console.groupEnd();
  }
};

/**
 * Test session timeout behavior
 */
export const testSessionTimeout = async () => {
  console.group('⏰ Session Timeout Test');
  
  try {
    const user = await getCurrentUser();
    const userId = await getUserIdFromToken();
    
    console.log('⏰ Testing session timeout behavior...');
    console.log('📝 Note: This test depends on backend session timeout settings');
    
    // Get security settings to check timeout value
    try {
      const securitySettings = await profileApi.getSecuritySettings(userId);
      console.log('⚙️ Current session timeout:', securitySettings.sessionTimeout, 'minutes');
      
      const timeoutMs = securitySettings.sessionTimeout * 60 * 1000;
      const timeoutDate = new Date(Date.now() + timeoutMs);
      console.log('⏰ Session should timeout at:', timeoutDate.toLocaleString());
      
    } catch (error) {
      console.log('❌ Could not fetch session timeout settings:', error);
    }
    
    console.log('📝 To test session timeout:');
    console.log('   1. Wait for the session timeout period');
    console.log('   2. Or set a very short timeout in Security Settings');
    console.log('   3. After timeout, API calls should fail with session validation errors');
    
  } catch (error) {
    console.error('❌ Session timeout test failed:', error);
  } finally {
    console.groupEnd();
  }
};

// Make functions available globally for debugging
declare global {
  interface Window {
    sessionDebug: {
      debugSessionState: typeof debugSessionState;
      testTerminatedSession: typeof testTerminatedSession;
      testTokenRefresh: typeof testTokenRefresh;
      runBackendValidationTest: typeof runBackendValidationTest;
      testSessionTimeout: typeof testSessionTimeout;
    };
  }
}

// Attach to window in development
if (process.env.NODE_ENV === 'development') {
  window.sessionDebug = {
    debugSessionState,
    testTerminatedSession,
    testTokenRefresh,
    runBackendValidationTest,
    testSessionTimeout
  };
} 