import React from 'react';

const TimeTracking: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Time Tracking</h1>
        <p className="text-neutral-600">Track your time and manage entries</p>
      </div>

      <div className="bg-white rounded-xl shadow-soft p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Timer</h2>
        <div className="text-center">
          <div className="text-4xl font-mono font-bold text-primary-600 mb-4">
            00:00:00
          </div>
          <button className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg">
            Start Timer
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimeTracking; 