import React, { useState } from 'react';

interface SettingsLayoutProps {
  children: React.ReactNode;
}

interface SettingsTab {
  id: string;
  label: string;
  icon: string;
}

const settingsTabs: SettingsTab[] = [
  { id: 'profile', label: 'Profile', icon: '👤' },
  { id: 'preferences', label: 'Preferences', icon: '⚙️' },
  { id: 'security', label: 'Security', icon: '🔒' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'api-test', label: 'API Test', icon: '🧪' },
];

interface SettingsLayoutContentProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
}

const SettingsLayout: React.FC<SettingsLayoutProps> & {
  Content: React.FC<SettingsLayoutContentProps>;
} = ({ children }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
        <p className="text-neutral-600">Manage your account settings and preferences</p>
      </div>
      {children}
    </div>
  );
};

const SettingsLayoutContent: React.FC<SettingsLayoutContentProps> = ({
  activeTab,
  onTabChange,
  children
}) => {
  return (
    <div className="bg-white rounded-xl shadow-soft overflow-hidden">
      {/* Tab Navigation */}
      <div className="border-b border-neutral-200">
        <nav className="flex space-x-8" aria-label="Settings sections">
          {settingsTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center space-x-2 py-4 px-6 text-sm font-medium border-b-2 transition-colors duration-200
                ${activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }
              `}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

SettingsLayout.Content = SettingsLayoutContent;

export default SettingsLayout; 