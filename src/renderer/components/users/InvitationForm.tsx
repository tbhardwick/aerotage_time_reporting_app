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
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
          <div className="text-center">
            <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Invitation Sent!</h3>
            <p className="text-sm text-gray-600 mb-4">
              The user invitation has been sent successfully. They will receive an email with instructions to join the platform.
            </p>
            <div className="animate-pulse text-sm text-gray-500">
              Closing automatically...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <PaperAirplaneIcon className="h-5 w-5 mr-2 text-blue-500" />
                Send User Invitation
              </h3>
              <p className="text-sm text-gray-500">
                Send an email invitation to a new user to join the platform
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={isSubmitting}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5" />
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-red-800">
                    {submitError.includes('Backend API is not available') ? 'Backend Not Available' : 'Error Sending Invitation'}
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{submitError}</p>
                    {submitError.includes('Backend API is not available') && (
                      <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                        <div className="text-yellow-800">
                          <p className="font-medium">📋 Development Status:</p>
                          <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                            <li>Frontend invitation system: ✅ Complete</li>
                            <li>Backend API endpoints: ⏳ Pending deployment</li>
                            <li>AWS SES email service: ⏳ Pending setup</li>
                          </ul>
                          <p className="mt-3 text-sm">
                            <strong>Next steps:</strong> Contact the backend team to deploy the user invitation API endpoints.
                            Reference: <code className="bg-yellow-100 px-1 rounded text-xs">USER_INVITATION_API_REQUIREMENTS.md</code>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setSubmitError(null)}
                      className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-md transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Information */}
            <div className="space-y-6">
              {/* Email & Role */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  Invitation Details
                </h4>
                <div className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email Address *
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type="email"
                        {...register('email')}
                        className="block w-full border border-gray-300 rounded-md pl-10 pr-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="user@company.com"
                        disabled={isSubmitting}
                      />
                      <EnvelopeIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Role *
                    </label>
                    <select
                      {...register('role')}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isSubmitting}
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Administrator</option>
                    </select>
                    {errors.role && (
                      <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Job Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                  <BriefcaseIcon className="h-4 w-4 mr-2" />
                  Job Information
                </h4>
                <div className="space-y-4">
                  {/* Job Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Job Title
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type="text"
                        {...register('jobTitle')}
                        className="block w-full border border-gray-300 rounded-md pl-10 pr-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Senior Designer"
                        disabled={isSubmitting}
                      />
                      <BriefcaseIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Department
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type="text"
                        {...register('department')}
                        className="block w-full border border-gray-300 rounded-md pl-10 pr-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Design"
                        disabled={isSubmitting}
                      />
                      <BuildingOfficeIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>

                  {/* Team */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Team
                    </label>
                    <select
                      {...register('teamId')}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isSubmitting}
                    >
                      <option value="">No Team</option>
                      {state.teams.map(team => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Hourly Rate */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Hourly Rate ($)
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        {...register('hourlyRate', { valueAsNumber: true })}
                        className="block w-full border border-gray-300 rounded-md pl-10 pr-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="100.00"
                        disabled={isSubmitting}
                      />
                      <CurrencyDollarIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    {errors.hourlyRate && (
                      <p className="mt-1 text-sm text-red-600">{errors.hourlyRate.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Permissions & Message */}
            <div className="space-y-6">
              {/* Permissions */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
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
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor={`feature-${feature.id}`} className="font-medium text-gray-700">
                          {feature.name}
                        </label>
                        <p className="text-gray-500">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Personal Message */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                  <UserIcon className="h-4 w-4 mr-2" />
                  Personal Message (Optional)
                </h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Welcome Message
                  </label>
                  <textarea
                    {...register('personalMessage')}
                    rows={4}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Welcome to the team! We're excited to have you join us..."
                    disabled={isSubmitting}
                  />
                  {errors.personalMessage && (
                    <p className="mt-1 text-sm text-red-600">{errors.personalMessage.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    This message will be included in the invitation email.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-6 border-t">
            <div className="text-sm text-gray-500">
              <p>The user will receive an email invitation with instructions to join.</p>
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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