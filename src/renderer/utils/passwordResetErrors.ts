/**
 * Password Reset Error Handling Utility
 * Based on backend team's integration guide
 */

export interface PasswordResetError {
  code: string;
  message: string;
  name: string;
}

/**
 * Handles password reset errors and returns user-friendly messages
 * Implements security best practices (no user existence revelation)
 */
export const handlePasswordResetErrors = (error: any): string => {
  const errorCode = error?.code || error?.name || '';
  
  switch (errorCode) {
    case 'UserNotFoundException':
      // Don't reveal if user exists - show generic message for security
      return 'If this email is registered, you will receive a reset code.';
      
    case 'InvalidParameterException':
      return 'Invalid email format. Please check and try again.';
      
    case 'TooManyRequestsException':
      return 'Too many requests. Please wait before trying again.';
      
    case 'CodeExpiredException':
      return 'Reset code has expired. Please request a new one.';
      
    case 'InvalidPasswordException':
      return 'Password does not meet requirements. Must be 8+ characters with uppercase, lowercase, and numbers.';
      
    case 'CodeMismatchException':
      return 'Invalid reset code. Please check and try again.';
      
    case 'LimitExceededException':
      return 'Too many attempts. Please try again later.';
      
    case 'NotAuthorizedException':
      return 'Invalid verification code provided.';
      
    case 'ExpiredCodeException':
      return 'Reset code has expired. Please request a new one.';
      
    case 'UsernameExistsException':
      return 'If this email is registered, you will receive a reset code.';
      
    default:
      console.error('Password reset error:', error);
      return 'Password reset failed. Please try again later.';
  }
};

/**
 * Validates password against the policy defined in aws-config.ts
 */
export const validatePasswordPolicy = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Import password policy from config
  const policy = {
    minLength: 8,
    requireLowercase: true,
    requireUppercase: true,
    requireDigits: true,
    requireSymbols: false,
  };
  
  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters long`);
  }
  
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (policy.requireDigits && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (policy.requireSymbols && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Formats validation errors for display
 */
export const formatPasswordErrors = (errors: string[]): string => {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0];
  
  return `Password requirements:\n• ${errors.join('\n• ')}`;
};

/**
 * Type definitions for password reset flow
 */
export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmation {
  email: string;
  code: string;
  newPassword: string;
}

export interface PasswordResetState {
  step: 'request' | 'confirm' | 'success';
  email: string;
  loading: boolean;
  error: string | null;
  success: string | null;
} 