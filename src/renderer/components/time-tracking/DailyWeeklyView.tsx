import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useDataLoader } from '../../hooks/useDataLoader';
import { apiClient, DailySummaryResponse, WeeklyOverview, UserWorkSchedule } from '../../services/api-client';
import QuickTimeEntryModal from './QuickTimeEntryModal';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  subDays, 
  isSameDay, 
  parseISO,
  startOfDay,
  endOfDay,
  differenceInMinutes,
  addWeeks,
  subWeeks
} from 'date-fns';
import { 
  CalendarIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

// Use API types directly - no need for local interfaces

const DailyWeeklyView: React.FC = () => {
  const { state } = useAppContext();
  const { loadTimeEntries } = useDataLoader();
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('weekly');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [dailySummaryData, setDailySummaryData] = useState<DailySummaryResponse | null>(null);
  const [weeklyOverviewData, setWeeklyOverviewData] = useState<WeeklyOverview | null>(null);
  const [workSchedule, setWorkSchedule] = useState<UserWorkSchedule | null>(null);
  const [quickEntryModal, setQuickEntryModal] = useState<{
    isOpen: boolean;
    date: string;
    startTime?: string;
    endTime?: string;
    suggestedDuration?: number;
  }>({
    isOpen: false,
    date: '',
  });

  // Calculate current week range
  const weekRange = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(selectedDate, { weekStartsOn: 1 }); // Sunday
    return { start, end };
  }, [selectedDate]);

  // Filter time entries for current period
  const filteredTimeEntries = useMemo(() => {
    if (viewMode === 'daily') {
      return state.timeEntries.filter(entry => 
        isSameDay(parseISO(entry.date), selectedDate)
      );
    } else {
      return state.timeEntries.filter(entry => {
        const entryDate = parseISO(entry.date);
        return entryDate >= weekRange.start && entryDate <= weekRange.end;
      });
    }
  }, [state.timeEntries, selectedDate, viewMode, weekRange]);

  // Load work schedule on component mount
  useEffect(() => {
    const loadWorkSchedule = async () => {
      try {
        const schedule = await apiClient.getUserWorkSchedule();
        setWorkSchedule(schedule);
      } catch (error) {
        console.error('Failed to load work schedule:', error);
        // Use default schedule if API fails
        setWorkSchedule({
          userId: 'current',
          schedule: {
            monday: { start: '09:00', end: '17:00', targetHours: 8 },
            tuesday: { start: '09:00', end: '17:00', targetHours: 8 },
            wednesday: { start: '09:00', end: '17:00', targetHours: 8 },
            thursday: { start: '09:00', end: '17:00', targetHours: 8 },
            friday: { start: '09:00', end: '17:00', targetHours: 8 },
            saturday: { start: null, end: null, targetHours: 0 },
            sunday: { start: null, end: null, targetHours: 0 }
          },
          timezone: 'America/New_York',
          weeklyTargetHours: 40
        });
      }
    };

    loadWorkSchedule();
  }, []);

  // Navigation handlers
  const navigatePrevious = () => {
    if (viewMode === 'daily') {
      setSelectedDate(subDays(selectedDate, 1));
    } else {
      setSelectedDate(subWeeks(selectedDate, 1));
    }
  };

  const navigateNext = () => {
    if (viewMode === 'daily') {
      setSelectedDate(addDays(selectedDate, 1));
    } else {
      setSelectedDate(addWeeks(selectedDate, 1));
    }
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const openQuickEntry = (date: string, startTime?: string, endTime?: string, suggestedDuration?: number) => {
    setQuickEntryModal({
      isOpen: true,
      date,
      startTime,
      endTime,
      suggestedDuration
    });
  };

  const closeQuickEntry = () => {
    setQuickEntryModal({
      isOpen: false,
      date: '',
    });
  };

  // Load data when date range changes
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (viewMode === 'daily') {
          const dailyData = await apiClient.getDailySummary({
            startDate: format(selectedDate, 'yyyy-MM-dd'),
            endDate: format(selectedDate, 'yyyy-MM-dd'),
            includeGaps: true
          });
          setDailySummaryData(dailyData);
          setWeeklyOverviewData(null);
        } else {
          const weeklyData = await apiClient.getWeeklyOverview({
            weekStartDate: format(weekRange.start, 'yyyy-MM-dd'),
            includeComparison: true
          });
          setWeeklyOverviewData(weeklyData);
          setDailySummaryData(null);
        }
      } catch (error) {
        console.error('Failed to load time tracking data:', error);
        // Fallback to loading time entries for basic functionality
        try {
          if (viewMode === 'daily') {
            await loadTimeEntries({
              startDate: format(selectedDate, 'yyyy-MM-dd'),
              endDate: format(selectedDate, 'yyyy-MM-dd')
            });
          } else {
            await loadTimeEntries({
              startDate: format(weekRange.start, 'yyyy-MM-dd'),
              endDate: format(weekRange.end, 'yyyy-MM-dd')
            });
          }
        } catch (fallbackError) {
          console.error('Failed to load fallback time entries:', fallbackError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedDate, viewMode, weekRange, loadTimeEntries]);

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  const formatTime = (timeString: string): string => {
    return timeString.slice(0, 5); // HH:MM format
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {viewMode === 'daily' ? 'Daily' : 'Weekly'} Time View
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Track your daily and weekly time allocation
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-4">
          <div className="flex rounded-lg p-1" style={{ backgroundColor: 'var(--border-color)' }}>
            <button
              onClick={() => setViewMode('daily')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'daily'
                  ? 'shadow-sm'
                  : ''
              }`}
              style={{
                backgroundColor: viewMode === 'daily' ? 'var(--surface-color)' : 'transparent',
                color: viewMode === 'daily' ? 'var(--color-primary-600)' : 'var(--text-secondary)'
              }}
              onMouseEnter={(e) => {
                if (viewMode !== 'daily') {
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (viewMode !== 'daily') {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              Daily
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'weekly'
                  ? 'shadow-sm'
                  : ''
              }`}
              style={{
                backgroundColor: viewMode === 'weekly' ? 'var(--surface-color)' : 'transparent',
                color: viewMode === 'weekly' ? 'var(--color-primary-600)' : 'var(--text-secondary)'
              }}
              onMouseEnter={(e) => {
                if (viewMode !== 'weekly') {
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (viewMode !== 'weekly') {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              Weekly
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between rounded-lg shadow-sm p-4" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center space-x-4">
          <button
            onClick={navigatePrevious}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.backgroundColor = 'var(--border-color)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {viewMode === 'daily' 
                ? format(selectedDate, 'EEEE, MMMM d, yyyy')
                : `Week of ${format(weekRange.start, 'MMM d')} - ${format(weekRange.end, 'MMM d, yyyy')}`
              }
            </h2>
          </div>

          <button
            onClick={navigateNext}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.backgroundColor = 'var(--border-color)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={goToToday}
          className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
          style={{
            backgroundColor: 'var(--color-primary-600)',
            color: 'var(--color-text-on-primary)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
          }}
        >
          Today
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div 
            className="animate-spin rounded-full h-8 w-8 border-b-2"
            style={{ borderColor: 'var(--color-primary-600)' }}
          />
        </div>
      ) : viewMode === 'weekly' ? (
        weeklyOverviewData ? (
          <WeeklyViewContent summary={weeklyOverviewData} onOpenQuickEntry={openQuickEntry} />
        ) : (
          <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
            No weekly data available. Please try again.
          </div>
        )
      ) : (
        dailySummaryData && dailySummaryData.summaries.length > 0 ? (
          <DailyViewContent summary={dailySummaryData.summaries[0]} onOpenQuickEntry={openQuickEntry} />
        ) : (
          <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
            No daily data available. Please try again.
          </div>
        )
      )}

      {/* Quick Time Entry Modal */}
      <QuickTimeEntryModal
        isOpen={quickEntryModal.isOpen}
        onClose={closeQuickEntry}
        date={quickEntryModal.date}
        startTime={quickEntryModal.startTime}
        endTime={quickEntryModal.endTime}
        suggestedDuration={quickEntryModal.suggestedDuration}
      />
    </div>
  );
};

