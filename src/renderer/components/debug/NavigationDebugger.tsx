import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

export const NavigationDebugger: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 20)); // Keep last 20 logs
  };

  useEffect(() => {
    if (isMonitoring) {
      addLog(`📍 Current location: ${location.pathname}`);
    }
  }, [location.pathname, isMonitoring]);

  const checkAuthBeforeNavigation = async (path: string) => {
    addLog(`🚀 Preparing to navigate to ${path}`);
    
    try {
      // Check auth state before navigation
      addLog('🔍 Checking auth state before navigation...');
      const user = await getCurrentUser();
      addLog(`✅ getCurrentUser() succeeded: ${user.username}`);
      
      const session = await fetchAuthSession({ forceRefresh: false });
      addLog(`✅ fetchAuthSession() succeeded - tokens: ${!!session.tokens}`);
      
      // Now navigate
      addLog(`➡️ Navigating to ${path}...`);
      navigate(path);
      
      // Check auth state after navigation (with a small delay)
      setTimeout(async () => {
        try {
          addLog('🔍 Checking auth state after navigation...');
          const userAfter = await getCurrentUser();
          addLog(`✅ Post-navigation getCurrentUser() succeeded: ${userAfter.username}`);
          
          const sessionAfter = await fetchAuthSession({ forceRefresh: false });
          addLog(`✅ Post-navigation fetchAuthSession() succeeded - tokens: ${!!sessionAfter.tokens}`);
        } catch (error) {
          addLog(`❌ Post-navigation auth check failed: ${(error as any).message}`);
        }
      }, 1000);
      
    } catch (error) {
      addLog(`❌ Pre-navigation auth check failed: ${(error as any).message}`);
      addLog('🚫 Navigation cancelled due to auth failure');
    }
  };

  const startMonitoring = () => {
    setIsMonitoring(true);
    setLogs([]);
    addLog('🔍 Navigation monitoring started');
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    addLog('⏹️ Navigation monitoring stopped');
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div 
      className="p-6 rounded-lg"
      style={{
        border: '1px solid var(--color-warning-300)',
        backgroundColor: 'var(--color-warning-50)'
      }}
    >
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-warning-800)' }}>🧭 Navigation Debugger</h3>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => isMonitoring ? stopMonitoring() : startMonitoring()}
          className="px-4 py-2 rounded-md transition-colors"
          style={{
            backgroundColor: isMonitoring ? 'var(--color-error-600)' : 'var(--color-success-600)',
            color: 'var(--color-text-on-primary)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isMonitoring ? 'var(--color-error-hover)' : 'var(--color-success-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isMonitoring ? 'var(--color-error-600)' : 'var(--color-success-600)';
          }}
        >
          {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
        </button>
        
        <button
          onClick={() => checkAuthBeforeNavigation('/settings')}
          className="px-4 py-2 rounded-md transition-colors disabled:opacity-50"
          style={{
            backgroundColor: 'var(--color-primary-600)',
            color: 'var(--color-text-on-primary)'
          }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
            }
          }}
          onMouseLeave={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
            }
          }}
          disabled={!isMonitoring}
        >
          Test Navigate to Settings
        </button>
        
        <button
          onClick={() => checkAuthBeforeNavigation('/time-tracking')}
          className="px-4 py-2 rounded-md transition-colors disabled:opacity-50"
          style={{
            backgroundColor: 'var(--color-secondary-600)',
            color: 'var(--color-text-on-secondary)'
          }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = 'var(--color-secondary-hover)';
            }
          }}
          onMouseLeave={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = 'var(--color-secondary-600)';
            }
          }}
          disabled={!isMonitoring}
        >
          Test Navigate to Time Tracking
        </button>
        
        <button
          onClick={clearLogs}
          className="px-4 py-2 rounded-md transition-colors"
          style={{
            backgroundColor: 'var(--color-secondary-600)',
            color: 'var(--color-text-on-secondary)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-secondary-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-secondary-600)';
          }}
        >
          Clear Logs
        </button>
      </div>

      <div 
        className="mb-4 p-3 rounded-md"
        style={{
          backgroundColor: 'var(--color-primary-50)',
          border: '1px solid var(--color-primary-200)'
        }}
      >
        <p className="text-sm" style={{ color: 'var(--color-primary-800)' }}>
          <strong>How to use:</strong><br/>
          1. Click "Start Monitoring" to begin tracking navigation<br/>
          2. Click "Test Navigate to Settings" to see what happens during navigation<br/>
          3. Watch the logs below to see where the authentication fails
        </p>
      </div>

      {logs.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Navigation Logs:</h4>
          <div 
            className="p-4 rounded-md text-sm font-mono max-h-64 overflow-y-auto"
            style={{
              backgroundColor: 'var(--color-neutral-900)',
              color: 'var(--color-success-400)'
            }}
          >
            {logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      <div 
        className="mt-4 p-3 rounded-md"
        style={{
          backgroundColor: 'var(--color-warning-50)',
          border: '1px solid var(--color-warning-200)'
        }}
      >
        <p className="text-sm" style={{ color: 'var(--color-warning-800)' }}>
          <strong>Current Status:</strong><br/>
          📍 Current Path: <code>{location.pathname}</code><br/>
          🔍 Monitoring: {isMonitoring ? '✅ Active' : '❌ Inactive'}<br/>
          📝 Log Count: {logs.length}
        </p>
      </div>
    </div>
  );
}; 