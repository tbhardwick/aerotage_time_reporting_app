import React, { useState, useEffect } from 'react';

interface ApiCall {
  timestamp: string;
  method: string;
  url: string;
  status: number | null;
  error: string | null;
  responseTime: number;
}

export const ApiCallLogger: React.FC = () => {
  const [apiCalls, setApiCalls] = useState<ApiCall[]>([]);
  const [isLogging, setIsLogging] = useState(false);

  useEffect(() => {
    if (!isLogging) return;

    // Intercept fetch calls
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = Date.now();
      const url = args[0] as string;
      const method = (args[1]?.method || 'GET').toUpperCase();
      
      const logEntry: ApiCall = {
        timestamp: new Date().toLocaleTimeString(),
        method,
        url: url.includes('amazonaws.com') ? url.split('/dev')[1] || url : url,
        status: null,
        error: null,
        responseTime: 0
      };

      try {
        const response = await originalFetch(...args);
        logEntry.status = response.status;
        logEntry.responseTime = Date.now() - startTime;
        
        // Clone response to read body without consuming it
        const clonedResponse = response.clone();
        try {
          const data = await clonedResponse.json();
          if (!response.ok) {
            logEntry.error = data.message || `HTTP ${response.status}`;
          }
        } catch {
          // Not JSON, that's okay
        }
        
        setApiCalls(prev => [logEntry, ...prev].slice(0, 10));
        return response;
      } catch (error) {
        logEntry.error = (error as Error).message;
        logEntry.responseTime = Date.now() - startTime;
        setApiCalls(prev => [logEntry, ...prev].slice(0, 10));
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [isLogging]);

  const clearLogs = () => {
    setApiCalls([]);
  };

  return (
    <div className="p-6 border border-purple-300 rounded-lg bg-purple-50">
      <h3 className="text-lg font-semibold text-purple-800 mb-4">🌐 API Call Logger</h3>
      
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setIsLogging(!isLogging)}
          className={`px-4 py-2 rounded-md text-white ${
            isLogging 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isLogging ? 'Stop Logging' : 'Start Logging'}
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
          <strong>Instructions:</strong><br/>
          1. Click "Start Logging" to monitor API calls<br/>
          2. Navigate to Settings (using the regular navigation)<br/>
          3. Watch which API call fails and causes the logout
        </p>
      </div>

      {apiCalls.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold text-gray-800 mb-2">Recent API Calls:</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {apiCalls.map((call, index) => (
              <div 
                key={index}
                className={`p-3 rounded-md text-sm border ${
                  call.status && call.status >= 400
                    ? 'bg-red-50 border-red-200'
                    : call.status && call.status >= 200 && call.status < 300
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-mono font-semibold">
                      {call.method} {call.url}
                    </div>
                    <div className="text-gray-600 text-xs">
                      {call.timestamp} • {call.responseTime}ms
                    </div>
                  </div>
                  <div className="text-right">
                    {call.status && (
                      <span className={`font-semibold ${
                        call.status >= 400 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {call.status}
                      </span>
                    )}
                  </div>
                </div>
                {call.error && (
                  <div className="mt-1 text-red-600 text-xs">
                    Error: {call.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-sm text-yellow-800">
          <strong>Status:</strong> {isLogging ? '🟢 Logging Active' : '🔴 Logging Stopped'}<br/>
          <strong>Calls Logged:</strong> {apiCalls.length}/10
        </p>
      </div>
    </div>
  );
}; 