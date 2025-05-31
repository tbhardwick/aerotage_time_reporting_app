import React, { useState, useMemo } from 'react';
import { PaperAirplaneIcon, ClockIcon, CalendarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAppContext } from '../../context/AppContext';
import { useApiOperations } from '../../hooks/useApiOperations';
import { TimeEntry } from '../../context/AppContext';

interface BulkSubmissionProps {
  userId?: string;
}

export function BulkSubmission({ userId }: BulkSubmissionProps) {
  const { state } = useAppContext();
  const { submitTimeEntries } = useApiOperations();
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get current user
  const currentUser = userId ? state.users.find(u => u.id === userId) : state.user;

  // Get draft entries for the current user
  const draftEntries = useMemo(() => {
    return state.timeEntries
      .filter(entry => 
        entry.status === 'draft' && 
        (!userId || entry.submittedBy === currentUser?.id || 
         // For time entries created by timer, there might not be submittedBy set
         (!entry.submittedBy && currentUser?.id === state.user?.id))
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.timeEntries, currentUser?.id, state.user?.id, userId]);

  // Get project details for display
  const getProjectDetails = (entry: TimeEntry) => {
    const project = state.projects.find(p => p.id === entry.projectId);
    return project;
  };

  // Handle entry selection
  const handleSelectEntry = (entryId: string) => {
    setSelectedEntries(prev => 
      prev.includes(entryId) 
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedEntries.length === draftEntries.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(draftEntries.map(entry => entry.id));
    }
  };

  // Handle submission
  const handleSubmit = async () => {
    if (selectedEntries.length === 0) return;
    
    setIsSubmitting(true);
    
    try {
      await submitTimeEntries(selectedEntries);
      setSelectedEntries([]);
      setShowConfirmModal(false);
    } catch (error) {
      console.error('Error submitting time entries:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format duration
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Calculate totals for selected entries
  const selectedTotals = useMemo(() => {
    const selected = draftEntries.filter(entry => selectedEntries.includes(entry.id));
    const totalHours = selected.reduce((sum, entry) => sum + entry.duration, 0);
    const billableHours = selected.filter(entry => entry.isBillable).reduce((sum, entry) => sum + entry.duration, 0);
    
    return {
      totalEntries: selected.length,
      totalHours: formatDuration(totalHours),
      billableHours: formatDuration(billableHours),
      nonBillableHours: formatDuration(totalHours - billableHours)
    };
  }, [draftEntries, selectedEntries]);

  // Group entries by date for better organization
  const entriesByDate = useMemo(() => {
    const groups: { [date: string]: TimeEntry[] } = {};
    draftEntries.forEach(entry => {
      if (!groups[entry.date]) {
        groups[entry.date] = [];
      }
      groups[entry.date].push(entry);
    });
    return groups;
  }, [draftEntries]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Submit Time Entries</h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {draftEntries.length} draft {draftEntries.length === 1 ? 'entry' : 'entries'} ready for submission
          </p>
        </div>

        {/* Submit Button */}
        {selectedEntries.length > 0 && (
          <button
            onClick={() => setShowConfirmModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              backgroundColor: 'var(--color-primary-600)',
              color: 'var(--color-text-on-primary)',
              '--tw-ring-color': 'var(--color-primary-600)'
            } as React.CSSProperties}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
            }}
          >
            <PaperAirplaneIcon className="h-4 w-4 mr-2" />
            Submit {selectedEntries.length} {selectedEntries.length === 1 ? 'Entry' : 'Entries'}
          </button>
        )}
      </div>

      {/* Selection Summary */}
      {selectedEntries.length > 0 && (
        <div 
          className="border rounded-lg p-4" 
          style={{ 
            backgroundColor: 'var(--color-primary-50)', 
            borderColor: 'var(--color-primary-200)' 
          }}
        >
          <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Submission Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Total Entries:</span>
              <p style={{ color: 'var(--text-primary)' }}>{selectedTotals.totalEntries}</p>
            </div>
            <div>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Total Time:</span>
              <p style={{ color: 'var(--text-primary)' }}>{selectedTotals.totalHours}</p>
            </div>
            <div>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Billable:</span>
              <p style={{ color: 'var(--text-primary)' }}>{selectedTotals.billableHours}</p>
            </div>
            <div>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Non-Billable:</span>
              <p style={{ color: 'var(--text-primary)' }}>{selectedTotals.nonBillableHours}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {draftEntries.length === 0 ? (
        <div 
          className="shadow rounded-lg p-6 text-center" 
          style={{ backgroundColor: 'var(--surface-color)' }}
        >
          <ClockIcon className="mx-auto h-12 w-12" style={{ color: 'var(--text-secondary)' }} />
          <h3 className="mt-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>No draft entries</h3>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            All your time entries have been submitted for approval or you haven't created any yet.
          </p>
        </div>
      ) : (
        <div 
          className="shadow overflow-hidden sm:rounded-md" 
          style={{ backgroundColor: 'var(--surface-color)' }}
        >
          {/* Select All Header */}
          <div 
            className="px-4 py-3" 
            style={{ 
              backgroundColor: 'var(--surface-secondary)', 
              borderBottom: '1px solid var(--border-color)' 
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedEntries.length === draftEntries.length && draftEntries.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 rounded focus:ring-2 focus:ring-offset-2"
                  style={{ 
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--background-color)',
                    '--tw-ring-color': 'var(--color-primary-600)'
                  } as React.CSSProperties}
                />
                <label className="ml-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Select all draft entries
                </label>
              </div>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {selectedEntries.length} of {draftEntries.length} selected
              </span>
            </div>
          </div>

          {/* Entries grouped by date */}
          <div style={{ borderColor: 'var(--border-color)' }} className="divide-y">
            {Object.entries(entriesByDate)
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .map(([date, entries]) => (
                <div key={date} className="p-4">
                  {/* Date Header */}
                  <div className="flex items-center mb-3">
                    <CalendarIcon className="h-5 w-5 mr-2" style={{ color: 'var(--text-secondary)' }} />
                    <h4 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {new Date(date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h4>
                  </div>

                  {/* Entries for this date */}
                  <div className="space-y-2">
                    {entries.map((entry) => {
                      const project = getProjectDetails(entry);
                      const isSelected = selectedEntries.includes(entry.id);

                      return (
                        <div
                          key={entry.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected ? 'ring-2 ring-offset-2' : ''
                          }`}
                          style={{
                            backgroundColor: isSelected ? 'var(--color-primary-50)' : 'var(--background-color)',
                            borderColor: isSelected ? 'var(--color-primary-200)' : 'var(--border-color)',
                            '--tw-ring-color': 'var(--color-primary-600)'
                          } as React.CSSProperties}
                          onClick={() => handleSelectEntry(entry.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectEntry(entry.id)}
                              className="mt-1 h-4 w-4 rounded focus:ring-2 focus:ring-offset-2"
                              style={{ 
                                borderColor: 'var(--border-color)',
                                backgroundColor: 'var(--background-color)',
                                '--tw-ring-color': 'var(--color-primary-600)'
                              } as React.CSSProperties}
                            />
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                    {project?.name || 'Unknown Project'}
                                  </h5>
                                  {project?.client && (
                                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                      {project.client.name}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                    {formatDuration(entry.duration)}
                                  </span>
                                  {entry.isBillable && (
                                    <span 
                                      className="px-2 py-1 rounded-full text-xs font-medium"
                                      style={{
                                        backgroundColor: 'var(--color-success-50)',
                                        color: 'var(--color-success-800)'
                                      }}
                                    >
                                      Billable
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                                {entry.description}
                              </p>
                              
                              {entry.startTime && entry.endTime && (
                                <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                  {entry.startTime} - {entry.endTime}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div 
            className="rounded-lg shadow-xl max-w-md w-full mx-4"
            style={{ backgroundColor: 'var(--surface-color)' }}
          >
            <div className="p-6">
              <div className="flex items-center mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 mr-3" style={{ color: 'var(--color-warning-600)' }} />
                <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                  Confirm Submission
                </h3>
              </div>
              
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                Are you sure you want to submit {selectedEntries.length} time {selectedEntries.length === 1 ? 'entry' : 'entries'} for approval?
                Once submitted, you won't be able to edit them until they are approved or rejected.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 text-sm font-medium rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--background-color)',
                    color: 'var(--text-primary)',
                    '--tw-ring-color': 'var(--color-primary-600)'
                  } as React.CSSProperties}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--background-color)';
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--color-primary-600)',
                    color: 'var(--color-text-on-primary)',
                    '--tw-ring-color': 'var(--color-primary-600)'
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
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 