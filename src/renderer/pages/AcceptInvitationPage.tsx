import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient, InvitationValidation, AcceptInvitationRequest } from '../services/api-client';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserIcon,
  KeyIcon,
  Cog6ToothIcon,
  PhoneIcon,
  MapPinIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';

// Validation schema for invitation acceptance
const acceptInvitationSchema = z.object({
  name: z.string().min(1, 'Name is required').min(2, 'Name must be at least 2 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  contactInfo: z.object({
    phone: z.string().optional(),
    address: z.string().optional(),
    emergencyContact: z.string().optional(),
  }).optional(),
  preferences: z.object({
    theme: z.enum(['light', 'dark']),
    notifications: z.boolean(),
    timezone: z.string(),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AcceptInvitationFormData = z.infer<typeof acceptInvitationSchema>;

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Australia/Sydney',
];

export const AcceptInvitationPage: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<InvitationValidation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<AcceptInvitationFormData>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: {
      name: '',
      password: '',
      confirmPassword: '',
      contactInfo: {
        phone: '',
        address: '',
        emergencyContact: '',
      },
      preferences: {
        theme: 'light',
        notifications: true,
        timezone: 'America/New_York',
      },
    },
  });

  // Get token from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const invitationToken = urlParams.get('token');
    
    if (invitationToken) {
      setToken(invitationToken);
      validateToken(invitationToken);
    } else {
      setError('No invitation token found in URL');
      setLoading(false);
    }
  }, []);

  const validateToken = async (tokenValue: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Validating invitation token...');
      const validation = await apiClient.validateInvitationToken(tokenValue);
      
      if (validation.invitation.isExpired) {
        setError('This invitation has expired. Please contact your administrator for a new invitation.');
      } else {
        setInvitation(validation);
        console.log('✅ Invitation validated:', validation);
      }
    } catch (err) {
      console.error('❌ Error validating token:', err);
      if (err instanceof Error) {
        if (err.message.includes('404') || err.message.includes('Invalid token')) {
          setError('Invalid invitation link. Please check the URL or contact your administrator.');
        } else if (err.message.includes('410') || err.message.includes('expired')) {
          setError('This invitation has expired. Please contact your administrator for a new invitation.');
        } else if (err.message.includes('409') || err.message.includes('already accepted')) {
          setError('This invitation has already been accepted. If you need access, please contact your administrator.');
        } else {
          setError('Failed to validate invitation. Please try again or contact your administrator.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: AcceptInvitationFormData) => {
    if (!token || !invitation) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      console.log('✅ Accepting invitation...');
      
      const acceptanceRequest: AcceptInvitationRequest = {
        token,
        userData: {
          name: data.name,
          password: data.password,
          contactInfo: data.contactInfo,
          preferences: data.preferences,
        },
      };

      const result = await apiClient.acceptInvitation(acceptanceRequest);
      
      console.log('🎉 Invitation accepted successfully:', result);
      setSuccess(true);

      // Redirect to login or dashboard after a delay
      setTimeout(() => {
        // In a real app, you might redirect to login or auto-login the user
        window.location.href = '/login';
      }, 3000);

    } catch (err) {
      console.error('❌ Error accepting invitation:', err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to accept invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--background-color)' }}>
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="py-8 px-4 shadow sm:rounded-lg sm:px-10" style={{ backgroundColor: 'var(--surface-color)' }}>
            <div className="flex items-center justify-center">
              <svg className="animate-spin h-8 w-8" style={{ color: 'var(--color-primary-600)' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="ml-2" style={{ color: 'var(--text-secondary)' }}>Validating invitation...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--background-color)' }}>
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="py-8 px-4 shadow sm:rounded-lg sm:px-10" style={{ backgroundColor: 'var(--surface-color)' }}>
            <div className="text-center">
              <ExclamationTriangleIcon className="mx-auto h-16 w-16 mb-4" style={{ color: 'var(--color-error-500)' }} />
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Invalid Invitation</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{error}</p>
              <button
                onClick={() => window.location.href = '/'}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
                style={{
                  color: 'var(--color-text-on-primary)',
                  backgroundColor: 'var(--color-primary-600)',
                  '--tw-ring-color': 'var(--color-primary-500)'
                } as React.CSSProperties}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
                }}
              >
                Go to Homepage
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--background-color)' }}>
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="py-8 px-4 shadow sm:rounded-lg sm:px-10" style={{ backgroundColor: 'var(--surface-color)' }}>
            <div className="text-center">
              <CheckCircleIcon className="mx-auto h-16 w-16 mb-4" style={{ color: 'var(--color-success-500)' }} />
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Welcome to Aerotage!</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                Your account has been created successfully. You'll be redirected to the login page shortly.
              </p>
              <div className="animate-pulse text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Redirecting...
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!invitation) return null;

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--background-color)' }}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Welcome to Aerotage</h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Complete your registration to join the team
          </p>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="py-8 px-4 shadow sm:rounded-lg sm:px-10" style={{ backgroundColor: 'var(--surface-color)' }}>
          {/* Invitation Details */}
          <div 
            className="border rounded-md p-4 mb-6"
            style={{
              backgroundColor: 'var(--color-primary-50)',
              borderColor: 'var(--color-primary-200)'
            }}
          >
            <h3 
              className="text-sm font-medium mb-2"
              style={{ color: 'var(--color-primary-800)' }}
            >
              Invitation Details
            </h3>
            <div 
              className="text-sm space-y-1"
              style={{ color: 'var(--color-primary-700)' }}
            >
              <p><span className="font-medium">Email:</span> {invitation.invitation.email}</p>
              <p><span className="font-medium">Role:</span> {invitation.invitation.role}</p>
              {invitation.invitation.department && (
                <p><span className="font-medium">Department:</span> {invitation.invitation.department}</p>
              )}
              {invitation.invitation.jobTitle && (
                <p><span className="font-medium">Job Title:</span> {invitation.invitation.jobTitle}</p>
              )}
            </div>
          </div>

          {/* Error Message */}
          {submitError && (
            <div 
              className="border rounded-md p-4 mb-6"
              style={{
                backgroundColor: 'var(--color-error-50)',
                borderColor: 'var(--color-error-200)'
              }}
            >
              <div className="flex">
                <ExclamationTriangleIcon 
                  className="h-5 w-5"
                  style={{ color: 'var(--color-error-400)' }}
                />
                <div className="ml-3">
                  <h3 
                    className="text-sm font-medium"
                    style={{ color: 'var(--color-error-800)' }}
                  >
                    Error
                  </h3>
                  <div 
                    className="mt-2 text-sm"
                    style={{ color: 'var(--color-error-700)' }}
                  >
                    <p>{submitError}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h4 className="text-sm font-medium mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                <UserIcon className="h-4 w-4 mr-2" />
                Personal Information
              </h4>
              
              <div>
                <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className="mt-1 block w-full border rounded-md px-3 py-2 focus:ring-2 focus:outline-none transition-colors"
                  style={{
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--background-color)',
                    color: 'var(--text-primary)',
                    '--tw-ring-color': 'var(--color-primary-500)'
                  } as React.CSSProperties}
                  placeholder="John Doe"
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="mt-1 text-sm" style={{ color: 'var(--color-error-600)' }}>{errors.name.message}</p>
                )}
              </div>
            </div>

            {/* Security */}
            <div>
              <h4 className="text-sm font-medium mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                <KeyIcon className="h-4 w-4 mr-2" />
                Security
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Password *
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      className="block w-full border rounded-md px-3 py-2 pr-10 focus:ring-2 focus:outline-none transition-colors"
                      style={{
                        borderColor: 'var(--border-color)',
                        backgroundColor: 'var(--background-color)',
                        color: 'var(--text-primary)',
                        '--tw-ring-color': 'var(--color-primary-500)'
                      } as React.CSSProperties}
                      placeholder="Create a secure password"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" style={{ color: 'var(--text-tertiary)' }} />
                      ) : (
                        <EyeIcon className="h-5 w-5" style={{ color: 'var(--text-tertiary)' }} />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm" style={{ color: 'var(--color-error-600)' }}>{errors.password.message}</p>
                  )}
                                      <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Must be at least 8 characters with uppercase, lowercase, and number
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Confirm Password *
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type="password"
                      {...register('confirmPassword')}
                      className="block w-full border rounded-md px-3 py-2 pr-10 focus:ring-2 focus:outline-none transition-colors"
                      style={{
                        borderColor: 'var(--border-color)',
                        backgroundColor: 'var(--background-color)',
                        color: 'var(--text-primary)',
                        '--tw-ring-color': 'var(--color-primary-500)'
                      } as React.CSSProperties}
                      placeholder="Confirm your password"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5" style={{ color: 'var(--text-tertiary)' }} />
                      ) : (
                        <EyeIcon className="h-5 w-5" style={{ color: 'var(--text-tertiary)' }} />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm" style={{ color: 'var(--color-error-600)' }}>{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h4 className="text-sm font-medium mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                <PhoneIcon className="h-4 w-4 mr-2" />
                Contact Information (Optional)
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    {...register('contactInfo.phone')}
                    className="mt-1 block w-full border rounded-md px-3 py-2 focus:ring-2 focus:outline-none transition-colors"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: 'var(--background-color)',
                      color: 'var(--text-primary)',
                      '--tw-ring-color': 'var(--color-primary-500)'
                    } as React.CSSProperties}
                    placeholder="+1 (555) 123-4567"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Address
                  </label>
                  <textarea
                    {...register('contactInfo.address')}
                    rows={2}
                    className="mt-1 block w-full border rounded-md px-3 py-2 focus:ring-2 focus:outline-none transition-colors"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: 'var(--background-color)',
                      color: 'var(--text-primary)',
                      '--tw-ring-color': 'var(--color-primary-500)'
                    } as React.CSSProperties}
                    placeholder="123 Main St, City, State 12345"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Emergency Contact
                  </label>
                  <input
                    type="text"
                    {...register('contactInfo.emergencyContact')}
                    className="mt-1 block w-full border rounded-md px-3 py-2 focus:ring-2 focus:outline-none transition-colors"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: 'var(--background-color)',
                      color: 'var(--text-primary)',
                      '--tw-ring-color': 'var(--color-primary-500)'
                    } as React.CSSProperties}
                    placeholder="Jane Doe (Spouse) - +1 (555) 987-6543"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div>
              <h4 className="text-sm font-medium mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                <Cog6ToothIcon className="h-4 w-4 mr-2" />
                Preferences
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Theme
                  </label>
                  <select
                    {...register('preferences.theme')}
                    className="mt-1 block w-full border rounded-md px-3 py-2 focus:ring-2 focus:outline-none transition-colors"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: 'var(--background-color)',
                      color: 'var(--text-primary)',
                      '--tw-ring-color': 'var(--color-primary-500)'
                    } as React.CSSProperties}
                    disabled={isSubmitting}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Timezone
                  </label>
                  <select
                    {...register('preferences.timezone')}
                    className="mt-1 block w-full border rounded-md px-3 py-2 focus:ring-2 focus:outline-none transition-colors"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: 'var(--background-color)',
                      color: 'var(--text-primary)',
                      '--tw-ring-color': 'var(--color-primary-500)'
                    } as React.CSSProperties}
                    disabled={isSubmitting}
                  >
                    {TIMEZONES.map(tz => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="notifications"
                    {...register('preferences.notifications')}
                    className="h-4 w-4 rounded focus:ring-2 focus:ring-offset-2 transition-colors"
                    style={{
                      color: 'var(--color-primary-600)',
                      borderColor: 'var(--border-color)',
                      '--tw-ring-color': 'var(--color-primary-500)'
                    } as React.CSSProperties}
                    disabled={isSubmitting}
                  />
                  <label htmlFor="notifications" className="ml-2 block text-sm" style={{ color: 'var(--text-primary)' }}>
                    Enable email notifications
                  </label>
                </div>
              </div>
            </div>



            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                style={{
                  color: 'var(--color-text-on-primary)',
                  backgroundColor: 'var(--color-primary-600)',
                  '--tw-ring-color': 'var(--color-primary-500)'
                } as React.CSSProperties}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
                  }
                }}
              >
                {isSubmitting ? 'Creating Account...' : 'Complete Registration'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}; 