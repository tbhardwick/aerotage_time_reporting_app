/**
 * Session API Test Utility
 * Use this to verify if session management is working with real API data
 */

import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { decodeJWTPayload } from './jwt';
import { awsConfig } from '../config/aws-config';

const API_BASE_URL = awsConfig.apiGatewayUrl;

/**
 * Test session API endpoints to verify real vs mock data
 */
export const testSessionAPI = async () => {
  console.group('🧪 Session API Test - Real vs Mock Data');
  
  try {
    // Get authentication
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
    
    console.log('👤 Testing with user ID:', userId);
    console.log('🔑 Token length:', token.length);
    
    // Test 1: Check if sessions endpoint exists and returns data
    console.log('\n=== Test 1: GET /users/{userId}/sessions ===');
    
    const sessionsResponse = await fetch(`${API_BASE_URL}/users/${userId}/sessions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    console.log('📡 Sessions Response Status:', sessionsResponse.status);
    
    if (sessionsResponse.ok) {
      const sessionsData = await sessionsResponse.json();
      console.log('📊 Sessions Response:', sessionsData);
      
      if (sessionsData.success && Array.isArray(sessionsData.data)) {
        const sessions = sessionsData.data;
        console.log('✅ Sessions endpoint working - Found', sessions.length, 'sessions');
        
        // Analyze session data to determine if it's real or mock
        if (sessions.length > 0) {
          const firstSession = sessions[0];
          console.log('\n🔍 Analyzing first session for real vs mock indicators:');
          console.log('   Session ID format:', firstSession.id?.length > 10 ? 'Real UUID' : 'Possibly mock');
          console.log('   IP Address:', firstSession.ipAddress || 'Missing');
          console.log('   User Agent length:', firstSession.userAgent?.length || 0);
          console.log('   Has location data:', !!firstSession.location);
          console.log('   Login time format:', firstSession.loginTime);
          console.log('   Is current session:', firstSession.isCurrent);
          
          // Check for mock data patterns
          const mockIndicators = [];
          if (firstSession.ipAddress === '127.0.0.1' || firstSession.ipAddress === 'localhost') {
            mockIndicators.push('Localhost IP address');
          }
          if (firstSession.userAgent?.includes('Mock') || firstSession.userAgent?.includes('Test')) {
            mockIndicators.push('Mock user agent');
          }
          if (firstSession.id?.startsWith('mock-') || firstSession.id?.startsWith('test-')) {
            mockIndicators.push('Mock ID pattern');
          }
          
          if (mockIndicators.length > 0) {
            console.log('⚠️  Possible mock data indicators:', mockIndicators);
          } else {
            console.log('✅ Data appears to be real (no obvious mock patterns)');
          }
        } else {
          console.log('ℹ️  No sessions found - this could mean:');
          console.log('   1. User hasn\'t logged in recently');
          console.log('   2. Session creation isn\'t working');
          console.log('   3. Sessions have expired');
        }
      } else {
        console.log('❌ Unexpected response format:', sessionsData);
      }
    } else {
      const errorText = await sessionsResponse.text();
      console.log('❌ Sessions request failed:', errorText);
    }
    
    // Test 2: Try to create a session
    console.log('\n=== Test 2: POST /users/{userId}/sessions ===');
    
    const createSessionResponse = await fetch(`${API_BASE_URL}/users/${userId}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        userAgent: navigator.userAgent,
        loginTime: new Date().toISOString()
      }),
    });
    
    console.log('📡 Create Session Response Status:', createSessionResponse.status);
    
    if (createSessionResponse.ok) {
      const createData = await createSessionResponse.json();
      console.log('✅ Session creation successful:', createData);
      
      if (createData.success && createData.data) {
        const newSession = createData.data;
        console.log('🆕 New session created with ID:', newSession.id);
        console.log('   IP Address:', newSession.ipAddress);
        console.log('   Location:', newSession.location);
        console.log('   Is Current:', newSession.isCurrent);
      }
    } else {
      const errorText = await createSessionResponse.text();
      console.log('❌ Session creation failed:', errorText);
      
      // Check if it's because session already exists
      if (createSessionResponse.status === 409) {
        console.log('ℹ️  This might be expected if a session already exists');
      }
    }
    
    // Test 3: Check profile endpoint for comparison
    console.log('\n=== Test 3: GET /users/{userId}/profile (for comparison) ===');
    
    const profileResponse = await fetch(`${API_BASE_URL}/users/${userId}/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    console.log('📡 Profile Response Status:', profileResponse.status);
    
    if (profileResponse.ok) {
      const profileData = await profileResponse.json();
      console.log('✅ Profile endpoint working');
      console.log('   User ID matches:', profileData.data?.id === userId);
    } else {
      const errorText = await profileResponse.text();
      console.log('❌ Profile request failed:', errorText);
    }
    
    console.log('\n=== Summary ===');
    console.log('🔍 To determine if session data is real or mock:');
    console.log('   1. Check if session IDs are proper UUIDs');
    console.log('   2. Verify IP addresses are not localhost/127.0.0.1');
    console.log('   3. Look for realistic user agent strings');
    console.log('   4. Check if location data makes sense');
    console.log('   5. Verify timestamps are recent and realistic');
    
  } catch (error) {
    console.error('❌ Session API test failed:', error);
  } finally {
    console.groupEnd();
  }
};

/**
 * Quick session data analysis
 */
export const analyzeSessionData = async () => {
  try {
    const { profileApi } = await import('../services/profileApi');
    const { getCurrentUser, fetchAuthSession } = await import('aws-amplify/auth');
    
    const user = await getCurrentUser();
    const session = await fetchAuthSession({ forceRefresh: false });
    const token = session.tokens?.idToken?.toString();
    const tokenPayload = decodeJWTPayload(token!);
    const userId = tokenPayload?.sub;
    
    if (!userId) {
      console.error('No user ID available');
      return;
    }
    
    const sessions = await profileApi.getUserSessions(userId);
    
    console.group('📊 Session Data Analysis');
    console.log('Total sessions:', sessions.length);
    
    sessions.forEach((session, index) => {
      console.log(`\nSession ${index + 1}:`);
      console.log('  ID:', session.id);
      console.log('  IP:', session.ipAddress);
      console.log('  Location:', session.location);
      console.log('  User Agent:', session.userAgent?.substring(0, 50) + '...');
      console.log('  Login Time:', new Date(session.loginTime).toLocaleString());
      console.log('  Last Activity:', new Date(session.lastActivity).toLocaleString());
      console.log('  Is Current:', session.isCurrent);
    });
    
    console.groupEnd();
    
  } catch (error) {
    console.error('Failed to analyze session data:', error);
  }
};

// Make functions available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).sessionApiTest = {
    testSessionAPI,
    analyzeSessionData
  };
} 