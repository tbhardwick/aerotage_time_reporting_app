import React, { useEffect, ReactNode, useRef, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useDataLoader } from '../../hooks/useDataLoader';
import SessionBootstrapError from '../SessionBootstrapError';
import { sessionBootstrap, type BootstrapResult } from '../../services/sessionBootstrap';
import { signOut } from 'aws-amplify/auth';

interface DataInitializerProps {
  children: ReactNode;
}

export const DataInitializer: React.FC<DataInitializerProps> = ({ children }) => {
  const { state } = useAppContext();
  const { loadAllData } = useDataLoader();
  const { user, loading, errors } = state;
  const hasLoadedRef = useRef(false);
  const [bootstrapError, setBootstrapError] = useState<BootstrapResult | null>(null);
  const [isRetryingBootstrap, setIsRetryingBootstrap] = useState(false);

  console.log('🔍 DataInitializer render:', {
    user: user ? `${user.email} (${user.id})` : null,
    initialLoad: loading.initialLoad,
    initialLoadError: errors.initialLoad,
    hasLoaded: hasLoadedRef.current,
    hasData: {
      timeEntries: state.timeEntries.length,
      projects: state.projects.length,
      clients: state.clients.length,
    }
  });

  useEffect(() => {
    console.log('🔄 DataInitializer useEffect triggered:', {
      hasUser: !!user,
      isLoading: loading.initialLoad,
      hasError: !!errors.initialLoad,
      hasLoaded: hasLoadedRef.current,
      dataCount: {
        timeEntries: state.timeEntries.length,
        projects: state.projects.length,
        clients: state.clients.length,
      }
    });

    // Check for session bootstrap errors first
    if (user) {
      const storedBootstrapError = localStorage.getItem('sessionBootstrapError');
      if (storedBootstrapError) {
        try {
          const errorData = JSON.parse(storedBootstrapError) as BootstrapResult;
          
          // Only show bootstrap error if:
          // 1. It requires manual resolution AND
          // 2. It's not successful AND
          // 3. We don't have any existing session data (indicating this is a fresh login)
          const hasExistingSession = localStorage.getItem('currentSessionId');
          
          if (errorData.requiresManualResolution && !errorData.success && !hasExistingSession) {
            console.log('🚨 Detected session bootstrap error requiring manual resolution');
            setBootstrapError(errorData);
            return; // Don't proceed with normal data loading
          } else {
            // Clear old bootstrap errors if we have a session or if the error is resolved
            console.log('🧹 Clearing old bootstrap error - user has session or error is resolved');
            localStorage.removeItem('sessionBootstrapError');
          }
        } catch (error) {
          console.warn('Failed to parse stored bootstrap error:', error);
          localStorage.removeItem('sessionBootstrapError');
        }
      }
    }

    // Prevent multiple loads
    if (hasLoadedRef.current) {
      console.log('⏭️ Data already loaded, skipping');
      return;
    }

    // Only load data if user is authenticated and we haven't started loading yet
    if (user && !loading.initialLoad && !errors.initialLoad) {
      console.log('🚀 Triggering loadAllData for the first time...');
      hasLoadedRef.current = true;
      loadAllData();
    } else {
      console.log('⏭️ Skipping data load:', {
        reason: !user ? 'No user' : loading.initialLoad ? 'Already loading' : 'Has error'
      });
    }
  }, [user, loading.initialLoad, errors.initialLoad, loadAllData]);

  // Handler for retrying session bootstrap
  const handleBootstrapRetry = async () => {
    setIsRetryingBootstrap(true);
    try {
      console.log('🔄 Retrying session bootstrap...');
      const result = await sessionBootstrap.bootstrapSession();
      
      if (result.success) {
        console.log('✅ Bootstrap retry successful');
        localStorage.removeItem('sessionBootstrapError');
        setBootstrapError(null);
        // Reset data loading flag and try again
        hasLoadedRef.current = false;
        loadAllData();
      } else {
        console.log('❌ Bootstrap retry failed:', result.error);
        setBootstrapError(result);
        if (result.requiresManualResolution) {
          localStorage.setItem('sessionBootstrapError', JSON.stringify(result));
        }
      }
    } catch (error) {
      console.error('❌ Bootstrap retry error:', error);
      setBootstrapError({
        success: false,
        error: error instanceof Error ? error.message : 'Retry failed',
        requiresManualResolution: true
      });
    } finally {
      setIsRetryingBootstrap(false);
    }
  };

  // Handler for logout
  const handleBootstrapLogout = async () => {
    try {
      console.log('🚪 Logging out due to bootstrap error...');
      localStorage.removeItem('sessionBootstrapError');
      localStorage.removeItem('currentSessionId');
      localStorage.removeItem('loginTime');
      await signOut();
      window.location.reload();
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Force reload anyway
      window.location.reload();
    }
  };

  // Show session bootstrap error if it exists
  if (bootstrapError && bootstrapError.requiresManualResolution) {
    console.log('🚨 Showing session bootstrap error screen');
    return (
      <SessionBootstrapError
        onRetry={handleBootstrapRetry}
        onLogout={handleBootstrapLogout}
        isRetrying={isRetryingBootstrap}
      />
    );
  }

  // Show loading state while initial data is being loaded
  if (user && loading.initialLoad) {
    console.log('🔄 Showing loading screen');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <h2 className="mt-6 text-lg font-medium text-gray-900">
              Loading application data...
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please wait while we load your projects, time entries, and other data.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if initial load failed
  if (user && errors.initialLoad) {
    console.log('❌ Showing error screen:', errors.initialLoad);
    
    // Check if this looks like a session termination issue (all API calls failing with 403)
    const isSessionTerminated = errors.initialLoad.includes('Access denied') || 
                               errors.initialLoad.includes('403') ||
                               errors.initialLoad.includes('explicit deny');
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="rounded-full h-12 w-12 bg-red-100 mx-auto flex items-center justify-center">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="mt-6 text-lg font-medium text-gray-900">
              {isSessionTerminated ? 'Session Terminated' : 'Failed to load application data'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {isSessionTerminated 
                ? 'Your session has been terminated. This usually happens when sessions are terminated from another device or by an administrator.'
                : errors.initialLoad
              }
            </p>
            
            {isSessionTerminated ? (
              <div className="mt-4 space-y-3">
                <button
                  onClick={handleBootstrapLogout}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Sign Out and Return to Login
                </button>
                <p className="text-xs text-gray-500">
                  Or open browser console and run: <code className="bg-gray-100 px-1 rounded">window.debugUtils.forceLogout()</code>
                </p>
              </div>
            ) : (
              <button
                onClick={() => {
                  console.log('🔄 Retry button clicked');
                  hasLoadedRef.current = false; // Reset the flag
                  loadAllData();
                }}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render children if user is authenticated and data is loaded (or loading is complete)
  console.log('✅ Rendering main app');
  return <>{children}</>;
}; 