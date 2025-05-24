import React, { useEffect, ReactNode, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useDataLoader } from '../../hooks/useDataLoader';

interface DataInitializerProps {
  children: ReactNode;
}

export const DataInitializer: React.FC<DataInitializerProps> = ({ children }) => {
  const { state } = useAppContext();
  const { loadAllData } = useDataLoader();
  const { user, loading, errors } = state;
  const hasLoadedRef = useRef(false);

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
              Failed to load application data
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {errors.initialLoad}
            </p>
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
          </div>
        </div>
      </div>
    );
  }

  // Render children if user is authenticated and data is loaded (or loading is complete)
  console.log('✅ Rendering main app');
  return <>{children}</>;
}; 