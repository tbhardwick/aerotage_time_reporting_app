import React, { useState } from 'react';
import SettingsLayout from '../components/settings/SettingsLayout';
import { ProfileSettings, PreferencesSettings, SecuritySettings, NotificationSettings } from '../components/settings';
import ApiIntegrationTest from '../components/common/ApiIntegrationTest';
import WorkflowTestPanel from '../components/common/WorkflowTestPanel';
import AdminBootstrap from '../components/common/AdminBootstrap';

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
      case 'workflow-test':
        return <WorkflowTestPanel />;
      case 'admin-bootstrap':
        return <AdminBootstrap />;
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