import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface SecurityFormData {
  twoFactorEnabled: boolean;
  sessionTimeout: number; // in minutes
  allowMultipleSessions: boolean;
  requirePasswordChangeEvery: number; // in days, 0 = never
}

const SecuritySettings: React.FC = () => {
  const { state } = useAppContext();
  const { user } = state;

  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [securityData, setSecurityData] = useState<SecurityFormData>({
    twoFactorEnabled: false,
    sessionTimeout: 480, // 8 hours
    allowMultipleSessions: true,
    requirePasswordChangeEvery: 90, // 90 days
  });

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSecurityInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setSecurityData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : Number(value),
    }));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long.' });
      return;
    }

    setIsChangingPassword(true);
    setMessage(null);

    try {
      // TODO: Make API call to change password
      // await apiClient.changePassword({
      //   currentPassword: passwordData.currentPassword,
      //   newPassword: passwordData.newPassword,
      // });

      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage({ type: 'error', text: 'Failed to change password. Please check your current password and try again.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSavingSecurity(true);
    setMessage(null);

    try {
      // TODO: Make API call to update security settings
      // await apiClient.updateSecuritySettings(securityData);

      setMessage({ type: 'success', text: 'Security settings updated successfully!' });
    } catch (error) {
      console.error('Error updating security settings:', error);
      setMessage({ type: 'error', text: 'Failed to update security settings. Please try again.' });
    } finally {
      setIsSavingSecurity(false);
    }
  };

  const handleEnableTwoFactor = async () => {
    try {
      // TODO: Make API call to initiate 2FA setup
      // const response = await apiClient.initiateTwoFactorSetup();
      // Show QR code for user to scan
      setShowQRCode(true);
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      setMessage({ type: 'error', text: 'Failed to enable two-factor authentication. Please try again.' });
    }
  };

  const handleDisableTwoFactor = async () => {
    try {
      // TODO: Make API call to disable 2FA
      // await apiClient.disableTwoFactor();
      setSecurityData(prev => ({ ...prev, twoFactorEnabled: false }));
      setMessage({ type: 'success', text: 'Two-factor authentication disabled.' });
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      setMessage({ type: 'error', text: 'Failed to disable two-factor authentication. Please try again.' });
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-neutral-500">Loading security settings...</p>
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

      {/* Two-Factor Authentication */}
      <div className="bg-neutral-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-md font-medium text-neutral-900">Two-Factor Authentication</h3>
            <p className="text-sm text-neutral-600">Add an extra layer of security to your account</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            securityData.twoFactorEnabled 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {securityData.twoFactorEnabled ? 'Enabled' : 'Disabled'}
          </div>
        </div>

        {!securityData.twoFactorEnabled ? (
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Enable two-factor authentication using an authenticator app like Google Authenticator or Authy.
            </p>
            <button
              onClick={handleEnableTwoFactor}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              Enable Two-Factor Authentication
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Two-factor authentication is currently enabled for your account.
            </p>
            <button
              onClick={handleDisableTwoFactor}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
            >
              Disable Two-Factor Authentication
            </button>
          </div>
        )}

        {showQRCode && (
          <div className="mt-4 p-4 border border-neutral-200 rounded-lg bg-white">
            <h4 className="font-medium text-neutral-900 mb-2">Scan QR Code</h4>
            <div className="bg-neutral-100 w-48 h-48 flex items-center justify-center rounded-lg">
              <span className="text-neutral-500">QR Code Placeholder</span>
            </div>
            <p className="text-xs text-neutral-600 mt-2">
              Scan this QR code with your authenticator app, then enter the verification code below.
            </p>
            <input
              type="text"
              placeholder="Enter verification code"
              className="w-full mt-2 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
              Verify and Enable
            </button>
          </div>
        )}
      </div>

      {/* Security Preferences */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h3 className="text-md font-medium text-neutral-900 mb-4">Security Preferences</h3>
        
        <form onSubmit={handleSecuritySubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sessionTimeout" className="block text-sm font-medium text-neutral-700 mb-1">
                Session Timeout (minutes)
              </label>
              <select
                id="sessionTimeout"
                name="sessionTimeout"
                value={securityData.sessionTimeout}
                onChange={handleSecurityInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
                <option value={240}>4 hours</option>
                <option value={480}>8 hours</option>
                <option value={720}>12 hours</option>
                <option value={1440}>24 hours</option>
              </select>
            </div>

            <div>
              <label htmlFor="requirePasswordChangeEvery" className="block text-sm font-medium text-neutral-700 mb-1">
                Password Change Frequency
              </label>
              <select
                id="requirePasswordChangeEvery"
                name="requirePasswordChangeEvery"
                value={securityData.requirePasswordChangeEvery}
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
                checked={securityData.allowMultipleSessions}
                onChange={handleSecurityInputChange}
                className="h-4 w-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="allowMultipleSessions" className="ml-2 text-sm text-neutral-700">
                Allow multiple simultaneous sessions
              </label>
            </div>
          </div>

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
      </div>

      {/* Active Sessions */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h3 className="text-md font-medium text-neutral-900 mb-4">Active Sessions</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
            <div>
              <div className="font-medium text-sm text-neutral-900">Current Session</div>
              <div className="text-xs text-neutral-600">MacOS • Chrome • 192.168.1.100</div>
              <div className="text-xs text-neutral-500">Last active: Just now</div>
            </div>
            <div className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              Current
            </div>
          </div>
          
          {/* Additional sessions would be listed here */}
          <div className="text-sm text-neutral-500 text-center py-4">
            No other active sessions
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings; 