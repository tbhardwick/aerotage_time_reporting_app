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
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-neutral-200 border-t-primary-500`}
        role="status"
        aria-label="Loading"
      />
      {text && (
        <p className="mt-2 text-sm text-neutral-600 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner; 