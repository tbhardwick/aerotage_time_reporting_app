import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppContext } from '../../context/AppContext';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    try {
      if (isEditMode && existingUser) {
        // Update existing user
        dispatch({
          type: 'UPDATE_USER',
          payload: {
            id: userId!,
            updates: {
              ...data,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      } else {
        // Create new user
        dispatch({
          type: 'ADD_USER',
          payload: {
            ...data,
            createdBy: state.user?.id || 'unknown',
          },
        });
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {isEditMode ? 'Edit User' : 'Create New User'}
              </h3>
              <p className="text-sm text-gray-500">
                {isEditMode 
                  ? 'Update user information, permissions, and preferences'
                  : 'Add a new user to the system with appropriate permissions'
                }
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Information */}
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                  <UserIcon className="h-4 w-4 mr-2" />
                  Personal Information
                </h4>
                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      {...register('name')}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="John Doe"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

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
                        placeholder="john@company.com"
                      />
                      <EnvelopeIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

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
                      />
                      <BuildingOfficeIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Start Date *
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type="date"
                        {...register('startDate')}
                        className="block w-full border border-gray-300 rounded-md pl-10 pr-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <CalendarIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    {errors.startDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                  <PhoneIcon className="h-4 w-4 mr-2" />
                  Contact Information
                </h4>
                <div className="space-y-4">
                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type="tel"
                        {...register('contactInfo.phone')}
                        className="block w-full border border-gray-300 rounded-md pl-10 pr-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="+1 (555) 123-4567"
                      />
                      <PhoneIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <div className="mt-1 relative">
                      <textarea
                        {...register('contactInfo.address')}
                        rows={2}
                        className="block w-full border border-gray-300 rounded-md pl-10 pr-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="123 Main St, City, State 12345"
                      />
                      <MapPinIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Emergency Contact
                    </label>
                    <input
                      type="text"
                      {...register('contactInfo.emergencyContact')}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Jane Doe (Spouse) - +1 (555) 987-6543"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Role, Permissions & Preferences */}
            <div className="space-y-6">
              {/* Role & Team */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                  <ShieldCheckIcon className="h-4 w-4 mr-2" />
                  Role & Team Assignment
                </h4>
                <div className="space-y-4">
                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Role *
                    </label>
                    <select
                      {...register('role')}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Administrator</option>
                    </select>
                    {errors.role && (
                      <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                    )}
                  </div>

                  {/* Team */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Team
                    </label>
                    <select
                      {...register('teamId')}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
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
                      />
                      <CurrencyDollarIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    {errors.hourlyRate && (
                      <p className="mt-1 text-sm text-red-600">{errors.hourlyRate.message}</p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      {...register('isActive')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                      Active User
                    </label>
                  </div>
                </div>
              </div>

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

              {/* Preferences */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                  <Cog6ToothIcon className="h-4 w-4 mr-2" />
                  User Preferences
                </h4>
                <div className="space-y-4">
                  {/* Theme */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Theme
                    </label>
                    <select
                      {...register('preferences.theme')}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>

                  {/* Timezone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Timezone
                    </label>
                    <select
                      {...register('preferences.timezone')}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
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
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="notifications" className="ml-2 block text-sm text-gray-900">
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
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
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