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
  
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load security settings and sessions on component mount
  useEffect(() => {
    if (user?.id) {
      loadSecuritySettings();
      loadUserSessions();
    }
  }, [user?.id]);

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
      setSessions(userSessions);
      
      if (userSessions.length === 0) {
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
    
    // Show confirmation dialog using utility function
    const confirmed = window.confirm(getTerminationConfirmationMessage(sessionToTerminate));
    if (!confirmed) return;
    
    setIsTerminatingSessions(prev => [...prev, sessionId]);
    
    try {
      await profileApi.terminateSession(user.id, sessionId);
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      setMessage({ type: 'success', text: 'Session terminated successfully.' });
    } catch (error) {
      console.error('Error terminating session:', error);
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
        <p className="text-neutral-500">Please wait while we load your user information...</p>
        <p className="text-sm text-neutral-400 mt-2">If this persists, please refresh the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">Security Settings</h2>
        <p className="text-sm text-neutral-600">Manage your account security and authentication</p>
      </div>

      {/* Messages */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Password Change Section */}
      <div className="bg-neutral-50 rounded-lg p-6">
        <h3 className="text-md font-medium text-neutral-900 mb-4">Change Password</h3>
        
        {securitySettings && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
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
            <label htmlFor="currentPassword" className="block text-sm font-medium text-neutral-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordInputChange}
              required
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-neutral-700 mb-1">
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
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-1">
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
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="text-xs text-neutral-500">
            Password must be at least 8 characters long and contain a mix of letters, numbers, and symbols.
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
            >
              {isChangingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Security Preferences */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h3 className="text-md font-medium text-neutral-900 mb-4">Security Preferences</h3>
        
        {isLoadingSettings ? (
          <div className="text-center py-8">
            <p className="text-neutral-500">Loading security settings...</p>
          </div>
        ) : securitySettings ? (
          <form onSubmit={handleSecuritySubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="sessionTimeout" className="block text-sm font-medium text-neutral-700 mb-1">
                  Session Timeout (minutes)
                </label>
                <select
                  id="sessionTimeout"
                  name="sessionTimeout"
                  value={securitySettings.sessionTimeout}
                  onChange={handleSecurityInputChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                <label htmlFor="requirePasswordChangeEvery" className="block text-sm font-medium text-neutral-700 mb-1">
                  Password Change Frequency
                </label>
                <select
                  id="requirePasswordChangeEvery"
                  name="requirePasswordChangeEvery"
                  value={securitySettings.securitySettings.requirePasswordChangeEvery}
                  onChange={handleSecurityInputChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                  className="h-4 w-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="allowMultipleSessions" className="ml-2 text-sm text-neutral-700">
                  Allow multiple simultaneous sessions
                </label>
              </div>
            </div>

            {securitySettings.passwordChangeRequired && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Password change required:</strong> Your password needs to be updated according to your security policy.
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-neutral-200">
              <button
                type="submit"
                disabled={isSavingSecurity}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
              >
                {isSavingSecurity ? 'Saving...' : 'Save Security Settings'}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-8">
            <p className="text-red-500">Failed to load security settings. Please refresh the page.</p>
          </div>
        )}
      </div>

      {/* Active Sessions */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md font-medium text-neutral-900">Active Sessions</h3>
          <button
            onClick={loadUserSessions}
            disabled={isLoadingSessions}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
          >
            {isLoadingSessions ? 'Refreshing...' : 'Refresh Sessions'}
          </button>
        </div>
        
        {/* Session Management Info */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <svg className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div className="text-sm text-blue-800">
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
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>No active sessions found.</strong><br />
              Sessions are automatically created when you log in. If you just logged in and don't see any sessions, please refresh this page or try logging out and back in.
            </p>
          </div>
        )}
        
        {isLoadingSessions ? (
          <div className="text-center py-8">
            <p className="text-neutral-500">Loading sessions...</p>
          </div>
        ) : sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div key={session.id} className={`flex items-center justify-between p-3 rounded-lg ${
                session.isCurrent ? 'bg-green-50 border border-green-200' : 'bg-neutral-50'
              }`}>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <div className="font-medium text-sm text-neutral-900">
                      {session.isCurrent ? 'Current Session' : 'Active Session'}
                    </div>
                    {session.isCurrent && (
                      <div className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Current
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-neutral-600 mt-1">
                    <span>{session.userAgent}</span>
                    {session.location && (
                      <span> • {session.location.city}, {session.location.country}</span>
                    )}
                  </div>
                  <div className="text-xs text-neutral-500">
                    IP: {session.ipAddress} • 
                    Logged in: {formatDate(session.loginTime)} • 
                    Last active: {formatTimeAgo(session.lastActivity)}
                  </div>
                </div>
                
                {session.isCurrent ? (
                  <div className="flex items-center space-x-2">
                    <div className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded cursor-not-allowed">
                      Cannot Terminate
                    </div>
                    <div className="group relative">
                      <svg className="h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute bottom-full right-0 mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                        You cannot terminate your current session from this interface. Use the "Sign Out" button in the navigation to safely end your current session.
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleTerminateSession(session.id)}
                    disabled={isTerminatingSessions.includes(session.id)}
                    className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors duration-200 disabled:opacity-50"
                  >
                    {isTerminatingSessions.includes(session.id) ? 'Terminating...' : 'Terminate'}
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-neutral-500 text-center py-4">
            No active sessions found
          </div>
        )}
      </div>
    </div>
  );
};

export default SecuritySettings; 