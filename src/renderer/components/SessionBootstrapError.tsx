/**
 * Session Bootstrap Error Component
 * Displays when session validation is working but no session record exists
 */

import React from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface SessionBootstrapErrorProps {
  onRetry?: () => void;
  onLogout?: () => void;
  isRetrying?: boolean;
}

const SessionBootstrapError: React.FC<SessionBootstrapErrorProps> = ({
  onRetry,
  onLogout,
  isRetrying = false
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-yellow-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Session Bootstrap Required
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enhanced session validation is active
          </p>
        </div>

        {/* Explanation */}
        <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
          <div className="flex items-start space-x-3">
            <CheckCircleIcon className="h-6 w-6 text-green-500 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                Authentication Successful
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                You've successfully logged in to Cognito, but session validation is preventing API access.
              </p>
            </div>
          </div>

          <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  What's Happening
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    The enhanced backend session validation system is working correctly, 
                    but you don't have an active session record in the database. This creates 
                    a "bootstrap" scenario where you need a session to create a session.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              💡 This is Actually Good!
            </h4>
            <p className="text-sm text-blue-800">
              The session validation system is working exactly as designed. It's preventing 
              unauthorized access and ensuring all API calls require valid, active sessions.
            </p>
          </div>
        </div>

        {/* Resolution Steps */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Resolution Options
          </h3>
          
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">
                Option 1: Backend Configuration (Recommended)
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Contact your backend team to configure the Lambda authorizer to allow 
                session creation endpoints for newly authenticated users.
              </p>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs text-gray-600 font-mono">
                  Backend needs to allow: POST /users/&#123;userId&#125;/sessions
                </p>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">
                Option 2: Temporary Logout & Retry
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Try logging out completely and logging in again. Sometimes this resolves 
                timing issues with session validation.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={onRetry}
                  disabled={isRetrying}
                  className="flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isRetrying ? (
                    <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  ) : (
                    <ArrowPathIcon className="-ml-1 mr-2 h-4 w-4" />
                  )}
                  {isRetrying ? 'Retrying...' : 'Retry Bootstrap'}
                </button>
                
                <button
                  onClick={onLogout}
                  className="px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Logout & Start Over
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <details className="bg-white shadow-md rounded-lg p-6">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
            🔧 Technical Details (for developers)
          </summary>
          <div className="mt-4 space-y-3 text-sm text-gray-600">
            <div>
              <strong>What we tried:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Attempted normal session creation via API</li>
                <li>Tried with delay to account for backend processing</li>
                <li>Checked for existing sessions</li>
              </ul>
            </div>
            
            <div>
              <strong>Error pattern:</strong>
              <code className="block bg-gray-100 p-2 rounded mt-1">
                CORS/NetworkError - Authorization rejected before endpoint processing
              </code>
            </div>
            
            <div>
              <strong>Root cause:</strong>
              <p className="mt-1">
                Lambda authorizer validates session existence before allowing any API access, 
                including the session creation endpoint itself.
              </p>
            </div>
            
            <div>
              <strong>Backend solution needed:</strong>
              <p className="mt-1">
                Configure authorizer to bypass session validation for session creation 
                endpoints when user has valid JWT but no active sessions.
              </p>
            </div>
          </div>
        </details>

        {/* Console Testing */}
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-600 mb-2">
            <strong>For debugging:</strong> Open browser console and run:
          </p>
          <code className="text-xs text-gray-800 bg-white p-2 rounded block">
            await window.sessionValidation.testCurrentAuthState()
          </code>
        </div>
      </div>
    </div>
  );
};

export default SessionBootstrapError; 