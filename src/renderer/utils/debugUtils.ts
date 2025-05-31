/**
 * Debug Utilities
 * Helper functions for debugging and manual intervention
 */

import { authErrorHandler } from '../services/authErrorHandler';
import { signOut } from 'aws-amplify/auth';

/**
 * Force logout when session has been terminated externally
 * Call this from browser console when app is stuck with 403 errors
 */
export const forceLogout = async (reason: string = 'Session terminated externally') => {
  console.log('🚪 Debug: Forcing logout...', reason);
  try {
    await authErrorHandler.forceLogout(reason);
  } catch (error) {
    console.error('❌ Force logout failed, trying direct signOut:', error);
    try {
      await signOut();
      window.location.reload();
    } catch (signOutError) {
      console.error('❌ Direct signOut failed, forcing page reload:', signOutError);
      window.location.reload();
    }
  }
};

/**
 * Clear all local storage and force reload
 */
export const clearAllData = () => {
  console.log('🧹 Debug: Clearing all local data...');
  localStorage.clear();
  sessionStorage.clear();
  window.location.reload();
};

/**
 * Check current authentication state
 */
export const checkAuthState = async () => {
  try {
    const { fetchAuthSession } = await import('aws-amplify/auth');
    const session = await fetchAuthSession({ forceRefresh: false });
    console.log('🔍 Current auth state:', {
      hasTokens: !!session.tokens,
      hasIdToken: !!session.tokens?.idToken,
      hasAccessToken: !!session.tokens?.accessToken,
      tokenLength: session.tokens?.idToken?.toString().length,
      sessionId: localStorage.getItem('currentSessionId')?.substring(0, 8) + '...'
    });
    
    if (session.tokens?.idToken) {
      const { decodeJWTPayload } = await import('./jwt');
      const payload = decodeJWTPayload(session.tokens.idToken.toString());
      console.log('🔍 Token payload:', {
        sub: payload?.sub,
        email: payload?.email,
        exp: payload?.exp ? new Date(payload.exp * 1000) : null,
        isExpired: payload?.exp ? payload.exp < Date.now() / 1000 : null
      });
    }
  } catch (error) {
    console.error('❌ Failed to check auth state:', error);
  }
};

/**
 * Test session termination protection
 */
export const testSessionProtection = async () => {
  console.log('🛡️ Testing session termination protection...');
  
  try {
    const { profileApi } = await import('../services/profileApi');
    const { getCurrentUser } = await import('aws-amplify/auth');
    const { decodeJWTPayload } = await import('./jwt');
    const { fetchAuthSession } = await import('aws-amplify/auth');
    
    // Get current user
    const user = await getCurrentUser();
    const session = await fetchAuthSession({ forceRefresh: false });
    const token = session.tokens?.idToken?.toString();
    
    if (!token) {
      console.error('❌ No authentication token available');
      return;
    }
    
    const tokenPayload = decodeJWTPayload(token);
    const userId = tokenPayload?.sub;
    
    if (!userId) {
      console.error('❌ No user ID found in token');
      return;
    }
    
    console.log('👤 Testing with user:', userId);
    
    // Get current sessions
    const sessions = await profileApi.getUserSessions(userId);
    console.log('📱 Found sessions:', sessions.length);
    
    const currentSession = sessions.find(s => s.isCurrent);
    if (!currentSession) {
      console.log('⚠️ No current session found in sessions list');
      return;
    }
    
    console.log('🎯 Current session ID:', currentSession.id.substring(0, 8) + '...');
    
    // Test 1: Try to terminate current session (should fail)
    console.log('🧪 Test 1: Attempting to terminate current session (should fail)...');
    try {
      await profileApi.terminateSession(userId, currentSession.id);
      console.log('❌ Test 1 FAILED: Current session termination was allowed!');
    } catch (error: any) {
      if (error.message?.includes('Cannot terminate your current session') || 
          error.message?.includes('CANNOT_TERMINATE_CURRENT_SESSION')) {
        console.log('✅ Test 1 PASSED: Current session termination was properly blocked');
        console.log('   Error message:', error.message);
      } else {
        console.log('⚠️ Test 1 UNCLEAR: Unexpected error:', error.message);
      }
    }
    
    // Test 2: Check frontend validation
    console.log('🧪 Test 2: Testing frontend validation...');
    const { validateSessionTermination } = await import('./sessionUtils');
    const validation = validateSessionTermination(currentSession.id, sessions);
    
    if (!validation.isValid) {
      console.log('✅ Test 2 PASSED: Frontend validation blocked current session termination');
      console.log('   Validation error:', validation.error);
    } else {
      console.log('❌ Test 2 FAILED: Frontend validation allowed current session termination');
    }
    
    // Test 3: Check other sessions (if any)
    const otherSessions = sessions.filter(s => !s.isCurrent);
    if (otherSessions.length > 0) {
      console.log('🧪 Test 3: Testing termination of other sessions...');
      const otherSession = otherSessions[0];
      const otherValidation = validateSessionTermination(otherSession.id, sessions);
      
      if (otherValidation.isValid) {
        console.log('✅ Test 3 PASSED: Other session termination is allowed');
        console.log('   Other session ID:', otherSession.id.substring(0, 8) + '...');
      } else {
        console.log('❌ Test 3 FAILED: Other session termination was blocked');
        console.log('   Validation error:', otherValidation.error);
      }
    } else {
      console.log('ℹ️ Test 3 SKIPPED: No other sessions to test');
    }
    
    console.log('🎉 Session protection testing completed!');
    
  } catch (error) {
    console.error('❌ Session protection test failed:', error);
  }
};

/**
 * Reset navigation state and redirect to dashboard
 */
export const resetNavigation = () => {
  console.log('🧭 Resetting navigation state...');
  
  // Clear any stored navigation state
  sessionStorage.removeItem('navigationState');
  sessionStorage.removeItem('lastVisitedRoute');
  
  // Force navigation to dashboard
  window.location.hash = '#/';
  window.location.reload();
  
  console.log('✅ Navigation reset complete');
};

/**
 * Force redirect to dashboard
 */
export const goToDashboard = () => {
  console.log('🏠 Forcing redirect to dashboard...');
  window.location.hash = '#/';
  console.log('✅ Redirected to dashboard');
};

// Make functions available globally for console access
if (typeof window !== 'undefined') {
  (window as any).debugUtils = {
    forceLogout,
    clearAllData,
    checkAuthState,
    testSessionProtection,
    resetNavigation,
    goToDashboard
  };
  
  console.log('🔧 Debug utilities available: window.debugUtils.forceLogout(), window.debugUtils.clearAllData(), window.debugUtils.checkAuthState(), window.debugUtils.testSessionProtection(), window.debugUtils.resetNavigation(), window.debugUtils.goToDashboard()');
} 