/**
 * Session Bootstrap Service
 * Handles the initial session creation when session validation is enabled
 * Solves the chicken-and-egg problem of needing a session to create a session
 */

import { getCurrentUser } from 'aws-amplify/auth';
import { profileApi } from './profileApi';

export interface BootstrapResult {
  success: boolean;
  sessionId?: string;
  error?: string;
  requiresManualResolution?: boolean;
}

class SessionBootstrapService {
  private static instance: SessionBootstrapService;
  private isBootstrapping = false;
  private maxRetries = 3;
  private retryDelay = 2000; // 2 seconds

  static getInstance(): SessionBootstrapService {
    if (!SessionBootstrapService.instance) {
      SessionBootstrapService.instance = new SessionBootstrapService();
    }
    return SessionBootstrapService.instance;
  }

  /**
   * Bootstrap a new session after successful Cognito authentication
   */
  async bootstrapSession(): Promise<BootstrapResult> {
    if (this.isBootstrapping) {
      console.log('🔄 Session bootstrap already in progress, waiting...');
      return this.waitForBootstrap();
    }

    this.isBootstrapping = true;
    
    try {
      console.group('🚀 Session Bootstrap Process');
      console.log('📋 Attempting to create initial session after authentication');
      
      const user = await getCurrentUser();
      const userId = user.userId || user.username;
      
      console.log('👤 Bootstrapping session for user:', userId);
      
      // Try multiple approaches to create a session
      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        console.log(`🔄 Bootstrap attempt ${attempt}/${this.maxRetries}`);
        
        try {
          // Attempt 1: Try normal session creation (should work if backend fix is deployed)
          if (attempt === 1) {
            console.log('🎯 Attempting normal session creation (testing backend bootstrap fix)...');
            const session = await this.attemptNormalSessionCreation(userId);
            if (session) {
              console.log('🎉 Normal session creation succeeded - backend bootstrap fix is working!');
              console.log(`✅ Session ID: ${session.id}`);
              return { success: true, sessionId: session.id };
            }
          }
          
          // Attempt 2: Try with delay (backend might need time to process)
          if (attempt === 2) {
            console.log('⏳ Waiting before retry...');
            await this.delay(this.retryDelay);
            
            const session = await this.attemptNormalSessionCreation(userId);
            if (session) {
              console.log('✅ Delayed session creation succeeded');
              return { success: true, sessionId: session.id };
            }
          }
          
          // Attempt 3: Check if session was created externally
          if (attempt === 3) {
            console.log('🔍 Checking if session exists from another source...');
            const sessions = await this.checkExistingSessions(userId);
            if (sessions && sessions.length > 0) {
              const latestSession = sessions[0]; // Assume latest is first
              console.log('✅ Found existing session:', latestSession.id);
              localStorage.setItem('currentSessionId', latestSession.id);
              return { success: true, sessionId: latestSession.id };
            }
          }
          
        } catch (error) {
          console.log(`❌ Attempt ${attempt} failed:`, error);
          
          // If it's a CORS/network error, this confirms the session validation is working
          if (this.isSessionValidationError(error)) {
            console.log('🔍 Confirmed: Session validation is blocking requests as expected');
          }
        }
        
        // Wait before next attempt (except on last attempt)
        if (attempt < this.maxRetries) {
          await this.delay(1000);
        }
      }
      
      // All attempts failed - could be expected if backend fix not deployed
      console.log('⚠️ All bootstrap attempts failed');
      console.log('🔍 This could mean:');
      console.log('   1. Backend bootstrap fix not yet deployed');
      console.log('   2. Lambda authorizer still blocking session creation');
      console.log('   3. Session validation working but bootstrap not configured');
      
      return {
        success: false,
        error: 'Session bootstrap failed - backend fix may not be deployed yet',
        requiresManualResolution: true
      };
      
    } catch (error) {
      console.error('❌ Session bootstrap failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Bootstrap failed',
        requiresManualResolution: true
      };
    } finally {
      this.isBootstrapping = false;
      console.groupEnd();
    }
  }

  /**
   * Wait for an ongoing bootstrap process to complete
   */
  private async waitForBootstrap(): Promise<BootstrapResult> {
    const maxWait = 30000; // 30 seconds
    const checkInterval = 500; // 500ms
    let elapsed = 0;
    
    while (this.isBootstrapping && elapsed < maxWait) {
      await this.delay(checkInterval);
      elapsed += checkInterval;
    }
    
    if (this.isBootstrapping) {
      return {
        success: false,
        error: 'Bootstrap process timed out',
        requiresManualResolution: true
      };
    }
    
    return { success: true };
  }

  /**
   * Attempt normal session creation
   */
  private async attemptNormalSessionCreation(userId: string) {
    try {
      const sessionData = {
        userAgent: navigator.userAgent,
        loginTime: new Date().toISOString()
      };
      
      const session = await profileApi.createSession(userId, sessionData);
      
      // Store session ID locally
      localStorage.setItem('currentSessionId', session.id);
      localStorage.setItem('loginTime', sessionData.loginTime);
      
      return session;
    } catch (error) {
      console.log('❌ Normal session creation failed:', error);
      return null;
    }
  }

  /**
   * Check for existing sessions (might work if endpoint allows it)
   */
  private async checkExistingSessions(userId: string) {
    try {
      console.log('🔍 Attempting to fetch existing sessions...');
      const sessions = await profileApi.getUserSessions(userId);
      return sessions;
    } catch (error) {
      console.log('❌ Could not fetch existing sessions:', error);
      return null;
    }
  }

  /**
   * Check if error indicates session validation is working
   */
  private isSessionValidationError(error: any): boolean {
    const errorMessage = error?.message || '';
    
    return (
      errorMessage.includes('NetworkError') ||
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('CORS') ||
      errorMessage.includes('Access-Control-Allow-Origin') ||
      errorMessage.includes('No active sessions') ||
      errorMessage.includes('session has been terminated')
    );
  }

  /**
   * Simple delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if we're in a bootstrap scenario
   */
  isBootstrapRequired(): boolean {
    // Check if we have Cognito auth but no session ID
    const hasStoredSession = localStorage.getItem('currentSessionId');
    return !hasStoredSession;
  }

  /**
   * Clear bootstrap state (for testing)
   */
  reset(): void {
    this.isBootstrapping = false;
  }
}

export const sessionBootstrap = SessionBootstrapService.getInstance(); 