import React from 'react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
        Welcome to Aerotage Time Reporting
      </h1>
      <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
        Track your time efficiently, manage projects, and generate professional reports with our comprehensive time tracking solution.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <Link 
          to="/time-tracking" 
          className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg transition-colors duration-200 text-center group"
        >
          <div className="text-2xl mb-2">⏱️</div>
          <h3 className="font-semibold mb-2">Time Tracking</h3>
          <p className="text-sm text-blue-100">Start tracking your time with our intuitive timer</p>
        </Link>
        <Link 
          to="/projects" 
          className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-lg transition-colors duration-200 text-center group"
        >
          <div className="text-2xl mb-2">📁</div>
          <h3 className="font-semibold mb-2">Projects</h3>
          <p className="text-sm text-green-100">Manage your clients and projects</p>
        </Link>
        <Link 
          to="/reports" 
          className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-lg transition-colors duration-200 text-center group"
        >
          <div className="text-2xl mb-2">📊</div>
          <h3 className="font-semibold mb-2">Reports</h3>
          <p className="text-sm text-purple-100">Generate insights and export data</p>
        </Link>
        <Link 
          to="/users" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-6 rounded-lg transition-colors duration-200 text-center group"
        >
          <div className="text-2xl mb-2">👥</div>
          <h3 className="font-semibold mb-2">User Management</h3>
          <p className="text-sm text-indigo-100">Manage users, roles, and permissions</p>
        </Link>
        <Link 
          to="/settings" 
          className="bg-gray-600 hover:bg-gray-700 text-white p-6 rounded-lg transition-colors duration-200 text-center group"
        >
          <div className="text-2xl mb-2">⚙️</div>
          <h3 className="font-semibold mb-2">Settings</h3>
          <p className="text-sm text-gray-100">Configure your preferences and debug tools</p>
        </Link>
      </div>
    </div>
  );
}; 