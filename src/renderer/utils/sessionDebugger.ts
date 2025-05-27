/**
 * Session Debugging Utility
 * Helps identify issues with session management UI
 */

import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { decodeJWTPayload } from './jwt';
import { profileApi } from '../services/profileApi';

/**
 * Debug session UI issues
 */
export const debugSessionUI = async () => {
  console.group('🐛 Session UI Debug Analysis');
  
  try {
    // Get current authentication state
    const user = await getCurrentUser();
    const session = await fetchAuthSession({ forceRefresh: false });
    const token = session.tokens?.idToken?.toString();
    const tokenPayload = decodeJWTPayload(token!);
    const userId = tokenPayload?.sub;
    
    console.log('👤 Current User ID:', userId);
    console.log('💾 Stored Session ID:', localStorage.getItem('currentSessionId'));
    
    // Fetch current sessions from API
    const sessions = await profileApi.getUserSessions(userId!);
    console.log('📱 Total sessions from API:', sessions.length);
    
    // Analyze each session
    sessions.forEach((session, index) => {
      console.log(`\n📊 Session ${index + 1} Analysis:`);
      console.log(`   ID: ${session.id}`);
      console.log(`   Is Current: ${session.isCurrent}`);
      console.log(`   User Agent: ${session.userAgent}`);
      console.log(`   IP Address: ${session.ipAddress}`);
      console.log(`   Login Time: ${session.loginTime}`);
      console.log(`   Last Activity: ${session.lastActivity}`);
      console.log(`   Location:`, session.location);
    });
    
    // Check for test/mock data indicators
    const testIndicators: string[] = [];
    sessions.forEach(session => {
      if (session.userAgent.toLowerCase().includes('test')) {
        testIndicators.push('User agent contains "test"');
      }
      if (session.userAgent.toLowerCase().includes('script')) {
        testIndicators.push('User agent contains "script"');
      }
      if (session.userAgent.toLowerCase().includes('mock')) {
        testIndicators.push('User agent contains "mock"');
      }
      if (session.ipAddress === '127.0.0.1' || session.ipAddress === 'localhost') {
        testIndicators.push('Localhost IP address');
      }
    });
    
    if (testIndicators.length > 0) {
      console.log('⚠️  Test/Mock indicators found:', testIndicators);
    } else {
      console.log('✅ No obvious test/mock indicators found');
    }
    
    // Analyze current session detection
    console.log('\n🎯 Current Session Analysis:');
    const currentSessions = sessions.filter(s => s.isCurrent);
    console.log(`   Sessions marked as current: ${currentSessions.length}`);
    
    if (currentSessions.length === 0) {
      console.log('❌ No session marked as current - this explains missing green highlighting');
      console.log('💡 Possible causes:');
      console.log('   1. Session creation not setting isCurrent flag');
      console.log('   2. Backend not properly identifying current session');
      console.log('   3. Session ID mismatch between frontend and backend');
    } else if (currentSessions.length > 1) {
      console.log('⚠️  Multiple sessions marked as current - this should not happen');
    } else {
      console.log('✅ Exactly one session marked as current');
    }
    
    // Check localStorage session tracking
    const storedSessionId = localStorage.getItem('currentSessionId');
    if (storedSessionId) {
      const matchingSession = sessions.find(s => s.id === storedSessionId);
      if (matchingSession) {
        console.log('✅ Stored session ID matches a session in the list');
        console.log(`   Stored session is current: ${matchingSession.isCurrent}`);
      } else {
        console.log('❌ Stored session ID does not match any session in the list');
      }
    } else {
      console.log('❌ No session ID stored in localStorage');
    }
    
    // Check user agent matching
    const currentUserAgent = navigator.userAgent;
    const matchingUserAgentSessions = sessions.filter(s => s.userAgent === currentUserAgent);
    console.log(`\n🔍 User Agent Analysis:`);
    console.log(`   Current browser user agent: ${currentUserAgent.substring(0, 50)}...`);
    console.log(`   Sessions with matching user agent: ${matchingUserAgentSessions.length}`);
    
    // Analyze termination protection
    console.log('\n🛡️ Termination Protection Analysis:');
    sessions.forEach((session, index) => {
      const canTerminate = !session.isCurrent;
      console.log(`   Session ${index + 1}: Can terminate = ${canTerminate}`);
      if (session.isCurrent) {
        console.log(`      ❌ Should show "Cannot Terminate" button`);
      } else {
        console.log(`      ✅ Should show "Terminate" button`);
      }
    });
    
    // UI state recommendations
    console.log('\n💡 UI State Recommendations:');
    if (currentSessions.length === 0) {
      console.log('   - All sessions should show gray background');
      console.log('   - All sessions should have "Terminate" button');
      console.log('   - Need to fix current session detection');
    } else {
      console.log('   - Current session should show green background');
      console.log('   - Current session should show "Cannot Terminate"');
      console.log('   - Other sessions should show "Terminate" button');
    }
    
  } catch (error) {
    console.error('❌ Debug analysis failed:', error);
  } finally {
    console.groupEnd();
  }
};

