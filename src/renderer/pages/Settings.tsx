import React, { useState } from 'react';
import SettingsLayout from '../components/settings/SettingsLayout';
import { ProfileSettings, PreferencesSettings, SecuritySettings, NotificationSettings } from '../components/settings';
import { HealthStatus } from '../components/common/HealthStatus';
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
      case 'api-health':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">API Health Status</h2>
              <p className="text-gray-600 mb-6">
                Monitor the health and performance of API connections. This helps ensure optimal application performance and connectivity.
              </p>
            </div>
            <HealthStatus showDetails={true} className="max-w-4xl" />
          </div>
        );
      case 'developer':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Developer Tools</h2>
              <p className="text-gray-600 mb-6">
                Development and testing tools for API integration, workflow testing, and system administration.
              </p>
            </div>
            
            {/* API Integration Test */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-xl mr-2">🧪</span>
                API Integration Test
              </h3>
              <ApiIntegrationTest />
            </div>
            
            {/* Workflow Test */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-xl mr-2">🔄</span>
                Workflow Test
              </h3>
              <WorkflowTestPanel />
            </div>
            
            {/* Admin Bootstrap */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-xl mr-2">🛠️</span>
                Admin Bootstrap
              </h3>
              <AdminBootstrap />
            </div>
          </div>
        );
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