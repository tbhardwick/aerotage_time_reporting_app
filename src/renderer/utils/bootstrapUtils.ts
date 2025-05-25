/**
 * Bootstrap Utilities
 * Helper functions to manage session bootstrap errors
 */

/**
 * Clear bootstrap error if the user has successfully authenticated and has a session
 * This prevents old bootstrap errors from persisting when the user is actually logged in
 */
export const clearBootstrapErrorIfLoggedIn = (): void => {
  const hasSession = localStorage.getItem('currentSessionId');
  const hasBootstrapError = localStorage.getItem('sessionBootstrapError');
  
  if (hasSession && hasBootstrapError) {
    console.log('🧹 Clearing bootstrap error - user has active session');
    localStorage.removeItem('sessionBootstrapError');
  }
};

/**
 * Check if bootstrap error should be shown
 * Only show if user doesn't have a session (indicating fresh login failure)
 */
export const shouldShowBootstrapError = (): boolean => {
  const hasSession = localStorage.getItem('currentSessionId');
  const bootstrapError = localStorage.getItem('sessionBootstrapError');
  
  if (!bootstrapError) {
    return false;
  }
  
  try {
    const errorData = JSON.parse(bootstrapError);
    
    // Only show if:
    // 1. Error requires manual resolution
    // 2. Error was not successful
    // 3. User doesn't have an existing session
    return errorData.requiresManualResolution && !errorData.success && !hasSession;
  } catch (error) {
    console.warn('Failed to parse bootstrap error:', error);
    localStorage.removeItem('sessionBootstrapError');
    return false;
  }
};

/**
 * Clear all bootstrap-related data
 * Useful for logout or when starting fresh
 */
export const clearAllBootstrapData = (): void => {
  localStorage.removeItem('sessionBootstrapError');
  localStorage.removeItem('currentSessionId');
  localStorage.removeItem('loginTime');
  console.log('🧹 Cleared all bootstrap data');
}; 