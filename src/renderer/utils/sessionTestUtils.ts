/**
 * Session Testing Utilities
 * Helper functions to test session creation integration
 */

import { profileApi } from '../services/profileApi';
import { getCurrentUser } from 'aws-amplify/auth';

/**
 * Test session creation functionality
 * Can be called from browser console for debugging
 */
export const testSessionCreation = async () => {
  console.group('🧪 Session Creation Test');
  
  try {
    console.log('1. Getting current user...');
    const cognitoUser = await getCurrentUser();
    const userId = cognitoUser.userId || cognitoUser.username;
    
    if (!userId) {
      console.error('❌ No user ID found');
      return false;
    }
    
    console.log('✅ User ID:', userId);
    
    console.log('2. Creating session...');
    const session = await profileApi.createSession(userId, {
      userAgent: navigator.userAgent,
      loginTime: new Date().toISOString()
    });
    
    console.log('✅ Session created successfully:', session);
    
    // Verify session properties
    console.log('3. Verifying session data...');
    const checks = {
      hasId: !!session.id,
      hasIpAddress: !!session.ipAddress,
      hasUserAgent: !!session.userAgent,
      hasLoginTime: !!session.loginTime,
      hasLastActivity: !!session.lastActivity,
      isCurrentSession: session.isCurrent === true
    };
    
    console.log('Session checks:', checks);
    
    const allChecksPass = Object.values(checks).every(check => check);
    
    if (allChecksPass) {
      console.log('✅ All session data checks passed!');
      
      // Test fetching sessions list
      console.log('4. Testing sessions list...');
      const sessions = await profileApi.getUserSessions(userId);
      console.log('✅ Sessions list fetched:', sessions.length, 'sessions');
      
      const currentSessionExists = sessions.some(s => s.isCurrent);
      console.log('Current session in list:', currentSessionExists ? '✅ Yes' : '❌ No');
      
      return true;
    } else {
      console.error('❌ Some session data checks failed');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Session creation test failed:', error);
    return false;
  } finally {
    console.groupEnd();
  }
};

/**
 * Test session list fetching
 */
export const testSessionsList = async () => {
  console.group('📱 Session List Test');
  
  try {
    const cognitoUser = await getCurrentUser();
    const userId = cognitoUser.userId || cognitoUser.username;
    
    if (!userId) {
      console.error('❌ No user ID found');
      return false;
    }
    
    console.log('📋 Fetching sessions for user:', userId);
    const sessions = await profileApi.getUserSessions(userId);
    
    console.log('✅ Sessions fetched:', sessions.length);
    
    sessions.forEach((session, index) => {
      console.log(`Session ${index + 1}:`, {
        id: session.id,
        isCurrent: session.isCurrent,
        ipAddress: session.ipAddress,
        location: session.location,
        loginTime: new Date(session.loginTime).toLocaleString(),
        lastActivity: new Date(session.lastActivity).toLocaleString()
      });
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Session list test failed:', error);
    return false;
  } finally {
    console.groupEnd();
  }
};

/**
 * Complete integration test
 */
export const runCompleteSessionTest = async () => {
  console.log('🚀 Running complete session integration test...');
  
  const creationTest = await testSessionCreation();
  const listTest = await testSessionsList();
  
  if (creationTest && listTest) {
    console.log('🎉 All session tests passed! Session integration is working correctly.');
    return true;
  } else {
    console.log('❌ Some session tests failed. Check the logs above for details.');
    return false;
  }
};

// Make test functions available globally for console debugging
declare global {
  interface Window {
    sessionTests: {
      testSessionCreation: typeof testSessionCreation;
      testSessionsList: typeof testSessionsList;
      runCompleteSessionTest: typeof runCompleteSessionTest;
    };
  }
}

// Only attach to window in development
if (process.env.NODE_ENV === 'development') {
  window.sessionTests = {
    testSessionCreation,
    testSessionsList,
    runCompleteSessionTest
  };
} 