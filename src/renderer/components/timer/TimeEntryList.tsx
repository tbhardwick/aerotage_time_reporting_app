import React, { useState } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { ClockIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useAppContext, TimeEntry } from '../../context/AppContext';

interface TimeEntryListProps {
  onEdit?: (entry: TimeEntry) => void;
  onDelete?: (entryId: string) => void;
  onSubmit?: (entryId: string) => void;
}

const TimeEntryList: React.FC<TimeEntryListProps> = ({ onEdit, onDelete, onSubmit }) => {
  const { state } = useAppContext();
  const { timeEntries, projects } = state;
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  const getStatusStyle = (status: TimeEntry['status']) => {
    switch (status) {
      case 'draft':
        return {
          backgroundColor: 'var(--surface-secondary)',
          color: 'var(--text-secondary)'
        };
      case 'submitted':
        return {
          backgroundColor: 'var(--color-warning-50)',
          color: 'var(--color-warning-800)'
        };
      case 'approved':
        return {
          backgroundColor: 'var(--color-success-50)',
          color: 'var(--color-success-800)'
        };
      case 'rejected':
        return {
          backgroundColor: 'var(--color-error-50)',
          color: 'var(--color-error-800)'
        };
      default:
        return {
          backgroundColor: 'var(--surface-secondary)',
          color: 'var(--text-secondary)'
        };
    }
  };

  const getEntriesForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return timeEntries.filter(entry => entry.date === dateStr);
  };

  const getWeeklyEntries = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    return weekDays.map(day => ({
      date: day,
      entries: getEntriesForDate(day),
      totalDuration: getEntriesForDate(day).reduce((sum, entry) => sum + entry.duration, 0)
    }));
  };

  const getTotalDuration = (entries: TimeEntry[]) => {
    return entries.reduce((sum, entry) => sum + entry.duration, 0);
  };

  const getBillableDuration = (entries: TimeEntry[]) => {
    return entries.filter(entry => entry.isBillable).reduce((sum, entry) => sum + entry.duration, 0);
  };

  // Get project name for display
  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? `${project.name} (${project.client?.name || 'Unknown Client'})` : 'Unknown Project';
  };

  return (
    <div 
      className="rounded-lg shadow-lg"
      style={{
        backgroundColor: 'var(--surface-color)',
        border: '1px solid var(--border-color)'
      }}
    >
      {/* Header */}
      <div 
        className="px-6 py-4 border-b"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Time Entries</h3>
          
          {/* View Mode Toggle */}
          <div 
            className="flex rounded-lg p-1"
            style={{ backgroundColor: 'var(--color-secondary-50)' }}
          >
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors`}
              style={viewMode === 'daily' 
                ? {
                    backgroundColor: 'var(--surface-color)',
                    color: 'var(--text-primary)',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                  }
                : {
                    color: 'var(--text-secondary)'
                  }
              }
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
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors`}
              style={viewMode === 'weekly' 
                ? {
                    backgroundColor: 'var(--surface-color)',
                    color: 'var(--text-primary)',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                  }
                : {
                    color: 'var(--text-secondary)'
                  }
              }
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

        {/* Date Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedDate(new Date(selectedDate.getTime() - (viewMode === 'daily' ? 86400000 : 604800000)))}
            className="px-3 py-1 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            ← Previous
          </button>
          
          <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>
            {viewMode === 'daily' 
              ? format(selectedDate, 'EEEE, MMMM d, yyyy')
              : `Week of ${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM d')} - ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}`
            }
          </h4>
          
          <button
            onClick={() => setSelectedDate(new Date(selectedDate.getTime() + (viewMode === 'daily' ? 86400000 : 604800000)))}
            className="px-3 py-1 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            Next →
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {viewMode === 'daily' ? (
          // Daily View
          <div>
            {(() => {
              const entries = getEntriesForDate(selectedDate);
              const totalDuration = getTotalDuration(entries);
              const billableDuration = getBillableDuration(entries);
              
              return (
                <>
                  {/* Daily Summary */}
                  <div 
                    className="rounded-lg p-4 mb-6"
                    style={{ backgroundColor: 'var(--color-secondary-50)' }}
                  >
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Time</p>
                        <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{formatDuration(totalDuration)}</p>
                      </div>
                      <div>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Billable</p>
                        <p className="text-lg font-semibold" style={{ color: 'var(--color-success-600)' }}>{formatDuration(billableDuration)}</p>
                      </div>
                      <div>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Non-billable</p>
                        <p className="text-lg font-semibold" style={{ color: 'var(--text-secondary)' }}>{formatDuration(totalDuration - billableDuration)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Time Entries */}
                  {entries.length === 0 ? (
                    <div className="text-center py-8">
                      <ClockIcon className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
                      <p style={{ color: 'var(--text-secondary)' }}>No time entries for this date</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {entries.map((entry) => (
                        <div 
                          key={entry.id} 
                          className="rounded-lg p-4 transition-colors"
                          style={{
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--surface-color)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--color-secondary-50)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--surface-color)';
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <span 
                                  className="px-2 py-1 rounded-full text-xs font-medium"
                                  style={getStatusStyle(entry.status)}
                                >
                                  {entry.status}
                                </span>
                                <span 
                                  className="px-2 py-1 rounded-full text-xs font-medium"
                                  style={{
                                    backgroundColor: entry.isBillable ? 'var(--color-success-50)' : 'var(--surface-secondary)',
                                    color: entry.isBillable ? 'var(--color-success-800)' : 'var(--text-secondary)'
                                  }}
                                >
                                  {entry.isBillable ? 'Billable' : 'Non-billable'}
                                </span>
                              </div>
                              <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>{getProjectName(entry.projectId)}</h4>
                              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{entry.description}</p>
                            </div>
                            
                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{formatDuration(entry.duration)}</p>
                                {entry.startTime && entry.endTime && (
                                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{entry.startTime} - {entry.endTime}</p>
                                )}
                              </div>
                              
                              <div className="flex space-x-2">
                                {entry.status === 'draft' && onSubmit && (
                                  <button
                                    onClick={() => onSubmit(entry.id)}
                                    className="px-3 py-1 text-sm rounded transition-colors"
                                    style={{
                                      backgroundColor: 'var(--color-primary-600)',
                                      color: 'var(--color-text-on-primary)'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = 'var(--color-primary-700)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
                                    }}
                                  >
                                    Submit
                                  </button>
                                )}
                                {onEdit && (
                                  <button
                                    onClick={() => onEdit(entry)}
                                    className="p-2 transition-colors"
                                    style={{ color: 'var(--text-secondary)' }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.color = 'var(--text-primary)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.color = 'var(--text-secondary)';
                                    }}
                                  >
                                    <PencilIcon className="w-4 h-4" />
                                  </button>
                                )}
                                {onDelete && entry.status === 'draft' && (
                                  <button
                                    onClick={() => onDelete(entry.id)}
                                    className="p-2 transition-colors"
                                    style={{ color: 'var(--text-secondary)' }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.color = 'var(--color-error-600)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.color = 'var(--text-secondary)';
                                    }}
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        ) : (
          // Weekly View
          <div className="space-y-4">
            {getWeeklyEntries().map(({ date, entries, totalDuration }) => (
              <div 
                key={date.toISOString()} 
                className="rounded-lg p-4"
                style={{
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--surface-color)'
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {format(date, 'EEEE, MMM d')}
                  </h4>
                  <div className="text-right">
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{formatDuration(totalDuration)}</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{entries.length} entries</p>
                  </div>
                </div>
                
                {entries.length > 0 ? (
                  <div className="space-y-2">
                    {entries.map((entry) => (
                      <div 
                        key={entry.id} 
                        className="flex items-center justify-between py-2 px-3 rounded"
                        style={{ backgroundColor: 'var(--color-secondary-50)' }}
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{getProjectName(entry.projectId)}</p>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{entry.description}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span 
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={getStatusStyle(entry.status)}
                          >
                            {entry.status}
                          </span>
                          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatDuration(entry.duration)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm italic" style={{ color: 'var(--text-secondary)' }}>No entries</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeEntryList; 