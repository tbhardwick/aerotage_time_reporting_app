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
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{ backgroundColor: 'var(--color-secondary-50)' }}
    >
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <ExclamationTriangleIcon 
            className="mx-auto h-12 w-12" 
            style={{ color: 'var(--color-warning-500)' }}
          />
          <h2 
            className="mt-6 text-3xl font-extrabold"
            style={{ color: 'var(--text-primary)' }}
          >
            Session Bootstrap Required
          </h2>
          <p 
            className="mt-2 text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            Enhanced session validation is active
          </p>
        </div>

        {/* Explanation */}
        <div 
          className="shadow-md rounded-lg p-6 space-y-4"
          style={{ backgroundColor: 'var(--surface-color)' }}
        >
          <div className="flex items-start space-x-3">
            <CheckCircleIcon 
              className="h-6 w-6 mt-0.5" 
              style={{ color: 'var(--color-success-500)' }}
            />
            <div>
              <h3 
                className="text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                Authentication Successful
              </h3>
              <p 
                className="text-sm mt-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                You've successfully logged in to Cognito, but session validation is preventing API access.
              </p>
            </div>
          </div>

          <div 
            className="border-l-4 p-4"
            style={{
              borderColor: 'var(--color-warning-400)',
              backgroundColor: 'var(--color-warning-50)'
            }}
          >
            <div className="flex">
              <div className="ml-3">
                <h3 
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-warning-800)' }}
                >
                  What's Happening
                </h3>
                <div className="mt-2 text-sm" style={{ color: 'var(--color-warning-700)' }}>
                  <p>
                    The enhanced backend session validation system is working correctly, 
                    but you don't have an active session record in the database. This creates 
                    a "bootstrap" scenario where you need a session to create a session.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div 
            className="border rounded-md p-4"
            style={{
              backgroundColor: 'var(--color-primary-50)',
              borderColor: 'var(--color-primary-200)'
            }}
          >
            <h4 
              className="text-sm font-medium mb-2"
              style={{ color: 'var(--color-primary-900)' }}
            >
              💡 This is Actually Good!
            </h4>
            <p 
              className="text-sm"
              style={{ color: 'var(--color-primary-800)' }}
            >
              The session validation system is working exactly as designed. It's preventing 
              unauthorized access and ensuring all API calls require valid, active sessions.
            </p>
          </div>
        </div>

        {/* Resolution Steps */}
        <div 
          className="shadow-md rounded-lg p-6"
          style={{ backgroundColor: 'var(--surface-color)' }}
        >
          <h3 
            className="text-lg font-medium mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            Resolution Options
          </h3>
          
          <div className="space-y-4">
            <div 
              className="border rounded-lg p-4"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <h4 
                className="font-medium mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Option 1: Backend Configuration (Recommended)
              </h4>
              <p 
                className="text-sm mb-3"
                style={{ color: 'var(--text-secondary)' }}
              >
                Contact your backend team to configure the Lambda authorizer to allow 
                session creation endpoints for newly authenticated users.
              </p>
              <div 
                className="rounded p-3"
                style={{ backgroundColor: 'var(--color-secondary-50)' }}
              >
                <p 
                  className="text-xs font-mono"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Backend needs to allow: POST /users/&#123;userId&#125;/sessions
                </p>
              </div>
            </div>

            <div 
              className="border rounded-lg p-4"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <h4 
                className="font-medium mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Option 2: Temporary Logout & Retry
              </h4>
              <p 
                className="text-sm mb-3"
                style={{ color: 'var(--text-secondary)' }}
              >
                Try logging out completely and logging in again. Sometimes this resolves 
                timing issues with session validation.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={onRetry}
                  disabled={isRetrying}
                  className="flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                  style={{
                    color: 'var(--color-text-on-primary)',
                    backgroundColor: 'var(--color-primary-600)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isRetrying) {
                      e.currentTarget.style.backgroundColor = 'var(--color-primary-700)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isRetrying) {
                      e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
                    }
                  }}
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
                  className="px-3 py-2 text-sm leading-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
                  style={{
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--surface-color)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-secondary-50)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface-color)';
                  }}
                >
                  Logout & Start Over
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <details 
          className="shadow-md rounded-lg p-6"
          style={{ backgroundColor: 'var(--surface-color)' }}
        >
          <summary 
            className="cursor-pointer text-sm font-medium transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            🔧 Technical Details (for developers)
          </summary>
          <div className="mt-4 space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
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
              <code 
                className="block p-2 rounded mt-1"
                style={{ backgroundColor: 'var(--color-secondary-100)' }}
              >
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
        <div 
          className="rounded-lg p-4"
          style={{ backgroundColor: 'var(--color-secondary-50)' }}
        >
          <p 
            className="text-xs mb-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            <strong>For debugging:</strong> Open browser console and run:
          </p>
          <code 
            className="text-xs p-2 rounded block"
            style={{
              color: 'var(--text-primary)',
              backgroundColor: 'var(--surface-color)'
            }}
          >
            await window.sessionValidation.testCurrentAuthState()
          </code>
        </div>
      </div>
    </div>
  );
};

export default SessionBootstrapError; 