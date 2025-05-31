import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import SettingsLayout from '../components/settings/SettingsLayout';
import ProfileSettings from '../components/settings/ProfileSettings';
import PreferencesSettings from '../components/settings/PreferencesSettings';
import SecuritySettings from '../components/settings/SecuritySettings';
import NotificationSettings from '../components/settings/NotificationSettings';
import DeveloperSettings from '../components/settings/DeveloperSettings';
import { HealthStatus } from '../components/common/HealthStatus';
import { AuthDebugger } from '../components/debug/AuthDebugger';

export const Settings: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('profile');
  const [showAuthDebugger, setShowAuthDebugger] = useState(false);

  // Handle URL parameters for direct tab navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get('tab');
    
    if (tabParam) {
      const validTabs = ['profile', 'preferences', 'security', 'notifications', 'api-health', 'developer', 'auth-debug'];
      if (validTabs.includes(tabParam)) {
        setActiveTab(tabParam);
        // Show auth debugger if that tab is selected
        if (tabParam === 'auth-debug') {
          setShowAuthDebugger(true);
        }
      }
    }
  }, [location.search]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings />;
      case 'preferences':
        return <PreferencesSettings />;
      case 'security':
        return <SecuritySettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'api-health':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2 text-[var(--color-text-primary)]">API Health Status</h3>
              <p className="mb-4 text-[var(--color-text-secondary)]">
                Monitor the health and performance of the Aerotage Time Reporting API.
              </p>
            </div>
            <HealthStatus 
              showDetails={true} 
              autoRefresh={true} 
              refreshInterval={30000}
              className="w-full"
            />
          </div>
        );
      case 'developer':
        return <DeveloperSettings />;
      case 'auth-debug':
        // Show a button to open the auth debugger instead of rendering it directly
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2 text-[var(--color-text-primary)]">Authentication Debugger</h3>
              <p className="mb-4 text-[var(--color-text-secondary)]">
                Debug authentication issues and test API connectivity. This tool disables automatic logout for debugging purposes.
              </p>
            </div>
            <button
              onClick={() => setShowAuthDebugger(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Open Authentication Debugger
            </button>
          </div>
        );
      default:
        return <ProfileSettings />;
    }
  };

  return (
    <>
      <SettingsLayout>
        <SettingsLayout.Content 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
        >
          {renderTabContent()}
        </SettingsLayout.Content>
      </SettingsLayout>
      
      {/* Auth Debugger Overlay */}
      {showAuthDebugger && (
        <AuthDebugger onClose={() => setShowAuthDebugger(false)} />
      )}
    </>
  );
};

export default Settings; 