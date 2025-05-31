import React, { useState, useMemo } from 'react';
import { ClockIcon, CheckIcon, XMarkIcon, UserIcon, CalendarIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { useAppContext } from '../../context/AppContext';
import { TimeEntry, User } from '../../context/AppContext';

interface ApprovalHistoryProps {
  userId?: string; // Filter by specific user if provided
}

export function ApprovalHistory({ userId }: ApprovalHistoryProps) {
  const { state } = useAppContext();
  const [filter, setFilter] = useState<'all' | 'approved' | 'rejected' | 'submitted'>('all');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'all'>('month');
  const [searchTerm, setSearchTerm] = useState('');

  // Get filtered history entries
  const historyEntries = useMemo(() => {
    let entries = state.timeEntries.filter(entry => {
      // Filter by status
      if (filter !== 'all' && entry.status !== filter) return false;
      
      // Filter by user if provided
      if (userId && entry.submittedBy !== userId) return false;
      
      // Filter by date range
      if (dateRange !== 'all') {
        const entryDate = new Date(entry.submittedAt || entry.createdAt);
        const now = new Date();
        const daysAgo = {
          week: 7,
          month: 30,
          quarter: 90
        }[dateRange];
        
        const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        if (entryDate < cutoffDate) return false;
      }
      
      // Filter by search term
      if (searchTerm) {
        const project = state.projects.find(p => p.id === entry.projectId);
        const user = state.users.find(u => u.id === entry.submittedBy);
        const approver = entry.approverId ? state.users.find(u => u.id === entry.approverId) : null;
        
        const searchFields = [
          entry.description,
          project?.name,
          project?.client?.name,
          user?.name,
          approver?.name,
          entry.comment
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchFields.includes(searchTerm.toLowerCase())) return false;
      }
      
      return ['submitted', 'approved', 'rejected'].includes(entry.status);
    });

    // Sort by most recent action first
    return entries.sort((a, b) => {
      const aDate = new Date(a.approvedAt || a.rejectedAt || a.submittedAt || a.createdAt);
      const bDate = new Date(b.approvedAt || b.rejectedAt || b.submittedAt || b.createdAt);
      return bDate.getTime() - aDate.getTime();
    });
  }, [state.timeEntries, state.projects, state.users, filter, dateRange, searchTerm, userId]);

  // Get entry details
  const getEntryDetails = (entry: TimeEntry) => {
    const user = state.users.find(u => u.id === entry.submittedBy);
    const project = state.projects.find(p => p.id === entry.projectId);
    const approver = entry.approverId ? state.users.find(u => u.id === entry.approverId) : null;
    return { user, project, approver };
  };

  // Format duration
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Get status icon
  const getStatusIcon = (status: TimeEntry['status']) => {
    switch (status) {
      case 'submitted':
        return <ClockIcon className="h-5 w-5" style={{ color: 'var(--color-warning-600)' }} />;
      case 'approved':
        return <CheckIcon className="h-5 w-5" style={{ color: 'var(--color-success-600)' }} />;
      case 'rejected':
        return <XMarkIcon className="h-5 w-5" style={{ color: 'var(--color-error-600)' }} />;
      default:
        return <ClockIcon className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />;
    }
  };

  // Get status color
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

  // Get action date
  const getActionDate = (entry: TimeEntry) => {
    if (entry.approvedAt) return new Date(entry.approvedAt);
    if (entry.rejectedAt) return new Date(entry.rejectedAt);
    if (entry.submittedAt) return new Date(entry.submittedAt);
    return new Date(entry.createdAt);
  };

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const total = historyEntries.length;
    const approved = historyEntries.filter(e => e.status === 'approved').length;
    const rejected = historyEntries.filter(e => e.status === 'rejected').length;
    const pending = historyEntries.filter(e => e.status === 'submitted').length;
    
    const totalHours = historyEntries.reduce((sum, entry) => sum + entry.duration, 0);
    const approvedHours = historyEntries
      .filter(e => e.status === 'approved')
      .reduce((sum, entry) => sum + entry.duration, 0);
    
    return {
      total,
      approved,
      rejected,
      pending,
      totalHours: formatDuration(totalHours),
      approvedHours: formatDuration(approvedHours),
      approvalRate: total > 0 ? Math.round((approved / (approved + rejected)) * 100) : 0
    };
  }, [historyEntries]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Approval History</h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Complete audit trail of time entry submissions and approvals
        </p>
      </div>

      {/* Filters */}
      <div 
        className="p-4 rounded-lg shadow" 
        style={{ 
          backgroundColor: 'var(--surface-color)', 
          border: '1px solid var(--border-color)' 
        }}
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Filters:</span>
          </div>
          
          {/* Status Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="rounded-md text-sm focus:ring-2 focus:ring-offset-2"
            style={{
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--background-color)',
              color: 'var(--text-primary)',
              '--tw-ring-color': 'var(--color-primary-600)'
            } as React.CSSProperties}
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="rounded-md text-sm focus:ring-2 focus:ring-offset-2"
            style={{
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--background-color)',
              color: 'var(--text-primary)',
              '--tw-ring-color': 'var(--color-primary-600)'
            } as React.CSSProperties}
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="all">All Time</option>
          </select>

          {/* Search */}
          <input
            type="text"
            placeholder="Search entries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-md text-sm focus:ring-2 focus:ring-offset-2 flex-1 min-w-0"
            style={{
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--background-color)',
              color: 'var(--text-primary)',
              '--tw-ring-color': 'var(--color-primary-600)'
            } as React.CSSProperties}
          />
        </div>
      </div>

      {/* Summary Stats */}
      {historyEntries.length > 0 && (
        <div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg"
          style={{ 
            backgroundColor: 'var(--surface-color)', 
            border: '1px solid var(--border-color)' 
          }}
        >
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {summaryStats.total}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Entries</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--color-success-600)' }}>
              {summaryStats.approved}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Approved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--color-error-600)' }}>
              {summaryStats.rejected}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Rejected</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--color-warning-600)' }}>
              {summaryStats.pending}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Pending</div>
          </div>
        </div>
      )}

      {/* History List */}
      {historyEntries.length === 0 ? (
        <div 
          className="text-center py-12 rounded-lg"
          style={{ backgroundColor: 'var(--surface-color)' }}
        >
          <ClockIcon className="mx-auto h-12 w-12 mb-4" style={{ color: 'var(--text-secondary)' }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            No approval history found
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            {filter === 'all' 
              ? 'No time entries have been submitted for approval yet.'
              : `No ${filter} entries found for the selected time period.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {historyEntries.map((entry) => {
            const { user, project, approver } = getEntryDetails(entry);
            const actionDate = getActionDate(entry);
            const statusStyle = getStatusStyle(entry.status);

            return (
              <div
                key={entry.id}
                className="p-4 rounded-lg shadow-sm border"
                style={{ 
                  backgroundColor: 'var(--surface-color)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Entry Header */}
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(entry.status)}
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium border"
                        style={statusStyle}
                      >
                        {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                      </span>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {formatDuration(entry.duration)}
                      </span>
                    </div>

                    {/* Project and Description */}
                    <div className="mb-2">
                      <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {project?.name || 'Unknown Project'}
                      </h4>
                      {project?.client && (
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {project.client.name}
                        </p>
                      )}
                      <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>
                        {entry.description}
                      </p>
                    </div>

                    {/* Entry Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {new Date(entry.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <UserIcon className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {user?.name || 'Unknown User'}
                        </span>
                      </div>
                      {approver && (
                        <div className="flex items-center space-x-2">
                          <CheckIcon className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {approver.name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Comments */}
                    {entry.comment && (
                      <div 
                        className="mt-3 p-3 rounded border-l-4"
                        style={{ 
                          backgroundColor: 'var(--surface-secondary)',
                          borderLeftColor: 'var(--color-primary-600)'
                        }}
                      >
                        <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                          <span className="font-medium">Comment:</span> {entry.comment}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Date */}
                  <div className="text-right text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <div>{actionDate.toLocaleDateString()}</div>
                    <div>{actionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 