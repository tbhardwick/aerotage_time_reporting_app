import React from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import TimeTrackingNew from './pages/TimeTrackingNew';
import Projects from './pages/Projects';
import ErrorBoundary from './components/ErrorBoundary';

const Dashboard: React.FC = () => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Dashboard</h1>
    <p style={{ color: '#666', marginBottom: '2rem' }}>Welcome to your time tracking dashboard</p>
    <Link 
      to="/time-tracking" 
      style={{
        backgroundColor: '#2563eb',
        color: 'white',
        padding: '0.75rem 1.5rem',
        borderRadius: '0.5rem',
        textDecoration: 'none',
        display: 'inline-block'
      }}
    >
      Go to Time Tracking
    </Link>
  </div>
);

const Reports: React.FC = () => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Reports</h1>
    <p style={{ color: '#666' }}>View your time tracking reports</p>
  </div>
);

const Navigation: React.FC = () => (
  <nav style={{
    backgroundColor: '#1f2937',
    padding: '1rem',
    marginBottom: '2rem'
  }}>
    <div style={{ maxWidth: '80rem', margin: '0 auto', display: 'flex', gap: '2rem' }}>
      <Link 
        to="/" 
        style={{ 
          color: 'white', 
          textDecoration: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '0.25rem',
          backgroundColor: 'rgba(255, 255, 255, 0.1)'
        }}
      >
        Dashboard
      </Link>
      <Link 
        to="/time-tracking" 
        style={{ 
          color: 'white', 
          textDecoration: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '0.25rem',
          backgroundColor: 'rgba(255, 255, 255, 0.1)'
        }}
      >
        Time Tracking
      </Link>
      <Link 
        to="/projects" 
        style={{ 
          color: 'white', 
          textDecoration: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '0.25rem',
          backgroundColor: 'rgba(255, 255, 255, 0.1)'
        }}
      >
        Projects
      </Link>
      <Link 
        to="/reports" 
        style={{ 
          color: 'white', 
          textDecoration: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '0.25rem',
          backgroundColor: 'rgba(255, 255, 255, 0.1)'
        }}
      >
        Reports
      </Link>
    </div>
  </nav>
);

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Router>
          <div style={{ 
            minHeight: '100vh', 
            backgroundColor: '#f3f4f6',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
          }}>
            <Navigation />
            <div style={{ padding: '0 1rem' }}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/time-tracking" element={<TimeTrackingNew />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/reports" element={<Reports />} />
              </Routes>
            </div>
          </div>
        </Router>
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App; 