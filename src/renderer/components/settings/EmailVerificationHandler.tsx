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
      <CheckCircleIcon className="h-5 w-5 text-green-600" />
    ) : (
      <ClockIcon className="h-5 w-5 text-yellow-600" />
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Email Verification
          </h2>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-8">
          {status === 'verifying' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Verifying your email...</h3>
              <p className="text-sm text-gray-600">Please wait while we verify your email address.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Email Verified Successfully!</h3>
              <p className="text-sm text-gray-600 mb-6">{message}</p>
              
              {verificationData && (
                <div className="space-y-4">
                  {/* Verification Status */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Verification Status:</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Current Email:</span>
                        <div className="flex items-center space-x-2">
                          {getVerificationStatusIcon(verificationData.verificationStatus.currentEmailVerified)}
                          <span className="text-sm text-gray-600">
                            {verificationData.verificationStatus.currentEmailVerified ? 'Verified' : 'Pending'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">New Email:</span>
                        <div className="flex items-center space-x-2">
                          {getVerificationStatusIcon(verificationData.verificationStatus.newEmailVerified)}
                          <span className="text-sm text-gray-600">
                            {verificationData.verificationStatus.newEmailVerified ? 'Verified' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Next Steps:</h4>
                    <p className="text-sm text-blue-800">{getNextStepMessage()}</p>
                  </div>
                </div>
              )}

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => navigate('/settings')}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Go to Settings
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <XCircleIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Verification Failed</h3>
              <p className="text-sm text-gray-600 mb-6">{message}</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/settings')}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Go to Email Settings
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Try Again
                </button>
              </div>

              {/* Common Error Solutions */}
              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-yellow-900 mb-2">Common Solutions:</h4>
                <ul className="text-sm text-yellow-800 space-y-1 text-left">
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
          <p className="text-xs text-gray-500">
            Having trouble? Contact{' '}
            <a href="mailto:support@aerotage.com" className="text-blue-600 hover:text-blue-500">
              support@aerotage.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationHandler; 