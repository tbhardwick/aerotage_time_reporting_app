import React, { useState } from 'react';
import { XMarkIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { CreateEmailChangeRequest } from '../../services/emailChangeService';

interface EmailChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string;
  onSubmit: (data: CreateEmailChangeRequest) => Promise<void>;
}

type ChangeReason = 'name_change' | 'company_change' | 'personal_preference' | 'security_concern' | 'other';

const reasonOptions: { value: ChangeReason; label: string; description: string }[] = [
  {
    value: 'name_change',
    label: 'Name Change',
    description: 'Marriage, divorce, or legal name change'
  },
  {
    value: 'company_change',
    label: 'Company Email Change',
    description: 'Company domain or email policy change'
  },
  {
    value: 'personal_preference',
    label: 'Personal Preference',
    description: 'Switching to a preferred email address'
  },
  {
    value: 'security_concern',
    label: 'Security Concern',
    description: 'Compromised account or security issue'
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Please specify in the text field below'
  }
];

export const EmailChangeModal: React.FC<EmailChangeModalProps> = ({
  isOpen,
  onClose,
  currentEmail,
  onSubmit
}) => {
  const [formData, setFormData] = useState<CreateEmailChangeRequest>({
    newEmail: '',
    reason: 'personal_preference',
    customReason: '',
    currentPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Email validation
    if (!formData.newEmail) {
      newErrors.newEmail = 'New email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.newEmail)) {
      newErrors.newEmail = 'Please enter a valid email address';
    } else if (formData.newEmail.toLowerCase() === currentEmail.toLowerCase()) {
      newErrors.newEmail = 'New email must be different from current email';
    }

    // Password validation
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required for verification';
    } else if (formData.currentPassword.length < 8) {
      newErrors.currentPassword = 'Password must be at least 8 characters';
    }

    // Reason validation
    if (!formData.reason) {
      newErrors.reason = 'Please select a reason for the email change';
    }

    // Custom reason validation
    if (formData.reason === 'other' && !formData.customReason?.trim()) {
      newErrors.customReason = 'Please provide a specific reason';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Reset form on success
      setFormData({
        newEmail: '',
        reason: 'personal_preference',
        customReason: '',
        currentPassword: ''
      });
      setErrors({});
      onClose();
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to submit email change request'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        newEmail: '',
        reason: 'personal_preference',
        customReason: '',
        currentPassword: ''
      });
      setErrors({});
      onClose();
    }
  };

  const getApprovalRequirement = (selectedReason: ChangeReason) => {
    switch (selectedReason) {
      case 'personal_preference':
        return { required: false, message: 'Usually approved automatically' };
      case 'name_change':
        return { required: false, message: 'Usually approved automatically' };
      case 'company_change':
        return { required: true, message: 'Admin approval required' };
      case 'security_concern':
        return { required: true, message: 'Admin approval required for security' };
      case 'other':
        return { required: true, message: 'Admin review required' };
      default:
        return { required: false, message: '' };
    }
  };

  if (!isOpen) return null;

  const approvalInfo = getApprovalRequirement(formData.reason);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />
        
        {/* Modal */}
        <div className="relative w-full max-w-md transform overflow-hidden rounded-lg shadow-xl transition-all" style={{ backgroundColor: 'var(--surface-color)' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Change Email Address</h3>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="disabled:opacity-50"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Submit Error */}
            {errors.submit && (
              <div className="p-3 rounded-md" style={{ backgroundColor: 'var(--color-error-50)', border: '1px solid var(--color-error-200)' }}>
                <p className="text-sm" style={{ color: 'var(--color-error-800)' }}>{errors.submit}</p>
              </div>
            )}

            {/* Current Email */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Current Email
              </label>
              <input
                type="email"
                value={currentEmail}
                disabled
                className="w-full px-3 py-2 rounded-md text-sm"
                style={{ 
                  border: '1px solid var(--border-color)', 
                  backgroundColor: 'var(--surface-secondary)', 
                  color: 'var(--text-tertiary)' 
                }}
              />
            </div>

            {/* New Email */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                New Email Address *
              </label>
              <input
                type="email"
                value={formData.newEmail}
                onChange={(e) => setFormData({ ...formData, newEmail: e.target.value })}
                disabled={isSubmitting}
                className="w-full px-3 py-2 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                style={{ 
                  border: `1px solid ${errors.newEmail ? 'var(--color-error-300)' : 'var(--border-color)'}`, 
                  backgroundColor: 'var(--surface-color)', 
                  color: 'var(--text-primary)' 
                }}
                placeholder="Enter your new email address"
              />
              {errors.newEmail && (
                <p className="mt-1 text-sm" style={{ color: 'var(--color-error-600)' }}>{errors.newEmail}</p>
              )}
            </div>

            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Current Password *
              </label>
              <input
                type="password"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                disabled={isSubmitting}
                className="w-full px-3 py-2 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                style={{ 
                  border: `1px solid ${errors.currentPassword ? 'var(--color-error-300)' : 'var(--border-color)'}`, 
                  backgroundColor: 'var(--surface-color)', 
                  color: 'var(--text-primary)' 
                }}
                placeholder="Enter your current password"
              />
              {errors.currentPassword && (
                <p className="mt-1 text-sm" style={{ color: 'var(--color-error-600)' }}>{errors.currentPassword}</p>
              )}
              <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Required for security verification</p>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Reason for Change *
              </label>
              <select
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value as ChangeReason })}
                disabled={isSubmitting}
                className="w-full px-3 py-2 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                style={{ 
                  border: `1px solid ${errors.reason ? 'var(--color-error-300)' : 'var(--border-color)'}`, 
                  backgroundColor: 'var(--surface-color)', 
                  color: 'var(--text-primary)' 
                }}
              >
                {reasonOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.reason && (
                <p className="mt-1 text-sm" style={{ color: 'var(--color-error-600)' }}>{errors.reason}</p>
              )}
              {formData.reason && formData.reason !== 'other' && (
                <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {reasonOptions.find(opt => opt.value === formData.reason)?.description}
                </p>
              )}
            </div>

            {/* Custom Reason */}
            {formData.reason === 'other' && (
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Please Specify *
                </label>
                <textarea
                  value={formData.customReason}
                  onChange={(e) => setFormData({ ...formData, customReason: e.target.value })}
                  disabled={isSubmitting}
                  rows={3}
                  className="w-full px-3 py-2 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  style={{ 
                    border: `1px solid ${errors.customReason ? 'var(--color-error-300)' : 'var(--border-color)'}`, 
                    backgroundColor: 'var(--surface-color)', 
                    color: 'var(--text-primary)' 
                  }}
                  placeholder="Please provide a detailed reason for the email change"
                />
                {errors.customReason && (
                  <p className="mt-1 text-sm" style={{ color: 'var(--color-error-600)' }}>{errors.customReason}</p>
                )}
              </div>
            )}

            {/* Approval Information */}
            {formData.reason && (
              <div className={`p-3 rounded-md border ${
                approvalInfo.required 
                  ? 'bg-yellow-50 border-yellow-200' 
                  : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex">
                  <InformationCircleIcon className={`h-5 w-5 ${
                    approvalInfo.required ? 'text-yellow-600' : 'text-green-600'
                  }`} />
                  <div className="ml-2">
                    <p className={`text-sm font-medium ${
                      approvalInfo.required ? 'text-yellow-800' : 'text-green-800'
                    }`}>
                      {approvalInfo.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Security Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-800">
                    Important Security Information
                  </h4>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>You'll need to verify both your current and new email addresses</li>
                      <li>All your sessions will be logged out after the change</li>
                      <li>You'll need to sign in with your new email address</li>
                      <li>This process may take 24-48 hours to complete</li>
                      <li>You can only have one active email change request at a time</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium rounded-md hover:opacity-80 disabled:opacity-50"
                style={{
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--surface-color)',
                  border: '1px solid var(--border-color)'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.newEmail || !formData.currentPassword || !formData.reason || (formData.reason === 'other' && !formData.customReason)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  'Request Email Change'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}; 