import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppContext } from '../../context/AppContext';
import { useApiOperations } from '../../hooks/useApiOperations';
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
} from '@heroicons/react/24/outline';

// Validation schema
const userFormSchema = z.object({
  name: z.string().min(1, 'Name is required').min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  hourlyRate: z.number().min(0, 'Hourly rate must be positive').optional(),
  role: z.enum(['admin', 'manager', 'employee']),
  teamId: z.string().optional(),
  contactInfo: z.object({
    phone: z.string().optional(),
    address: z.string().optional(),
    emergencyContact: z.string().optional(),
  }).optional(),
  startDate: z.string().min(1, 'Start date is required'),
  isActive: z.boolean(),
  preferences: z.object({
    theme: z.enum(['light', 'dark']),
    notifications: z.boolean(),
    timezone: z.string(),
  }),
  permissions: z.object({
    features: z.array(z.string()),
    projects: z.array(z.string()),
  }),
});

type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormProps {
  userId?: string; // If provided, edit mode; otherwise create mode
  onClose: () => void;
  onSave: () => void;
}

const AVAILABLE_FEATURES = [
  { id: 'timeTracking', name: 'Time Tracking', description: 'Create and manage time entries' },
  { id: 'approvals', name: 'Approvals', description: 'Approve/reject time entries' },
  { id: 'reporting', name: 'Reporting', description: 'View and generate reports' },
  { id: 'invoicing', name: 'Invoicing', description: 'Create and manage invoices' },
  { id: 'projectManagement', name: 'Project Management', description: 'Manage projects and clients' },
  { id: 'userManagement', name: 'User Management', description: 'Manage users and teams' },
];

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

