import React from 'react';
import { EnvelopeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface EmailChangeButtonProps {
  currentEmail: string;
  onEmailChangeRequest: () => void;
  hasActiveRequest?: boolean;
}

export const EmailChangeButton: React.FC<EmailChangeButtonProps> = ({
  currentEmail,
  onEmailChangeRequest,
  hasActiveRequest = false
}) => {
  if (hasActiveRequest) {
    return (
      <div 
        className="flex items-center justify-between p-3 rounded-lg border"
        style={{ 
          backgroundColor: 'var(--surface-color)', 
          borderColor: 'var(--border-color)',
          boxShadow: '0 0 0 1px var(--color-warning-500)'
        }}
      >
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 mr-2" style={{ color: 'var(--color-warning-500)' }} />
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Email change in progress</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>You have a pending email change request</p>
          </div>
        </div>
        <span 
          className="px-2 py-1 text-xs font-medium rounded-full"
          style={{ 
            color: 'var(--color-warning-800)', 
            backgroundColor: 'var(--color-warning-100)',
            border: '1px solid var(--color-warning-300)'
          }}
        >
          Pending
        </span>
      </div>
    );
  }

  return (
    <div 
      className="flex items-center justify-between p-3 rounded-lg border"
      style={{ 
        backgroundColor: 'var(--surface-color)', 
        borderColor: 'var(--border-color)',
        boxShadow: '0 0 0 1px var(--color-primary-600)'
      }}
    >
      <div className="flex items-center">
        <EnvelopeIcon className="h-5 w-5 mr-2" style={{ color: 'var(--color-primary-600)' }} />
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Need to change your email?</p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Current: {currentEmail}</p>
        </div>
      </div>
      <button
        onClick={onEmailChangeRequest}
                                className="px-3 py-1 text-sm rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              backgroundColor: 'var(--color-primary-600)',
              color: 'var(--color-text-on-primary)',
              '--tw-ring-color': 'var(--color-primary-500)'
            } as React.CSSProperties}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-primary-700)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        Change Email
      </button>
    </div>
  );
}; 