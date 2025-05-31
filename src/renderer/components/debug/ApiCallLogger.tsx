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
    <div 
      className="p-6 rounded-lg"
      style={{
        border: '1px solid var(--color-secondary-300)',
        backgroundColor: 'var(--color-secondary-50)'
      }}
    >
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-secondary-800)' }}>🌐 API Call Logger</h3>
      
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setIsLogging(!isLogging)}
          className="px-4 py-2 rounded-md transition-colors"
          style={{
            backgroundColor: isLogging ? 'var(--color-error-600)' : 'var(--color-success-600)',
            color: 'var(--color-text-on-primary)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isLogging ? 'var(--color-error-hover)' : 'var(--color-success-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isLogging ? 'var(--color-error-600)' : 'var(--color-success-600)';
          }}
        >
          {isLogging ? 'Stop Logging' : 'Start Logging'}
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
          <strong>Instructions:</strong><br/>
          1. Click "Start Logging" to monitor API calls<br/>
          2. Navigate to Settings (using the regular navigation)<br/>
          3. Watch which API call fails and causes the logout
        </p>
      </div>

      {apiCalls.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Recent API Calls:</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {apiCalls.map((call, index) => (
              <div 
                key={index}
                className="p-3 rounded-md text-sm"
                style={{
                  backgroundColor: call.status && call.status >= 400
                    ? 'var(--color-error-50)'
                    : call.status && call.status >= 200 && call.status < 300
                    ? 'var(--color-success-50)'
                    : 'var(--color-secondary-50)',
                  border: `1px solid ${call.status && call.status >= 400
                    ? 'var(--color-error-200)'
                    : call.status && call.status >= 200 && call.status < 300
                    ? 'var(--color-success-200)'
                    : 'var(--color-secondary-200)'}`
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-mono font-semibold">
                      {call.method} {call.url}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {call.timestamp} • {call.responseTime}ms
                    </div>
                  </div>
                  <div className="text-right">
                    {call.status && (
                      <span 
                        className="font-semibold"
                        style={{
                          color: call.status >= 400 ? 'var(--color-error-600)' : 'var(--color-success-600)'
                        }}
                      >
                        {call.status}
                      </span>
                    )}
                  </div>
                </div>
                {call.error && (
                  <div className="mt-1 text-xs" style={{ color: 'var(--color-error-600)' }}>
                    Error: {call.error}
                  </div>
                )}
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
          <strong>Status:</strong> {isLogging ? '🟢 Logging Active' : '🔴 Logging Stopped'}<br/>
          <strong>Calls Logged:</strong> {apiCalls.length}/10
        </p>
      </div>
    </div>
  );
}; 