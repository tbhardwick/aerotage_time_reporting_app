import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppContext } from '../../context/AppContext';
import { useApiOperations } from '../../hooks/useApiOperations';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Validation schema
const projectSchema = z.object({
  clientId: z.string().min(1, 'Please select a client'),
  name: z.string().min(1, 'Project name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().optional(),
  hourlyRate: z.number().min(0, 'Hourly rate must be positive').max(10000, 'Hourly rate seems too high'),
  budgetHours: z.number().min(0, 'Budget hours must be positive').optional().or(z.literal(0)),
  budgetAmount: z.number().min(0, 'Budget amount must be positive').optional().or(z.literal(0)),
  status: z.enum(['active', 'inactive', 'completed']),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  projectId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ projectId, onClose, onSuccess }) => {
  const { state } = useAppContext();
  const { createProject, updateProject } = useApiOperations();
  const isEditing = !!projectId;
  const project = isEditing ? state.projects.find(p => p.id === projectId) : null;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      clientId: '',
      name: '',
      description: '',
      hourlyRate: 100,
      budgetHours: 0,
      budgetAmount: 0,
      status: 'active',
    },
  });

  const watchedBudgetHours = watch('budgetHours');
  const watchedHourlyRate = watch('hourlyRate');

  // Calculate estimated budget amount based on hours and rate
  const estimatedBudgetAmount = (watchedBudgetHours || 0) * (watchedHourlyRate || 0);

  // Populate form when editing
  useEffect(() => {
    if (project) {
      reset({
        clientId: project.clientId,
        name: project.name,
        description: project.description || '',
        hourlyRate: project.hourlyRate,
        budgetHours: project.budget?.hours || 0,
        budgetAmount: project.budget?.amount || 0,
        status: project.status,
      });
    }
  }, [project, reset]);

  const onSubmit = async (data: ProjectFormData) => {
    try {
      const projectData = {
        clientId: data.clientId,
        name: data.name,
        description: data.description || undefined,
        hourlyRate: data.hourlyRate,
        budget: {
          hours: data.budgetHours || undefined,
          amount: data.budgetAmount || undefined,
        },
        status: data.status,
        isActive: data.status === 'active',
      };

      if (isEditing && projectId) {
        await updateProject(projectId, projectData);
      } else {
        await createProject(projectData);
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Failed to save project. Please try again.');
    }
  };

  const activeClients = state.clients.filter(client => client.isActive);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-900">
            {isEditing ? 'Edit Project' : 'Create New Project'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Client Selection */}
          <div>
            <label htmlFor="clientId" className="block text-sm font-medium text-neutral-700 mb-2">
              Client *
            </label>
            <select
              id="clientId"
              {...register('clientId')}
              className={`block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.clientId ? 'border-red-300' : 'border-neutral-300'
              }`}
            >
              <option value="">Select a client...</option>
              {activeClients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            {errors.clientId && (
              <p className="mt-1 text-sm text-red-600">{errors.clientId.message}</p>
            )}
            {activeClients.length === 0 && (
              <p className="mt-1 text-sm text-amber-600">
                No active clients available. Please create a client first.
              </p>
            )}
          </div>

          {/* Project Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-2">
              Project Name *
            </label>
            <input
              type="text"
              id="name"
              {...register('name')}
              className={`block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-300' : 'border-neutral-300'
              }`}
              placeholder="Enter project name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Project Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={3}
              className="block w-full px-3 py-2 border border-neutral-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe the project scope and objectives"
            />
          </div>

          {/* Hourly Rate */}
          <div>
            <label htmlFor="hourlyRate" className="block text-sm font-medium text-neutral-700 mb-2">
              Hourly Rate *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-neutral-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                id="hourlyRate"
                {...register('hourlyRate', { valueAsNumber: true })}
                className={`block w-full pl-7 pr-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.hourlyRate ? 'border-red-300' : 'border-neutral-300'
                }`}
                placeholder="100"
                min="0"
                step="0.01"
              />
            </div>
            {errors.hourlyRate && (
              <p className="mt-1 text-sm text-red-600">{errors.hourlyRate.message}</p>
            )}
          </div>

          {/* Budget Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-neutral-900">Budget (Optional)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Budget Hours */}
              <div>
                <label htmlFor="budgetHours" className="block text-sm font-medium text-neutral-700 mb-2">
                  Budget Hours
                </label>
                <input
                  type="number"
                  id="budgetHours"
                  {...register('budgetHours', { valueAsNumber: true })}
                  className="block w-full px-3 py-2 border border-neutral-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                  min="0"
                  step="0.5"
                />
                {errors.budgetHours && (
                  <p className="mt-1 text-sm text-red-600">{errors.budgetHours.message}</p>
                )}
              </div>

              {/* Budget Amount */}
              <div>
                <label htmlFor="budgetAmount" className="block text-sm font-medium text-neutral-700 mb-2">
                  Budget Amount
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-neutral-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    id="budgetAmount"
                    {...register('budgetAmount', { valueAsNumber: true })}
                    className="block w-full pl-7 pr-3 py-2 border border-neutral-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
                {errors.budgetAmount && (
                  <p className="mt-1 text-sm text-red-600">{errors.budgetAmount.message}</p>
                )}
              </div>
            </div>

            {/* Budget Estimate */}
            {watchedBudgetHours && watchedBudgetHours > 0 && watchedHourlyRate && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Estimated Budget:</strong> {watchedBudgetHours} hours × ${watchedHourlyRate}/hr = ${estimatedBudgetAmount.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Project Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-neutral-700 mb-2">
              Status *
            </label>
            <select
              id="status"
              {...register('status')}
              className="block w-full px-3 py-2 border border-neutral-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="completed">Completed</option>
            </select>
            <p className="mt-1 text-sm text-neutral-500">
              Only active projects will appear in time tracking dropdowns
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || activeClients.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectForm; 