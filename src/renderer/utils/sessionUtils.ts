/**
 * Session Management Utilities
 * Helper functions for session identification and protection
 */

import { UserSession } from '../types/user-profile-api';

/**
 * Get the current session ID from localStorage
 */
export const getCurrentSessionId = (): string | null => {
  return localStorage.getItem('currentSessionId');
};

/**
 * Check if a session is the current session
 */
export const isCurrentSession = (session: UserSession): boolean => {
  const currentSessionId = getCurrentSessionId();
  return session.isCurrent || (currentSessionId !== null && session.id === currentSessionId);
};

/**
 * Find the current session from a list of sessions
 */
export const findCurrentSession = (sessions: UserSession[]): UserSession | null => {
  // First try to find by isCurrent flag
  let currentSession = sessions.find(session => session.isCurrent);
  
  // If not found, try to match by stored session ID
  if (!currentSession) {
    const currentSessionId = getCurrentSessionId();
    if (currentSessionId) {
      currentSession = sessions.find(session => session.id === currentSessionId);
    }
  }
  
  return currentSession || null;
};

/**
 * Validate that a session can be terminated
 */
export const canTerminateSession = (session: UserSession): { canTerminate: boolean; reason?: string } => {
  if (isCurrentSession(session)) {
    return {
      canTerminate: false,
      reason: 'Cannot terminate your current session. Use the Sign Out button to safely end your current session.'
    };
  }
  
  return { canTerminate: true };
};

/**
 * Get session termination confirmation message
 */
export const getTerminationConfirmationMessage = (session: UserSession): string => {
  const deviceInfo = session.userAgent || 'Unknown device';
  const locationInfo = session.location 
    ? `${session.location.city}, ${session.location.country}` 
    : 'Unknown location';
  
  return `Are you sure you want to terminate this session?\n\n` +
         `Device: ${deviceInfo}\n` +
         `IP: ${session.ipAddress || 'Unknown'}\n` +
         `Location: ${locationInfo}\n` +
         `Last Active: ${new Date(session.lastActivity).toLocaleString()}\n\n` +
         `This action cannot be undone and will immediately log out that device.`;
};

/**
 * Session security policy information
 */
export const SESSION_SECURITY_POLICY = {
  title: 'Session Security Policy',
  rules: [
    'You can terminate other sessions to secure your account',
    'Your current session cannot be terminated from this interface',
    'Use the "Sign Out" button in the navigation to safely end your current session',
    'Terminated sessions will be immediately logged out',
    'Sessions automatically expire based on your security settings'
  ]
};

/**
 * Check if session termination should be allowed (additional frontend validation)
 */
export const validateSessionTermination = (sessionId: string, sessions: UserSession[]): {
  isValid: boolean;
  error?: string;
} => {
  const session = sessions.find(s => s.id === sessionId);
  
  if (!session) {
    return {
      isValid: false,
      error: 'Session not found.'
    };
  }
  
  const { canTerminate, reason } = canTerminateSession(session);
  
  if (!canTerminate) {
    return {
      isValid: false,
      error: reason
    };
  }
  
  return { isValid: true };
}; 