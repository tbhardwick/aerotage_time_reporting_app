import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ClockIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { useAppContext } from '../../context/AppContext';
import { TimeEntryForm } from '../../types';

const timeEntrySchema = z.object({
  projectId: z.string().min(1, 'Project is required'),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  duration: z.number().min(1, 'Duration must be at least 1 minute').optional(),
  description: z.string().min(1, 'Description is required'),
  isBillable: z.boolean(),
});

interface ManualTimeEntryProps {
  onSubmit: (entry: TimeEntryForm) => void;
  onCancel?: () => void;
}

const ManualTimeEntry: React.FC<ManualTimeEntryProps> = ({ onSubmit, onCancel }) => {
  const { state } = useAppContext();
  const { projects } = state;
  const [useTimeRange, setUseTimeRange] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<TimeEntryForm>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      isBillable: true,
      duration: 60, // Default 1 hour
    }
  });

  const startTime = watch('startTime');
  const endTime = watch('endTime');

  // Calculate duration when time range is used
  React.useEffect(() => {
    if (useTimeRange && startTime && endTime) {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      const diffMs = end.getTime() - start.getTime();
      const diffMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
      setValue('duration', diffMinutes);
    }
  }, [startTime, endTime, useTimeRange, setValue]);

  const handleFormSubmit = (data: TimeEntryForm) => {
    onSubmit(data);
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <ClockIcon className="w-5 h-5 mr-2" />
          Add Time Entry
        </h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Project Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project *
          </label>
          <select
            {...register('projectId')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a project...</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} - {project.client?.name || 'Unknown Client'}
              </option>
            ))}
          </select>
          {errors.projectId && (
            <p className="text-red-600 text-sm mt-1">{errors.projectId.message}</p>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date *
          </label>
          <div className="relative">
            <input
              type="date"
              {...register('date')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
          {errors.date && (
            <p className="text-red-600 text-sm mt-1">{errors.date.message}</p>
          )}
        </div>

        {/* Time Entry Method Toggle */}
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              checked={!useTimeRange}
              onChange={() => setUseTimeRange(false)}
              className="mr-2"
            />
            Duration
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              checked={useTimeRange}
              onChange={() => setUseTimeRange(true)}
              className="mr-2"
            />
            Time Range
          </label>
        </div>

        {/* Duration or Time Range */}
        {useTimeRange ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <input
                type="time"
                {...register('startTime')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <input
                type="time"
                {...register('endTime')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (minutes) *
            </label>
            <input
              type="number"
              min="1"
              step="1"
              {...register('duration', { valueAsNumber: true })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {watch('duration') && (
              <p className="text-sm text-gray-600 mt-1">
                {formatDuration(watch('duration') || 0)}
              </p>
            )}
            {errors.duration && (
              <p className="text-red-600 text-sm mt-1">{errors.duration.message}</p>
            )}
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            {...register('description')}
            placeholder="What did you work on?"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
          {errors.description && (
            <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* Billable Toggle */}
        <div className="flex items-center">
          <input
            type="checkbox"
            {...register('isBillable')}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label className="ml-2 text-sm font-medium text-gray-700">
            Billable time
          </label>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Adding...' : 'Add Time Entry'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManualTimeEntry; 