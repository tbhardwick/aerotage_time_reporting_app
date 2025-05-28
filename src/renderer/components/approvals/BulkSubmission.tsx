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
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PaperAirplaneIcon className="h-4 w-4 mr-2" />
            Submit {selectedEntries.length} {selectedEntries.length === 1 ? 'Entry' : 'Entries'}
          </button>
        )}
      </div>

      {/* Selection Summary */}
      {selectedEntries.length > 0 && (
        <div className="border rounded-lg p-4" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
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
        <div className="shadow rounded-lg p-6 text-center" style={{ backgroundColor: 'var(--surface-color)' }}>
          <ClockIcon className="mx-auto h-12 w-12" style={{ color: 'var(--text-secondary)' }} />
          <h3 className="mt-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>No draft entries</h3>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            All your time entries have been submitted for approval or you haven't created any yet.
          </p>
        </div>
      ) : (
        <div className="shadow overflow-hidden sm:rounded-md" style={{ backgroundColor: 'var(--surface-color)' }}>
          {/* Select All Header */}
          <div className="px-4 py-3" style={{ backgroundColor: 'var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedEntries.length === draftEntries.length && draftEntries.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded"
                  style={{ borderColor: 'var(--border-color)' }}
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
                    <span className="ml-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      ({entries.length} {entries.length === 1 ? 'entry' : 'entries'})
                    </span>
                  </div>

                  {/* Entries for this date */}
                  <div className="space-y-3 ml-7">
                    {entries.map((entry) => {
                      const project = getProjectDetails(entry);
                      
                      return (
                        <div 
                          key={entry.id} 
                          className="flex items-center space-x-3 p-3 rounded-lg transition-colors"
                          style={{ border: '1px solid var(--border-color)' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--border-color)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={selectedEntries.includes(entry.id)}
                            onChange={() => handleSelectEntry(entry.id)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded"
                            style={{ borderColor: 'var(--border-color)' }}
                          />

                          {/* Entry Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                  {project?.name || 'Unknown Project'}
                                </p>
                                {project?.client && (
                                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    {project.client.name}
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                                  <ClockIcon className="h-4 w-4 mr-1" />
                                  {formatDuration(entry.duration)}
                                </div>
                                {entry.isBillable && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Billable
                                  </span>
                                )}
                                {!entry.isBillable && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    Non-billable
                                  </span>
                                )}
                              </div>
                            </div>

                            {entry.description && (
                              <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                                {entry.description}
                              </p>
                            )}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md" style={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)' }}>
            <div className="mt-3">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                    Confirm Submission
                  </h3>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                  You are about to submit {selectedEntries.length} time {selectedEntries.length === 1 ? 'entry' : 'entries'} for approval:
                </p>
                
                <div className="rounded-md p-3 text-sm" style={{ backgroundColor: 'var(--border-color)' }}>
                  <div className="flex justify-between mb-1">
                    <span style={{ color: 'var(--text-secondary)' }}>Total entries:</span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{selectedTotals.totalEntries}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span style={{ color: 'var(--text-secondary)' }}>Total time:</span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{selectedTotals.totalHours}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Billable time:</span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{selectedTotals.billableHours}</span>
                  </div>
                </div>
                
                <p className="text-sm mt-3" style={{ color: 'var(--text-secondary)' }}>
                  Once submitted, these entries cannot be edited until they are approved or rejected.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  style={{
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--border-color)',
                    border: '1px solid var(--border-color)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--text-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--border-color)';
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 