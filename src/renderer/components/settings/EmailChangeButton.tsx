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
          boxShadow: '0 0 0 1px #f59e0b'
        }}
      >
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 mr-2" style={{ color: '#f59e0b' }} />
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Email change in progress</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>You have a pending email change request</p>
          </div>
        </div>
        <span 
          className="px-2 py-1 text-xs font-medium rounded-full"
          style={{ 
            color: '#92400e', 
            backgroundColor: '#fef3c7',
            border: '1px solid #fde68a'
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
        boxShadow: '0 0 0 1px #3b82f6'
      }}
    >
      <div className="flex items-center">
        <EnvelopeIcon className="h-5 w-5 mr-2" style={{ color: '#3b82f6' }} />
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Need to change your email?</p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Current: {currentEmail}</p>
        </div>
      </div>
      <button
        onClick={onEmailChangeRequest}
        className="px-3 py-1 text-sm text-white rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        style={{ backgroundColor: '#3b82f6' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#2563eb';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#3b82f6';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        Change Email
      </button>
    </div>
  );
}; 