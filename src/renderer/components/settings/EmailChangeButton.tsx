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
      <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
          <div>
            <p className="text-sm font-medium text-yellow-900">Email change in progress</p>
            <p className="text-xs text-yellow-700">You have a pending email change request</p>
          </div>
        </div>
        <span className="px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">
          Pending
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center">
        <EnvelopeIcon className="h-5 w-5 text-blue-600 mr-2" />
        <div>
          <p className="text-sm font-medium text-blue-900">Need to change your email?</p>
          <p className="text-xs text-blue-700">Current: {currentEmail}</p>
        </div>
      </div>
      <button
        onClick={onEmailChangeRequest}
        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Change Email
      </button>
    </div>
  );
}; 