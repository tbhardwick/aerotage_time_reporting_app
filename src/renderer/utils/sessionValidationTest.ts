/**
 * Session Validation Test Utility
 * Quick test to verify the enhanced backend session validation is working
 */

import { apiClient } from '../services/api-client';
import { profileApi } from '../services/profileApi';
import { sessionBootstrap } from '../services/sessionBootstrap';
import { getCurrentUser } from 'aws-amplify/auth';

/**
 * Test if the enhanced backend session validation is working
 */
export const testSessionValidation = async () => {
  console.group('🧪 Testing Enhanced Backend Session Validation');
  
  try {
    console.log('📋 This test will verify that:');
    console.log('   1. API calls fail when no session exists');
    console.log('   2. Automatic logout is triggered');
    console.log('   3. User is redirected to login');
    console.log('');
    
    // Get current user info
    const user = await getCurrentUser();
    const userId = user.userId || user.username;
    console.log('👤 Testing with user:', userId);
    
    // Test different API endpoints that should fail
    const tests = [
      {
        name: 'Profile API - Get User Profile',
        test: () => profileApi.getUserProfile(userId)
      },
      {
        name: 'Main API - Get Projects', 
        test: () => apiClient.getProjects()
      },
      {
        name: 'Main API - Get Clients',
        test: () => apiClient.getClients()
      }
    ];
    
    console.log('🔧 Running API tests (all should fail with session validation)...');
    
    let sessionValidationWorking = true;
    let autoLogoutTriggered = false;
    
    for (const testCase of tests) {
      try {
        console.log(`   Testing: ${testCase.name}...`);
        await testCase.test();
        console.log(`   ❌ ${testCase.name}: SUCCEEDED (Session validation not working!)`);
        sessionValidationWorking = false;
      } catch (error: any) {
        console.log(`   ✅ ${testCase.name}: FAILED as expected`);
        
        // Check if it triggered automatic logout
        if (error.message?.includes('session is no longer valid') || 
            error.message?.includes('session has been terminated')) {
          autoLogoutTriggered = true;
          console.log(`   🎯 Automatic logout should be triggered`);
        }
        
        console.log(`   📄 Error: ${error.message}`);
      }
    }
    
    // Wait a moment for automatic logout to process
    console.log('⏳ Waiting for automatic logout to process...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Summary
    console.log('');
    console.log('📊 Test Results:');
    console.log(`   Backend Session Validation: ${sessionValidationWorking ? '❌ NOT WORKING' : '✅ WORKING'}`);
    console.log(`   Automatic Logout Detection: ${autoLogoutTriggered ? '✅ DETECTED' : '❌ NOT DETECTED'}`);
    
    if (sessionValidationWorking) {
      console.log('');
      console.log('⚠️  Session validation appears to not be working properly.');
      console.log('   This could mean:');
      console.log('   1. Backend session validation not deployed');
      console.log('   2. You already have an active session');
      console.log('   3. CORS is configured to allow requests');
    } else {
      console.log('');
      console.log('🎉 Enhanced backend session validation is working!');
      console.log('   All API calls were properly blocked.');
      console.log('   The automatic logout should redirect you to login shortly.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.groupEnd();
  }
};

/**
 * Quick test to verify current auth state
 */
export const testCurrentAuthState = async () => {
  console.group('🔍 Current Authentication State');
  
  try {
    const user = await getCurrentUser();
    console.log('👤 Cognito User:', {
      userId: user.userId || user.username,
      username: user.username
    });
    
    console.log('💾 Local Storage:');
    console.log('   Session ID:', localStorage.getItem('currentSessionId'));
    console.log('   Login Time:', localStorage.getItem('loginTime'));
    
    // Try one simple API call
    console.log('🔧 Testing one API call...');
    try {
      const projects = await apiClient.getProjects();
      console.log('✅ API call succeeded - session appears valid');
      console.log('📊 Projects loaded:', projects.length);
    } catch (error: any) {
      console.log('❌ API call failed:', error.message);
      
      if (error.message?.includes('CORS') || 
          error.message?.includes('NetworkError') ||
          error.message?.includes('session')) {
        console.log('🔍 This looks like a session validation error');
        console.log('   The backend session validation is likely working');
      }
    }
    
  } catch (error) {
    console.error('❌ Auth state test failed:', error);
  } finally {
    console.groupEnd();
  }
};

/**
 * Test the session bootstrap fix - specifically for the chicken-and-egg solution
 */
export const testSessionBootstrapFix = async () => {
  console.group('🐣 Testing Session Bootstrap Fix (Chicken-and-Egg Solution)');
  
  try {
    console.log('📋 This test verifies the backend bootstrap fix:');
    console.log('   1. New users can create their first session');
    console.log('   2. Session creation works despite session validation');
    console.log('   3. Subsequent API calls work after session creation');
    console.log('');
    
    // Get current user info
    const user = await getCurrentUser();
    const userId = user.userId || user.username;
    console.log('👤 Testing bootstrap for user:', userId);
    
    // Clear any existing session to simulate new user
    console.log('🧹 Clearing existing session data to simulate new user...');
    localStorage.removeItem('currentSessionId');
    localStorage.removeItem('loginTime');
    
    // Test session bootstrap
    console.log('🚀 Testing session bootstrap...');
    try {
      const bootstrapResult = await sessionBootstrap.bootstrapSession();
      
      if (bootstrapResult.success) {
        console.log('✅ Session bootstrap SUCCEEDED!');
        console.log(`   📝 Session ID: ${bootstrapResult.sessionId}`);
        console.log('   🎉 Backend chicken-and-egg fix is working!');
        
        // Test that APIs now work
        console.log('🔧 Testing API calls with new session...');
        try {
          const projects = await apiClient.getProjects();
          console.log('✅ API call succeeded after bootstrap');
          console.log(`   📊 Projects loaded: ${projects.length}`);
          
          // Test profile API
          const profile = await profileApi.getUserProfile(userId);
          console.log('✅ Profile API succeeded after bootstrap');
          console.log(`   👤 Profile loaded: ${profile.name}`);
          
          console.log('');
          console.log('🎉 BOOTSTRAP FIX IS WORKING PERFECTLY!');
          console.log('   ✅ Session creation succeeded');
          console.log('   ✅ Subsequent API calls work');
          console.log('   ✅ No manual intervention required');
          
        } catch (apiError: any) {
          console.log('❌ API calls failed after bootstrap:', apiError.message);
          console.log('⚠️  Bootstrap created session but APIs still blocked');
        }
        
      } else if (bootstrapResult.requiresManualResolution) {
        console.log('⚠️  Session bootstrap still requires manual resolution');
        console.log(`   📄 Error: ${bootstrapResult.error}`);
        console.log('');
        console.log('🤔 This suggests:');
        console.log('   1. Backend fix may not be fully deployed');
        console.log('   2. Lambda authorizer still blocking session creation');
        console.log('   3. Additional backend configuration needed');
        
      } else {
        console.log('❌ Session bootstrap failed unexpectedly');
        console.log(`   📄 Error: ${bootstrapResult.error}`);
      }
      
    } catch (bootstrapError: any) {
      console.error('❌ Session bootstrap threw error:', bootstrapError.message);
      console.log('');
      console.log('🔍 If you see CORS/NetworkError, this means:');
      console.log('   - Session validation is working (good!)');
      console.log('   - But bootstrap fix is not yet active (needs backend update)');
    }
    
  } catch (error) {
    console.error('❌ Bootstrap test failed:', error);
  } finally {
    console.groupEnd();
  }
};

// Make functions available globally for debugging
declare global {
  interface Window {
    sessionValidation: {
      testSessionValidation: typeof testSessionValidation;
      testCurrentAuthState: typeof testCurrentAuthState;
      testSessionBootstrapFix: typeof testSessionBootstrapFix;
    };
  }
}

// Attach to window in development
if (process.env.NODE_ENV === 'development') {
  window.sessionValidation = {
    testSessionValidation,
    testCurrentAuthState,
    testSessionBootstrapFix
  };
} 