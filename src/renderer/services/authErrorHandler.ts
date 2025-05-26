/**
 * Authentication Error Handler Service
 * Handles session validation errors and manages automatic logout
 */

import { signOut } from 'aws-amplify/auth';

interface AuthError {
  code?: string;
  statusCode?: number;
  shouldLogout?: boolean;
  message: string;
}

class AuthErrorHandler {
  private static instance: AuthErrorHandler;
  private isLoggingOut = false;

  static getInstance(): AuthErrorHandler {
    if (!AuthErrorHandler.instance) {
      AuthErrorHandler.instance = new AuthErrorHandler();
    }
    return AuthErrorHandler.instance;
  }

  /**
   * Handle authentication errors from API calls
   */
  async handleAuthError(error: AuthError): Promise<void> {
    console.log('🔐 AuthErrorHandler: Processing authentication error', {
      code: error.code,
      statusCode: error.statusCode,
      shouldLogout: error.shouldLogout,
      message: error.message
    });

    // Check if this is a session validation error that requires logout
    if (this.shouldForceLogout(error)) {
      await this.performLogout(error);
    }
  }

  /**
   * Determine if error should trigger automatic logout
   */
  private shouldForceLogout(error: AuthError): boolean {
    // Enhanced backend session validation error codes
    if (error.code === 'AUTHENTICATION_FAILED' || error.code === 'SESSION_TERMINATED') {
      return true;
    }

    // 401 errors always indicate authentication failure
    if (error.statusCode === 401) {
      return true;
    }

    // For 403 errors, only logout if it's a session-related error, not a permission error
    if (error.statusCode === 403) {
      // Check if this is a session validation error vs a permission error
      const message = error.message || '';
      
      // Session-related 403 errors that should trigger logout
      if (message.includes('No active sessions') || 
          message.includes('session has been terminated') ||
          message.includes('Authentication required') ||
          message.includes('session is no longer valid') ||
          message.includes('explicit deny')) {
        return true;
      }
      
      // Permission-related 403 errors that should NOT trigger logout
      if (message.includes('You can only access your own') ||
          message.includes('UNAUTHORIZED_PROFILE_ACCESS')) {
        console.log('🔍 AuthErrorHandler: 403 is a permission error, not triggering logout:', message);
        return false;
      }
      
      // If we can't determine the type of 403 error, err on the side of caution and don't logout
      console.log('🔍 AuthErrorHandler: Unknown 403 error type, not triggering logout:', message);
      return false;
    }

    // Legacy authentication error patterns
    if (error.message?.includes('Authentication required') || 
        error.message?.includes('session has been terminated') ||
        error.message?.includes('No active sessions')) {
      return true;
    }

    // Explicit logout flag
    if (error.shouldLogout === true) {
      return true;
    }

    return false;
  }

  /**
   * Perform logout and cleanup
   */
  private async performLogout(error: AuthError): Promise<void> {
    if (this.isLoggingOut) {
      console.log('🔐 AuthErrorHandler: Logout already in progress, skipping');
      return;
    }

    try {
      this.isLoggingOut = true;
      
      console.log('🔐 AuthErrorHandler: Performing automatic logout due to:', error.message);

      // Clear local session data
      this.clearLocalSessionData();

      // Show user notification
      this.showLogoutNotification(error);

      // Sign out from Cognito
      await signOut();

      // Reload the page to return to login state
      window.location.reload();

    } catch (logoutError) {
      console.error('🔐 AuthErrorHandler: Failed to logout cleanly:', logoutError);
      
      // Force reload even if logout fails
      window.location.reload();
    } finally {
      this.isLoggingOut = false;
    }
  }

  /**
   * Clear local session data
   */
  private clearLocalSessionData(): void {
    try {
      localStorage.removeItem('currentSessionId');
      localStorage.removeItem('loginTime');
      sessionStorage.clear();
      console.log('🔐 AuthErrorHandler: Local session data cleared');
    } catch (error) {
      console.warn('🔐 AuthErrorHandler: Failed to clear local session data:', error);
    }
  }

  /**
   * Show user notification about logout
   */
  private showLogoutNotification(error: AuthError): void {
    let message = 'Your session has expired. Please sign in again.';

    if (error.code === 'SESSION_TERMINATED') {
      message = 'Your session was terminated from another device. Please sign in again.';
    } else if (error.statusCode === 401) {
      message = 'Your authentication token has expired. Please sign in again.';
    } else if (error.statusCode === 403) {
      message = 'Your session is no longer valid. Please sign in again.';
    }

    // Show a temporary notification before reload
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ef4444;
      color: white;
      padding: 16px;
      border-radius: 8px;
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      max-width: 400px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);

    // Remove notification after a short delay (it will be removed by page reload anyway)
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 3000);
  }

  /**
   * Check if currently logging out
   */
  isCurrentlyLoggingOut(): boolean {
    return this.isLoggingOut;
  }

  /**
   * Manually force logout - useful when session has been terminated externally
   */
  async forceLogout(reason: string = 'Manual logout requested'): Promise<void> {
    console.log('🔐 AuthErrorHandler: Force logout requested:', reason);
    
    const logoutError = {
      code: 'MANUAL_LOGOUT',
      statusCode: 403,
      shouldLogout: true,
      message: reason
    };
    
    await this.performLogout(logoutError);
  }
}

// Export singleton instance
export const authErrorHandler = AuthErrorHandler.getInstance();

/**
 * Utility function to wrap API calls with automatic error handling
 */
export const withAuthErrorHandling = async <T>(
  apiCall: () => Promise<T>
): Promise<T> => {
  try {
    return await apiCall();
  } catch (error: any) {
    // Handle authentication errors automatically
    if (error && typeof error === 'object') {
      await authErrorHandler.handleAuthError(error);
    }
    
    // Re-throw the error for the caller to handle
    throw error;
  }
}; 