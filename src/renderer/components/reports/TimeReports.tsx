import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { TimeEntry, Project, User, Client } from '../../context/AppContext';
import { format, parseISO, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { CalendarIcon, ClockIcon, CurrencyDollarIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface TimeReportFilters {
  dateRange: 'today' | 'week' | 'month' | 'custom';
  startDate?: string;
  endDate?: string;
  projectId?: string;
  userId?: string;
  status?: TimeEntry['status'] | 'all';
  billableOnly?: boolean;
}

interface TimeReportSummary {
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  totalAmount: number;
  entriesCount: number;
  projectBreakdown: { [projectId: string]: { hours: number; amount: number } };
  statusBreakdown: { [status: string]: number };
}

const TimeReports: React.FC = () => {
  const { state } = useAppContext();
  const { timeEntries, projects, users, clients } = state;

  const [filters, setFilters] = useState<TimeReportFilters>({
    dateRange: 'month',
    status: 'all',
    billableOnly: false,
  });

  // Calculate date range based on filter
  const dateRange = useMemo(() => {
    const today = new Date();
    switch (filters.dateRange) {
      case 'today':
        return {
          start: format(today, 'yyyy-MM-dd'),
          end: format(today, 'yyyy-MM-dd'),
        };
      case 'week':
        return {
          start: format(startOfWeek(today), 'yyyy-MM-dd'),
          end: format(endOfWeek(today), 'yyyy-MM-dd'),
        };
      case 'month':
        return {
          start: format(startOfMonth(today), 'yyyy-MM-dd'),
          end: format(endOfMonth(today), 'yyyy-MM-dd'),
        };
      case 'custom':
        return {
          start: filters.startDate || format(startOfMonth(today), 'yyyy-MM-dd'),
          end: filters.endDate || format(endOfMonth(today), 'yyyy-MM-dd'),
        };
      default:
        return {
          start: format(startOfMonth(today), 'yyyy-MM-dd'),
          end: format(endOfMonth(today), 'yyyy-MM-dd'),
        };
    }
  }, [filters.dateRange, filters.startDate, filters.endDate]);

  // Filter time entries based on criteria
  const filteredEntries = useMemo(() => {
    return timeEntries.filter(entry => {
      // Date range filter
      const entryDate = parseISO(entry.date);
      const isInRange = isWithinInterval(entryDate, {
        start: parseISO(dateRange.start),
        end: parseISO(dateRange.end),
      });

      if (!isInRange) return false;

      // Project filter
      if (filters.projectId && entry.projectId !== filters.projectId) return false;

      // User filter (based on entry creator - would need to add this field in real app)
      // For now, we'll skip this filter since we don't have entry creator data

      // Status filter
      if (filters.status !== 'all' && entry.status !== filters.status) return false;

      // Billable filter
      if (filters.billableOnly && !entry.isBillable) return false;

      return true;
    });
  }, [timeEntries, dateRange, filters]);

  // Calculate summary statistics
  const summary: TimeReportSummary = useMemo(() => {
    const result: TimeReportSummary = {
      totalHours: 0,
      billableHours: 0,
      nonBillableHours: 0,
      totalAmount: 0,
      entriesCount: filteredEntries.length,
      projectBreakdown: {},
      statusBreakdown: {},
    };

    filteredEntries.forEach(entry => {
      const hours = entry.duration / 60; // Convert minutes to hours
      const project = projects.find(p => p.id === entry.projectId);
      const hourlyRate = project?.defaultHourlyRate || 0;
      const amount = entry.isBillable ? hours * hourlyRate : 0;

      result.totalHours += hours;
      if (entry.isBillable) {
        result.billableHours += hours;
        result.totalAmount += amount;
      } else {
        result.nonBillableHours += hours;
      }

      // Project breakdown
      if (!result.projectBreakdown[entry.projectId]) {
        result.projectBreakdown[entry.projectId] = { hours: 0, amount: 0 };
      }
      result.projectBreakdown[entry.projectId].hours += hours;
      result.projectBreakdown[entry.projectId].amount += amount;

      // Status breakdown
      result.statusBreakdown[entry.status] = (result.statusBreakdown[entry.status] || 0) + hours;
    });

    return result;
  }, [filteredEntries, projects]);

  const formatHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Time Reports</h2>
        <p style={{ color: 'var(--text-secondary)' }}>View and analyze time tracking data</p>
      </div>

      {/* Filters */}
      <div className="rounded-xl shadow-sm p-6" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Date Range
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
              className="w-full rounded-lg text-sm"
              style={{
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--background-color)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Range */}
          {filters.dateRange === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full rounded-lg text-sm"
                  style={{
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--background-color)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full rounded-lg text-sm"
                  style={{
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--background-color)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </>
          )}

          {/* Project Filter */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Project
            </label>
            <select
              value={filters.projectId || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, projectId: e.target.value || undefined }))}
              className="w-full rounded-lg text-sm"
              style={{
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--background-color)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="">All Projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name} ({clients.find(c => c.id === project.clientId)?.name})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Status
            </label>
            <select
              value={filters.status || 'all'}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value === 'all' ? 'all' : e.target.value as any }))}
              className="w-full rounded-lg text-sm"
              style={{
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--background-color)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.billableOnly}
              onChange={(e) => setFilters(prev => ({ ...prev, billableOnly: e.target.checked }))}
              className="rounded text-blue-600 focus:ring-blue-500"
              style={{ borderColor: 'var(--border-color)' }}
            />
            <span className="ml-2 text-sm" style={{ color: 'var(--text-primary)' }}>Show billable time only</span>
          </label>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--surface-color)', boxShadow: 'var(--shadow)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Total Hours</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{summary.totalHours.toFixed(1)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--surface-color)', boxShadow: 'var(--shadow)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Billable Hours</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{summary.billableHours.toFixed(1)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--surface-color)', boxShadow: 'var(--shadow)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Total Amount</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>${summary.totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--surface-color)', boxShadow: 'var(--shadow)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center">
            <CalendarIcon className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Entries</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{summary.entriesCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Project Breakdown */}
      <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--surface-color)', boxShadow: 'var(--shadow)', border: '1px solid var(--border-color)' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Project Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y" style={{ borderColor: 'var(--border-color)' }}>
            <thead style={{ backgroundColor: 'var(--background-color)' }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Rate
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)' }}>
              {Object.entries(summary.projectBreakdown).map(([projectId, data]) => {
                const project = projects.find(p => p.id === projectId);
                const client = clients.find(c => c.id === project?.clientId);
                return (
                  <tr key={projectId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {project?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {client?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-primary)' }}>
                      {data.hours.toFixed(1)}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-primary)' }}>
                      ${data.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-secondary)' }}>
                      ${project?.defaultHourlyRate || 'N/A'}/hr
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Time Entries */}
      <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--surface-color)', boxShadow: 'var(--shadow)', border: '1px solid var(--border-color)' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Time Entries</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y" style={{ borderColor: 'var(--border-color)' }}>
            <thead style={{ backgroundColor: 'var(--background-color)' }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Billable
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)' }}>
              {filteredEntries.map(entry => {
                const project = projects.find(p => p.id === entry.projectId);
                const hours = entry.duration / 60;
                const amount = entry.isBillable ? hours * (project?.defaultHourlyRate || 0) : 0;
                
                return (
                  <tr key={entry.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-primary)' }}>
                      {format(parseISO(entry.date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {project?.name}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {entry.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-primary)' }}>
                      {formatHours(entry.duration)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        entry.isBillable 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {entry.isBillable ? 'Billable' : 'Non-billable'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        entry.status === 'approved' ? 'bg-green-100 text-green-800' :
                        entry.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                        entry.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-primary)' }}>
                      ${amount.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TimeReports; 