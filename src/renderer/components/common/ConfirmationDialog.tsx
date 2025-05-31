import React from 'react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          iconColor: 'var(--color-error-600)',
          iconBg: 'var(--color-error-50)',
          confirmButtonBg: 'var(--color-error-600)',
          confirmButtonHover: 'var(--color-error-hover)',
          confirmButtonRing: 'var(--color-error-600)',
        };
      case 'warning':
        return {
          iconColor: 'var(--color-warning-600)',
          iconBg: 'var(--color-warning-50)',
          confirmButtonBg: 'var(--color-warning-600)',
          confirmButtonHover: 'var(--color-warning-700)',
          confirmButtonRing: 'var(--color-warning-600)',
        };
      case 'info':
        return {
          iconColor: 'var(--color-primary-600)',
          iconBg: 'var(--color-primary-50)',
          confirmButtonBg: 'var(--color-primary-600)',
          confirmButtonHover: 'var(--color-primary-hover)',
          confirmButtonRing: 'var(--color-primary-600)',
        };
      default:
        return {
          iconColor: 'var(--color-error-600)',
          iconBg: 'var(--color-error-50)',
          confirmButtonBg: 'var(--color-error-600)',
          confirmButtonHover: 'var(--color-error-hover)',
          confirmButtonRing: 'var(--color-error-600)',
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div 
      className="fixed inset-0 overflow-y-auto h-full w-full z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div 
        className="relative rounded-lg max-w-md w-full mx-4"
        style={{
          backgroundColor: 'var(--surface-color)',
          boxShadow: 'var(--shadow)'
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center">
            <div 
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: styles.iconBg }}
            >
              <ExclamationTriangleIcon 
                className="w-6 h-6"
                style={{ color: styles.iconColor }}
              />
            </div>
            <h3 
              className="ml-3 text-lg font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="disabled:opacity-50 transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-tertiary)';
            }}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p 
            className="text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            {message}
          </p>
        </div>

        {/* Actions */}
        <div 
          className="flex items-center justify-end space-x-3 p-4 border-t"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            style={{
              color: 'var(--text-primary)',
              backgroundColor: 'var(--surface-color)',
              borderColor: 'var(--border-color)',
              '--tw-ring-color': 'var(--color-primary-600)'
            } as React.CSSProperties}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-color)';
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            style={{
              backgroundColor: styles.confirmButtonBg,
              color: 'var(--color-text-on-primary)',
              '--tw-ring-color': styles.confirmButtonRing
            } as React.CSSProperties}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = styles.confirmButtonHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = styles.confirmButtonBg;
            }}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div 
                  className="animate-spin rounded-full h-4 w-4 border-b-2 mr-2"
                  style={{ borderColor: 'var(--color-text-on-primary)' }}
                />
                Processing...
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}; 