import React, { useState } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { ClockIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { TimeEntry } from '../../types';

// Mock time entries data
const mockTimeEntries: TimeEntry[] = [
  {
    id: '1',
    userId: 'user1',
    projectId: '1',
    date: format(new Date(), 'yyyy-MM-dd'),
    duration: 120,
    description: 'Working on homepage design',
    isBillable: true,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    project: { 
      id: '1',
      clientId: 'client1',
      name: 'Website Redesign',
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      client: { 
        id: 'client1',
        name: 'Acme Corp',
        contactInfo: {},
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } 
    }
  },
  {
    id: '2',
    userId: 'user1',
    projectId: '2',
    date: format(new Date(Date.now() - 86400000), 'yyyy-MM-dd'), // Yesterday
    duration: 180,
    description: 'Mobile app wireframes',
    isBillable: true,
    status: 'submitted',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    project: { 
      id: '2',
      clientId: 'client2',
      name: 'Mobile App Development',
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      client: { 
        id: 'client2',
        name: 'TechStart Inc',
        contactInfo: {},
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } 
    }
  },
  {
    id: '3',
    userId: 'user1',
    projectId: '1',
    date: format(new Date(Date.now() - 172800000), 'yyyy-MM-dd'), // 2 days ago
    duration: 90,
    description: 'Client feedback review',
    isBillable: false,
    status: 'approved',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    project: { 
      id: '1',
      clientId: 'client1',
      name: 'Website Redesign',
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      client: { 
        id: 'client1',
        name: 'Acme Corp',
        contactInfo: {},
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } 
    }
  },
];

interface TimeEntryListProps {
  onEdit?: (entry: TimeEntry) => void;
  onDelete?: (entryId: string) => void;
  onSubmit?: (entryId: string) => void;
}

const TimeEntryList: React.FC<TimeEntryListProps> = ({ onEdit, onDelete, onSubmit }) => {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: TimeEntry['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEntriesForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return mockTimeEntries.filter(entry => entry.date === dateStr);
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

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <ClockIcon className="w-5 h-5 mr-2" />
            Time Entries
          </h3>
          
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'daily'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'weekly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Weekly
            </button>
          </div>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedDate(new Date(selectedDate.getTime() - (viewMode === 'daily' ? 86400000 : 604800000)))}
            className="px-3 py-1 text-gray-600 hover:text-gray-900"
          >
            ← Previous
          </button>
          
          <h4 className="font-medium text-gray-900">
            {viewMode === 'daily' 
              ? format(selectedDate, 'EEEE, MMMM d, yyyy')
              : `Week of ${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM d')} - ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}`
            }
          </h4>
          
          <button
            onClick={() => setSelectedDate(new Date(selectedDate.getTime() + (viewMode === 'daily' ? 86400000 : 604800000)))}
            className="px-3 py-1 text-gray-600 hover:text-gray-900"
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
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-gray-600">Total Time</p>
                        <p className="text-lg font-semibold text-gray-900">{formatDuration(totalDuration)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Billable</p>
                        <p className="text-lg font-semibold text-green-600">{formatDuration(billableDuration)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Non-billable</p>
                        <p className="text-lg font-semibold text-gray-600">{formatDuration(totalDuration - billableDuration)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Time Entries */}
                  {entries.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <ClockIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No time entries for this date</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {entries.map((entry) => (
                        <div key={entry.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                                  {entry.status}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  entry.isBillable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {entry.isBillable ? 'Billable' : 'Non-billable'}
                                </span>
                              </div>
                              <h4 className="font-medium text-gray-900">{entry.project?.name}</h4>
                              <p className="text-sm text-gray-600 mb-1">{entry.project?.client?.name}</p>
                              <p className="text-sm text-gray-800">{entry.description}</p>
                            </div>
                            
                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <p className="text-lg font-semibold text-gray-900">{formatDuration(entry.duration)}</p>
                                {entry.startTime && entry.endTime && (
                                  <p className="text-sm text-gray-500">{entry.startTime} - {entry.endTime}</p>
                                )}
                              </div>
                              
                              <div className="flex space-x-2">
                                {entry.status === 'draft' && onSubmit && (
                                  <button
                                    onClick={() => onSubmit(entry.id)}
                                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                                  >
                                    Submit
                                  </button>
                                )}
                                {onEdit && (
                                  <button
                                    onClick={() => onEdit(entry)}
                                    className="p-2 text-gray-400 hover:text-gray-600"
                                  >
                                    <PencilIcon className="w-4 h-4" />
                                  </button>
                                )}
                                {onDelete && entry.status === 'draft' && (
                                  <button
                                    onClick={() => onDelete(entry.id)}
                                    className="p-2 text-gray-400 hover:text-red-600"
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
              <div key={date.toISOString()} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">
                    {format(date, 'EEEE, MMM d')}
                  </h4>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatDuration(totalDuration)}</p>
                    <p className="text-sm text-gray-500">{entries.length} entries</p>
                  </div>
                </div>
                
                {entries.length > 0 ? (
                  <div className="space-y-2">
                    {entries.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900">{entry.project?.name}</p>
                          <p className="text-xs text-gray-600">{entry.description}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                            {entry.status}
                          </span>
                          <span className="text-sm font-medium text-gray-900">{formatDuration(entry.duration)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No entries</p>
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