// Weekly View Component
const WeeklyViewContent: React.FC<{ 
  summary: WeeklyOverview; 
  onOpenQuickEntry: (date: string, startTime?: string, endTime?: string, suggestedDuration?: number) => void;
}> = ({ summary, onOpenQuickEntry }) => {
  return (
    <div className="space-y-6">
      {/* Weekly Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="rounded-lg shadow-sm p-6" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8" style={{ color: 'var(--color-primary-600)' }} />
            <div className="ml-4">
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Total Hours</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {summary.weeklyTotals.totalHours.toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg shadow-sm p-6" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8" style={{ color: 'var(--color-success-600)' }} />
            <div className="ml-4">
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Billable Hours</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {summary.weeklyTotals.billableHours.toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg shadow-sm p-6" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center">
            <CalendarIcon className="h-8 w-8" style={{ color: 'var(--color-warning-600)' }} />
            <div className="ml-4">
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Target Hours</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {summary.weeklyTotals.targetHours.toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg shadow-sm p-6" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center">
            <div 
              className="h-8 w-8 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: summary.weeklyTotals.completionPercentage >= 100 
                  ? 'var(--color-success-50)' 
                  : summary.weeklyTotals.completionPercentage >= 80
                  ? 'var(--color-warning-50)'
                  : 'var(--color-error-50)',
                color: summary.weeklyTotals.completionPercentage >= 100 
                  ? 'var(--color-success-600)' 
                  : summary.weeklyTotals.completionPercentage >= 80
                  ? 'var(--color-warning-600)'
                  : 'var(--color-error-600)'
              }}
            >
              <span className="text-sm font-bold">
                {Math.round(summary.weeklyTotals.completionPercentage)}%
              </span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Completion</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {summary.weeklyTotals.completionPercentage.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Breakdown */}
      <div className="rounded-lg shadow-sm p-6" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Daily Breakdown</h3>
        <div className="grid grid-cols-7 gap-4">
          {summary.dailySummaries.map((day) => (
            <DayCard key={day.date} summary={day} onOpenQuickEntry={onOpenQuickEntry} />
          ))}
        </div>
      </div>
    </div>
  );
};

