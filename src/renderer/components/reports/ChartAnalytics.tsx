import React, { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, subWeeks, subMonths } from 'date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ChartAnalytics: React.FC = () => {
  const { state } = useAppContext();
  const { timeEntries, projects, clients } = state;

  // Chart color palette
  const colors = {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6',
    pink: '#EC4899',
    indigo: '#6366F1',
    teal: '#14B8A6',
  };

  // Weekly hours trend data
  const weeklyTrendData = useMemo(() => {
    const weeks = [];
    const now = new Date();
    
    // Get last 8 weeks
    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(now, i));
      const weekEnd = endOfWeek(weekStart);
      weeks.push({ start: weekStart, end: weekEnd });
    }

    const data = weeks.map(week => {
      const weekEntries = timeEntries.filter(entry => {
        const entryDate = parseISO(entry.date);
        return entryDate >= week.start && entryDate <= week.end;
      });
      
      return {
        week: format(week.start, 'MMM dd'),
        billableHours: weekEntries
          .filter(entry => entry.isBillable)
          .reduce((sum, entry) => sum + entry.duration / 60, 0),
        nonBillableHours: weekEntries
          .filter(entry => !entry.isBillable)
          .reduce((sum, entry) => sum + entry.duration / 60, 0),
      };
    });

    return {
      labels: data.map(d => d.week),
      datasets: [
        {
          label: 'Billable Hours',
          data: data.map(d => d.billableHours),
          backgroundColor: colors.primary,
          borderColor: colors.primary,
          borderWidth: 2,
          fill: false,
        },
        {
          label: 'Non-billable Hours',
          data: data.map(d => d.nonBillableHours),
          backgroundColor: colors.secondary,
          borderColor: colors.secondary,
          borderWidth: 2,
          fill: false,
        },
      ],
    };
  }, [timeEntries]);

  // Project distribution data
  const projectDistributionData = useMemo(() => {
    const projectHours: { [projectId: string]: number } = {};
    
    timeEntries.forEach(entry => {
      if (!projectHours[entry.projectId]) {
        projectHours[entry.projectId] = 0;
      }
      projectHours[entry.projectId] += entry.duration / 60;
    });

    const sortedProjects = Object.entries(projectHours)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5); // Top 5 projects

    const backgroundColors = [colors.primary, colors.secondary, colors.accent, colors.purple, colors.pink];

    return {
      labels: sortedProjects.map(([projectId]) => {
        const project = projects.find(p => p.id === projectId);
        const client = clients.find(c => c.id === project?.clientId);
        return `${project?.name} (${client?.name})`;
      }),
      datasets: [
        {
          data: sortedProjects.map(([, hours]) => hours),
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map(color => color),
          borderWidth: 2,
        },
      ],
    };
  }, [timeEntries, projects, clients]);

  // Daily productivity data for current week
  const dailyProductivityData = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const data = days.map(day => {
      const dayEntries = timeEntries.filter(entry => {
        const entryDate = parseISO(entry.date);
        return format(entryDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
      });

      return {
        day: format(day, 'EEE'),
        hours: dayEntries.reduce((sum, entry) => sum + entry.duration / 60, 0),
        entries: dayEntries.length,
      };
    });

    return {
      labels: data.map(d => d.day),
      datasets: [
        {
          label: 'Hours Logged',
          data: data.map(d => d.hours),
          backgroundColor: colors.primary + '80', // Semi-transparent
          borderColor: colors.primary,
          borderWidth: 2,
          fill: true,
        },
      ],
    };
  }, [timeEntries]);

  // Status breakdown data
  const statusBreakdownData = useMemo(() => {
    const statusCounts = timeEntries.reduce((acc, entry) => {
      acc[entry.status] = (acc[entry.status] || 0) + 1;
      return acc;
    }, {} as { [status: string]: number });

    const colors_map = {
      draft: colors.accent,
      submitted: colors.purple,
      approved: colors.secondary,
      rejected: colors.danger,
    };

    return {
      labels: Object.keys(statusCounts).map(status => 
        status.charAt(0).toUpperCase() + status.slice(1)
      ),
      datasets: [
        {
          data: Object.values(statusCounts),
          backgroundColor: Object.keys(statusCounts).map(status => colors_map[status as keyof typeof colors_map]),
          borderColor: Object.keys(statusCounts).map(status => colors_map[status as keyof typeof colors_map]),
          borderWidth: 2,
        },
      ],
    };
  }, [timeEntries]);

  // Revenue trend data
  const revenueTrendData = useMemo(() => {
    const months = [];
    const now = new Date();
    
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfWeek(subMonths(now, i));
      months.push(monthStart);
    }

    const data = months.map(month => {
      const monthEntries = timeEntries.filter(entry => {
        const entryDate = parseISO(entry.date);
        return format(entryDate, 'yyyy-MM') === format(month, 'yyyy-MM') && 
               entry.isBillable && 
               entry.status === 'approved';
      });
      
      const revenue = monthEntries.reduce((sum, entry) => {
        const project = projects.find(p => p.id === entry.projectId);
        const hours = entry.duration / 60;
        const rate = project?.hourlyRate || 0;
        return sum + (hours * rate);
      }, 0);

      return {
        month: format(month, 'MMM yyyy'),
        revenue,
      };
    });

    return {
      labels: data.map(d => d.month),
      datasets: [
        {
          label: 'Revenue',
          data: data.map(d => d.revenue),
          backgroundColor: colors.secondary + '40',
          borderColor: colors.secondary,
          borderWidth: 3,
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [timeEntries, projects]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed.toFixed(1)}h (${percentage}%)`;
          }
        }
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">Analytics & Charts</h2>
        <p className="text-neutral-600">Visual insights into your time tracking data</p>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Hours Trend */}
        <div className="bg-white rounded-xl shadow-soft p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Weekly Hours Trend</h3>
          <div className="h-64">
            <Line data={weeklyTrendData} options={chartOptions} />
          </div>
        </div>

        {/* Project Distribution */}
        <div className="bg-white rounded-xl shadow-soft p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Project Time Distribution</h3>
          <div className="h-64">
            <Doughnut data={projectDistributionData} options={pieChartOptions} />
          </div>
        </div>

        {/* Daily Productivity */}
        <div className="bg-white rounded-xl shadow-soft p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">This Week's Productivity</h3>
          <div className="h-64">
            <Bar data={dailyProductivityData} options={chartOptions} />
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-white rounded-xl shadow-soft p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Entry Status Distribution</h3>
          <div className="h-64">
            <Pie data={statusBreakdownData} options={pieChartOptions} />
          </div>
        </div>
      </div>

      {/* Revenue Trend - Full Width */}
      <div className="bg-white rounded-xl shadow-soft p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Revenue Trend (Approved Billable Hours)</h3>
        <div className="h-80">
          <Line 
            data={revenueTrendData} 
            options={{
              ...chartOptions,
              scales: {
                ...chartOptions.scales,
                y: {
                  ...chartOptions.scales.y,
                  ticks: {
                    callback: function(value: any) {
                      return '$' + value.toLocaleString();
                    }
                  }
                }
              },
              plugins: {
                ...chartOptions.plugins,
                tooltip: {
                  ...chartOptions.plugins.tooltip,
                  callbacks: {
                    label: function(context: any) {
                      return `Revenue: $${context.parsed.y.toLocaleString()}`;
                    }
                  }
                }
              }
            }} 
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-soft p-6 text-white">
          <h4 className="text-lg font-semibold mb-2">Average Daily Hours</h4>
          <p className="text-3xl font-bold">
            {(timeEntries.reduce((sum, entry) => sum + entry.duration, 0) / 60 / Math.max(1, new Set(timeEntries.map(e => e.date)).size)).toFixed(1)}h
          </p>
          <p className="text-blue-100 text-sm">Across all tracked days</p>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-soft p-6 text-white">
          <h4 className="text-lg font-semibold mb-2">Billable Rate</h4>
          <p className="text-3xl font-bold">
            {((timeEntries.filter(e => e.isBillable).length / Math.max(1, timeEntries.length)) * 100).toFixed(1)}%
          </p>
          <p className="text-green-100 text-sm">Of all time entries</p>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-soft p-6 text-white">
          <h4 className="text-lg font-semibold mb-2">Approval Rate</h4>
          <p className="text-3xl font-bold">
            {((timeEntries.filter(e => e.status === 'approved').length / Math.max(1, timeEntries.filter(e => e.status !== 'draft').length)) * 100).toFixed(1)}%
          </p>
          <p className="text-purple-100 text-sm">Of submitted entries</p>
        </div>
      </div>
    </div>
  );
};

export default ChartAnalytics; 