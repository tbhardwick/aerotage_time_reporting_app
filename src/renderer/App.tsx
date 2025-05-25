import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import { signOut } from 'aws-amplify/auth';
import { AppProvider } from './context/AppContext';
import { DataInitializer } from './components/common/DataInitializer';
import TimeTrackingNew from './pages/TimeTrackingNew';
import Projects from './pages/Projects';
import { Approvals } from './pages/Approvals';
import Reports from './pages/Reports';
import Invoices from './pages/Invoices';
import Users from './pages/Users';
import ErrorBoundary from './components/ErrorBoundary';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { amplifyConfig } from './config/aws-config';

// Configure AWS Amplify
Amplify.configure(amplifyConfig);

const Dashboard: React.FC = () => (
  <div className="max-w-4xl mx-auto px-8 py-12 text-center">
    <h1 className="text-4xl font-bold text-gray-900 mb-4">
      Welcome to Aerotage Time Reporting
    </h1>
    <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
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
    </div>
  </div>
);

const NavLink: React.FC<{ to: string; children: React.ReactNode; icon?: string }> = ({ to, children, icon }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to}
      className={`
        flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200
        ${isActive 
      ? 'bg-blue-600 text-white' 
      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }
      `}
      aria-current={isActive ? 'page' : undefined}
    >
      {icon && <span className="text-lg">{icon}</span>}
      <span>{children}</span>
    </Link>
  );
};

const Navigation: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      // Reload the page to reset the app state
      window.location.reload();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Check if we're on macOS to adjust for window controls
  const isMac = window.electronAPI?.isMac || false;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-gray-900 shadow-lg" role="navigation" aria-label="Main navigation">
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isMac ? 'pl-20 sm:pl-6 lg:pl-8' : ''}`}>
        <div className="flex items-center justify-between h-16">
          {/* Logo and Desktop Navigation */}
          <div className="flex items-center">
            <h1 className="text-white text-xl font-bold mr-8">Aerotage Time</h1>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex lg:space-x-1">
              <NavLink to="/" icon="🏠">Dashboard</NavLink>
              <NavLink to="/time-tracking" icon="⏱️">Time Tracking</NavLink>
              <NavLink to="/projects" icon="📁">Projects</NavLink>
              <NavLink to="/approvals" icon="✅">Approvals</NavLink>
              <NavLink to="/reports" icon="📊">Reports</NavLink>
              <NavLink to="/invoices" icon="📄">Invoices</NavLink>
              <NavLink to="/users" icon="👥">Users</NavLink>
            </div>
          </div>

          {/* Desktop Sign Out */}
          <div className="hidden lg:flex lg:items-center">
            <button
              onClick={handleLogout}
              className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              Sign Out
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-300 hover:text-white hover:bg-gray-700 p-2 rounded-md"
              aria-label="Toggle mobile menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-800 rounded-md mt-2">
              <div onClick={() => setIsMobileMenuOpen(false)}>
                <NavLink to="/" icon="🏠">Dashboard</NavLink>
              </div>
              <div onClick={() => setIsMobileMenuOpen(false)}>
                <NavLink to="/time-tracking" icon="⏱️">Time Tracking</NavLink>
              </div>
              <div onClick={() => setIsMobileMenuOpen(false)}>
                <NavLink to="/projects" icon="📁">Projects</NavLink>
              </div>
              <div onClick={() => setIsMobileMenuOpen(false)}>
                <NavLink to="/approvals" icon="✅">Approvals</NavLink>
              </div>
              <div onClick={() => setIsMobileMenuOpen(false)}>
                <NavLink to="/reports" icon="📊">Reports</NavLink>
              </div>
              <div onClick={() => setIsMobileMenuOpen(false)}>
                <NavLink to="/invoices" icon="📄">Invoices</NavLink>
              </div>
              <div onClick={() => setIsMobileMenuOpen(false)}>
                <NavLink to="/users" icon="👥">Users</NavLink>
              </div>
              <div className="border-t border-gray-700 pt-2 mt-2">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-sm font-medium w-full text-left transition-colors duration-200"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppProvider>
        <DataInitializer>
          <ProtectedRoute>
            <Router>
              <div className="min-h-screen bg-gray-50 font-sans">
                <Navigation />
                <main className="flex-1" role="main">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/time-tracking" element={<TimeTrackingNew />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/approvals" element={<Approvals />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/invoices" element={<Invoices />} />
                    <Route path="/users" element={<Users />} />
                  </Routes>
                </main>
              </div>
            </Router>
          </ProtectedRoute>
        </DataInitializer>
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App; 