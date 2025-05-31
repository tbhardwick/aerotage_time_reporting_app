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
  { id: 'api-health', label: 'API Status', icon: '🏥' },
  { id: 'developer', label: 'Developer', icon: '🛠️' },
  { id: 'auth-debug', label: 'Auth Debug', icon: '🔍' },
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
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your account settings and preferences</p>
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
    <div className="rounded-xl shadow-soft overflow-hidden" style={{ backgroundColor: 'var(--surface-color)' }}>
      {/* Tab Navigation */}
      <div style={{ borderBottom: '1px solid var(--border-color)' }}>
        <nav className="flex flex-wrap space-x-2 sm:space-x-4 lg:space-x-6 p-2" aria-label="Settings sections">
          {settingsTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center space-x-1 sm:space-x-2 py-2 px-2 sm:px-3 lg:px-4 text-xs sm:text-sm font-medium border-b-2 transition-colors duration-200 mb-2
                ${activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent'
                }
              `}
              style={{
                color: activeTab === tab.id ? '#2563eb' : 'var(--text-secondary)'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.borderColor = 'transparent';
                }
              }}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <span className="text-sm sm:text-base">{tab.icon}</span>
              <span className="whitespace-nowrap">{tab.label}</span>
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