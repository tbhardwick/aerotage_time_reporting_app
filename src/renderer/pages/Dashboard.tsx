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
          className="p-6 rounded-lg transition-colors duration-200 text-center group"
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
          <div className="text-2xl mb-2">⏱️</div>
          <h3 className="font-semibold mb-2">Time Tracking</h3>
          <p className="text-sm opacity-90">Start tracking your time with our intuitive timer</p>
        </Link>
        <Link 
          to="/projects" 
          className="p-6 rounded-lg transition-colors duration-200 text-center group"
          style={{
            backgroundColor: 'var(--color-success-600)',
            color: 'var(--color-text-on-primary)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-success-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-success-600)';
          }}
        >
          <div className="text-2xl mb-2">📁</div>
          <h3 className="font-semibold mb-2">Projects</h3>
          <p className="text-sm opacity-90">Manage your clients and projects</p>
        </Link>
        <Link 
          to="/reports" 
          className="p-6 rounded-lg transition-colors duration-200 text-center group"
          style={{
            backgroundColor: 'var(--color-secondary-600)',
            color: 'var(--color-text-on-primary)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-secondary-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-secondary-600)';
          }}
        >
          <div className="text-2xl mb-2">📊</div>
          <h3 className="font-semibold mb-2">Reports</h3>
          <p className="text-sm opacity-90">Generate insights and export data</p>
        </Link>
        <Link 
          to="/users" 
          className="p-6 rounded-lg transition-colors duration-200 text-center group"
          style={{
            backgroundColor: 'var(--color-info-600)',
            color: 'var(--color-text-on-primary)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-info-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-info-600)';
          }}
        >
          <div className="text-2xl mb-2">👥</div>
          <h3 className="font-semibold mb-2">User Management</h3>
          <p className="text-sm opacity-90">Manage users, roles, and permissions</p>
        </Link>
        <Link 
          to="/settings" 
          className="p-6 rounded-lg transition-colors duration-200 text-center group"
          style={{
            backgroundColor: 'var(--color-neutral-600)',
            color: 'var(--color-text-on-primary)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-neutral-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-neutral-600)';
          }}
        >
          <div className="text-2xl mb-2">⚙️</div>
          <h3 className="font-semibold mb-2">Settings</h3>
          <p className="text-sm opacity-90">Configure your preferences and debug tools</p>
        </Link>
      </div>
    </div>
  );
}; 