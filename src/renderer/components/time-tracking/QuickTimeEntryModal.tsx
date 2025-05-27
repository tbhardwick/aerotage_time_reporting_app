import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useApiOperations } from '../../hooks/useApiOperations';
import { XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';

interface QuickTimeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  startTime?: string;
  endTime?: string;
  suggestedDuration?: number; // in minutes
}

const QuickTimeEntryModal: React.FC<QuickTimeEntryModalProps> = ({
  isOpen,
  onClose,
  date,
  startTime = '',
  endTime = '',
  suggestedDuration = 30
}) => {
  const { state } = useAppContext();
  const { createTimeEntry } = useApiOperations();
  
  const [formData, setFormData] = useState({
    projectId: '',
    description: '',
    startTime: startTime,
    endTime: endTime,
    duration: suggestedDuration,
    isBillable: false,
    useDuration: !startTime || !endTime // Use duration if times not provided
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        projectId: '',
        description: '',
        startTime: startTime,
        endTime: endTime,
        duration: suggestedDuration,
        isBillable: false,
        useDuration: !startTime || !endTime
      });
      setError(null);
    }
  }, [isOpen, startTime, endTime, suggestedDuration]);

  // Calculate duration when times change
  useEffect(() => {
    if (formData.startTime && formData.endTime && !formData.useDuration) {
      const start = new Date(`${date}T${formData.startTime}`);
      const end = new Date(`${date}T${formData.endTime}`);
      const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
      
      if (durationMinutes > 0) {
        setFormData(prev => ({ ...prev, duration: durationMinutes }));
      }
    }
  }, [formData.startTime, formData.endTime, formData.useDuration, date]);

  // Calculate end time when duration changes
  useEffect(() => {
    if (formData.startTime && formData.useDuration && formData.duration > 0) {
      const start = new Date(`${date}T${formData.startTime}`);
      const end = new Date(start.getTime() + formData.duration * 60 * 1000);
      const endTimeString = end.toTimeString().slice(0, 5);
      setFormData(prev => ({ ...prev, endTime: endTimeString }));
    }
  }, [formData.startTime, formData.duration, formData.useDuration, date]);

  const activeProjects = state.projects.filter(project => project.status === 'active');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.projectId) {
      setError('Please select a project');
      return;
    }
    
    if (!formData.description.trim()) {
      setError('Please enter a description');
      return;
    }
    
    if (formData.duration <= 0) {
      setError('Duration must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const timeEntryData = {
        projectId: formData.projectId,
        date: date,
        startTime: formData.startTime || undefined,
        endTime: formData.endTime || undefined,
        duration: formData.duration,
        description: formData.description,
        isBillable: formData.isBillable,
        status: 'draft' as const
      };

      await createTimeEntry(timeEntryData);
      onClose();
    } catch (error: any) {
      console.error('Failed to create time entry:', error);
      setError(error.message || 'Failed to create time entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  const commonDurations = [15, 30, 45, 60, 90, 120]; // in minutes
  const commonActivities = [
    'Break',
    'Lunch',
    'Meeting',
    'Email',
    'Administrative work',
    'Research',
    'Planning',
    'Code review'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <div className="flex items-center">
            <ClockIcon className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-neutral-900">Quick Time Entry</h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Date Display */}
          <div className="text-sm text-neutral-600">
            <span className="font-medium">Date:</span> {new Date(date).toLocaleDateString()}
          </div>

          {/* Project Selection */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Project *
            </label>
            <select
              value={formData.projectId}
              onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
              className="w-full rounded-lg border-neutral-300 text-sm focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a project...</option>
              {activeProjects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name} - {project.client?.name || 'Unknown Client'}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Description *
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="What did you work on?"
              className="w-full rounded-lg border-neutral-300 text-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
            
            {/* Quick description buttons */}
            <div className="mt-2 flex flex-wrap gap-2">
              {commonActivities.map(activity => (
                <button
                  key={activity}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, description: activity }))}
                  className="px-2 py-1 text-xs bg-neutral-100 text-neutral-700 rounded hover:bg-neutral-200 transition-colors"
                >
                  {activity}
                </button>
              ))}
            </div>
          </div>

          {/* Time Entry Mode Toggle */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Time Entry Method
            </label>
            <div className="flex bg-neutral-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, useDuration: true }))}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  formData.useDuration
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Duration
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, useDuration: false }))}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  !formData.useDuration
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Start/End Time
              </button>
            </div>
          </div>

          {/* Duration Mode */}
          {formData.useDuration ? (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Duration
              </label>
              <div className="space-y-3">
                {/* Duration input */}
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                    min="1"
                    max="480"
                    className="w-20 rounded-lg border-neutral-300 text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-sm text-neutral-600">minutes ({formatDuration(formData.duration)})</span>
                </div>
                
                {/* Quick duration buttons */}
                <div className="flex flex-wrap gap-2">
                  {commonDurations.map(duration => (
                    <button
                      key={duration}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, duration }))}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        formData.duration === duration
                          ? 'bg-blue-600 text-white'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      {formatDuration(duration)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Start/End Time Mode */
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full rounded-lg border-neutral-300 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  className="w-full rounded-lg border-neutral-300 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Calculated duration display */}
          {formData.duration > 0 && (
            <div className="text-sm text-neutral-600 bg-neutral-50 p-3 rounded-lg">
              <span className="font-medium">Duration:</span> {formatDuration(formData.duration)} 
              {formData.startTime && formData.endTime && (
                <span> ({formData.startTime} - {formData.endTime})</span>
              )}
            </div>
          )}

          {/* Billable Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="billable"
              checked={formData.isBillable}
              onChange={(e) => setFormData(prev => ({ ...prev, isBillable: e.target.checked }))}
              className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="billable" className="ml-2 text-sm text-neutral-700">
              Billable time
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickTimeEntryModal; 