import React, { useState, useEffect, useRef } from 'react';
import { signIn, confirmSignIn, getCurrentUser, resetPassword, confirmResetPassword, resendSignUpCode, AuthError, fetchAuthSession } from 'aws-amplify/auth';
import { useAppContext } from '../../context/AppContext';
import { apiClient } from '../../services/api-client';
import { profileApi } from '../../services/profileApi';
import { sessionBootstrap } from '../../services/sessionBootstrap';
import { handlePasswordResetErrors, validatePasswordPolicy, formatPasswordErrors } from '../../utils/passwordResetErrors';
import { useDataLoader } from '../../hooks/useDataLoader';
import { decodeJWTPayload } from '../../utils/jwt';
import { useNavigate, useLocation } from 'react-router-dom';

interface LoginFormProps {
  onLoginSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const { dispatch } = useAppContext();
  const { loadAllData } = useDataLoader();
  
  // Navigation hooks for redirect after login
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberUsername, setRememberUsername] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requireNewPassword, setRequireNewPassword] = useState(false);
  const [challengeName, setChallengeName] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [showResetCode, setShowResetCode] = useState(false);

  // Refs for focus management
  const newPasswordRef = useRef<HTMLInputElement>(null);
  const resetEmailRef = useRef<HTMLInputElement>(null);
  const resetCodeRef = useRef<HTMLInputElement>(null);

  // Load remembered username on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedUsername');
    const shouldRemember = localStorage.getItem('rememberUsername') !== 'false';
    
    console.log('🔍 Loading remembered username:', {
      rememberedEmail,
      rememberPreference: localStorage.getItem('rememberUsername'),
      shouldRemember
    });
    
    if (rememberedEmail && shouldRemember) {
      setEmail(rememberedEmail);
      setRememberUsername(true);
      console.log('✅ Email pre-filled:', rememberedEmail);
    } else {
      setRememberUsername(shouldRemember);
      console.log('📝 No email to pre-fill, checkbox set to:', shouldRemember);
    }
  }, []);

  // Save/clear remembered username when checkbox changes
  useEffect(() => {
    localStorage.setItem('rememberUsername', rememberUsername.toString());
    
    if (!rememberUsername) {
      localStorage.removeItem('rememberedUsername');
    }
    // Note: Don't save email here - only save on successful login
  }, [rememberUsername]);

  // Focus management effects
  useEffect(() => {
    if (requireNewPassword && newPasswordRef.current) {
      // Small delay to ensure the form is rendered before focusing
      const timer = setTimeout(() => {
        newPasswordRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [requireNewPassword]);

  useEffect(() => {
    if (showForgotPassword && !showResetCode && resetEmailRef.current) {
      const timer = setTimeout(() => {
        resetEmailRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showForgotPassword, showResetCode]);

  useEffect(() => {
    if (showResetCode && resetCodeRef.current) {
      const timer = setTimeout(() => {
        resetCodeRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showResetCode]);

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
    console.log('🚀 handleSuccessfulLogin called');
    try {
      // Save username if remember is enabled
      if (rememberUsername && email) {
        localStorage.setItem('rememberedUsername', email);
        console.log('💾 Username saved for next login:', email);
        console.log('📋 Current localStorage state:', {
          rememberedUsername: localStorage.getItem('rememberedUsername'),
          rememberUsername: localStorage.getItem('rememberUsername')
        });
      } else {
        console.log('⏭️ Username not saved - rememberUsername:', rememberUsername, 'email:', email);
      }

      // Step 1: Get user information from Cognito and JWT token
      console.log('👤 Getting current user information...');
      const user = await getCurrentUser();
      
      // Get user ID from JWT token (consistent with backend expectations)
      const session = await fetchAuthSession({ forceRefresh: false });
      const token = session.tokens?.idToken?.toString();
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      const tokenPayload = decodeJWTPayload(token);
      if (!tokenPayload || !tokenPayload.sub) {
        throw new Error('Invalid token payload');
      }
      
      const userId = tokenPayload.sub;
      console.log('✅ User ID obtained:', userId);

      // Step 2: Create session record for Electron app
      console.log('🆕 Creating session record for Electron app...');
      try {
        const sessionData = await profileApi.createSession(userId, {
          userAgent: navigator.userAgent, // This will show as Electron app
          loginTime: new Date().toISOString()
        });
        
        console.log('✅ Electron session created successfully:', sessionData.id);
        
        // Store session ID for current session tracking
        localStorage.setItem('currentSessionId', sessionData.id);
        localStorage.setItem('loginTime', sessionData.loginTime);
        
      } catch (sessionError) {
        console.log('⚠️ Session creation failed, but continuing with login:', sessionError);
        
        // Don't block login if session creation fails
        // This allows login to work even if backend doesn't support multiple sessions yet
        if (sessionError instanceof Error) {
          if (sessionError.message.includes('403') || sessionError.message.includes('Forbidden')) {
            console.log('💡 Backend may not support multiple sessions yet');
            console.log('💡 User can still use the app, session management will be limited');
          }
        }
      }

      // Step 3: Load application data
      console.log('📊 Loading application data...');
      
      // Step 4: Update app context with user information
      console.log('🔄 Updating app context...');
      // Note: User object will be created when profile data is loaded
      
      // Step 5: Load initial data using the data loader
      console.log('📥 Loading initial application data...');
      await loadAllData();

      console.log('🎉 Login completed successfully!');
      
      // Always navigate to dashboard after successful login for better UX
      // This prevents users from being taken back to routes that might have authorization issues
      console.log('🏠 [LoginForm] Redirecting to dashboard after successful login');
      console.log('🔍 [LoginForm] Previous location was:', location.pathname);
      navigate('/', { replace: true });
      
      // Call the onLoginSuccess callback to trigger auth status check
      if (onLoginSuccess) {
        onLoginSuccess();
      }
      
    } catch (error) {
      console.error('❌ Login process failed:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('Authentication')) {
          errorMessage = 'Authentication failed. Please check your credentials and try again.';
        } else if (error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await resetPassword({ username: resetEmail });
      setShowResetCode(true);
      setError('');
      // Show success message even for non-existent emails (security)
      console.log('✅ Password reset request sent for:', resetEmail);
    } catch (err: any) {
      console.error('Password reset error:', err);
      const errorMessage = handlePasswordResetErrors(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side password validation
    const passwordValidation = validatePasswordPolicy(newPassword);
    if (!passwordValidation.isValid) {
      setError(formatPasswordErrors(passwordValidation.errors));
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await confirmResetPassword({
        username: resetEmail,
        confirmationCode: resetCode,
        newPassword: newPassword,
      });
      
      // Reset all states and go back to login
      setShowForgotPassword(false);
      setShowResetCode(false);
      setResetEmail('');
      setResetCode('');
      setNewPassword('');
      setConfirmPassword('');
      setError('Password reset successful! Please sign in with your new password.');
      console.log('✅ Password reset completed successfully');
    } catch (err: any) {
      console.error('Password reset confirmation error:', err);
      const errorMessage = handlePasswordResetErrors(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (requireNewPassword) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" 
        style={{ 
          WebkitAppRegion: 'drag',
          backgroundColor: 'var(--color-secondary-50)'
        } as any}
      >
        <div className="max-w-md w-full space-y-8" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
              Set New Password
            </h2>
            <p className="mt-2 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
              Please set a new password for your account
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleNewPassword}>
            <div className="space-y-4">
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  New Password
                </label>
                <input
                  ref={newPasswordRef}
                  id="new-password"
                  name="newPassword"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (error) setError(''); // Clear error when user starts typing
                  }}
                  className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--surface-color)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError(''); // Clear error when user starts typing
                  }}
                  className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--surface-color)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            {error && (
              <div 
                className="rounded-md p-4"
                style={{
                  backgroundColor: 'var(--color-error-50)',
                  border: '1px solid var(--color-error-200)'
                }}
              >
                <div className="text-sm" style={{ color: 'var(--color-error-700)' }}>{error}</div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                style={{
                  color: 'var(--color-text-on-primary)',
                  backgroundColor: 'var(--color-primary-600)'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary-700)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
                  }
                }}
              >
                {loading ? 'Setting Password...' : 'Set New Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Forgot Password Form
  if (showForgotPassword && !showResetCode) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" 
        style={{ 
          WebkitAppRegion: 'drag',
          backgroundColor: 'var(--color-secondary-50)'
        } as any}
      >
        <div className="max-w-md w-full space-y-8" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
              Reset Your Password
            </h2>
            <p className="mt-2 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
              Enter your email address and we'll send you a 6-digit reset code
            </p>
            <div 
              className="mt-4 p-4 rounded-md"
              style={{
                backgroundColor: 'var(--color-primary-50)',
                border: '1px solid var(--color-primary-200)'
              }}
            >
              <p className="text-sm" style={{ color: 'var(--color-primary-800)' }}>
                <strong>Note:</strong> Check your spam folder if you don't receive the email within 5 minutes.
                The reset code expires in 15 minutes.
              </p>
            </div>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleForgotPassword}>
            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Email address
              </label>
              <input
                ref={resetEmailRef}
                id="reset-email"
                name="resetEmail"
                type="email"
                autoComplete="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--surface-color)',
                  color: 'var(--text-primary)'
                }}
                placeholder="Enter your email"
              />
            </div>

            {error && (
              <div 
                className="rounded-md p-4"
                style={{
                  backgroundColor: 'var(--color-error-50)',
                  border: '1px solid var(--color-error-200)'
                }}
              >
                <div className="text-sm" style={{ color: 'var(--color-error-700)' }}>{error}</div>
              </div>
            )}

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                style={{
                  color: 'var(--color-text-on-primary)',
                  backgroundColor: 'var(--color-primary-600)'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary-700)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
                  }
                }}
              >
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setError('');
                  setResetEmail('');
                }}
                className="group relative w-full flex justify-center py-2 px-4 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
                style={{
                  border: '1px solid var(--border-color)',
                  color: 'var(--button-secondary-text)',
                  backgroundColor: 'var(--button-secondary-bg)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--button-secondary-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--button-secondary-bg)';
                }}
              >
                Back to Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Reset Password Confirmation Form
  if (showResetCode) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" 
        style={{ 
          WebkitAppRegion: 'drag',
          backgroundColor: 'var(--color-secondary-50)'
        } as any}
      >
        <div className="max-w-md w-full space-y-8" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
              Enter Reset Code
            </h2>
            <p className="mt-2 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
              Check your email for a 6-digit code and enter your new password
            </p>
            <div 
              className="mt-4 p-4 rounded-md"
              style={{
                backgroundColor: 'var(--color-success-50)',
                border: '1px solid var(--color-success-200)'
              }}
            >
              <p className="text-sm" style={{ color: 'var(--color-success-800)' }}>
                <strong>Reset code sent to:</strong> {resetEmail}
              </p>
            </div>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
            <div className="space-y-4">
              <div>
                <label htmlFor="reset-code" className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Reset Code
                </label>
                <input
                  ref={resetCodeRef}
                  id="reset-code"
                  name="resetCode"
                  type="text"
                  required
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 text-center text-lg font-mono"
                  style={{
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--surface-color)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="000000"
                  maxLength={6}
                />
                <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Enter the 6-digit code from your email
                </p>
              </div>
              
              <div 
                className="p-4 rounded-md"
                style={{
                  backgroundColor: 'var(--color-secondary-50)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Password Requirements:</h4>
                <ul className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
                  <li>• At least 8 characters long</li>
                  <li>• Contains uppercase letter (A-Z)</li>
                  <li>• Contains lowercase letter (a-z)</li>
                  <li>• Contains number (0-9)</li>
                </ul>
              </div>
              
              <div>
                <label htmlFor="new-password-reset" className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  New Password
                </label>
                <input
                  id="new-password-reset"
                  name="newPassword"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--surface-color)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label htmlFor="confirm-password-reset" className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Confirm Password
                </label>
                <input
                  id="confirm-password-reset"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--surface-color)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            {error && (
              <div 
                className="rounded-md p-4"
                style={{
                  backgroundColor: 'var(--color-error-50)',
                  border: '1px solid var(--color-error-200)'
                }}
              >
                <div className="text-sm whitespace-pre-line" style={{ color: 'var(--color-error-700)' }}>{error}</div>
              </div>
            )}

            {error && error.includes('Password reset successful') && (
              <div 
                className="rounded-md p-4"
                style={{
                  backgroundColor: 'var(--color-success-50)',
                  border: '1px solid var(--color-success-200)'
                }}
              >
                <div className="text-sm" style={{ color: 'var(--color-success-700)' }}>{error}</div>
              </div>
            )}

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                style={{
                  color: 'var(--color-text-on-primary)',
                  backgroundColor: 'var(--color-primary-600)'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary-700)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
                  }
                }}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetCode(false);
                  setShowForgotPassword(true);
                  setResetCode('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setError('');
                }}
                className="group relative w-full flex justify-center py-2 px-4 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
                style={{
                  border: '1px solid var(--border-color)',
                  color: 'var(--button-secondary-text)',
                  backgroundColor: 'var(--button-secondary-bg)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--button-secondary-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--button-secondary-bg)';
                }}
              >
                Request New Code
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetCode(false);
                  setShowForgotPassword(false);
                  setResetEmail('');
                  setResetCode('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setError('');
                }}
                className="group relative w-full flex justify-center py-2 px-4 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
                style={{
                  border: '1px solid var(--border-color)',
                  color: 'var(--button-secondary-text)',
                  backgroundColor: 'var(--button-secondary-bg)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--button-secondary-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--button-secondary-bg)';
                }}
              >
                Back to Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" 
      style={{ 
        WebkitAppRegion: 'drag',
        backgroundColor: 'var(--color-secondary-50)'
      } as any}
    >
      <div className="max-w-md w-full space-y-8" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            Sign in to Aerotage Time
          </h2>
          <p className="mt-2 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Track your time and manage your projects
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
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
                className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--surface-color)',
                  color: 'var(--text-primary)'
                }}
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
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
                className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--surface-color)',
                  color: 'var(--text-primary)'
                }}
                placeholder="Enter your password"
              />
            </div>
            
            {/* Remember Username Checkbox */}
            <div className="flex items-center">
              <input
                id="remember-username"
                name="remember-username"
                type="checkbox"
                checked={rememberUsername}
                onChange={(e) => setRememberUsername(e.target.checked)}
                className="h-4 w-4 rounded focus:ring-2 focus:ring-offset-2"
                style={{
                  color: 'var(--color-primary-600)',
                  border: '1px solid var(--border-color)'
                }}
              />
              <label htmlFor="remember-username" className="ml-2 block text-sm" style={{ color: 'var(--text-primary)' }}>
                Remember my email address
              </label>
            </div>
          </div>

          {error && (
            <div 
              className="rounded-md p-4"
              style={{
                backgroundColor: 'var(--color-error-50)',
                border: '1px solid var(--color-error-200)'
              }}
            >
              <div className="text-sm" style={{ color: 'var(--color-error-700)' }}>{error}</div>
            </div>
          )}

          {error && error.includes('Password reset successful') && (
            <div 
              className="rounded-md p-4"
              style={{
                backgroundColor: 'var(--color-success-50)',
                border: '1px solid var(--color-success-200)'
              }}
            >
              <div className="text-sm" style={{ color: 'var(--color-success-700)' }}>{error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              style={{
                color: 'var(--color-text-on-primary)',
                backgroundColor: 'var(--color-primary-600)'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary-700)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
                }
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Don't have an account? Contact your administrator.
          </p>
          <button
            type="button"
            onClick={() => {
              setShowForgotPassword(true);
              setError(''); // Clear any existing errors
            }}
            className="mt-2 text-sm font-medium transition-colors"
            style={{ color: 'var(--color-primary-600)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-primary-500)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-primary-600)';
            }}
          >
            Forgot your password?
          </button>
        </div>
      </div>
    </div>
  );
}; 