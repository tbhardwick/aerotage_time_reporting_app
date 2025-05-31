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
    <div className="p-6 border border-orange-300 rounded-lg bg-orange-50">
      <h3 className="text-lg font-semibold text-orange-800 mb-4">🧭 Navigation Debugger</h3>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => isMonitoring ? stopMonitoring() : startMonitoring()}
          className={`px-4 py-2 rounded-md text-white ${isMonitoring ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
        </button>
        
        <button
          onClick={() => checkAuthBeforeNavigation('/settings')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          disabled={!isMonitoring}
        >
          Test Navigate to Settings
        </button>
        
        <button
          onClick={() => checkAuthBeforeNavigation('/time-tracking')}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          disabled={!isMonitoring}
        >
          Test Navigate to Time Tracking
        </button>
        
        <button
          onClick={clearLogs}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          Clear Logs
        </button>
      </div>

      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-800">
          <strong>How to use:</strong><br/>
          1. Click "Start Monitoring" to begin tracking navigation<br/>
          2. Click "Test Navigate to Settings" to see what happens during navigation<br/>
          3. Watch the logs below to see where the authentication fails
        </p>
      </div>

      {logs.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold text-gray-800 mb-2">Navigation Logs:</h4>
          <div className="bg-gray-900 text-green-400 p-4 rounded-md text-sm font-mono max-h-64 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-sm text-yellow-800">
          <strong>Current Status:</strong><br/>
          📍 Current Path: <code>{location.pathname}</code><br/>
          🔍 Monitoring: {isMonitoring ? '✅ Active' : '❌ Inactive'}<br/>
          📝 Log Count: {logs.length}
        </p>
      </div>
    </div>
  );
}; 