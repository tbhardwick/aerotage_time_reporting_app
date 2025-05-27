import React, { useState } from 'react';
import { ClockIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import TimeTrackingNew from './TimeTrackingNew';
import DailyWeeklyView from '../components/time-tracking/DailyWeeklyView';

const TimeTrackingEnhanced: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'timer' | 'calendar'>('timer');

  return (
    <div className="space-y-6">
      {/* Header with Tab Navigation */}
      <div className="border-b border-neutral-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Time Tracking</h1>
            <p className="text-neutral-600">Track your time and manage your work activities</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('timer')}
            className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'timer'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            <ClockIcon className="w-5 h-5 mr-2" />
            Timer & Entries
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'calendar'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            <CalendarDaysIcon className="w-5 h-5 mr-2" />
            Daily & Weekly View
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'timer' ? (
          <div className="space-y-6">
            {/* Timer and Entry Management */}
            <TimeTrackingNew />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Daily and Weekly Time View */}
            <DailyWeeklyView />
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeTrackingEnhanced; 