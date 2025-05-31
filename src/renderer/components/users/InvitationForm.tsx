import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppContext } from '../../context/AppContext';
import { apiClient, CreateInvitationRequest } from '../../services/api-client';
import {
  XMarkIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  CalendarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';

// Validation schema for invitations
const invitationFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'manager', 'employee']),
  teamId: z.string().optional(),
  department: z.string().optional(),
  jobTitle: z.string().optional(),
  hourlyRate: z.number().min(0, 'Hourly rate must be positive').optional(),
  permissions: z.object({
    features: z.array(z.string()),
    projects: z.array(z.string()),
  }),
  personalMessage: z.string().max(500, 'Message must be less than 500 characters').optional(),
});

type InvitationFormData = z.infer<typeof invitationFormSchema>;

interface InvitationFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AVAILABLE_FEATURES = [
  { id: 'timeTracking', name: 'Time Tracking', description: 'Create and manage time entries' },
  { id: 'approvals', name: 'Approvals', description: 'Approve/reject time entries' },
  { id: 'reporting', name: 'Reporting', description: 'View and generate reports' },
  { id: 'invoicing', name: 'Invoicing', description: 'Create and manage invoices' },
  { id: 'projectManagement', name: 'Project Management', description: 'Manage projects and clients' },
  { id: 'userManagement', name: 'User Management', description: 'Manage users and teams' },
];

