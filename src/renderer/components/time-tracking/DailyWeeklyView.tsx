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
          <h1 className="text-2xl font-bold text-neutral-900">
            {viewMode === 'daily' ? 'Daily' : 'Weekly'} Time View
          </h1>
          <p className="text-neutral-600">
            Track your daily and weekly time allocation
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-4">
          <div className="flex bg-neutral-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'daily'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'weekly'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Weekly
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={navigatePrevious}
            className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-neutral-400" />
            <h2 className="text-lg font-semibold text-neutral-900">
              {viewMode === 'daily' 
                ? format(selectedDate, 'EEEE, MMMM d, yyyy')
                : `Week of ${format(weekRange.start, 'MMM d')} - ${format(weekRange.end, 'MMM d, yyyy')}`
              }
            </h2>
          </div>

          <button
            onClick={navigateNext}
            className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={goToToday}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Today
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : viewMode === 'weekly' ? (
        weeklyOverviewData ? (
          <WeeklyViewContent summary={weeklyOverviewData} onOpenQuickEntry={openQuickEntry} />
        ) : (
          <div className="text-center py-12 text-neutral-500">
            No weekly data available. Please try again.
          </div>
        )
      ) : (
        dailySummaryData && dailySummaryData.summaries.length > 0 ? (
          <DailyViewContent summary={dailySummaryData.summaries[0]} onOpenQuickEntry={openQuickEntry} />
        ) : (
          <div className="text-center py-12 text-neutral-500">
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
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Total Hours</p>
              <p className="text-2xl font-bold text-neutral-900">
                {summary.weeklyTotals.totalHours.toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Billable Hours</p>
              <p className="text-2xl font-bold text-neutral-900">
                {summary.weeklyTotals.billableHours.toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <CalendarIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Target Hours</p>
              <p className="text-2xl font-bold text-neutral-900">
                {summary.weeklyTotals.targetHours.toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
              summary.weeklyTotals.completionPercentage >= 100 
                ? 'bg-green-100 text-green-600' 
                : summary.weeklyTotals.completionPercentage >= 80
                ? 'bg-yellow-100 text-yellow-600'
                : 'bg-red-100 text-red-600'
            }`}>
              <span className="text-sm font-bold">
                {Math.round(summary.weeklyTotals.completionPercentage)}%
              </span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Completion</p>
              <p className="text-2xl font-bold text-neutral-900">
                {summary.weeklyTotals.completionPercentage.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Breakdown */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Daily Breakdown</h3>
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
  // Debug: Log the summary structure to understand the API response
  console.log('📊 Daily Summary Data:', summary);
  
  return (
    <div className="space-y-6">
      {/* Daily Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Total Hours</p>
              <p className="text-2xl font-bold text-neutral-900">
                {(summary.totalHours || 0).toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Billable Hours</p>
              <p className="text-2xl font-bold text-neutral-900">
                {(summary.billableHours || 0).toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <CalendarIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Entries</p>
              <p className="text-2xl font-bold text-neutral-900">
                {summary.entriesCount || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
              (summary.completionPercentage || 0) >= 100 
                ? 'bg-green-100 text-green-600' 
                : (summary.completionPercentage || 0) >= 80
                ? 'bg-yellow-100 text-yellow-600'
                : 'bg-red-100 text-red-600'
            }`}>
              <span className="text-sm font-bold">
                {Math.round(summary.completionPercentage || 0)}%
              </span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Target Progress</p>
              <p className="text-2xl font-bold text-neutral-900">
                {(summary.completionPercentage || 0).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Time Gaps Analysis */}
      {summary.timeGaps && summary.timeGaps.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-4">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-2" />
            <h3 className="text-lg font-semibold text-neutral-900">Time Gaps Detected</h3>
          </div>
          <div className="space-y-3">
            {summary.timeGaps.map((gap, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    {gap.startTime} - {gap.endTime}
                  </p>
                  <p className="text-xs text-neutral-600">
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
                  className="flex items-center px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
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
    <div className={`p-4 rounded-lg border-2 transition-colors ${
      isToday 
        ? 'border-blue-500 bg-blue-50' 
        : 'border-neutral-200 bg-white hover:border-neutral-300'
    }`}>
      <div className="text-center">
        <p className="text-xs font-medium text-neutral-600 uppercase tracking-wide">
          {summary.dayOfWeek.slice(0, 3)}
        </p>
        <p className="text-lg font-bold text-neutral-900 mt-1">
          {format(parseISO(summary.date), 'd')}
        </p>
        
        <div className="mt-3 space-y-2">
          <div className="text-sm">
            <p className="font-medium text-neutral-900">
              {(summary.totalHours || 0).toFixed(1)}h
            </p>
            <p className="text-xs text-neutral-600">
              of {summary.targetHours || 0}h target
            </p>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                (summary.completionPercentage || 0) >= 100 
                  ? 'bg-green-500' 
                  : (summary.completionPercentage || 0) >= 80
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(summary.completionPercentage || 0, 100)}%` }}
            />
          </div>
          
          {hasGaps && (
            <div className="flex items-center justify-center">
              <button
                onClick={() => onOpenQuickEntry(summary.date)}
                className="flex items-center text-xs text-yellow-600 hover:text-yellow-800 transition-colors"
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
              className="flex items-center justify-center text-xs text-blue-600 hover:text-blue-800 transition-colors"
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