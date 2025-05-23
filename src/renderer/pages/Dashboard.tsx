import React from 'react';

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-neutral-600">Welcome to Aerotage Time Reporting</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-soft p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">Today's Time</h3>
          <p className="text-3xl font-bold text-primary-600">7.5h</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-soft p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">This Week</h3>
          <p className="text-3xl font-bold text-success-600">32h</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-soft p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">Active Projects</h3>
          <p className="text-3xl font-bold text-accent-600">4</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-soft p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">Billable Hours</h3>
          <p className="text-3xl font-bold text-warning-600">28h</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 