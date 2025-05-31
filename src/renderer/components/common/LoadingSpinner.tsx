import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '', 
  text 
}) => {
  const sizeClasses = {
    sm: 'spinner-sm',
    md: 'spinner',
    lg: 'spinner-lg',
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-t-transparent`}
        style={{
          borderColor: 'var(--border-color)',
          borderTopColor: 'var(--color-primary-600)'
        }}
        role="status"
        aria-label="Loading"
      />
      {text && (
        <p 
          className="mt-2 text-sm animate-pulse"
          style={{ color: 'var(--text-secondary)' }}
        >
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner; 