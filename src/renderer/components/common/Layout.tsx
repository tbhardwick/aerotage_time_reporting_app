import React from 'react';
import { Outlet } from 'react-router-dom';

const Layout: React.FC = () => {
  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: 'var(--background-color)' }}
    >
      {/* Header */}
      <header 
        className="shadow-soft border-b"
        style={{ 
          backgroundColor: 'var(--surface-color)',
          borderColor: 'var(--border-color)'
        }}
      >
        <div className="px-6 py-4">
          <h1 
            className="text-xl font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Aerotage Time Reporting
          </h1>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout; 