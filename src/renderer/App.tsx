import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import { signOut } from 'aws-amplify/auth';
import { AppProvider, useAppContext } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { DataInitializer } from './components/common/DataInitializer';
import { HealthStatus } from './components/common/HealthStatus';
import { Dashboard } from './pages/Dashboard';
import TimeTrackingEnhanced from './pages/TimeTrackingEnhanced';
import Projects from './pages/Projects';
import { Approvals } from './pages/Approvals';
import Reports from './pages/Reports';
import Invoices from './pages/Invoices';
import Users from './pages/Users';
import Settings from './pages/Settings';
import ErrorBoundary from './components/ErrorBoundary';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { EmailVerificationHandler } from './components/settings';
import { amplifyConfig } from './config/aws-config';
import { UserDropdown } from './components/common/UserDropdown';

// Import session test utilities for development
import './utils/sessionTestUtils';
import './utils/sessionDebugUtils';
import './utils/debugUtils';
import './utils/dataDebugUtils';
import './utils/themeTestUtils';

// Configure AWS Amplify
Amplify.configure(amplifyConfig);

const NavLink: React.FC<{ to: string; children: React.ReactNode; icon?: string }> = ({ to, children, icon }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to}
      className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
      style={{
        color: isActive ? 'var(--color-text-on-primary)' : 'var(--text-primary)',
        backgroundColor: isActive ? 'var(--color-primary-600)' : 'transparent'
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'var(--surface-secondary)';
        } else {
          e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
        } else {
          e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
        }
      }}
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
      // Use the new backend logout endpoint for proper cleanup
      try {
        const { fetchAuthSession } = await import('aws-amplify/auth');
        const { profileApi } = await import('./services/profileApi');
        
        // Get current session for API call
        const session = await fetchAuthSession({ forceRefresh: false });
        const token = session.tokens?.accessToken?.toString();
        
        if (token) {
          console.log('🚪 Calling backend logout endpoint...');
          await profileApi.logout();
          console.log('✅ Backend logout successful - session cleaned up');
        }
      } catch (logoutError) {
        // Don't block logout if backend logout fails
        console.warn('⚠️ Backend logout failed, continuing with Cognito logout:', logoutError);
      }
      
      // Clear local session data
      localStorage.removeItem('currentSessionId');
      localStorage.removeItem('loginTime');
      
      // Sign out from Cognito
      await signOut();
      
      // Reload the page to reset the app state
      window.location.reload();
    } catch (error) {
      console.error('Error signing out:', error);
      // Force reload even if logout fails
      window.location.reload();
    }
  };

  // Check if we're on macOS to adjust for window controls
  const isMac = window.electronAPI?.isMac || false;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

    return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 shadow-lg" role="navigation" aria-label="Main navigation" style={{ WebkitAppRegion: 'drag', backgroundColor: 'var(--surface-color)', borderBottom: '1px solid var(--border-color)' } as any}>
        <div className={`max-w-7xl mx-auto ${isMac ? 'pr-4 sm:pr-6 lg:pr-8 pl-20' : 'px-4 sm:px-6 lg:px-8'}`}>
          <div className="flex items-center justify-between h-16">
                        {/* Desktop Navigation */}
            <div className="hidden lg:flex lg:space-x-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
              <NavLink to="/" icon="🏠">Dashboard</NavLink>
              <NavLink to="/time-tracking" icon="⏱️">Time Tracking</NavLink>
              <NavLink to="/projects" icon="📁">Projects</NavLink>
              <NavLink to="/approvals" icon="✅">Approvals</NavLink>
              <NavLink to="/reports" icon="📊">Reports</NavLink>
              <NavLink to="/invoices" icon="📄">Invoices</NavLink>
              <NavLink to="/users" icon="👥">Users</NavLink>
            </div>

            {/* Desktop Sign Out */}
            <div className="hidden lg:flex lg:items-center lg:space-x-4" style={{ WebkitAppRegion: 'no-drag' } as any}>
              {/* API Health Status */}
              <HealthStatus className="text-sm" />
              
              <UserDropdown />
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden" style={{ WebkitAppRegion: 'no-drag' } as any}>
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-md transition-colors"
                style={{
                  color: 'var(--text-secondary)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.backgroundColor = 'var(--surface-secondary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
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
      </div>
    </nav>

    {/* Mobile Navigation Menu - Outside nav to avoid width constraints */}
    <div className={`lg:hidden transition-all duration-300 ease-in-out fixed top-16 left-0 right-0 z-40 ${
      isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
    }`} style={{ overflow: isMobileMenuOpen ? 'visible' : 'hidden' }}>
      {/* Subtle backdrop when menu is open - starts below nav */}
      {isMobileMenuOpen && (
        <div 
          className="fixed top-16 left-0 right-0 bottom-0 backdrop-blur-sm -z-10"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      <div className={`mx-4 sm:mx-6 lg:mx-8 ${isMac ? 'ml-20 mr-4 sm:mr-6 lg:mr-8' : ''} mt-2 px-2 pt-2 pb-3 space-y-1 rounded-lg shadow-2xl border`} style={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)' }}>
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
        <div className="pt-2 mt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
          {/* API Health Status for Mobile */}
          <div className="px-3 py-2">
            <HealthStatus className="text-sm" />
          </div>
          
          {/* Mobile User Dropdown */}
          <div className="px-3 py-2">
            <UserDropdown 
              className="w-full" 
              onMenuItemClick={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContextConsumer>
          {({ state }) => (
            <ThemeProvider user={state.user}>
              <DataInitializer>
                <Router>
                  <ProtectedRoute>
                    <div className="min-h-screen font-sans" style={{ backgroundColor: 'var(--background-color)', color: 'var(--text-primary)' }}>
                      <Navigation />
                      <main className="flex-1 pt-16" role="main">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                          <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/time-tracking" element={<TimeTrackingEnhanced />} />
                            <Route path="/projects" element={<Projects />} />
                            <Route path="/approvals" element={<Approvals />} />
                            <Route path="/reports" element={<Reports />} />
                            <Route path="/invoices" element={<Invoices />} />
                            <Route path="/users" element={<Users />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/email-verification" element={<EmailVerificationHandler />} />
                            {/* Fallback route - redirect any unmatched routes to dashboard */}
                            <Route path="*" element={<Dashboard />} />
                          </Routes>
                        </div>
                      </main>
                    </div>
                  </ProtectedRoute>
                </Router>
              </DataInitializer>
            </ThemeProvider>
          )}
        </AppContextConsumer>
      </AppProvider>
    </ErrorBoundary>
  );
};

// Helper component to consume AppContext
const AppContextConsumer: React.FC<{ children: (context: { state: any }) => React.ReactNode }> = ({ children }) => {
  const { state } = useAppContext();
  return <>{children({ state })}</>;
};

export default App; 