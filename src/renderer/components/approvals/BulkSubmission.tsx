import React, { useState, useMemo } from 'react';
import { PaperAirplaneIcon, ClockIcon, CalendarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAppContext } from '../../context/AppContext';
import { TimeEntry } from '../../context/AppContext';

interface BulkSubmissionProps {
  userId?: string;
}

export function BulkSubmission({ userId }: BulkSubmissionProps) {
  const { state, dispatch } = useAppContext();
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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
  const handleSubmit = () => {
    if (selectedEntries.length === 0) return;
    
    dispatch({
      type: 'SUBMIT_TIME_ENTRIES',
      payload: selectedEntries
    });
    
    setSelectedEntries([]);
    setShowConfirmModal(false);
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
          <h2 className="text-xl font-semibold text-gray-900">Submit Time Entries</h2>
          <p className="text-sm text-gray-500">
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
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-indigo-900 mb-2">Submission Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-indigo-700 font-medium">Total Entries:</span>
              <p className="text-indigo-900">{selectedTotals.totalEntries}</p>
            </div>
            <div>
              <span className="text-indigo-700 font-medium">Total Time:</span>
              <p className="text-indigo-900">{selectedTotals.totalHours}</p>
            </div>
            <div>
              <span className="text-indigo-700 font-medium">Billable:</span>
              <p className="text-indigo-900">{selectedTotals.billableHours}</p>
            </div>
            <div>
              <span className="text-indigo-700 font-medium">Non-Billable:</span>
              <p className="text-indigo-900">{selectedTotals.nonBillableHours}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {draftEntries.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No draft entries</h3>
          <p className="mt-1 text-sm text-gray-500">
            All your time entries have been submitted for approval or you haven't created any yet.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {/* Select All Header */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedEntries.length === draftEntries.length && draftEntries.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-3 text-sm font-medium text-gray-700">
                  Select all draft entries
                </label>
              </div>
              <span className="text-sm text-gray-500">
                {selectedEntries.length} of {draftEntries.length} selected
              </span>
            </div>
          </div>

          {/* Entries grouped by date */}
          <div className="divide-y divide-gray-200">
            {Object.entries(entriesByDate)
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .map(([date, entries]) => (
                <div key={date} className="p-4">
                  {/* Date Header */}
                  <div className="flex items-center mb-3">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <h4 className="text-sm font-medium text-gray-900">
                      {new Date(date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h4>
                    <span className="ml-2 text-sm text-gray-500">
                      ({entries.length} {entries.length === 1 ? 'entry' : 'entries'})
                    </span>
                  </div>

                  {/* Entries for this date */}
                  <div className="space-y-3 ml-7">
                    {entries.map((entry) => {
                      const project = getProjectDetails(entry);
                      
                      return (
                        <div key={entry.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={selectedEntries.includes(entry.id)}
                            onChange={() => handleSelectEntry(entry.id)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />

                          {/* Entry Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {project?.name || 'Unknown Project'}
                                </p>
                                {project?.client && (
                                  <p className="text-sm text-gray-500">
                                    {project.client.name}
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center text-sm text-gray-500">
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
                              <p className="mt-1 text-sm text-gray-600">
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Confirm Submission
                  </h3>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-3">
                  You are about to submit {selectedEntries.length} time {selectedEntries.length === 1 ? 'entry' : 'entries'} for approval:
                </p>
                
                <div className="bg-gray-50 rounded-md p-3 text-sm">
                  <div className="flex justify-between mb-1">
                    <span>Total entries:</span>
                    <span className="font-medium">{selectedTotals.totalEntries}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>Total time:</span>
                    <span className="font-medium">{selectedTotals.totalHours}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Billable time:</span>
                    <span className="font-medium">{selectedTotals.billableHours}</span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 mt-3">
                  Once submitted, these entries cannot be edited until they are approved or rejected.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Submit for Approval
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 