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
  const tabs = [
    {
      name: 'Time Reports',
      icon: TableCellsIcon,
      component: TimeReports,
      description: 'Detailed time tracking reports with filtering',
    },
    {
      name: 'Analytics',
      icon: ChartBarIcon,
      component: ChartAnalytics,
      description: 'Visual charts and performance insights',
    },
    {
      name: 'Export',
      icon: DocumentArrowDownIcon,
      component: ExportReports,
      description: 'Export reports in PDF, Excel, and CSV formats',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Reports & Analytics</h1>
        <p className="text-neutral-600">
          View detailed time reports, analytics, and export data in multiple formats
        </p>
      </div>

      {/* Tab Interface */}
      <div className="bg-white rounded-xl shadow-soft">
        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-xl bg-neutral-100 p-1">
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                    'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                    selected
                      ? 'bg-white text-blue-700 shadow'
                      : 'text-neutral-700 hover:bg-white/[0.12] hover:text-neutral-900'
                  )
                }
              >
                <div className="flex items-center justify-center space-x-2">
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </div>
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels className="mt-2">
            {tabs.map((tab, idx) => (
              <Tab.Panel
                key={idx}
                className={classNames(
                  'rounded-xl bg-white p-6',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'
                )}
              >
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-neutral-900 flex items-center">
                    <tab.icon className="h-6 w-6 mr-2 text-blue-600" />
                    {tab.name}
                  </h2>
                  <p className="text-neutral-600 text-sm">{tab.description}</p>
                </div>
                <tab.component />
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </div>

      {/* Quick Stats Summary */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-soft p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">Reporting Suite</h3>
            <p className="text-blue-100">
              Complete time tracking analytics and reporting tools for professional insights
            </p>
          </div>
          <DocumentChartBarIcon className="h-12 w-12 text-blue-200" />
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <h4 className="font-semibold text-blue-100">Time Reports</h4>
            <p className="text-sm text-blue-200">
              Filter and analyze time entries with detailed breakdowns by project, client, and status
            </p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <h4 className="font-semibold text-blue-100">Visual Analytics</h4>
            <p className="text-sm text-blue-200">
              Interactive charts showing trends, productivity patterns, and project distribution
            </p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <h4 className="font-semibold text-blue-100">Export Options</h4>
            <p className="text-sm text-blue-200">
              Professional PDF reports, Excel spreadsheets, and CSV data exports
            </p>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TableCellsIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="ml-4 text-lg font-semibold text-neutral-900">Advanced Filtering</h3>
          </div>
          <p className="text-neutral-600">
            Filter time entries by date range, project, status, and billable type with real-time summary calculations.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="ml-4 text-lg font-semibold text-neutral-900">Interactive Charts</h3>
          </div>
          <p className="text-neutral-600">
            Visualize productivity trends, project distribution, revenue patterns, and approval rates with dynamic charts.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <DocumentArrowDownIcon className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="ml-4 text-lg font-semibold text-neutral-900">Multi-Format Export</h3>
          </div>
          <p className="text-neutral-600">
            Export professional reports in PDF, detailed Excel workbooks, or simple CSV files for external analysis.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Reports; 