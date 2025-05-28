import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import SettingsLayout from '../components/settings/SettingsLayout';
import ProfileSettings from '../components/settings/ProfileSettings';
import PreferencesSettings from '../components/settings/PreferencesSettings';
import SecuritySettings from '../components/settings/SecuritySettings';
import NotificationSettings from '../components/settings/NotificationSettings';
import DeveloperSettings from '../components/settings/DeveloperSettings';
import { HealthStatus } from '../components/common/HealthStatus';

export const Settings: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('profile');

  // Handle URL parameters for direct tab navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get('tab');
    
    if (tabParam) {
      const validTabs = ['profile', 'preferences', 'security', 'notifications', 'api-health', 'developer'];
      if (validTabs.includes(tabParam)) {
        setActiveTab(tabParam);
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
      default:
        return <ProfileSettings />;
    }
  };

  return (
    <SettingsLayout>
      <SettingsLayout.Content 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
      >
        {renderTabContent()}
      </SettingsLayout.Content>
    </SettingsLayout>
  );
};

export default Settings; 