export const UserForm: React.FC<UserFormProps> = ({ userId, onClose, onSave }) => {
  const { state, dispatch } = useAppContext();
  const { createUser, updateUser } = useApiOperations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isEditMode = !!userId;

  // Get user data for edit mode
  const existingUser = isEditMode ? state.users.find(u => u.id === userId) : null;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: existingUser ? {
      name: existingUser.name,
      email: existingUser.email,
      jobTitle: existingUser.jobTitle || '',
      department: existingUser.department || '',
      hourlyRate: existingUser.hourlyRate || 0,
      role: existingUser.role,
      teamId: existingUser.teamId || '',
      contactInfo: {
        phone: existingUser.contactInfo?.phone || '',
        address: existingUser.contactInfo?.address || '',
        emergencyContact: existingUser.contactInfo?.emergencyContact || '',
      },
      startDate: existingUser.startDate.split('T')[0], // Convert to date input format
      isActive: existingUser.isActive,
      preferences: existingUser.preferences || {
        theme: 'light',
        notifications: true,
        timezone: 'America/New_York',
      },
      permissions: existingUser.permissions || {
        features: ['timeTracking'],
        projects: [],
      },
    } : {
      name: '',
      email: '',
      jobTitle: '',
      department: '',
      hourlyRate: 100,
      role: 'employee',
      teamId: '',
      contactInfo: {
        phone: '',
        address: '',
        emergencyContact: '',
      },
      startDate: new Date().toISOString().split('T')[0],
      isActive: true,
      preferences: {
        theme: 'light',
        notifications: true,
        timezone: 'America/New_York',
      },
      permissions: {
        features: ['timeTracking'],
        projects: [],
      },
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

    if (!isEditMode) {
      setValue('permissions.features', rolePermissions[watchedRole]);
      setValue('permissions.projects', state.projects.map(p => p.id));
    }
  }, [watchedRole, setValue, isEditMode, state.projects]);

  const handleFeatureToggle = (featureId: string) => {
    const currentFeatures = watchedFeatures || [];
    const newFeatures = currentFeatures.includes(featureId)
      ? currentFeatures.filter(f => f !== featureId)
      : [...currentFeatures, featureId];
    setValue('permissions.features', newFeatures);
  };

  const onSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);
    setSubmitError(null); // Clear any previous errors
    try {
      if (isEditMode && existingUser) {
        // Update existing user
        await updateUser(userId!, data);
      } else {
        // Create new user
        await createUser({
          ...data,
          createdBy: state.user?.id || 'unknown',
        });
      }
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error saving user:', error);
      setSubmitError(error.message || 'An error occurred while saving the user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 overflow-y-auto h-full w-full z-50"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div 
        className="relative top-4 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md"
        style={{ 
          backgroundColor: 'var(--surface-color)',
          borderColor: 'var(--border-color)'
        }}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
                          <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
              {isEditMode ? 'Edit User' : 'Create New User'}
            </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {isEditMode 
                  ? 'Update user information, permissions, and preferences'
                  : 'Add a new user to the system with appropriate permissions'
                }
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
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Error Display */}
                  {submitError && (
          <div 
            className="rounded-md p-4"
            style={{
              backgroundColor: 'var(--color-error-50)',
              border: '1px solid var(--color-error-200)'
            }}
          >
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5" style={{ color: 'var(--color-error-400)' }} />
              <div className="ml-3">
                <h3 className="text-sm font-medium" style={{ color: 'var(--color-error-800)' }}>Error</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--color-error-700)' }}>{submitError}</p>
              </div>
            </div>
          </div>
        )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Information */}
            <div className="space-y-6">
              {/* Personal Information */}
              <div 
                className="p-4 rounded-lg"
                style={{ backgroundColor: 'var(--color-secondary-50)' }}
              >
                <h4 className="text-sm font-medium mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                  <UserIcon className="h-4 w-4 mr-2" />
                  Personal Information
                </h4>
                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      {...register('name')}
                      className="mt-1 block w-full rounded-md px-3 py-2 focus:ring-2 focus:ring-offset-2"
                      style={{
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--surface-color)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="John Doe"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm" style={{ color: 'var(--color-error-600)' }}>{errors.name.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Email Address *
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type="email"
                        {...register('email')}
                        className="block w-full rounded-md pl-10 pr-3 py-2 focus:ring-2 focus:ring-offset-2"
                        style={{
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--surface-color)',
                          color: 'var(--text-primary)'
                        }}
                        placeholder="john@company.com"
                      />
                      <EnvelopeIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm" style={{ color: 'var(--color-error-600)' }}>{errors.email.message}</p>
                    )}
                  </div>

                  {/* Job Title */}
                  <div>
                    <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Job Title
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type="text"
                        {...register('jobTitle')}
                        className="block w-full rounded-md pl-10 pr-3 py-2 focus:ring-2 focus:ring-offset-2"
                        style={{
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--surface-color)',
                          color: 'var(--text-primary)'
                        }}
                        placeholder="Senior Designer"
                      />
                      <BriefcaseIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
                    </div>
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Department
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type="text"
                        {...register('department')}
                        className="block w-full rounded-md pl-10 pr-3 py-2 focus:ring-2 focus:ring-offset-2"
                        style={{
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--surface-color)',
                          color: 'var(--text-primary)'
                        }}
                        placeholder="Design"
                      />
                      <BuildingOfficeIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
                    </div>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Start Date *
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type="date"
                        {...register('startDate')}
                        className="block w-full rounded-md pl-10 pr-3 py-2 focus:ring-2 focus:ring-offset-2"
                        style={{
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--surface-color)',
                          color: 'var(--text-primary)'
                        }}
                      />
                      <CalendarIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
                    </div>
                    {errors.startDate && (
                      <p className="mt-1 text-sm" style={{ color: 'var(--color-error-600)' }}>{errors.startDate.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div 
                className="p-4 rounded-lg"
                style={{ backgroundColor: 'var(--color-secondary-50)' }}
              >
                <h4 className="text-sm font-medium mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                  <PhoneIcon className="h-4 w-4 mr-2" />
                  Contact Information
                </h4>
                <div className="space-y-4">
                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Phone Number
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type="tel"
                        {...register('contactInfo.phone')}
                        className="block w-full rounded-md pl-10 pr-3 py-2 focus:ring-2 focus:ring-offset-2"
                        style={{
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--surface-color)',
                          color: 'var(--text-primary)'
                        }}
                        placeholder="+1 (555) 123-4567"
                      />
                      <PhoneIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Address
                    </label>
                    <div className="mt-1 relative">
                      <textarea
                        {...register('contactInfo.address')}
                        rows={2}
                        className="block w-full rounded-md pl-10 pr-3 py-2 focus:ring-2 focus:ring-offset-2"
                        style={{
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--surface-color)',
                          color: 'var(--text-primary)'
                        }}
                        placeholder="123 Main St, City, State 12345"
                      />
                      <MapPinIcon className="h-5 w-5 absolute left-3 top-3" style={{ color: 'var(--text-secondary)' }} />
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div>
                    <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Emergency Contact
                    </label>
                    <input
                      type="text"
                      {...register('contactInfo.emergencyContact')}
                      className="mt-1 block w-full rounded-md px-3 py-2 focus:ring-2 focus:ring-offset-2"
                      style={{
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--surface-color)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="Jane Doe (Spouse) - +1 (555) 987-6543"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Role, Permissions & Preferences */}
            <div className="space-y-6">
              {/* Role & Team */}
              <div 
                className="p-4 rounded-lg"
                style={{ backgroundColor: 'var(--color-secondary-50)' }}
              >
                <h4 className="text-sm font-medium mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                  <ShieldCheckIcon className="h-4 w-4 mr-2" />
                  Role & Team Assignment
                </h4>
                <div className="space-y-4">
                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Role *
                    </label>
                    <select
                      {...register('role')}
                      className="mt-1 block w-full rounded-md px-3 py-2 focus:ring-2 focus:ring-offset-2"
                      style={{
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--surface-color)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Administrator</option>
                    </select>
                    {errors.role && (
                      <p className="mt-1 text-sm" style={{ color: 'var(--color-error-600)' }}>{errors.role.message}</p>
                    )}
                  </div>

                  {/* Team */}
                  <div>
                    <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Team
                    </label>
                    <select
                      {...register('teamId')}
                      className="mt-1 block w-full rounded-md px-3 py-2 focus:ring-2 focus:ring-offset-2"
                      style={{
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--surface-color)',
                        color: 'var(--text-primary)'
                      }}
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
                    <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Hourly Rate ($)
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        {...register('hourlyRate', { valueAsNumber: true })}
                        className="block w-full rounded-md pl-10 pr-3 py-2 focus:ring-2 focus:ring-offset-2"
                        style={{
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--surface-color)',
                          color: 'var(--text-primary)'
                        }}
                        placeholder="100.00"
                      />
                      <CurrencyDollarIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
                    </div>
                    {errors.hourlyRate && (
                      <p className="mt-1 text-sm" style={{ color: 'var(--color-error-600)' }}>{errors.hourlyRate.message}</p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      {...register('isActive')}
                      className="h-4 w-4 rounded focus:ring-2 focus:ring-offset-2"
                      style={{
                        color: 'var(--color-primary-600)',
                        border: '1px solid var(--border-color)'
                      }}
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm" style={{ color: 'var(--text-primary)' }}>
                      Active User
                    </label>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div 
                className="p-4 rounded-lg"
                style={{ backgroundColor: 'var(--color-secondary-50)' }}
              >
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
                          className="h-4 w-4 rounded focus:ring-2 focus:ring-offset-2"
                          style={{
                            color: 'var(--color-primary-600)',
                            border: '1px solid var(--border-color)'
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

              {/* Preferences */}
              <div 
                className="p-4 rounded-lg"
                style={{ backgroundColor: 'var(--color-secondary-50)' }}
              >
                <h4 className="text-sm font-medium mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                  <Cog6ToothIcon className="h-4 w-4 mr-2" />
                  User Preferences
                </h4>
                <div className="space-y-4">
                  {/* Theme */}
                  <div>
                    <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Theme
                    </label>
                    <select
                      {...register('preferences.theme')}
                      className="mt-1 block w-full rounded-md px-3 py-2 focus:ring-2 focus:ring-offset-2"
                      style={{
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--surface-color)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>

                  {/* Timezone */}
                  <div>
                    <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Timezone
                    </label>
                    <select
                      {...register('preferences.timezone')}
                      className="mt-1 block w-full rounded-md px-3 py-2 focus:ring-2 focus:ring-offset-2"
                      style={{
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--surface-color)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      {TIMEZONES.map(tz => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                  </div>

                  {/* Notifications */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="notifications"
                      {...register('preferences.notifications')}
                      className="h-4 w-4 rounded focus:ring-2 focus:ring-offset-2"
                      style={{
                        color: 'var(--color-primary-600)',
                        border: '1px solid var(--border-color)'
                      }}
                    />
                    <label htmlFor="notifications" className="ml-2 block text-sm" style={{ color: 'var(--text-primary)' }}>
                      Enable email notifications
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
              style={{
                border: '1px solid var(--border-color)',
                color: 'var(--button-secondary-text)',
                backgroundColor: 'var(--button-secondary-bg)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--button-secondary-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--button-secondary-bg)';
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              style={{
                color: 'var(--color-text-on-primary)',
                backgroundColor: 'var(--color-primary-600)'
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary-700)';
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
                  <ClockIcon className="h-4 w-4 mr-2 animate-spin" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  {isEditMode ? 'Update User' : 'Create User'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm; 