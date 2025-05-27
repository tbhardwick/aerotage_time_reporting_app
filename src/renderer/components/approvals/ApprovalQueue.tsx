import React, { useState, useMemo } from 'react';
import { CheckIcon, XMarkIcon, UserIcon, ClockIcon, CalendarIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { useAppContext } from '../../context/AppContext';
import { useApiOperations } from '../../hooks/useApiOperations';
import { TimeEntry, User, Project } from '../../context/AppContext';

interface ApprovalQueueProps {
  managerId?: string;
}

export function ApprovalQueue({ managerId }: ApprovalQueueProps) {
  const { state } = useAppContext();
  const { approveTimeEntries, rejectTimeEntries } = useApiOperations();
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'submitted'>('submitted');
  const [comment, setComment] = useState('');
  const [showCommentModal, setShowCommentModal] = useState<'approve' | 'reject' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get pending entries for approval
  const pendingEntries = useMemo(() => {
    let entries = state.timeEntries.filter(entry => 
      filter === 'all' ? ['submitted', 'approved', 'rejected'].includes(entry.status) : entry.status === 'submitted'
    );

    // If managerId is provided, filter by team members
    if (managerId) {
      const team = state.teams.find(team => team.managerId === managerId);
      if (team) {
        const teamMemberIds = team.memberIds;
        entries = entries.filter(entry => {
          const user = state.users.find(u => u.id === entry.submittedBy);
          return user && teamMemberIds.includes(user.id);
        });
      }
    }

    return entries.sort((a, b) => new Date(b.submittedAt || b.createdAt).getTime() - new Date(a.submittedAt || a.createdAt).getTime());
  }, [state.timeEntries, state.teams, state.users, managerId, filter]);

  // Get user and project details for display
  const getEntryDetails = (entry: TimeEntry) => {
    const user = state.users.find(u => u.id === entry.submittedBy);
    const project = state.projects.find(p => p.id === entry.projectId);
    return { user, project };
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
    const submittedEntries = pendingEntries.filter(entry => entry.status === 'submitted');
    if (selectedEntries.length === submittedEntries.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(submittedEntries.map(entry => entry.id));
    }
  };

  // Handle approval
  const handleApprove = async () => {
    if (selectedEntries.length === 0) return;
    
    if (comment.trim()) {
      setIsProcessing(true);
      try {
        await approveTimeEntries(selectedEntries, comment.trim());
        setComment('');
        setShowCommentModal(null);
      } catch (error) {
        console.error('Error approving entries:', error);
      } finally {
        setIsProcessing(false);
      }
    } else {
      setIsProcessing(true);
      try {
        await approveTimeEntries(selectedEntries);
      } catch (error) {
        console.error('Error approving entries:', error);
      } finally {
        setIsProcessing(false);
      }
    }
    
    setSelectedEntries([]);
  };

  // Handle rejection
  const handleReject = async () => {
    if (selectedEntries.length === 0 || !comment.trim()) return;
    
    setIsProcessing(true);
    try {
      await rejectTimeEntries(selectedEntries, comment.trim());
    } catch (error) {
      console.error('Error rejecting entries:', error);
    } finally {
      setIsProcessing(false);
    }
    
    setComment('');
    setShowCommentModal(null);
    setSelectedEntries([]);
  };

  // Format duration
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Get status badge color
  const getStatusColor = (status: TimeEntry['status']) => {
    switch (status) {
      case 'submitted': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const submittedCount = pendingEntries.filter(entry => entry.status === 'submitted').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Approval Queue</h2>
          <p className="text-sm text-gray-500">
            {submittedCount} {submittedCount === 1 ? 'entry' : 'entries'} pending approval
          </p>
        </div>
        
        {/* Filter */}
        <div className="flex items-center space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'submitted')}
            className="rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="submitted">Pending Only</option>
            <option value="all">All Submissions</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedEntries.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-indigo-900">
              {selectedEntries.length} {selectedEntries.length === 1 ? 'entry' : 'entries'} selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowCommentModal('approve')}
                disabled={isProcessing}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckIcon className="h-4 w-4 mr-1" />
                Approve
              </button>
              <button
                onClick={() => setShowCommentModal('reject')}
                disabled={isProcessing}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Entries List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {pendingEntries.length === 0 ? (
          <div className="p-6 text-center">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No entries found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'submitted' ? 'No time entries are pending approval.' : 'No time entries have been submitted.'}
            </p>
          </div>
        ) : (
          <>
            {/* Select All Header */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedEntries.length === pendingEntries.filter(entry => entry.status === 'submitted').length && submittedCount > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-3 text-sm font-medium text-gray-700">
                  Select all pending entries
                </label>
              </div>
            </div>

            {/* Entries */}
            <ul className="divide-y divide-gray-200">
              {pendingEntries.map((entry) => {
                const { user, project } = getEntryDetails(entry);
                const canSelect = entry.status === 'submitted';
                
                return (
                  <li key={entry.id} className="px-4 py-4 hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedEntries.includes(entry.id)}
                        onChange={() => handleSelectEntry(entry.id)}
                        disabled={!canSelect}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
                      />

                      {/* Entry Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <UserIcon className="h-6 w-6 text-gray-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {user?.name || 'Unknown User'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {project?.name || 'Unknown Project'}
                                {project?.client && ` - ${project.client.name}`}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                              {entry.status}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {entry.date}
                          </div>
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {formatDuration(entry.duration)}
                          </div>
                          {entry.isBillable && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Billable
                            </span>
                          )}
                        </div>

                        {entry.description && (
                          <p className="mt-1 text-sm text-gray-600">
                            {entry.description}
                          </p>
                        )}

                        {entry.comment && (
                          <div className="mt-2 p-2 bg-gray-100 rounded-md">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Comment:</span> {entry.comment}
                            </p>
                          </div>
                        )}

                        {/* Submission/Approval Info */}
                        <div className="mt-2 text-xs text-gray-500">
                          {entry.submittedAt && (
                            <span>Submitted on {new Date(entry.submittedAt).toLocaleDateString()}</span>
                          )}
                          {entry.approvedAt && entry.approverId && (
                            <span> • Approved on {new Date(entry.approvedAt).toLocaleDateString()}</span>
                          )}
                          {entry.rejectedAt && entry.approverId && (
                            <span> • Rejected on {new Date(entry.rejectedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {showCommentModal === 'approve' ? 'Approve Entries' : 'Reject Entries'}
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {showCommentModal === 'reject' ? 'Rejection Reason (Required)' : 'Comment (Optional)'}
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder={showCommentModal === 'reject' ? 'Please provide a reason for rejection...' : 'Add a comment...'}
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCommentModal(null);
                    setComment('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={showCommentModal === 'approve' ? handleApprove : handleReject}
                  disabled={isProcessing || (showCommentModal === 'reject' && !comment.trim())}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    showCommentModal === 'approve'
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                      : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  }`}
                >
                  {isProcessing 
                    ? (showCommentModal === 'approve' ? 'Approving...' : 'Rejecting...')
                    : (showCommentModal === 'approve' ? 'Approve' : 'Reject')
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 