export const InvitationForm: React.FC<InvitationFormProps> = ({ onClose, onSuccess }) => {
  const { state, dispatch } = useAppContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<InvitationFormData>({
    resolver: zodResolver(invitationFormSchema),
    defaultValues: {
      email: '',
      role: 'employee',
      teamId: '',
      department: '',
      jobTitle: '',
      hourlyRate: 100,
      permissions: {
        features: ['timeTracking'],
        projects: [],
      },
      personalMessage: '',
    },
  });

  const watchedRole = watch('role');
  const watchedFeatures = watch('permissions.features');

  // Update default permissions based on role
  useEffect(() => {
    const rolePermissions = {
      admin: ['timeTracking', 'approvals', 'reporting', 'invoicing', 'projectManagement', 'userManagement'],
      manager: ['timeTracking', 'approvals', 'reporting', 'projectManagement'],
      employee: ['timeTracking'],
    };

    setValue('permissions.features', rolePermissions[watchedRole]);
    setValue('permissions.projects', state.projects.map(p => p.id));
  }, [watchedRole, setValue, state.projects]);

  const handleFeatureToggle = (featureId: string) => {
    const currentFeatures = watchedFeatures || [];
    const newFeatures = currentFeatures.includes(featureId)
      ? currentFeatures.filter(f => f !== featureId)
      : [...currentFeatures, featureId];
    setValue('permissions.features', newFeatures);
  };

  const onSubmit = async (data: InvitationFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      console.log('📧 Sending invitation:', data);
      
      // Prepare invitation request
      const invitationRequest: CreateInvitationRequest = {
        email: data.email,
        role: data.role,
        teamId: data.teamId || undefined,
        department: data.department || undefined,
        jobTitle: data.jobTitle || undefined,
        hourlyRate: data.hourlyRate || undefined,
        permissions: data.permissions,
        personalMessage: data.personalMessage || undefined,
      };

      // Send invitation via API
      const newInvitation = await apiClient.createUserInvitation(invitationRequest);
      
      console.log('✅ Invitation sent successfully:', newInvitation);

      // Update context state
      dispatch({
        type: 'ADD_USER_INVITATION',
        payload: newInvitation,
      });

      setSubmitSuccess(true);
      
      // Show success message for 2 seconds, then close
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);

    } catch (error) {
      console.error('❌ Error sending invitation:', error);
      
      let errorMessage = 'Failed to send invitation';
      
      // Check for specific error types
      if (error instanceof Error) {
        if (error.message.includes('NetworkError') || error.message.includes('ERR_NAME_NOT_RESOLVED')) {
          errorMessage = 'Backend API is not available. The user invitation endpoints may not be deployed yet.';
        } else if (error.message.includes('Authentication required')) {
          errorMessage = 'Authentication required. Please sign in again.';
        } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
          errorMessage = 'You do not have permission to create invitations.';
        } else if (error.message.includes('409') || error.message.includes('already exists')) {
          errorMessage = 'A user with this email address already exists or has a pending invitation.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="fixed inset-0 overflow-y-auto h-full w-full z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md" style={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)' }}>
          <div className="text-center">
            <CheckCircleIcon className="mx-auto h-16 w-16 mb-4" style={{ color: 'var(--color-success-600)' }} />
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Invitation Sent!</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              The user invitation has been sent successfully. They will receive an email with instructions to join the platform.
            </p>
            <div className="animate-pulse text-sm" style={{ color: 'var(--text-secondary)' }}>
              Closing automatically...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-y-auto h-full w-full z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="relative top-4 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md" style={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)' }}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div>
              <h3 className="text-lg font-medium flex items-center" style={{ color: 'var(--text-primary)' }}>
                <PaperAirplaneIcon className="h-5 w-5 mr-2" style={{ color: 'var(--color-primary-600)' }} />
                Send User Invitation
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Send an email invitation to a new user to join the platform
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
              disabled={isSubmitting}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Error Message */}
          {submitError && (
            <div 
              className="border rounded-md p-4"
              style={{
                backgroundColor: 'var(--color-error-50)',
                borderColor: 'var(--color-error-200)'
              }}
            >
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 mt-0.5" style={{ color: 'var(--color-error-400)' }} />
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium" style={{ color: 'var(--color-error-800)' }}>
                    {submitError.includes('Backend API is not available') ? 'Backend Not Available' : 'Error Sending Invitation'}
                  </h3>
                  <div className="mt-2 text-sm" style={{ color: 'var(--color-error-700)' }}>
                    <p>{submitError}</p>
                    {submitError.includes('Backend API is not available') && (
                      <div 
                        className="mt-3 border rounded-md p-3"
                        style={{
                          backgroundColor: 'var(--color-warning-50)',
                          borderColor: 'var(--color-warning-200)'
                        }}
                      >
                        <div style={{ color: 'var(--color-warning-800)' }}>
                          <p className="font-medium">📋 Development Status:</p>
                          <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                            <li>Frontend invitation system: ✅ Complete</li>
                            <li>Backend API endpoints: ⏳ Pending deployment</li>
                            <li>AWS SES email service: ⏳ Pending setup</li>
                          </ul>
                          <p className="mt-3 text-sm">
                            <strong>Next steps:</strong> Contact the backend team to deploy the user invitation API endpoints.
                            Reference: <code 
                              className="px-1 rounded text-xs"
                              style={{
                                backgroundColor: 'var(--color-warning-100)',
                                color: 'var(--color-warning-800)'
                              }}
                            >USER_INVITATION_API_REQUIREMENTS.md</code>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {submitSuccess && (
            <div 
              className="border rounded-md p-4"
              style={{
                backgroundColor: 'var(--color-success-50)',
                borderColor: 'var(--color-success-200)'
              }}
            >
              <div className="flex">
                <CheckCircleIcon className="h-5 w-5 mt-0.5" style={{ color: 'var(--color-success-400)' }} />
                <div className="ml-3">
                  <h3 className="text-sm font-medium" style={{ color: 'var(--color-success-800)' }}>
                    Invitation Sent Successfully!
                  </h3>
                  <div className="mt-2 text-sm" style={{ color: 'var(--color-success-700)' }}>
                    <p>The invitation has been sent and the user will receive an email with instructions to join.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Information */}
            <div>
              <h4 className="text-sm font-medium mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                <UserIcon className="h-4 w-4 mr-2" />
                Basic Information
              </h4>
              
              <div className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Email Address *
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type="email"
                      {...register('email')}
                      className="block w-full rounded-md pl-10 pr-3 py-2 focus:outline-none focus:ring-2 transition-colors"
                      style={{
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--background-color)',
                        color: 'var(--text-primary)',
                        '--tw-ring-color': 'var(--color-primary-500)'
                      } as React.CSSProperties}
                      placeholder="user@company.com"
                      disabled={isSubmitting}
                    />
                    <EnvelopeIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm" style={{ color: 'var(--color-error-600)' }}>{errors.email.message}</p>
                  )}
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Role *
                  </label>
                  <select
                    {...register('role')}
                    className="mt-1 block w-full rounded-md px-3 py-2 focus:outline-none focus:ring-2 transition-colors"
                    style={{
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--background-color)',
                      color: 'var(--text-primary)',
                      '--tw-ring-color': 'var(--color-primary-500)'
                    } as React.CSSProperties}
                    disabled={isSubmitting}
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Administrator</option>
                  </select>
                  {errors.role && (
                    <p className="mt-1 text-sm" style={{ color: 'var(--color-error-600)' }}>{errors.role.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Job Information */}
            <div>
              <h4 className="text-sm font-medium mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                <BriefcaseIcon className="h-4 w-4 mr-2" />
                Job Information
              </h4>
              
              <div className="space-y-4">
                {/* Job Title */}
                <div>
                  <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Job Title
                  </label>
                  <input
                    type="text"
                    {...register('jobTitle')}
                    className="mt-1 block w-full rounded-md px-3 py-2 focus:outline-none focus:ring-2 transition-colors"
                    style={{
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--background-color)',
                      color: 'var(--text-primary)',
                      '--tw-ring-color': 'var(--color-primary-500)'
                    } as React.CSSProperties}
                    placeholder="e.g., Senior Developer"
                    disabled={isSubmitting}
                  />
                  {errors.jobTitle && (
                    <p className="mt-1 text-sm" style={{ color: 'var(--color-error-600)' }}>{errors.jobTitle.message}</p>
                  )}
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Department
                  </label>
                  <input
                    type="text"
                    {...register('department')}
                    className="mt-1 block w-full rounded-md px-3 py-2 focus:outline-none focus:ring-2 transition-colors"
                    style={{
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--background-color)',
                      color: 'var(--text-primary)',
                      '--tw-ring-color': 'var(--color-primary-500)'
                    } as React.CSSProperties}
                    placeholder="e.g., Engineering"
                    disabled={isSubmitting}
                  />
                  {errors.department && (
                    <p className="mt-1 text-sm" style={{ color: 'var(--color-error-600)' }}>{errors.department.message}</p>
                  )}
                </div>

                {/* Team */}
                <div>
                  <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Team
                  </label>
                  <select
                    {...register('teamId')}
                    className="mt-1 block w-full rounded-md px-3 py-2 focus:outline-none focus:ring-2 transition-colors"
                    style={{
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--background-color)',
                      color: 'var(--text-primary)',
                      '--tw-ring-color': 'var(--color-primary-500)'
                    } as React.CSSProperties}
                    disabled={isSubmitting}
                  >
                    <option value="">No Team</option>
                    {state.teams.map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                  {errors.teamId && (
                    <p className="mt-1 text-sm" style={{ color: 'var(--color-error-600)' }}>{errors.teamId.message}</p>
                  )}
                </div>

                {/* Hourly Rate */}
                <div>
                  <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Hourly Rate ($)
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('hourlyRate', { valueAsNumber: true })}
                      className="block w-full rounded-md pl-10 pr-3 py-2 focus:outline-none focus:ring-2 transition-colors"
                      style={{
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--background-color)',
                        color: 'var(--text-primary)',
                        '--tw-ring-color': 'var(--color-primary-500)'
                      } as React.CSSProperties}
                      placeholder="100.00"
                      disabled={isSubmitting}
                    />
                    <CurrencyDollarIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
                  </div>
                  {errors.hourlyRate && (
                    <p className="mt-1 text-sm" style={{ color: 'var(--color-error-600)' }}>{errors.hourlyRate.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Permissions and Message */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              {/* Permissions */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--border-color)' }}>
                <h4 className="text-sm font-medium mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                  <ShieldCheckIcon className="h-4 w-4 mr-2" />
                  Feature Permissions
                </h4>
                <div className="space-y-3">
                  {AVAILABLE_FEATURES.map(feature => (
                    <div key={feature.id} className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          id={`feature-${feature.id}`}
                          checked={watchedFeatures?.includes(feature.id) || false}
                          onChange={() => handleFeatureToggle(feature.id)}
                          disabled={isSubmitting}
                          className="h-4 w-4 rounded"
                          style={{ 
                            borderColor: 'var(--border-color)',
                            accentColor: 'var(--color-primary-600)'
                          }}
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor={`feature-${feature.id}`} className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {feature.name}
                        </label>
                        <p style={{ color: 'var(--text-secondary)' }}>{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Personal Message */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Personal Message (Optional)
                </label>
                <textarea
                  {...register('personalMessage')}
                  className="w-full rounded-md px-3 py-2 focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--background-color)',
                    color: 'var(--text-primary)',
                    '--tw-ring-color': 'var(--color-primary-500)'
                  } as React.CSSProperties}
                  rows={4}
                  placeholder="Add a personal message to include in the invitation email..."
                  disabled={isSubmitting}
                />
                {errors.personalMessage && (
                  <p className="mt-1 text-sm" style={{ color: 'var(--color-error-600)' }}>{errors.personalMessage.message}</p>
                )}
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--border-color)' }}>
              <h4 className="text-sm font-medium mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                <EnvelopeIcon className="h-4 w-4 mr-2" />
                Invitation Preview
              </h4>
              <div className="text-sm space-y-2" style={{ color: 'var(--text-secondary)' }}>
                <p><strong>To:</strong> {watch('email') || 'user@company.com'}</p>
                <p><strong>Role:</strong> {watch('role')?.charAt(0).toUpperCase() + watch('role')?.slice(1)}</p>
                {watch('jobTitle') && <p><strong>Job Title:</strong> {watch('jobTitle')}</p>}
                {watch('department') && <p><strong>Department:</strong> {watch('department')}</p>}
                {watch('hourlyRate') && <p><strong>Hourly Rate:</strong> ${watch('hourlyRate')}/hour</p>}
                <p><strong>Features:</strong> {watchedFeatures?.length || 0} selected</p>
                {watch('personalMessage') && (
                  <div className="mt-3 p-2 rounded" style={{ backgroundColor: 'var(--background-color)' }}>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>Personal Message:</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{watch('personalMessage')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-6" style={{ borderTop: '1px solid var(--border-color)' }}>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <p>The user will receive an email invitation with instructions to join.</p>
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50"
                style={{
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--surface-color)',
                  '--tw-ring-color': 'var(--color-primary-500)'
                } as React.CSSProperties}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--border-color)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--surface-color)';
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--color-primary-600)',
                  color: 'var(--color-text-on-primary)',
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
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" style={{ color: 'var(--color-text-on-primary)' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending Invitation...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}; 