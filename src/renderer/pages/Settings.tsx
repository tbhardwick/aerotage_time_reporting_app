import React, { useState } from 'react';
import SettingsLayout from '../components/settings/SettingsLayout';
import { ProfileSettings, PreferencesSettings, SecuritySettings, NotificationSettings } from '../components/settings';
import ApiIntegrationTest from '../components/common/ApiIntegrationTest';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');

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
      case 'api-test':
        return <ApiIntegrationTest />;
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