/**
 * Fix session state by creating a proper current session
 */
export const fixSessionState = async () => {
  console.group('🔧 Session State Fix');
  
  try {
    // Get current user
    const user = await getCurrentUser();
    const session = await fetchAuthSession({ forceRefresh: false });
    const token = session.tokens?.idToken?.toString();
    const tokenPayload = decodeJWTPayload(token!);
    const userId = tokenPayload?.sub;
    
    if (!userId) {
      console.error('❌ No user ID available');
      return false;
    }
    
    console.log('👤 Fixing session state for user:', userId);
    
    // Get current sessions
    const existingSessions = await profileApi.getUserSessions(userId);
    console.log('📱 Current sessions count:', existingSessions.length);
    
    // Analyze existing sessions
    existingSessions.forEach((session, index) => {
      console.log(`📊 Session ${index + 1}:`);
      console.log(`   ID: ${session.id}`);
      console.log(`   User Agent: ${session.userAgent}`);
      console.log(`   Is Current: ${session.isCurrent}`);
      console.log(`   IP: ${session.ipAddress}`);
    });
    
    // Check if we have a proper current session
    const currentUserAgent = navigator.userAgent;
    const properCurrentSession = existingSessions.find(s => 
      s.userAgent === currentUserAgent && s.isCurrent
    );
    
    if (properCurrentSession) {
      console.log('✅ Found proper current session:', properCurrentSession.id);
      localStorage.setItem('currentSessionId', properCurrentSession.id);
      return true;
    }
    
    // Check for sessions with matching user agent but not marked as current
    const matchingUserAgentSession = existingSessions.find(s => 
      s.userAgent === currentUserAgent
    );
    
    if (matchingUserAgentSession) {
      console.log('🔍 Found session with matching user agent but not marked as current');
      console.log('   This might be the session from browser login');
      console.log('   Session ID:', matchingUserAgentSession.id);
      localStorage.setItem('currentSessionId', matchingUserAgentSession.id);
      console.log('✅ Using existing session instead of creating new one');
      return true;
    }
    
    // Check for test sessions to clean up
    const testSessions = existingSessions.filter(s => 
      s.userAgent.toLowerCase().includes('test') || 
      s.userAgent.toLowerCase().includes('script') ||
      s.userAgent.toLowerCase().includes('mock')
    );
    
    if (testSessions.length > 0) {
      console.log(`🧹 Found ${testSessions.length} test sessions to clean up`);
      
      // Terminate test sessions
      for (const testSession of testSessions) {
        try {
          console.log(`🗑️ Terminating test session: ${testSession.id}`);
          await profileApi.terminateSession(userId, testSession.id);
          console.log('✅ Test session terminated');
        } catch (error) {
          console.log('⚠️ Could not terminate test session:', error);
        }
      }
    }
    
    // Only try to create a new session if we don't have any sessions
    if (existingSessions.length === 0) {
      console.log('🆕 No sessions found, creating new current session...');
      
      try {
        const newSession = await profileApi.createSession(userId, {
          userAgent: currentUserAgent,
          loginTime: new Date().toISOString()
        });
        
        console.log('✅ New session created:', newSession.id);
        localStorage.setItem('currentSessionId', newSession.id);
        return true;
      } catch (error) {
        console.error('❌ Failed to create new session:', error);
        
        // Check if it's a permission issue
        if (error instanceof Error && error.message.includes('403')) {
          console.log('🔍 403 Forbidden - possible causes:');
          console.log('   1. User already has maximum allowed sessions');
          console.log('   2. Backend session validation is blocking creation');
          console.log('   3. JWT token doesn\'t have session creation permissions');
          console.log('   4. Browser and Electron app have different authentication contexts');
        }
        
        return false;
      }
    } else {
      console.log('ℹ️ Sessions exist but none match current browser');
      console.log('💡 This is expected if you logged in via browser first');
      console.log('💡 The browser session should become current when you use the browser');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Session state fix failed:', error);
    return false;
  } finally {
    console.groupEnd();
  }
};

/**
 * Test session creation with current browser data
 */
export const testSessionCreation = async () => {
  console.group('🧪 Session Creation Test');
  
  try {
    const user = await getCurrentUser();
    const session = await fetchAuthSession({ forceRefresh: false });
    const token = session.tokens?.idToken?.toString();
    const tokenPayload = decodeJWTPayload(token!);
    const userId = tokenPayload?.sub;
    
    if (!userId) {
      console.error('❌ No user ID available');
      return false;
    }
    
    console.log('🆕 Testing session creation with current browser data...');
    
    const sessionData = {
      userAgent: navigator.userAgent,
      loginTime: new Date().toISOString()
    };
    
    console.log('📤 Session data:', sessionData);
    
    const newSession = await profileApi.createSession(userId, sessionData);
    
    console.log('✅ Session created successfully:', newSession);
    console.log('   ID:', newSession.id);
    console.log('   Is Current:', newSession.isCurrent);
    console.log('   User Agent Match:', newSession.userAgent === navigator.userAgent);
    
    // Store session ID
    localStorage.setItem('currentSessionId', newSession.id);
    
    return true;
    
  } catch (error) {
    console.error('❌ Session creation test failed:', error);
    return false;
  } finally {
    console.groupEnd();
  }
};

/**
 * Sync with existing browser session instead of creating new one
 */
export const syncWithBrowserSession = async () => {
  console.group('🔄 Sync with Browser Session');
  
  try {
    // Get current user
    const user = await getCurrentUser();
    const session = await fetchAuthSession({ forceRefresh: false });
    const token = session.tokens?.idToken?.toString();
    const tokenPayload = decodeJWTPayload(token!);
    const userId = tokenPayload?.sub;
    
    if (!userId) {
      console.error('❌ No user ID available');
      return false;
    }
    
    console.log('👤 Syncing with browser session for user:', userId);
    
    // Get current sessions
    const existingSessions = await profileApi.getUserSessions(userId);
    console.log('📱 Found sessions:', existingSessions.length);
    
    if (existingSessions.length === 0) {
      console.log('❌ No sessions found to sync with');
      return false;
    }
    
    // Find the most recent session (likely from browser login)
    const sortedSessions = existingSessions.sort((a, b) => 
      new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime()
    );
    
    const latestSession = sortedSessions[0];
    console.log('🎯 Latest session found:');
    console.log(`   ID: ${latestSession.id}`);
    console.log(`   User Agent: ${latestSession.userAgent}`);
    console.log(`   Login Time: ${latestSession.loginTime}`);
    console.log(`   Is Current: ${latestSession.isCurrent}`);
    console.log(`   IP: ${latestSession.ipAddress}`);
    
    // Use this session as our current session
    localStorage.setItem('currentSessionId', latestSession.id);
    console.log('✅ Synced with browser session');
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to sync with browser session:', error);
    return false;
  } finally {
    console.groupEnd();
  }
};

/**
 * Create Electron app session (for multiple sessions support)
 */
export const createElectronSession = async () => {
  console.group('🖥️ Create Electron Session');
  
  try {
    // Get current user
    const user = await getCurrentUser();
    const session = await fetchAuthSession({ forceRefresh: false });
    const token = session.tokens?.idToken?.toString();
    const tokenPayload = decodeJWTPayload(token!);
    const userId = tokenPayload?.sub;
    
    if (!userId) {
      console.error('❌ No user ID available');
      return false;
    }
    
    console.log('👤 Creating Electron session for user:', userId);
    
    // Create session with Electron-specific user agent
    const sessionData = {
      userAgent: navigator.userAgent, // Will show as Electron app
      loginTime: new Date().toISOString()
    };
    
    console.log('📤 Creating session with data:', sessionData);
    
    const newSession = await profileApi.createSession(userId, sessionData);
    
    console.log('✅ Electron session created successfully:');
    console.log(`   ID: ${newSession.id}`);
    console.log(`   User Agent: ${newSession.userAgent}`);
    console.log(`   Is Current: ${newSession.isCurrent}`);
    console.log(`   IP: ${newSession.ipAddress}`);
    
    // Store session ID for tracking
    localStorage.setItem('currentSessionId', newSession.id);
    localStorage.setItem('loginTime', newSession.loginTime);
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to create Electron session:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('403') || error.message.includes('Forbidden')) {
        console.log('🔍 403 Forbidden - Backend may need updates for multiple sessions:');
        console.log('   1. Enable allowMultipleSessions in user security settings');
        console.log('   2. Update session creation logic to allow multiple sessions');
        console.log('   3. Remove session termination before creation');
      }
    }
    
    return false;
  } finally {
    console.groupEnd();
  }
};

// Make functions available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).sessionDebug = {
    debugSessionUI,
    testSessionCreation,
    fixSessionState,
    syncWithBrowserSession,
    createElectronSession
  };
} 