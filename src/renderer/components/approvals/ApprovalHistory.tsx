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
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'approved':
        return <CheckIcon className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XMarkIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />;
    }
  };

  // Get status color
  const getStatusColor = (status: TimeEntry['status']) => {
    switch (status) {
      case 'submitted': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
      <div className="p-4 rounded-lg shadow" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Filters:</span>
          </div>
          
          {/* Status Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="rounded-md text-sm focus:border-indigo-500 focus:ring-indigo-500"
            style={{
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--background-color)',
              color: 'var(--text-primary)'
            }}
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
            className="rounded-md text-sm focus:border-indigo-500 focus:ring-indigo-500"
            style={{
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--background-color)',
              color: 'var(--text-primary)'
            }}
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
            className="rounded-md text-sm focus:border-indigo-500 focus:ring-indigo-500 min-w-[200px]"
            style={{
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--background-color)',
              color: 'var(--text-primary)'
            }}
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-lg shadow" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{summaryStats.total}</div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Entries</div>
        </div>
        <div className="p-4 rounded-lg shadow" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
          <div className="text-2xl font-bold text-green-600">{summaryStats.approved}</div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Approved</div>
        </div>
        <div className="p-4 rounded-lg shadow" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
          <div className="text-2xl font-bold text-red-600">{summaryStats.rejected}</div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Rejected</div>
        </div>
        <div className="p-4 rounded-lg shadow" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
          <div className="text-2xl font-bold text-yellow-600">{summaryStats.pending}</div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Pending</div>
        </div>
        <div className="p-4 rounded-lg shadow" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{summaryStats.totalHours}</div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Time</div>
        </div>
        <div className="p-4 rounded-lg shadow" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
          <div className="text-2xl font-bold text-indigo-600">{summaryStats.approvalRate}%</div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Approval Rate</div>
        </div>
      </div>

      {/* History List */}
      <div className="shadow overflow-hidden sm:rounded-md" style={{ backgroundColor: 'var(--surface-color)' }}>
        {historyEntries.length === 0 ? (
          <div className="p-6 text-center">
            <ClockIcon className="mx-auto h-12 w-12" style={{ color: 'var(--text-secondary)' }} />
            <h3 className="mt-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>No history found</h3>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              No time entries match your current filters.
            </p>
          </div>
        ) : (
          <ul style={{ borderColor: 'var(--border-color)' }} className="divide-y">
            {historyEntries.map((entry) => {
              const { user, project, approver } = getEntryDetails(entry);
              const actionDate = getActionDate(entry);
              
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
                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                      {getStatusIcon(entry.status)}
                    </div>

                    {/* Entry Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                              {project?.name || 'Unknown Project'}
                            </p>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                              {user?.name || 'Unknown User'}
                              {project?.client && ` • ${project.client.name}`}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(entry.status)}`}>
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
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Billable
                          </span>
                        )}
                      </div>

                      {entry.description && (
                        <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                          {entry.description}
                        </p>
                      )}

                      {/* Approval/Rejection Details */}
                      <div className="mt-2 space-y-1">
                        {entry.submittedAt && (
                          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            <span className="font-medium">Submitted:</span> {new Date(entry.submittedAt).toLocaleString()}
                          </div>
                        )}
                        
                        {entry.approvedAt && approver && (
                          <div className="text-xs text-green-600">
                            <span className="font-medium">Approved by {approver.name}:</span> {new Date(entry.approvedAt).toLocaleString()}
                          </div>
                        )}
                        
                        {entry.rejectedAt && approver && (
                          <div className="text-xs text-red-600">
                            <span className="font-medium">Rejected by {approver.name}:</span> {new Date(entry.rejectedAt).toLocaleString()}
                          </div>
                        )}
                        
                        {entry.comment && (
                          <div className="mt-2 p-2 rounded-md" style={{ backgroundColor: 'var(--border-color)' }}>
                            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                              <span className="font-medium">
                                {entry.status === 'rejected' ? 'Rejection reason:' : 'Comment:'}
                              </span> {entry.comment}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Pagination could be added here for large datasets */}
    </div>
  );
} 