import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { profileApi } from '../../services/profileApi';
import { 
  UserSecuritySettings, 
  UserSession, 
  ChangePasswordRequest, 
  UpdateUserSecuritySettingsRequest 
} from '../../types/user-profile-api';
import { 
  validateSessionTermination, 
  getTerminationConfirmationMessage,
  SESSION_SECURITY_POLICY 
} from '../../utils/sessionUtils';

// Session utilities are available in sessionDebugger.ts for development if needed

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const SecuritySettings: React.FC = () => {
  const { state } = useAppContext();
  const { user } = state;

  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [securitySettings, setSecuritySettings] = useState<UserSecuritySettings | null>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isTerminatingSessions, setIsTerminatingSessions] = useState<string[]>([]);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [autoRefreshPaused, setAutoRefreshPaused] = useState(false);
  const [previousSessionIds, setPreviousSessionIds] = useState<string[]>([]);
  
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load security settings and sessions on component mount
  useEffect(() => {
    if (user?.id) {
      loadSecuritySettings();
      loadUserSessions();
    }
  }, [user?.id]);

  // Auto-refresh sessions every 30 seconds to detect terminated sessions
  useEffect(() => {
    if (!user?.id) return;

    const refreshInterval = setInterval(() => {
      // Don't auto-refresh if paused or if user is actively terminating sessions
      if (autoRefreshPaused || isTerminatingSessions.length > 0) {
        console.log('⏸️ Auto-refresh paused (user activity detected)');
        return;
      }
      
      console.log('🔄 Auto-refreshing session list...');
      loadUserSessions();
    }, 30000); // Refresh every 30 seconds

    // Cleanup interval on unmount
    return () => {
      clearInterval(refreshInterval);
    };
  }, [user?.id, autoRefreshPaused, isTerminatingSessions.length]);

  const loadSecuritySettings = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoadingSettings(true);
      const settings = await profileApi.getSecuritySettings(user.id);
      setSecuritySettings(settings);
    } catch (error) {
      console.error('Failed to load security settings:', error);
      setMessage({ type: 'error', text: 'Failed to load security settings. Please refresh the page.' });
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const loadUserSessions = async () => {
    if (!user?.id) {
      console.log('❌ No user ID available for loading sessions');
      return;
    }
    
    console.log('🔍 Loading user sessions for user ID:', user.id);
    
    try {
      setIsLoadingSessions(true);
      const userSessions = await profileApi.getUserSessions(user.id);
      console.log('📱 Sessions response:', userSessions);
      console.log('📊 Number of sessions found:', userSessions.length);
      
      // Enhanced logging for debugging terminated sessions
      userSessions.forEach((session, index) => {
        console.log(`📋 Session ${index + 1}:`, {
          id: session.id.substring(0, 8) + '...',
          userAgent: session.userAgent.substring(0, 50) + '...',
          isCurrent: session.isCurrent,
          loginTime: session.loginTime,
          lastActivity: session.lastActivity,
          ipAddress: session.ipAddress
        });
      });
      
      // Get the current session ID from localStorage
      const currentSessionId = localStorage.getItem('currentSessionId');
      console.log('💾 Current session ID from localStorage:', currentSessionId);
      
      // Check if any sessions should have been deleted
      const currentSessionIds = userSessions.map(s => s.id);
      console.log('🔍 Session comparison:', {
        previousCount: previousSessionIds.length,
        currentCount: currentSessionIds.length,
        previousIds: previousSessionIds.map(id => id.substring(0, 8) + '...'),
        currentIds: currentSessionIds.map(id => id.substring(0, 8) + '...')
      });
      
      const removedSessions = previousSessionIds.filter(id => !currentSessionIds.includes(id));
      const addedSessions = currentSessionIds.filter(id => !previousSessionIds.includes(id));
      
      if (removedSessions.length > 0) {
        console.log('🗑️ Sessions removed since last refresh:', removedSessions.map(id => id.substring(0, 8) + '...'));
      }
      if (addedSessions.length > 0) {
        console.log('➕ New sessions since last refresh:', addedSessions.map(id => id.substring(0, 8) + '...'));
      }
      if (removedSessions.length === 0 && addedSessions.length === 0 && previousSessionIds.length > 0) {
        console.log('🔄 No session changes detected - this might indicate backend deletion issue');
      }
      
      // Update previous session IDs for next comparison
      setPreviousSessionIds(currentSessionIds);
      
      // Manually mark the current session if backend isn't doing it
      const enhancedSessions = userSessions.map(session => {
        const isCurrentSession = session.id === currentSessionId || session.isCurrent;
        
        if (session.id === currentSessionId && !session.isCurrent) {
          console.log('🔧 Manually marking session as current:', session.id);
        }
        
        return {
          ...session,
          isCurrent: isCurrentSession
        };
      });
      
      console.log('✅ Enhanced sessions with current detection:', enhancedSessions);
      setSessions(enhancedSessions);
      setLastRefreshTime(new Date());
      
      if (enhancedSessions.length === 0) {
        console.log('ℹ️ No active sessions found for user. This could mean:');
        console.log('   1. Sessions have expired');
        console.log('   2. User recently changed session settings');
        console.log('   3. This is the first login after session implementation');
      }
    } catch (error) {
      console.error('❌ Failed to load user sessions:', error);
      setMessage({ type: 'error', text: 'Failed to load user sessions. Please refresh the page.' });
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSecurityInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!securitySettings) return;
    
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    if (name === 'sessionTimeout') {
      // sessionTimeout is at the root level
      setSecuritySettings(prev => prev ? {
        ...prev,
        sessionTimeout: Number(value),
      } : null);
    } else if (name === 'requirePasswordChangeEvery') {
      // requirePasswordChangeEvery is nested under securitySettings
      setSecuritySettings(prev => prev ? {
        ...prev,
        securitySettings: {
          ...prev.securitySettings,
          requirePasswordChangeEvery: Number(value),
        }
      } : null);
    } else if (name === 'allowMultipleSessions') {
      setSecuritySettings(prev => prev ? {
        ...prev,
        allowMultipleSessions: checked,
      } : null);
    } else {
      setSecuritySettings(prev => prev ? {
        ...prev,
        [name]: type === 'checkbox' ? checked : Number(value),
      } : null);
    }
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[a-zA-Z]/.test(password)) {
      errors.push('Password must contain letters');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain numbers');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain symbols');
    }
    
    return errors;
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) return;
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    const passwordErrors = validatePassword(passwordData.newPassword);
    if (passwordErrors.length > 0) {
      setMessage({ type: 'error', text: passwordErrors.join('. ') + '.' });
      return;
    }

    setIsChangingPassword(true);
    setMessage(null);

    try {
      const request: ChangePasswordRequest = {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      };
      
      await profileApi.changePassword(user.id, request);
      
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      // Reload security settings to get updated password info
      await loadSecuritySettings();
    } catch (error) {
      console.error('Error changing password:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to change password. Please try again.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id || !securitySettings) return;
    
    setIsSavingSecurity(true);
    setMessage(null);

    try {
      const updates: UpdateUserSecuritySettingsRequest = {
        sessionTimeout: securitySettings.sessionTimeout,
        allowMultipleSessions: securitySettings.allowMultipleSessions,
        requirePasswordChangeEvery: securitySettings.securitySettings.requirePasswordChangeEvery,
      };
      
      const updatedSettings = await profileApi.updateSecuritySettings(user.id, updates);
      setSecuritySettings(updatedSettings);
      
      setMessage({ type: 'success', text: 'Security settings updated successfully!' });
    } catch (error) {
      console.error('Error updating security settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update security settings. Please try again.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsSavingSecurity(false);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    if (!user?.id) return;
    
    // Validate session termination using utility function
    const validation = validateSessionTermination(sessionId, sessions);
    if (!validation.isValid) {
      setMessage({ 
        type: 'error', 
        text: validation.error || 'Cannot terminate this session.' 
      });
      return;
    }
    
    // Find the session for confirmation dialog
    const sessionToTerminate = sessions.find(s => s.id === sessionId);
    if (!sessionToTerminate) {
      setMessage({ type: 'error', text: 'Session not found.' });
      return;
    }
    
    console.log('🚫 About to terminate session:', {
      sessionId: sessionId.substring(0, 8) + '...',
      userAgent: sessionToTerminate.userAgent.substring(0, 50) + '...',
      ipAddress: sessionToTerminate.ipAddress,
      isCurrent: sessionToTerminate.isCurrent
    });
    
    // Show confirmation dialog using utility function
    const confirmed = window.confirm(getTerminationConfirmationMessage(sessionToTerminate));
    if (!confirmed) return;
    
    setIsTerminatingSessions(prev => [...prev, sessionId]);
    
    try {
      console.log('📡 Calling terminateSession API...');
      const result = await profileApi.terminateSession(user.id, sessionId);
      console.log('✅ Session termination API response:', result);
      
      // Remove from local state immediately
      setSessions(prev => {
        const newSessions = prev.filter(session => session.id !== sessionId);
        console.log('🔄 Updated local sessions state:', newSessions.length, 'sessions remaining');
        return newSessions;
      });
      
      setMessage({ type: 'success', text: 'Session terminated successfully.' });
      
      // Refresh the session list after termination to ensure consistency
      console.log('⏰ Scheduling session refresh in 1 second to verify backend deletion...');
      setTimeout(() => {
        console.log('🔍 Refreshing sessions to verify backend deletion...');
        loadUserSessions();
      }, 1000);
    } catch (error) {
      console.error('❌ Failed to terminate session:', error);
      let errorMessage = 'Failed to terminate session. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('Cannot terminate your current session') || 
            error.message.includes('CANNOT_TERMINATE_CURRENT_SESSION')) {
          errorMessage = 'Cannot terminate your current session. Please use the Sign Out button to end your current session safely.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsTerminatingSessions(prev => prev.filter(id => id !== sessionId));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };



  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-[var(--color-text-secondary)]">Please wait while we load your user information...</p>
        <p className="text-sm text-[var(--color-text-tertiary)] mt-2">If this persists, please refresh the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Security Settings</h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Manage your account security and authentication</p>
      </div>

      {/* Messages */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-[var(--color-success-50)] text-[var(--color-success-800)] border border-[var(--color-success-200)]' 
            : 'bg-[var(--color-error-50)] text-[var(--color-error-800)] border border-[var(--color-error-200)]'
        }`}>
          {message.text}
        </div>
      )}

      {/* Password Change Section */}
      <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
        <h3 className="text-md font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Change Password</h3>
        
        {securitySettings && (
          <div className="mb-4 p-3 bg-[var(--color-primary-50)] border border-[var(--color-primary-200)] rounded-lg">
            <p className="text-sm text-[var(--color-primary-800)]">
              <strong>Last changed:</strong> {formatDate(securitySettings.passwordLastChanged)}
              {securitySettings.passwordExpiresAt && (
                <>
                  <br />
                  <strong>Expires:</strong> {formatDate(securitySettings.passwordExpiresAt)}
                </>
              )}
            </p>
          </div>
        )}
        
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Current Password
            </label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordInputChange}
              required
              className="w-full px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-offset-2"
              style={{ 
                backgroundColor: 'var(--background-color)', 
                color: 'var(--text-primary)', 
                border: '1px solid var(--border-color)',
                '--tw-ring-color': 'var(--color-primary-500)'
              } as React.CSSProperties}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordInputChange}
                required
                minLength={8}
                className="w-full px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-offset-2"
                style={{ 
                  backgroundColor: 'var(--background-color)', 
                  color: 'var(--text-primary)', 
                  border: '1px solid var(--border-color)',
                  '--tw-ring-color': 'var(--color-primary-500)'
                } as React.CSSProperties}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordInputChange}
                required
                minLength={8}
                className="w-full px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-offset-2"
                style={{ 
                  backgroundColor: 'var(--background-color)', 
                  color: 'var(--text-primary)', 
                  border: '1px solid var(--border-color)',
                  '--tw-ring-color': 'var(--color-primary-500)'
                } as React.CSSProperties}
              />
            </div>
          </div>

          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Password must be at least 8 characters long and contain a mix of letters, numbers, and symbols.
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50"
              style={{
                backgroundColor: 'var(--color-primary-600)',
                color: 'var(--color-text-on-primary)'
              }}
              onMouseEnter={(e) => {
                if (!isChangingPassword) {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary-700)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isChangingPassword) {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
                }
              }}
            >
              {isChangingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Security Preferences */}
      <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
        <h3 className="text-md font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Security Preferences</h3>
        
        {isLoadingSettings ? (
          <div className="text-center py-8">
            <p className="text-[var(--color-text-secondary)]">Loading security settings...</p>
          </div>
        ) : securitySettings ? (
          <form onSubmit={handleSecuritySubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="sessionTimeout" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Session Timeout (minutes)
                </label>
                <select
                  id="sessionTimeout"
                  name="sessionTimeout"
                  value={securitySettings.sessionTimeout}
                  onChange={handleSecurityInputChange}
                  className="w-full px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-offset-2"
                  style={{ 
                    backgroundColor: 'var(--background-color)', 
                    color: 'var(--text-primary)', 
                    border: '1px solid var(--border-color)',
                    '--tw-ring-color': 'var(--color-primary-500)'
                  } as React.CSSProperties}
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                  <option value={240}>4 hours</option>
                  <option value={480}>8 hours</option>
                  <option value={720}>12 hours</option>
                  <option value={1440}>24 hours</option>
                  <option value={43200}>30 days</option>
                </select>
              </div>

              <div>
                <label htmlFor="requirePasswordChangeEvery" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Password Change Frequency
                </label>
                <select
                  id="requirePasswordChangeEvery"
                  name="requirePasswordChangeEvery"
                  value={securitySettings.securitySettings.requirePasswordChangeEvery}
                  onChange={handleSecurityInputChange}
                  className="w-full px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-offset-2"
                  style={{ 
                    backgroundColor: 'var(--background-color)', 
                    color: 'var(--text-primary)', 
                    border: '1px solid var(--border-color)',
                    '--tw-ring-color': 'var(--color-primary-500)'
                  } as React.CSSProperties}
                >
                  <option value={0}>Never</option>
                  <option value={30}>Every 30 days</option>
                  <option value={60}>Every 60 days</option>
                  <option value={90}>Every 90 days</option>
                  <option value={180}>Every 6 months</option>
                  <option value={365}>Every year</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allowMultipleSessions"
                  name="allowMultipleSessions"
                  checked={securitySettings.allowMultipleSessions}
                  onChange={handleSecurityInputChange}
                  className="h-4 w-4 text-[var(--color-primary)] border-[var(--color-border)] rounded focus:ring-[var(--color-primary-500)]"
                />
                <label htmlFor="allowMultipleSessions" className="ml-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Allow multiple simultaneous sessions
                </label>
              </div>
            </div>

            {securitySettings.passwordChangeRequired && (
              <div className="p-3 bg-[var(--color-warning-50)] border border-[var(--color-warning-200)] rounded-lg">
                <p className="text-sm text-[var(--color-warning-800)]">
                  <strong>Password change required:</strong> Your password needs to be updated according to your security policy.
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-[var(--color-border)]">
              <button
                type="submit"
                disabled={isSavingSecurity}
                className="px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--color-primary-600)',
                  color: 'var(--color-text-on-primary)'
                }}
                onMouseEnter={(e) => {
                  if (!isSavingSecurity) {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary-700)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSavingSecurity) {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
                  }
                }}
              >
                {isSavingSecurity ? 'Saving...' : 'Save Security Settings'}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-8">
            <p className="text-[var(--color-error)]">Failed to load security settings. Please refresh the page.</p>
          </div>
        )}
      </div>

      {/* Active Sessions */}
      <div className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-md font-medium text-[var(--color-text-primary)]">Active Sessions</h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              {autoRefreshPaused ? (
                <span className="text-[var(--color-warning)] font-medium">Auto-refresh paused</span>
              ) : (
                'Auto-refreshes every 30 seconds to detect terminated sessions'
              )}
              {lastRefreshTime && (
                <span className="ml-2">
                  • Last updated: {lastRefreshTime.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setAutoRefreshPaused(!autoRefreshPaused)}
              className={`px-3 py-1 text-sm rounded transition-colors duration-200 ${
                autoRefreshPaused 
                  ? 'bg-[var(--color-success)] text-[var(--color-text-on-success)] hover:bg-[var(--color-success-hover)]' 
                  : 'bg-[var(--color-secondary)] text-[var(--color-text-on-secondary)] hover:bg-[var(--color-secondary-hover)]'
              }`}
            >
              {autoRefreshPaused ? 'Resume Auto-Refresh' : 'Pause Auto-Refresh'}
            </button>
            <button
              onClick={loadUserSessions}
              disabled={isLoadingSessions}
              className="px-3 py-1 bg-[var(--color-primary)] text-[var(--color-text-on-primary)] text-sm rounded hover:bg-[var(--color-primary-hover)] transition-colors duration-200 disabled:opacity-50"
            >
              {isLoadingSessions ? 'Refreshing...' : 'Refresh Now'}
            </button>
          </div>
        </div>
        
        {/* Session Management Info */}
        <div className="mb-4 p-3 bg-[var(--color-primary-50)] border border-[var(--color-primary-200)] rounded-lg">
          <div className="flex items-start space-x-2">
            <svg className="h-5 w-5 text-[var(--color-primary)] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div className="text-sm text-[var(--color-primary)]">
              <p className="font-medium mb-1">{SESSION_SECURITY_POLICY.title}</p>
              <ul className="text-xs space-y-1">
                {SESSION_SECURITY_POLICY.rules.map((rule, index) => (
                  <li key={index}>• {rule}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        {/* Session creation info */}
        {user && sessions.length === 0 && !isLoadingSessions && (
          <div className="mb-4 p-3 bg-[var(--color-primary-50)] border border-[var(--color-primary-200)] rounded-lg">
            <p className="text-sm text-[var(--color-primary)]">
              <strong>No active sessions found.</strong><br />
              Sessions are automatically created when you log in. If you just logged in and don't see any sessions, please refresh this page or try logging out and back in.
            </p>
          </div>
        )}
        
        {isLoadingSessions ? (
          <div className="text-center py-8">
            <p className="text-[var(--color-text-secondary)]">Loading sessions...</p>
          </div>
        ) : sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div key={session.id} className={`flex items-center justify-between p-3 rounded-lg ${
                session.isCurrent ? 'bg-[var(--color-success-50)] border border-[var(--color-success-200)]' : 'bg-[var(--color-surface)]'
              }`}>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <div className="font-medium text-sm text-[var(--color-text-primary)]">
                      {session.isCurrent ? 'Current Session' : 'Active Session'}
                    </div>
                    {session.isCurrent && (
                      <div className="px-2 py-1 bg-[var(--color-success-100)] text-[var(--color-success-800)] text-xs rounded-full">
                        Current
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                    <span>{session.userAgent}</span>
                    {session.location && (
                      <span> • {session.location.city}, {session.location.country}</span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--color-text-tertiary)]">
                    IP: {session.ipAddress} • 
                    Logged in: {formatDate(session.loginTime)} • 
                    Last active: {formatTimeAgo(session.lastActivity)}
                  </div>
                </div>
                
                {session.isCurrent ? (
                  <div className="flex items-center space-x-2">
                    <div className="px-3 py-1 bg-[var(--color-secondary-100)] text-[var(--color-secondary-800)] text-xs rounded cursor-not-allowed">
                      Cannot Terminate
                    </div>
                    <div className="group relative">
                      <svg className="h-4 w-4 text-[var(--color-text-tertiary)] cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute bottom-full right-0 mb-2 w-64 p-2 bg-[var(--color-background)] text-[var(--color-text-primary)] text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                        You cannot terminate your current session from this interface. Use the "Sign Out" button in the navigation to safely end your current session.
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleTerminateSession(session.id)}
                    disabled={isTerminatingSessions.includes(session.id)}
                    className="px-3 py-1 bg-[var(--color-error)] text-[var(--color-text-on-error)] text-xs rounded hover:bg-[var(--color-error-hover)] transition-colors duration-200 disabled:opacity-50"
                  >
                    {isTerminatingSessions.includes(session.id) ? 'Terminating...' : 'Terminate'}
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-[var(--color-text-secondary)] text-center py-4">
            No active sessions found
          </div>
        )}
      </div>
    </div>
  );
};

export default SecuritySettings; 