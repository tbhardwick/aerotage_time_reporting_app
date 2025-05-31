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

  // Get status badge style
  const getStatusStyle = (status: TimeEntry['status']) => {
    switch (status) {
      case 'submitted': 
        return {
          backgroundColor: 'var(--color-warning-50)',
          color: 'var(--color-warning-800)',
          borderColor: 'var(--color-warning-200)'
        };
      case 'approved': 
        return {
          backgroundColor: 'var(--color-success-50)',
          color: 'var(--color-success-800)',
          borderColor: 'var(--color-success-200)'
        };
      case 'rejected': 
        return {
          backgroundColor: 'var(--color-error-50)',
          color: 'var(--color-error-800)',
          borderColor: 'var(--color-error-200)'
        };
      default: 
        return {
          backgroundColor: 'var(--surface-secondary)',
          color: 'var(--text-secondary)',
          borderColor: 'var(--border-color)'
        };
    }
  };

  const submittedCount = pendingEntries.filter(entry => entry.status === 'submitted').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Approval Queue</h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {submittedCount} {submittedCount === 1 ? 'entry' : 'entries'} pending approval
          </p>
        </div>
        
        {/* Filter */}
        <div className="flex items-center space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'submitted')}
            className="rounded-md text-sm"
            style={{
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--background-color)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="submitted">Pending Only</option>
            <option value="all">All Submissions</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedEntries.length > 0 && (
        <div className="border rounded-lg p-4" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {selectedEntries.length} {selectedEntries.length === 1 ? 'entry' : 'entries'} selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowCommentModal('approve')}
                disabled={isProcessing}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--color-success-600)',
                  color: 'var(--color-text-on-success)',
                  '--tw-ring-color': 'var(--color-success-500)'
                } as React.CSSProperties}
                onMouseEnter={(e) => {
                  if (!isProcessing) {
                    e.currentTarget.style.backgroundColor = 'var(--color-success-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isProcessing) {
                    e.currentTarget.style.backgroundColor = 'var(--color-success-600)';
                  }
                }}
              >
                <CheckIcon className="h-4 w-4 mr-1" />
                Approve
              </button>
              <button
                onClick={() => setShowCommentModal('reject')}
                disabled={isProcessing}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--color-error-600)',
                  color: 'var(--color-text-on-error)',
                  '--tw-ring-color': 'var(--color-error-500)'
                } as React.CSSProperties}
                onMouseEnter={(e) => {
                  if (!isProcessing) {
                    e.currentTarget.style.backgroundColor = 'var(--color-error-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isProcessing) {
                    e.currentTarget.style.backgroundColor = 'var(--color-error-600)';
                  }
                }}
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Entries List */}
      <div className="shadow overflow-hidden sm:rounded-md" style={{ backgroundColor: 'var(--surface-color)' }}>
        {pendingEntries.length === 0 ? (
          <div className="p-6 text-center">
            <ClockIcon className="mx-auto h-12 w-12" style={{ color: 'var(--text-secondary)' }} />
            <h3 className="mt-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>No entries found</h3>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {filter === 'submitted' ? 'No time entries are pending approval.' : 'No time entries have been submitted.'}
            </p>
          </div>
        ) : (
          <>
            {/* Select All Header */}
            <div className="px-4 py-3" style={{ backgroundColor: 'var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedEntries.length === pendingEntries.filter(entry => entry.status === 'submitted').length && submittedCount > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 rounded focus:ring-2 focus:ring-offset-2"
                  style={{
                    borderColor: 'var(--border-color)',
                    color: 'var(--color-primary-600)',
                    '--tw-ring-color': 'var(--color-primary-500)'
                  } as React.CSSProperties}
                />
                <label className="ml-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Select all pending entries
                </label>
              </div>
            </div>

            {/* Entries */}
            <ul style={{ borderColor: 'var(--border-color)' }} className="divide-y">
              {pendingEntries.map((entry) => {
                const { user, project } = getEntryDetails(entry);
                const canSelect = entry.status === 'submitted';
                
                return (
                  <li 
                    key={entry.id} 
                    className="px-4 py-4 transition-colors"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--border-color)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedEntries.includes(entry.id)}
                        onChange={() => handleSelectEntry(entry.id)}
                        disabled={!canSelect}
                        className="h-4 w-4 rounded disabled:opacity-50 focus:ring-2 focus:ring-offset-2"
                        style={{
                          borderColor: 'var(--border-color)',
                          color: 'var(--color-primary-600)',
                          '--tw-ring-color': 'var(--color-primary-500)'
                        } as React.CSSProperties}
                      />

                      {/* Entry Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <UserIcon className="h-6 w-6" style={{ color: 'var(--text-secondary)' }} />
                            </div>
                            <div>
                              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                {user?.name || 'Unknown User'}
                              </p>
                              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                {project?.name || 'Unknown Project'}
                                {project?.client && ` - ${project.client.name}`}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                                                          <span 
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
                                style={getStatusStyle(entry.status)}
                              >
                              {entry.status}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center space-x-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {entry.date}
                          </div>
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {formatDuration(entry.duration)}
                          </div>
                          {entry.isBillable && (
                            <span 
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
                              style={{
                                backgroundColor: 'var(--color-primary-50)',
                                color: 'var(--color-primary-800)',
                                borderColor: 'var(--color-primary-200)'
                              }}
                            >
                              Billable
                            </span>
                          )}
                        </div>

                        {entry.description && (
                          <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                            {entry.description}
                          </p>
                        )}

                        {entry.comment && (
                          <div className="mt-2 p-2 rounded-md" style={{ backgroundColor: 'var(--border-color)' }}>
                            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                              <span className="font-medium">Comment:</span> {entry.comment}
                            </p>
                          </div>
                        )}

                        {/* Submission/Approval Info */}
                        <div className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
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
        <div className="fixed inset-0 overflow-y-auto h-full w-full z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md" style={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)' }}>
            <div className="mt-3">
              <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
                {showCommentModal === 'approve' ? 'Approve Entries' : 'Reject Entries'}
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  {showCommentModal === 'reject' ? 'Rejection Reason (Required)' : 'Comment (Optional)'}
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="w-full rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--background-color)',
                    color: 'var(--text-primary)',
                    '--tw-ring-color': 'var(--color-primary-500)'
                  } as React.CSSProperties}
                  placeholder={showCommentModal === 'reject' ? 'Please provide a reason for rejection...' : 'Add a comment...'}
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCommentModal(null);
                    setComment('');
                  }}
                  className="px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--border-color)',
                    border: '1px solid var(--border-color)',
                    '--tw-ring-color': 'var(--color-primary-500)'
                  } as React.CSSProperties}
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
                  onClick={showCommentModal === 'approve' ? handleApprove : handleReject}
                  disabled={isProcessing || (showCommentModal === 'reject' && !comment.trim())}
                  className="px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  style={showCommentModal === 'approve' 
                    ? {
                        backgroundColor: 'var(--color-success-600)',
                        color: 'var(--color-text-on-success)',
                        '--tw-ring-color': 'var(--color-success-500)'
                      } as React.CSSProperties
                    : {
                        backgroundColor: 'var(--color-error-600)',
                        color: 'var(--color-text-on-error)',
                        '--tw-ring-color': 'var(--color-error-500)'
                      } as React.CSSProperties
                  }
                  onMouseEnter={(e) => {
                    if (!isProcessing && !(showCommentModal === 'reject' && !comment.trim())) {
                      e.currentTarget.style.backgroundColor = showCommentModal === 'approve' 
                        ? 'var(--color-success-hover)' 
                        : 'var(--color-error-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isProcessing && !(showCommentModal === 'reject' && !comment.trim())) {
                      e.currentTarget.style.backgroundColor = showCommentModal === 'approve' 
                        ? 'var(--color-success-600)' 
                        : 'var(--color-error-600)';
                    }
                  }}
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