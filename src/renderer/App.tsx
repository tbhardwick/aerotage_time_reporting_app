import React from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import TimeTrackingNew from './pages/TimeTrackingNew';
import Projects from './pages/Projects';
import { Approvals } from './pages/Approvals';
import Reports from './pages/Reports';
import Invoices from './pages/Invoices';
import ErrorBoundary from './components/ErrorBoundary';

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
        flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200
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

const Navigation: React.FC = () => (
  <nav className="bg-gray-900 shadow-lg" role="navigation" aria-label="Main navigation">
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex items-center justify-between h-16">
        <div className="flex items-center space-x-8">
          <h1 className="text-white text-xl font-bold">Aerotage Time</h1>
          <div className="flex space-x-1">
            <NavLink to="/" icon="🏠">Dashboard</NavLink>
            <NavLink to="/time-tracking" icon="⏱️">Time Tracking</NavLink>
            <NavLink to="/projects" icon="📁">Projects</NavLink>
            <NavLink to="/approvals" icon="✅">Approvals</NavLink>
            <NavLink to="/reports" icon="📊">Reports</NavLink>
            <NavLink to="/invoices" icon="📄">Invoices</NavLink>
          </div>
        </div>
      </div>
    </div>
  </nav>
);

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppProvider>
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
              </Routes>
            </main>
          </div>
        </Router>
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App; 