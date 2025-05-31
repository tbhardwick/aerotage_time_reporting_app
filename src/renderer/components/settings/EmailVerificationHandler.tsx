import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { emailChangeService } from '../../services/emailChangeService';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface VerificationResult {
  requestId: string;
  emailType: 'current' | 'new';
  verified: boolean;
  verificationStatus: {
    currentEmailVerified: boolean;
    newEmailVerified: boolean;
  };
  nextStep: string;
  message: string;
}

const EmailVerificationHandler: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const [verificationData, setVerificationData] = useState<VerificationResult | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const emailType = searchParams.get('type') as 'current' | 'new';

    if (!token || !emailType) {
      setStatus('error');
      setMessage('Invalid verification link. Please check your email and try again.');
      return;
    }

    verifyEmail(token, emailType);
  }, [searchParams]);

  const verifyEmail = async (token: string, emailType: 'current' | 'new') => {
    try {
      console.log('🔍 Verifying email with token:', { token: token.substring(0, 10) + '...', emailType });
      
      const result = await emailChangeService.verifyEmail(token, emailType);
      console.log('✅ Email verification successful:', result);
      
      setStatus('success');
      setVerificationData(result);
      setMessage(result.message);
    } catch (error) {
      console.error('❌ Email verification failed:', error);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Verification failed');
    }
  };

  const getNextStepMessage = () => {
    if (!verificationData) return '';

    switch (verificationData.nextStep) {
      case 'verify_other_email':
        return 'Please check your other email address and click the verification link there.';
      case 'pending_approval':
        return 'Both emails have been verified. Your request is now pending admin approval.';
      case 'auto_approved':
        return 'Your email change has been automatically approved and is being processed.';
      case 'processing':
        return 'Your email change is being processed. You will receive a confirmation email shortly.';
      case 'completed':
        return 'Your email change has been completed successfully!';
      default:
        return verificationData.message || '';
    }
  };

  const getVerificationStatusIcon = (verified: boolean) => {
    return verified ? (
      <CheckCircleIcon className="h-5 w-5" style={{ color: 'var(--color-success-600)' }} />
    ) : (
      <ClockIcon className="h-5 w-5" style={{ color: 'var(--color-warning-600)' }} />
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--background-color)' }}>
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            Email Verification
          </h2>
        </div>

        <div className="shadow-lg rounded-lg p-8" style={{ backgroundColor: 'var(--surface-color)' }}>
          {status === 'verifying' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--color-primary-600)' }}></div>
              <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Verifying your email...</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Please wait while we verify your email address.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div 
                className="mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4"
                style={{ backgroundColor: 'var(--color-success-100)' }}
              >
                <CheckCircleIcon 
                  className="h-6 w-6"
                  style={{ color: 'var(--color-success-600)' }}
                />
              </div>
              <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Email Verified Successfully!</h3>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{message}</p>
              
              {verificationData && (
                <div className="space-y-4">
                  {/* Verification Status */}
                  <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--border-color)' }}>
                    <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Verification Status:</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Current Email:</span>
                        <div className="flex items-center space-x-2">
                          {getVerificationStatusIcon(verificationData.verificationStatus.currentEmailVerified)}
                          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {verificationData.verificationStatus.currentEmailVerified ? 'Verified' : 'Pending'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>New Email:</span>
                        <div className="flex items-center space-x-2">
                          {getVerificationStatusIcon(verificationData.verificationStatus.newEmailVerified)}
                          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {verificationData.verificationStatus.newEmailVerified ? 'Verified' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div 
                    className="border rounded-lg p-4"
                    style={{
                      backgroundColor: 'var(--color-primary-50)',
                      borderColor: 'var(--color-primary-200)'
                    }}
                  >
                    <h4 
                      className="text-sm font-medium mb-2"
                      style={{ color: 'var(--color-primary-900)' }}
                    >
                      Next Steps:
                    </h4>
                    <p 
                      className="text-sm"
                      style={{ color: 'var(--color-primary-800)' }}
                    >
                      {getNextStepMessage()}
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => navigate('/settings')}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
                  style={{
                    color: 'var(--color-text-on-primary)',
                    backgroundColor: 'var(--color-primary-600)',
                    '--tw-ring-color': 'var(--color-primary-500)'
                  } as React.CSSProperties}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
                  }}
                >
                  Go to Settings
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
                  style={{
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--surface-color)',
                    borderColor: 'var(--border-color)',
                    '--tw-ring-color': 'var(--color-primary-500)'
                  } as React.CSSProperties}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--border-color)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface-color)';
                  }}
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div 
                className="mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4"
                style={{ backgroundColor: 'var(--color-error-100)' }}
              >
                <XCircleIcon 
                  className="h-6 w-6"
                  style={{ color: 'var(--color-error-600)' }}
                />
              </div>
              <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Verification Failed</h3>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{message}</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/settings')}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
                  style={{
                    color: 'var(--color-text-on-primary)',
                    backgroundColor: 'var(--color-primary-600)',
                    '--tw-ring-color': 'var(--color-primary-500)'
                  } as React.CSSProperties}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
                  }}
                >
                  Go to Email Settings
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
                  style={{
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--surface-color)',
                    borderColor: 'var(--border-color)',
                    '--tw-ring-color': 'var(--color-primary-500)'
                  } as React.CSSProperties}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--border-color)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface-color)';
                  }}
                >
                  Try Again
                </button>
              </div>

              {/* Common Error Solutions */}
              <div 
                className="mt-6 border rounded-lg p-4"
                style={{
                  backgroundColor: 'var(--color-warning-50)',
                  borderColor: 'var(--color-warning-200)'
                }}
              >
                <h4 
                  className="text-sm font-medium mb-2"
                  style={{ color: 'var(--color-warning-900)' }}
                >
                  Common Solutions:
                </h4>
                <ul 
                  className="text-sm space-y-1 text-left"
                  style={{ color: 'var(--color-warning-800)' }}
                >
                  <li>• Check if the verification link has expired</li>
                  <li>• Make sure you're using the correct email address</li>
                  <li>• Request a new verification email from settings</li>
                  <li>• Contact support if the problem persists</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Having trouble? Contact{' '}
            <a href="mailto:support@aerotage.com" className="transition-colors" style={{ color: 'var(--color-primary-600)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-primary-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-primary-600)';
              }}
            >
              support@aerotage.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationHandler; 