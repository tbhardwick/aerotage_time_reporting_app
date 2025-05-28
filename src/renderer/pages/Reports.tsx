import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import { ChartBarIcon, DocumentChartBarIcon, DocumentArrowDownIcon, TableCellsIcon } from '@heroicons/react/24/outline';
import TimeReports from '../components/reports/TimeReports';
import ChartAnalytics from '../components/reports/ChartAnalytics';
import ExportReports from '../components/reports/ExportReports';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const Reports: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);

  const tabs = [
    {
      name: 'Time Reports',
      icon: ChartBarIcon,
      component: <TimeReports />,
      description: 'Detailed time tracking reports and analytics'
    },
    {
      name: 'Analytics',
      icon: DocumentChartBarIcon,
      component: <ChartAnalytics />,
      description: 'Visual charts and performance metrics'
    },
    {
      name: 'Export',
      icon: DocumentArrowDownIcon,
      component: <ExportReports />,
      description: 'Export reports in various formats'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Reports & Analytics</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Comprehensive reporting and analytics for time tracking and project performance
        </p>
      </div>

      {/* Tab Interface */}
      <div className="rounded-xl shadow-sm" style={{ backgroundColor: 'var(--surface-color)' }}>
        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
          <div style={{ borderBottom: '1px solid var(--border-color)' }}>
            <Tab.List className="flex space-x-8 px-6">
              {tabs.map((tab, index) => (
                <Tab
                  key={tab.name}
                  className={({ selected }) =>
                    classNames(
                      'py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 focus:outline-none transition-colors',
                      selected
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent'
                    )
                  }
                  style={{
                    color: 'var(--text-secondary)'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedTab !== index) {
                      e.currentTarget.style.color = 'var(--text-primary)';
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedTab !== index) {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                      e.currentTarget.style.borderColor = 'transparent';
                    }
                  }}
                >
                  {({ selected }) => (
                    <div 
                      className="flex items-center gap-2"
                      style={{
                        color: selected ? '#2563eb' : 'var(--text-secondary)'
                      }}
                    >
                      <tab.icon className="w-5 h-5" />
                      {tab.name}
                    </div>
                  )}
                </Tab>
              ))}
            </Tab.List>
          </div>

          <Tab.Panels>
            {tabs.map((tab, index) => (
              <Tab.Panel key={index} className="p-6">
                {/* Tab Description */}
                <div className="mb-6">
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{tab.description}</p>
                </div>

                {/* Tab Content */}
                {tab.component}
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </div>

      {/* Quick Help */}
      <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
        <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Reporting Features</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm" style={{ color: 'var(--text-primary)' }}>
          <div>
            <h4 className="font-medium mb-1">Time Reports</h4>
            <p>Detailed breakdowns of time entries by project, user, and date range with filtering and summary statistics.</p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Visual Analytics</h4>
            <p>Interactive charts showing productivity trends, project distribution, and billable vs non-billable time.</p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Export Options</h4>
            <p>Export reports in PDF, CSV, or Excel formats for external analysis and client presentations.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports; 