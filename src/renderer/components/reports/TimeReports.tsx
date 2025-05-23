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
      const hourlyRate = project?.hourlyRate || 0;
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
        <h2 className="text-2xl font-bold text-neutral-900">Time Reports</h2>
        <p className="text-neutral-600">View and analyze time tracking data</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-soft p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Date Range
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
              className="w-full rounded-lg border-neutral-300 text-sm"
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
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full rounded-lg border-neutral-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full rounded-lg border-neutral-300 text-sm"
                />
              </div>
            </>
          )}

          {/* Project Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Project
            </label>
            <select
              value={filters.projectId || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, projectId: e.target.value || undefined }))}
              className="w-full rounded-lg border-neutral-300 text-sm"
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
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Status
            </label>
            <select
              value={filters.status || 'all'}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value === 'all' ? 'all' : e.target.value as any }))}
              className="w-full rounded-lg border-neutral-300 text-sm"
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
              className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-neutral-700">Show billable time only</span>
          </label>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Total Hours</p>
              <p className="text-2xl font-bold text-neutral-900">{summary.totalHours.toFixed(1)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Billable Hours</p>
              <p className="text-2xl font-bold text-neutral-900">{summary.billableHours.toFixed(1)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Total Amount</p>
              <p className="text-2xl font-bold text-neutral-900">${summary.totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center">
            <CalendarIcon className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Entries</p>
              <p className="text-2xl font-bold text-neutral-900">{summary.entriesCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Project Breakdown */}
      <div className="bg-white rounded-xl shadow-soft p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Project Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {Object.entries(summary.projectBreakdown).map(([projectId, data]) => {
                const project = projects.find(p => p.id === projectId);
                const client = clients.find(c => c.id === project?.clientId);
                return (
                  <tr key={projectId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                      {project?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {client?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                      {data.hours.toFixed(1)}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                      ${data.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      ${project?.hourlyRate}/hr
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Time Entries */}
      <div className="bg-white rounded-xl shadow-soft p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Time Entries</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Billable
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {filteredEntries.map(entry => {
                const project = projects.find(p => p.id === entry.projectId);
                const hours = entry.duration / 60;
                const amount = entry.isBillable ? hours * (project?.hourlyRate || 0) : 0;
                
                return (
                  <tr key={entry.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                      {format(parseISO(entry.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                      {project?.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-900 max-w-xs truncate">
                      {entry.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                      {formatHours(entry.duration)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        entry.isBillable 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-neutral-100 text-neutral-800'
                      }`}>
                        {entry.isBillable ? 'Billable' : 'Non-billable'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        entry.status === 'approved' ? 'bg-green-100 text-green-800' :
                        entry.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                        entry.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-neutral-100 text-neutral-800'
                      }`}>
                        {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
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