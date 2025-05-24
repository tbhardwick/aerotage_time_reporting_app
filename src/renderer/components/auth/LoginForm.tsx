import React, { useState } from 'react';
import { signIn, confirmSignIn, getCurrentUser } from 'aws-amplify/auth';
import { useAppContext } from '../../context/AppContext';
import { apiClient } from '../../services/api-client';

interface LoginFormProps {
  onLoginSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const { dispatch } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requireNewPassword, setRequireNewPassword] = useState(false);
  const [challengeName, setChallengeName] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn({
        username: email,
        password: password,
      });

      if (result.isSignedIn) {
        await handleSuccessfulLogin();
      } else if (result.nextStep) {
        // Handle different challenge types
        switch (result.nextStep.signInStep) {
          case 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED':
            setRequireNewPassword(true);
            setChallengeName('NEW_PASSWORD_REQUIRED');
            break;
          case 'CONFIRM_SIGN_IN_WITH_SMS_CODE':
            setChallengeName('SMS_MFA');
            break;
          case 'CONFIRM_SIGN_IN_WITH_TOTP_CODE':
            setChallengeName('SOFTWARE_TOKEN_MFA');
            break;
          default:
            setError('Authentication challenge not supported');
            break;
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await confirmSignIn({
        challengeResponse: newPassword,
      });

      if (result.isSignedIn) {
        await handleSuccessfulLogin();
      } else {
        setError('Failed to set new password');
      }
    } catch (err: any) {
      console.error('New password error:', err);
      setError(err.message || 'Failed to set new password');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessfulLogin = async () => {
    try {
      // Try to get user data from API
      const userData = await apiClient.getCurrentUser();
      
      // Update context with user data
      dispatch({ type: 'SET_USER', payload: userData });
      
      onLoginSuccess?.();
    } catch (err: any) {
      console.error('Failed to load user data:', err);
      
      // If it's an identity pool error, show a specific message but continue
      if (err.message?.includes('AWS Identity Pool configuration error')) {
        setError('Warning: Some features may be limited due to configuration issues. Contact your administrator.');
      }
      
      // Create a minimal user object from Cognito data for now
      try {
        const cognitoUser = await getCurrentUser();
        const minimalUser = {
          id: cognitoUser.userId || 'unknown',
          email: cognitoUser.signInDetails?.loginId || 'unknown@example.com',
          name: cognitoUser.signInDetails?.loginId?.split('@')[0] || 'User',
          role: 'employee' as const,
          isActive: true,
          startDate: new Date().toISOString(),
          permissions: { features: [], projects: [] },
          preferences: { theme: 'light' as const, notifications: true, timezone: 'UTC' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'system'
        };
        
        dispatch({ type: 'SET_USER', payload: minimalUser });
      } catch (cognitoErr) {
        console.error('Failed to get Cognito user data:', cognitoErr);
      }
      
      // Continue with login even if data loading fails
      onLoginSuccess?.();
    }
  };

  if (requireNewPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Set New Password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Please set a new password for your account
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleNewPassword}>
            <div className="space-y-4">
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  id="new-password"
                  name="newPassword"
                  type="password"
                  required
                  autoFocus
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Setting Password...' : 'Set New Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Aerotage Time
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Track your time and manage your projects
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}; 