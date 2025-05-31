import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { apiClient } from '../../services/api-client';
import { awsConfig } from '../../config/aws-config';
import { ApiCallLogger } from '../debug/ApiCallLogger';
import { 
  CodeBracketIcon, 
  CogIcon, 
  DocumentTextIcon,
  ClipboardDocumentIcon,
  TrashIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface DeveloperInfo {
  appVersion: string;
  electronVersion: string;
  nodeVersion: string;
  chromeVersion: string;
  platform: string;
  userAgent: string;
  language: string;
  cookieEnabled: boolean;
  onLine: boolean;
  screenResolution: string;
  colorDepth: number;
  timezone: string;
}

interface LocalStorageItem {
  key: string;
  value: string;
  size: number;
}

const DeveloperSettings: React.FC = () => {
  const { state } = useAppContext();
  const { user } = state;
  
  const [developerInfo, setDeveloperInfo] = useState<DeveloperInfo | null>(null);
  const [localStorageItems, setLocalStorageItems] = useState<LocalStorageItem[]>([]);
  const [apiTestResult, setApiTestResult] = useState<string>('');
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [showDangerZone, setShowDangerZone] = useState(false);
  const [showApiLogger, setShowApiLogger] = useState(false);

  useEffect(() => {
    loadDeveloperInfo();
    loadLocalStorageItems();
  }, []);

  const loadDeveloperInfo = () => {
    // Extract Chrome version from user agent
    const getChromeVersion = (): string => {
      const userAgent = navigator.userAgent;
      const chromeMatch = userAgent.match(/Chrome\/([0-9.]+)/);
      return chromeMatch ? chromeMatch[1] : 'Unknown';
    };

    // Detect if we're running in Electron
    const isElectron = (): boolean => {
      return !!(window as any).electronAPI || 
             navigator.userAgent.toLowerCase().includes('electron') ||
             !!(window as any).require;
    };

    // Get Electron version from user agent if available
    const getElectronVersion = (): string => {
      const userAgent = navigator.userAgent;
      const electronMatch = userAgent.match(/Electron\/([0-9.]+)/);
      if (electronMatch) {
        return electronMatch[1];
      }
      return isElectron() ? 'Detected (version unknown)' : 'Not running in Electron';
    };

    // Get Node.js version (only available in Electron main process)
    const getNodeVersion = (): string => {
      try {
        // In Electron renderer, we can't directly access process.versions
        // This would need to be passed from main process via IPC
        if (isElectron()) {
          return 'Available in main process (IPC needed)';
        }
        return 'Not available in browser';
      } catch (error) {
        return 'Not accessible';
      }
    };

    const info: DeveloperInfo = {
      appVersion: '1.0.0', // TODO: Get from package.json or build process
      electronVersion: getElectronVersion(),
      nodeVersion: getNodeVersion(),
      chromeVersion: getChromeVersion(),
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    setDeveloperInfo(info);
  };

  const loadLocalStorageItems = () => {
    const items: LocalStorageItem[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) || '';
        items.push({
          key,
          value,
          size: new Blob([value]).size,
        });
      }
    }
    items.sort((a, b) => a.key.localeCompare(b.key));
    setLocalStorageItems(items);
  };

  const testApiConnection = async () => {
    setIsTestingApi(true);
    setApiTestResult('Testing API connection...');

    try {
      // Test health endpoint
      const healthResult = await apiClient.checkAPIHealth();
      
      // Test authenticated endpoint (if user is logged in)
      let authTestResult = 'Not logged in';
      if (user) {
        try {
          // TODO: Replace with actual authenticated endpoint test
          authTestResult = 'Authentication test not implemented yet';
        } catch (authError) {
          authTestResult = `Auth test failed: ${authError}`;
        }
      }

      const result = `
✅ Health Check: ${healthResult.status}
📊 Response Time: ${healthResult.message}
🔐 Auth Test: ${authTestResult}
🌐 Primary Endpoint: ${awsConfig.apiGatewayUrl}
🔄 Backup Endpoint: ${awsConfig.backupApiUrl}
⏰ Timestamp: ${new Date().toLocaleString()}
      `.trim();

      setApiTestResult(result);
    } catch (error) {
      setApiTestResult(`❌ API Test Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTestingApi(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
      console.log('Copied to clipboard');
    });
  };

  const clearLocalStorageItem = (key: string) => {
    if (confirm(`Are you sure you want to delete "${key}" from localStorage?`)) {
      localStorage.removeItem(key);
      loadLocalStorageItems();
    }
  };

  const clearAllLocalStorage = () => {
    if (confirm('⚠️ This will clear ALL localStorage data and log you out. Are you sure?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const exportDebugInfo = () => {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      user: user ? { id: user.id, email: user.email, role: user.role } : null,
      developerInfo,
      localStorage: localStorageItems,
      awsConfig: {
        region: awsConfig.region,
        apiGatewayUrl: awsConfig.apiGatewayUrl,
        backupApiUrl: awsConfig.backupApiUrl,
        userPoolId: awsConfig.userPoolId,
        userPoolClientId: awsConfig.userPoolClientId,
      },
      apiTestResult,
    };

    const blob = new Blob([JSON.stringify(debugInfo, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aerotage-debug-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!developerInfo) {
    return (
      <div className="text-center py-8">
        <p className="text-[var(--color-text-secondary)]">Loading developer information...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Developer Settings</h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          Development tools, debugging information, and advanced settings.
        </p>
      </div>

      {/* System Information */}
      <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center space-x-2 mb-4">
          <InformationCircleIcon className="h-5 w-5" style={{ color: 'var(--color-primary-500)' }} />
          <h4 className="text-md font-medium" style={{ color: 'var(--text-primary)' }}>System Information</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>App Version:</span>
            <span className="ml-2" style={{ color: 'var(--text-secondary)' }}>{developerInfo.appVersion}</span>
          </div>
          <div>
            <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Electron:</span>
            <span className="ml-2" style={{ color: 'var(--text-secondary)' }}>{developerInfo.electronVersion}</span>
          </div>
          <div>
            <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Node.js:</span>
            <span className="ml-2" style={{ color: 'var(--text-secondary)' }}>{developerInfo.nodeVersion}</span>
          </div>
          <div>
            <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Chrome:</span>
            <span className="ml-2" style={{ color: 'var(--text-secondary)' }}>{developerInfo.chromeVersion}</span>
          </div>
          <div>
            <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Platform:</span>
            <span className="ml-2" style={{ color: 'var(--text-secondary)' }}>{developerInfo.platform}</span>
          </div>
          <div>
            <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Language:</span>
            <span className="ml-2" style={{ color: 'var(--text-secondary)' }}>{developerInfo.language}</span>
          </div>
          <div>
            <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Screen:</span>
            <span className="ml-2" style={{ color: 'var(--text-secondary)' }}>{developerInfo.screenResolution} ({developerInfo.colorDepth}-bit)</span>
          </div>
          <div>
            <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Timezone:</span>
            <span className="ml-2" style={{ color: 'var(--text-secondary)' }}>{developerInfo.timezone}</span>
          </div>
          <div>
            <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Online:</span>
                            <span className="ml-2" style={{ color: developerInfo.onLine ? 'var(--color-success-600)' : 'var(--color-error-600)' }}>
              {developerInfo.onLine ? '✅ Connected' : '❌ Offline'}
            </span>
          </div>
          <div>
            <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Cookies:</span>
                            <span className="ml-2" style={{ color: developerInfo.cookieEnabled ? 'var(--color-success-600)' : 'var(--color-error-600)' }}>
              {developerInfo.cookieEnabled ? '✅ Enabled' : '❌ Disabled'}
            </span>
          </div>
          <div className="md:col-span-2">
            <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>User Agent:</span>
            <span className="ml-2 break-all" style={{ color: 'var(--text-secondary)' }}>{developerInfo.userAgent}</span>
          </div>
        </div>
      </div>

      {/* API Testing */}
      <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <CodeBracketIcon className="h-5 w-5" style={{ color: 'var(--color-success-500)' }} />
            <h4 className="text-md font-medium" style={{ color: 'var(--text-primary)' }}>API Testing</h4>
          </div>
          <button
            onClick={testApiConnection}
            disabled={isTestingApi}
                            className="inline-flex items-center px-3 py-2 shadow-sm text-sm leading-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors duration-200"
                style={{
                  backgroundColor: 'var(--color-primary-600)',
                  color: 'var(--color-text-on-primary)',
                  '--tw-ring-color': 'var(--color-primary-500)'
                } as React.CSSProperties}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary-700)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
                }}
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${isTestingApi ? 'animate-spin' : ''}`} />
            {isTestingApi ? 'Testing...' : 'Test API'}
          </button>
        </div>

        {apiTestResult && (
          <div className="rounded-md p-4" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
            <pre className="text-sm whitespace-pre-wrap font-mono" style={{ color: 'var(--text-primary)' }}>
              {apiTestResult}
            </pre>
            <button
              onClick={() => copyToClipboard(apiTestResult)}
              className="mt-2 inline-flex items-center px-2 py-1 shadow-sm text-xs font-medium rounded transition-colors"
              style={{
                backgroundColor: 'var(--color-secondary-600)',
                color: 'var(--color-text-on-secondary)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-secondary-700)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-secondary-600)';
              }}
            >
              <ClipboardDocumentIcon className="h-3 w-3 mr-1" />
              Copy
            </button>
          </div>
        )}
      </div>

      {/* Local Storage Management */}
      <div className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <DocumentTextIcon className="h-5 w-5 text-[var(--color-secondary-500)]" />
            <h4 className="text-md font-medium text-[var(--color-text-primary)]">Local Storage</h4>
          </div>
          <button
            onClick={loadLocalStorageItems}
            className="inline-flex items-center px-3 py-2 border border-[var(--color-border)] shadow-sm text-sm leading-4 font-medium rounded-md text-[var(--color-text-secondary)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-secondary)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary-500)]"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {localStorageItems.map((item) => (
            <div key={item.key} className="flex items-center justify-between p-2 bg-[var(--color-surface-secondary)] rounded">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[var(--color-text-primary)] truncate">{item.key}</div>
                <div className="text-xs text-[var(--color-text-tertiary)]">
                  {item.size} bytes • {item.value.substring(0, 50)}
                  {item.value.length > 50 ? '...' : ''}
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => copyToClipboard(item.value)}
                  className="p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
                  title="Copy value"
                >
                  <ClipboardDocumentIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => clearLocalStorageItem(item.key)}
                  className="p-1 text-[var(--color-error-400)] hover:text-[var(--color-error-600)]"
                  title="Delete item"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {localStorageItems.length === 0 && (
          <p className="text-[var(--color-text-tertiary)] text-center py-4">No localStorage items found</p>
        )}
      </div>

      {/* Debug Tools */}
      <div className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] p-6">
        <div className="flex items-center space-x-2 mb-4">
          <CogIcon className="h-5 w-5 text-[var(--color-text-tertiary)]" />
          <h4 className="text-md font-medium text-[var(--color-text-primary)]">Debug Tools</h4>
        </div>

        <div className="space-y-4">
          <div>
            <button
              onClick={exportDebugInfo}
              className="inline-flex items-center px-4 py-2 border border-[var(--color-border)] shadow-sm text-sm font-medium rounded-md text-[var(--color-text-secondary)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-secondary)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary-500)]"
            >
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              Export Debug Information
            </button>

            <div className="text-sm text-[var(--color-text-tertiary)] mt-2">
              Downloads a JSON file with system info, localStorage data, and API configuration for debugging.
            </div>
          </div>

          <div>
            <button
              onClick={() => setShowApiLogger(!showApiLogger)}
              className="inline-flex items-center px-4 py-2 border border-[var(--color-border)] shadow-sm text-sm font-medium rounded-md text-[var(--color-text-secondary)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-secondary)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary-500)]"
            >
              <CodeBracketIcon className="h-4 w-4 mr-2" />
              {showApiLogger ? 'Hide API Call Logger' : 'Show API Call Logger'}
            </button>

            <div className="text-sm text-[var(--color-text-tertiary)] mt-2">
              Monitor API calls in real-time to debug network issues and authentication problems.
            </div>

            {showApiLogger && (
              <div className="mt-4">
                <ApiCallLogger />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-error-200)] p-6">
        <div className="flex items-center space-x-2 mb-4">
          <ExclamationTriangleIcon className="h-5 w-5 text-[var(--color-error-500)]" />
          <h4 className="text-md font-medium text-[var(--color-error-900)]">Danger Zone</h4>
          <button
            onClick={() => setShowDangerZone(!showDangerZone)}
            className="ml-auto text-sm text-[var(--color-error-600)] hover:text-[var(--color-error-800)]"
          >
            {showDangerZone ? 'Hide' : 'Show'}
          </button>
        </div>

        {showDangerZone && (
          <div className="space-y-3">
            <div className="bg-[var(--color-error-50)] border border-[var(--color-error-200)] rounded-md p-4">
              <p className="text-sm text-[var(--color-error-800)] mb-3">
                ⚠️ These actions are irreversible and will affect your current session.
              </p>
              
              <button
                onClick={clearAllLocalStorage}
                className="inline-flex items-center px-4 py-2 border border-[var(--color-error-300)] shadow-sm text-sm font-medium rounded-md text-[var(--color-error-700)] bg-[var(--color-error-50)] hover:bg-[var(--color-error-100)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-error-500)]"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Clear All Local Storage
              </button>
              
              <p className="text-xs text-[var(--color-error-600)] mt-2">
                This will log you out and clear all locally stored data.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeveloperSettings; 