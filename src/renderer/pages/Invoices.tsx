import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import { 
  DocumentTextIcon, 
  PlusIcon,
  ChartBarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { InvoiceList, InvoiceGenerator } from '../components/invoices';
import { useAppContext } from '../context/AppContext';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const Invoices: React.FC = () => {
  const { state } = useAppContext();
  const [selectedTab, setSelectedTab] = useState(0);

  // Calculate some summary statistics
  const invoiceStats = {
    total: state.invoices.length,
    draft: state.invoices.filter(i => i.status === 'draft').length,
    sent: state.invoices.filter(i => i.status === 'sent').length,
    paid: state.invoices.filter(i => i.status === 'paid').length,
    overdue: state.invoices.filter(i => i.status === 'overdue').length,
    totalRevenue: state.invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + i.totalAmount, 0),
    pendingRevenue: state.invoices
      .filter(i => i.status === 'sent')
      .reduce((sum, i) => sum + i.totalAmount, 0),
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const tabs = [
    {
      name: 'All Invoices',
      icon: DocumentTextIcon,
      count: invoiceStats.total,
      component: <InvoiceList />,
    },
    {
      name: 'Generate Invoice',
      icon: PlusIcon,
      count: undefined,
      component: <InvoiceGenerator />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Invoices</h1>
        <p className="text-neutral-600">Manage invoices and billing for your clients</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-neutral-500">Total Invoices</p>
              <p className="text-2xl font-bold text-neutral-900">{invoiceStats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-neutral-500">Paid Revenue</p>
              <p className="text-2xl font-bold text-neutral-900">
                {formatCurrency(invoiceStats.totalRevenue)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Cog6ToothIcon className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-neutral-500">Pending</p>
              <p className="text-2xl font-bold text-neutral-900">
                {formatCurrency(invoiceStats.pendingRevenue)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500">Status Breakdown</p>
              <div className="mt-1 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-600">Draft:</span>
                  <span className="font-medium">{invoiceStats.draft}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-600">Sent:</span>
                  <span className="font-medium">{invoiceStats.sent}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-600">Paid:</span>
                  <span className="font-medium text-green-600">{invoiceStats.paid}</span>
                </div>
                {invoiceStats.overdue > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-600">Overdue:</span>
                    <span className="font-medium text-red-600">{invoiceStats.overdue}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Interface */}
      <div className="bg-white rounded-xl shadow-soft">
        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
          <div className="border-b border-neutral-200">
            <Tab.List className="flex space-x-8 px-6">
              {tabs.map((tab, index) => (
                <Tab
                  key={tab.name}
                  className={({ selected }) =>
                    classNames(
                      'py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 focus:outline-none',
                      selected
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                    )
                  }
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.name}
                  {tab.count !== undefined && (
                    <span
                      className={classNames(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        selectedTab === index
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-neutral-100 text-neutral-800'
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                </Tab>
              ))}
            </Tab.List>
          </div>

          <Tab.Panels>
            {tabs.map((tab, index) => (
              <Tab.Panel key={index} className="p-6">
                {tab.component}
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </div>

      {/* Quick Help */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">Invoice Management</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-1">Generate Invoices</h4>
            <p>Create invoices from approved billable time entries. Select a client and their approved hours to generate professional invoices.</p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Track Payments</h4>
            <p>Monitor invoice status from draft to paid. Send invoices to clients and track payment completion to maintain healthy cash flow.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoices; 