import React, { useState } from 'react';
import { ClockIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import TimeTrackingNew from './TimeTrackingNew';
import DailyWeeklyView from '../components/time-tracking/DailyWeeklyView';

const TimeTrackingEnhanced: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'timer' | 'calendar'>('timer');

  return (
    <div className="space-y-6">
      {/* Header with Tab Navigation */}
      <div style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Time Tracking</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Track your time and manage your work activities</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('timer')}
            className="flex items-center px-1 py-4 border-b-2 font-medium text-sm transition-colors"
            style={{
              color: activeTab === 'timer' ? 'var(--color-primary-600)' : 'var(--text-secondary)',
              borderColor: activeTab === 'timer' ? 'var(--color-primary-600)' : 'transparent'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'timer') {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'timer') {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'transparent';
              }
            }}
          >
            <ClockIcon className="w-5 h-5 mr-2" />
            Timer & Entries
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className="flex items-center px-1 py-4 border-b-2 font-medium text-sm transition-colors"
            style={{
              color: activeTab === 'calendar' ? 'var(--color-primary-600)' : 'var(--text-secondary)',
              borderColor: activeTab === 'calendar' ? 'var(--color-primary-600)' : 'transparent'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'calendar') {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'calendar') {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'transparent';
              }
            }}
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