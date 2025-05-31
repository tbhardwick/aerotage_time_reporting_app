import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { DocumentArrowDownIcon, TableCellsIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

interface ExportFilters {
  dateRange: 'month' | 'custom';
  startDate?: string;
  endDate?: string;
  projectId?: string;
  status?: 'all' | 'approved' | 'submitted' | 'draft' | 'rejected';
  includeDetails: boolean;
  groupBy: 'project' | 'date' | 'none';
}

interface EnrichedTimeEntry {
  id: string;
  projectId: string;
  date: string;
  duration: number;
  description: string;
  isBillable: boolean;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  createdAt: string;
  project: string;
  client: string;
  hours: number;
  amount: number;
  hourlyRate: number;
}

interface ProjectGroup {
  project: string;
  client: string;
  entries: EnrichedTimeEntry[];
  totalHours: number;
  totalAmount: number;
}

interface DateGroup {
  date: string;
  entries: EnrichedTimeEntry[];
  totalHours: number;
  totalAmount: number;
}

type ExportDataType = EnrichedTimeEntry[] | ProjectGroup[] | DateGroup[];

const ExportReports: React.FC = () => {
  const { state } = useAppContext();
  const { timeEntries, projects, clients, user } = state;

  const [filters, setFilters] = useState<ExportFilters>({
    dateRange: 'month',
    status: 'all',
    includeDetails: true,
    groupBy: 'project',
  });

  const [isExporting, setIsExporting] = useState(false);

  // Calculate date range
  const dateRange = useMemo(() => {
    const today = new Date();
    switch (filters.dateRange) {
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

  // Filter and prepare data for export
  const exportData: ExportDataType = useMemo(() => {
    let filteredEntries = timeEntries.filter(entry => {
      // Date filter
      const entryDate = parseISO(entry.date);
      const isInRange = isWithinInterval(entryDate, {
        start: parseISO(dateRange.start),
        end: parseISO(dateRange.end),
      });
      if (!isInRange) return false;

      // Project filter
      if (filters.projectId && entry.projectId !== filters.projectId) return false;

      // Status filter
      if (filters.status !== 'all' && entry.status !== filters.status) return false;

      return true;
    });

    // Add project and client info
    const enrichedEntries: EnrichedTimeEntry[] = filteredEntries.map(entry => {
      const project = projects.find(p => p.id === entry.projectId);
      const client = clients.find(c => c.id === project?.clientId);
      const hours = entry.duration / 60;
      const amount = entry.isBillable ? hours * (project?.defaultHourlyRate || 0) : 0;

      return {
        ...entry,
        project: project?.name || 'Unknown Project',
        client: client?.name || 'Unknown Client',
        hours,
        amount,
        hourlyRate: project?.defaultHourlyRate || 0,
      };
    });

    // Group data if requested
    if (filters.groupBy === 'project') {
      const grouped = enrichedEntries.reduce((acc, entry) => {
        const key = entry.project;
        if (!acc[key]) {
          acc[key] = {
            project: entry.project,
            client: entry.client,
            entries: [],
            totalHours: 0,
            totalAmount: 0,
          };
        }
        acc[key].entries.push(entry);
        acc[key].totalHours += entry.hours;
        acc[key].totalAmount += entry.amount;
        return acc;
      }, {} as Record<string, ProjectGroup>);

      return Object.values(grouped) as ProjectGroup[];
    } else if (filters.groupBy === 'date') {
      const grouped = enrichedEntries.reduce((acc, entry) => {
        const key = entry.date;
        if (!acc[key]) {
          acc[key] = {
            date: entry.date,
            entries: [],
            totalHours: 0,
            totalAmount: 0,
          };
        }
        acc[key].entries.push(entry);
        acc[key].totalHours += entry.hours;
        acc[key].totalAmount += entry.amount;
        return acc;
      }, {} as Record<string, DateGroup>);

      return Object.values(grouped) as DateGroup[];
    }

    return enrichedEntries;
  }, [timeEntries, projects, clients, dateRange, filters]);

  // Calculate summary
  const summary = useMemo(() => {
    const flatEntries = Array.isArray(exportData) && exportData.length > 0 && 'entries' in exportData[0]
      ? (exportData as (ProjectGroup | DateGroup)[]).flatMap(group => group.entries)
      : exportData as EnrichedTimeEntry[];

    return {
      totalHours: flatEntries.reduce((sum, entry) => sum + entry.hours, 0),
      billableHours: flatEntries.filter(entry => entry.isBillable).reduce((sum, entry) => sum + entry.hours, 0),
      totalAmount: flatEntries.reduce((sum, entry) => sum + entry.amount, 0),
      entriesCount: flatEntries.length,
    };
  }, [exportData]);

  // Export to PDF
  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      
      // Header
      doc.setFontSize(20);
      doc.text('Time Report', margin, 30);
      
      doc.setFontSize(12);
      doc.text(`Generated by: ${user?.name || 'Aerotage User'}`, margin, 45);
      doc.text(`Date Range: ${format(parseISO(dateRange.start), 'MMM dd, yyyy')} - ${format(parseISO(dateRange.end), 'MMM dd, yyyy')}`, margin, 55);
      doc.text(`Generated on: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, margin, 65);

      // Summary
      let yPos = 85;
      doc.setFontSize(14);
      doc.text('Summary', margin, yPos);
      yPos += 15;
      
      doc.setFontSize(10);
      doc.text(`Total Hours: ${summary.totalHours.toFixed(1)}`, margin, yPos);
      doc.text(`Billable Hours: ${summary.billableHours.toFixed(1)}`, margin + 80, yPos);
      yPos += 10;
      doc.text(`Total Amount: $${summary.totalAmount.toLocaleString()}`, margin, yPos);
      doc.text(`Total Entries: ${summary.entriesCount}`, margin + 80, yPos);
      yPos += 20;

      // Table headers
      doc.setFontSize(8);
      const headers = ['Date', 'Project', 'Client', 'Description', 'Hours', 'Billable', 'Amount'];
      const colWidths = [25, 35, 35, 50, 20, 20, 25];
      let xPos = margin;
      
      headers.forEach((header, i) => {
        doc.text(header, xPos, yPos);
        xPos += colWidths[i];
      });
      yPos += 10;

      // Table data
      const flatEntries = Array.isArray(exportData) && exportData.length > 0 && 'entries' in exportData[0]
        ? (exportData as (ProjectGroup | DateGroup)[]).flatMap(group => group.entries)
        : exportData as EnrichedTimeEntry[];

      flatEntries.forEach((entry) => {
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = 30;
        }

        xPos = margin;
        const rowData = [
          format(parseISO(entry.date), 'MM/dd/yy'),
          entry.project.substring(0, 15),
          entry.client.substring(0, 15),
          entry.description.substring(0, 25),
          entry.hours.toFixed(1),
          entry.isBillable ? 'Yes' : 'No',
          `$${entry.amount.toFixed(0)}`,
        ];

        rowData.forEach((data, i) => {
          doc.text(data, xPos, yPos);
          xPos += colWidths[i];
        });
        yPos += 8;
      });

      // Save
      const filename = `time-report-${format(parseISO(dateRange.start), 'yyyy-MM-dd')}-to-${format(parseISO(dateRange.end), 'yyyy-MM-dd')}.pdf`;
      doc.save(filename);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error exporting PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Export to Excel
  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ['Time Report Summary'],
        ['Generated by:', user?.name || 'Aerotage User'],
        ['Date Range:', `${format(parseISO(dateRange.start), 'MMM dd, yyyy')} - ${format(parseISO(dateRange.end), 'MMM dd, yyyy')}`],
        ['Generated on:', format(new Date(), 'MMM dd, yyyy HH:mm')],
        [],
        ['Total Hours:', summary.totalHours.toFixed(1)],
        ['Billable Hours:', summary.billableHours.toFixed(1)],
        ['Total Amount:', `$${summary.totalAmount.toLocaleString()}`],
        ['Total Entries:', summary.entriesCount],
      ];

      const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');

      // Detailed data sheet
      const flatEntries = Array.isArray(exportData) && exportData.length > 0 && 'entries' in exportData[0]
        ? (exportData as (ProjectGroup | DateGroup)[]).flatMap(group => group.entries)
        : exportData as EnrichedTimeEntry[];

      const detailData = [
        ['Date', 'Project', 'Client', 'Description', 'Duration (Hours)', 'Billable', 'Status', 'Hourly Rate', 'Amount'],
        ...flatEntries.map((entry) => [
          format(parseISO(entry.date), 'MM/dd/yyyy'),
          entry.project,
          entry.client,
          entry.description,
          entry.hours.toFixed(2),
          entry.isBillable ? 'Yes' : 'No',
          entry.status.charAt(0).toUpperCase() + entry.status.slice(1),
          `$${entry.hourlyRate}`,
          `$${entry.amount.toFixed(2)}`,
        ])
      ];

      const detailWS = XLSX.utils.aoa_to_sheet(detailData);
      XLSX.utils.book_append_sheet(wb, detailWS, 'Time Entries');

      // If grouped, add group summary sheet
      if (filters.groupBy !== 'none' && Array.isArray(exportData) && exportData.length > 0 && 'entries' in exportData[0]) {
        const groupData = [
          filters.groupBy === 'project' 
            ? ['Project', 'Client', 'Total Hours', 'Total Amount', 'Entry Count']
            : ['Date', 'Total Hours', 'Total Amount', 'Entry Count'],
          ...(exportData as (ProjectGroup | DateGroup)[]).map((group) => 
            filters.groupBy === 'project'
              ? [(group as ProjectGroup).project, (group as ProjectGroup).client, group.totalHours.toFixed(2), `$${group.totalAmount.toFixed(2)}`, group.entries.length]
              : [format(parseISO((group as DateGroup).date), 'MM/dd/yyyy'), group.totalHours.toFixed(2), `$${group.totalAmount.toFixed(2)}`, group.entries.length]
          )
        ];

        const groupWS = XLSX.utils.aoa_to_sheet(groupData);
        XLSX.utils.book_append_sheet(wb, groupWS, `By ${filters.groupBy.charAt(0).toUpperCase() + filters.groupBy.slice(1)}`);
      }

      // Save
      const filename = `time-report-${format(parseISO(dateRange.start), 'yyyy-MM-dd')}-to-${format(parseISO(dateRange.end), 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert('Error exporting Excel file. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Export to CSV
  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      const flatEntries = Array.isArray(exportData) && exportData.length > 0 && 'entries' in exportData[0]
        ? (exportData as (ProjectGroup | DateGroup)[]).flatMap(group => group.entries)
        : exportData as EnrichedTimeEntry[];

      const csvData = [
        ['Date', 'Project', 'Client', 'Description', 'Duration (Hours)', 'Billable', 'Status', 'Hourly Rate', 'Amount'],
        ...flatEntries.map((entry) => [
          format(parseISO(entry.date), 'MM/dd/yyyy'),
          entry.project,
          entry.client,
          entry.description,
          entry.hours.toFixed(2),
          entry.isBillable ? 'Yes' : 'No',
          entry.status.charAt(0).toUpperCase() + entry.status.slice(1),
          entry.hourlyRate,
          entry.amount.toFixed(2),
        ])
      ];

      const csvContent = csvData.map(row => 
        row.map(field => `"${field}"`).join(',')
      ).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `time-report-${format(parseISO(dateRange.start), 'yyyy-MM-dd')}-to-${format(parseISO(dateRange.end), 'yyyy-MM-dd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error exporting CSV file. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Export Reports</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Export time reports in various formats</p>
      </div>

      {/* Export Configuration */}
      <div 
        className="rounded-xl shadow-soft p-6"
        style={{ backgroundColor: 'var(--surface-color)' }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Export Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                backgroundColor: 'var(--surface-color)',
                color: 'var(--text-primary)'
              }}
            >
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
                    backgroundColor: 'var(--surface-color)',
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
                    backgroundColor: 'var(--surface-color)',
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
                backgroundColor: 'var(--surface-color)',
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
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
              className="w-full rounded-lg text-sm"
              style={{
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--surface-color)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved Only</option>
              <option value="submitted">Submitted</option>
              <option value="draft">Draft</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Group By */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Group By
            </label>
            <select
              value={filters.groupBy}
              onChange={(e) => setFilters(prev => ({ ...prev, groupBy: e.target.value as any }))}
              className="w-full rounded-lg text-sm"
              style={{
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--surface-color)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="none">No Grouping</option>
              <option value="project">Project</option>
              <option value="date">Date</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.includeDetails}
              onChange={(e) => setFilters(prev => ({ ...prev, includeDetails: e.target.checked }))}
              className="rounded focus:ring-2 focus:ring-offset-2"
              style={{
                border: '1px solid var(--border-color)',
                color: 'var(--color-primary-600)'
              }}
            />
            <span className="ml-2 text-sm" style={{ color: 'var(--text-primary)' }}>Include detailed descriptions</span>
          </label>
        </div>
      </div>

      {/* Export Summary */}
      <div 
        className="rounded-xl shadow-soft p-6"
        style={{ backgroundColor: 'var(--surface-color)' }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Export Preview</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--color-primary-600)' }}>{summary.totalHours.toFixed(1)}</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Hours</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--color-success-600)' }}>{summary.billableHours.toFixed(1)}</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Billable Hours</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--color-secondary-600)' }}>${summary.totalAmount.toLocaleString()}</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Amount</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--color-warning-600)' }}>{summary.entriesCount}</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Entries</p>
          </div>
        </div>

        <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-secondary-50)' }}>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            <strong>Date Range:</strong> {format(parseISO(dateRange.start), 'MMM dd, yyyy')} - {format(parseISO(dateRange.end), 'MMM dd, yyyy')}
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            <strong>Grouping:</strong> {filters.groupBy === 'none' ? 'No grouping' : `Grouped by ${filters.groupBy}`}
          </p>
        </div>
      </div>

      {/* Export Buttons */}
      <div 
        className="rounded-xl shadow-soft p-6"
        style={{ backgroundColor: 'var(--surface-color)' }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Export Options</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* PDF Export */}
          <button
            onClick={exportToPDF}
            disabled={isExporting || summary.entriesCount === 0}
            className="flex items-center justify-center px-6 py-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{
              backgroundColor: 'var(--color-error-600)',
              color: 'var(--color-text-on-primary)'
            }}
            onMouseEnter={(e) => {
              if (!isExporting && summary.entriesCount > 0) {
                e.currentTarget.style.backgroundColor = 'var(--color-error-700)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isExporting && summary.entriesCount > 0) {
                e.currentTarget.style.backgroundColor = 'var(--color-error-600)';
              }
            }}
          >
            <DocumentTextIcon className="h-6 w-6 mr-3" />
            <div className="text-left">
              <p className="font-semibold">Export PDF</p>
              <p className="text-sm" style={{ color: 'var(--color-error-100)' }}>Professional report format</p>
            </div>
          </button>

          {/* Excel Export */}
          <button
            onClick={exportToExcel}
            disabled={isExporting || summary.entriesCount === 0}
            className="flex items-center justify-center px-6 py-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{
              backgroundColor: 'var(--color-success-600)',
              color: 'var(--color-text-on-primary)'
            }}
            onMouseEnter={(e) => {
              if (!isExporting && summary.entriesCount > 0) {
                e.currentTarget.style.backgroundColor = 'var(--color-success-700)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isExporting && summary.entriesCount > 0) {
                e.currentTarget.style.backgroundColor = 'var(--color-success-600)';
              }
            }}
          >
            <TableCellsIcon className="h-6 w-6 mr-3" />
            <div className="text-left">
              <p className="font-semibold">Export Excel</p>
              <p className="text-sm" style={{ color: 'var(--color-success-100)' }}>Spreadsheet with multiple sheets</p>
            </div>
          </button>

          {/* CSV Export */}
          <button
            onClick={exportToCSV}
            disabled={isExporting || summary.entriesCount === 0}
            className="flex items-center justify-center px-6 py-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{
              backgroundColor: 'var(--color-primary-600)',
              color: 'var(--color-text-on-primary)'
            }}
            onMouseEnter={(e) => {
              if (!isExporting && summary.entriesCount > 0) {
                e.currentTarget.style.backgroundColor = 'var(--color-primary-700)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isExporting && summary.entriesCount > 0) {
                e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
              }
            }}
          >
            <DocumentArrowDownIcon className="h-6 w-6 mr-3" />
            <div className="text-left">
              <p className="font-semibold">Export CSV</p>
              <p className="text-sm" style={{ color: 'var(--color-primary-100)' }}>Simple data format</p>
            </div>
          </button>
        </div>

        {isExporting && (
          <div className="mt-4 text-center">
            <div 
              className="inline-flex items-center px-4 py-2 rounded-lg"
              style={{
                backgroundColor: 'var(--color-primary-50)',
                color: 'var(--color-primary-800)'
              }}
            >
              <div 
                className="animate-spin rounded-full h-4 w-4 border-b-2 mr-2"
                style={{ borderColor: 'var(--color-primary-800)' }}
              ></div>
              Generating export...
            </div>
          </div>
        )}

        {summary.entriesCount === 0 && (
          <div className="mt-4 text-center">
            <p style={{ color: 'var(--text-secondary)' }}>No time entries found for the selected criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportReports; 