// Daily View Component
const DailyViewContent: React.FC<{ 
  summary: import('../../services/api-client').DailySummary; 
  onOpenQuickEntry: (date: string, startTime?: string, endTime?: string, suggestedDuration?: number) => void;
}> = ({ summary, onOpenQuickEntry }) => {
  return (
    <div className="space-y-6">
      {/* Daily Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="rounded-lg shadow-sm p-6" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8" style={{ color: 'var(--color-primary-600)' }} />
            <div className="ml-4">
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Total Hours</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {(summary.totalHours || 0).toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg shadow-sm p-6" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8" style={{ color: 'var(--color-success-600)' }} />
            <div className="ml-4">
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Billable Hours</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {(summary.billableHours || 0).toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg shadow-sm p-6" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center">
            <CalendarIcon className="h-8 w-8" style={{ color: 'var(--color-warning-600)' }} />
            <div className="ml-4">
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Target Hours</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {summary.targetHours || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg shadow-sm p-6" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center">
            <div 
              className="h-8 w-8 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: (summary.completionPercentage || 0) >= 100 
                  ? 'var(--color-success-50)' 
                  : (summary.completionPercentage || 0) >= 80
                  ? 'var(--color-warning-50)'
                  : 'var(--color-error-50)',
                color: (summary.completionPercentage || 0) >= 100 
                  ? 'var(--color-success-600)' 
                  : (summary.completionPercentage || 0) >= 80
                  ? 'var(--color-warning-600)'
                  : 'var(--color-error-600)'
              }}
            >
              <span className="text-sm font-bold">
                {Math.round(summary.completionPercentage || 0)}%
              </span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Target Progress</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {(summary.completionPercentage || 0).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Time Gaps Analysis */}
      {summary.timeGaps && summary.timeGaps.length > 0 && (
        <div className="rounded-lg shadow-sm p-6" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center mb-4">
            <ExclamationTriangleIcon className="h-6 w-6 mr-2" style={{ color: 'var(--color-warning-600)' }} />
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Time Gaps Detected</h3>
          </div>
          <div className="space-y-3">
            {summary.timeGaps.map((gap, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 rounded-lg border"
                style={{
                  backgroundColor: 'var(--color-warning-50)',
                  borderColor: 'var(--color-warning-200)'
                }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {gap.startTime} - {gap.endTime}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {(gap.duration || 0).toFixed(1)}h untracked
                  </p>
                </div>
                <button 
                  onClick={() => onOpenQuickEntry(
                    summary.date, 
                    gap.startTime, 
                    gap.endTime, 
                    (gap.duration || 0) * 60 // Convert hours to minutes
                  )}
                  className="flex items-center px-3 py-1 text-xs font-medium rounded-md transition-colors"
                  style={{
                    backgroundColor: 'var(--color-primary-600)',
                    color: 'var(--color-text-on-primary)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
                  }}
                >
                  <PlusIcon className="w-3 h-3 mr-1" />
                  Fill Gap
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Day Card Component for Weekly View
const DayCard: React.FC<{ 
  summary: import('../../services/api-client').DailySummary; 
  onOpenQuickEntry: (date: string, startTime?: string, endTime?: string, suggestedDuration?: number) => void;
}> = ({ summary, onOpenQuickEntry }) => {
  const isToday = isSameDay(parseISO(summary.date), new Date());
  const hasGaps = summary.timeGaps && summary.timeGaps.length > 0;
  
  return (
    <div 
      className="p-4 rounded-lg border-2 transition-colors"
      style={{
        backgroundColor: isToday ? 'var(--color-primary-50)' : 'var(--surface-color)',
        borderColor: isToday ? 'var(--color-primary-500)' : 'var(--border-color)'
      }}
      onMouseEnter={(e) => {
        if (!isToday) {
          e.currentTarget.style.borderColor = 'var(--text-secondary)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isToday) {
          e.currentTarget.style.borderColor = 'var(--border-color)';
        }
      }}
    >
      <div className="text-center">
        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
          {summary.dayOfWeek.slice(0, 3)}
        </p>
        <p className="text-lg font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
          {format(parseISO(summary.date), 'd')}
        </p>
        
        <div className="mt-3 space-y-2">
          <div className="text-sm">
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
              {(summary.totalHours || 0).toFixed(1)}h
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              of {summary.targetHours || 0}h target
            </p>
          </div>
          
          {/* Progress bar */}
          <div className="w-full rounded-full h-2" style={{ backgroundColor: 'var(--border-color)' }}>
            <div 
              className="h-2 rounded-full transition-all"
              style={{ 
                width: `${Math.min(summary.completionPercentage || 0, 100)}%`,
                backgroundColor: (summary.completionPercentage || 0) >= 100 
                  ? 'var(--color-success-500)' 
                  : (summary.completionPercentage || 0) >= 80
                  ? 'var(--color-warning-500)'
                  : 'var(--color-error-500)'
              }}
            />
          </div>
          
          {hasGaps && (
            <div className="flex items-center justify-center">
              <button
                onClick={() => onOpenQuickEntry(summary.date)}
                className="flex items-center text-xs transition-colors"
                style={{ color: 'var(--color-warning-600)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-warning-800)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-warning-600)';
                }}
              >
                <ExclamationTriangleIcon className="w-3 h-3" />
                <span className="ml-1">
                  {summary.timeGaps?.length || 0} gap{(summary.timeGaps?.length || 0) !== 1 ? 's' : ''}
                </span>
              </button>
            </div>
          )}
          
          {/* Quick add button for days with low completion */}
          {!hasGaps && (summary.completionPercentage || 0) < 80 && (
            <button
              onClick={() => onOpenQuickEntry(summary.date)}
              className="flex items-center justify-center text-xs transition-colors"
              style={{ color: 'var(--color-primary-600)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-primary-800)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-primary-600)';
              }}
            >
              <PlusIcon className="w-3 h-3 mr-1" />
              Add Time
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyWeeklyView; 