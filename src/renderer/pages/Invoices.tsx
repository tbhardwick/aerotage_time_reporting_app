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
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Invoices</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage invoices and billing for your clients</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl shadow-sm p-6" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8" style={{ color: 'var(--color-primary-600)' }} />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Total Invoices</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{invoiceStats.total}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl shadow-sm p-6" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8" style={{ color: 'var(--color-success-600)' }} />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Paid Revenue</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(invoiceStats.totalRevenue)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl shadow-sm p-6" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Cog6ToothIcon className="h-8 w-8" style={{ color: 'var(--color-warning-600)' }} />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Pending</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(invoiceStats.pendingRevenue)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl shadow-sm p-6" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Status Breakdown</p>
              <div className="mt-1 space-y-1">
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--text-secondary)' }}>Draft:</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{invoiceStats.draft}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--text-secondary)' }}>Sent:</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{invoiceStats.sent}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--text-secondary)' }}>Paid:</span>
                  <span className="font-medium" style={{ color: 'var(--color-success-600)' }}>{invoiceStats.paid}</span>
                </div>
                {invoiceStats.overdue > 0 && (
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--text-secondary)' }}>Overdue:</span>
                    <span className="font-medium" style={{ color: 'var(--color-error-600)' }}>{invoiceStats.overdue}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
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
                        ? 'border-transparent'
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
                        color: selected ? 'var(--color-primary-600)' : 'var(--text-secondary)',
                        borderBottomColor: selected ? 'var(--color-primary-600)' : 'transparent'
                      }}
                    >
                      <tab.icon className="w-5 h-5" />
                      {tab.name}
                      {tab.count !== undefined && (
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: selectedTab === index
                              ? 'var(--color-primary-50)'
                              : 'var(--color-secondary-50)',
                            color: selectedTab === index
                              ? 'var(--color-primary-800)'
                              : 'var(--color-secondary-800)'
                          }}
                        >
                          {tab.count}
                        </span>
                      )}
                    </div>
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
      <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
        <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Invoice Management</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm" style={{ color: 'var(--text-primary)' }}>
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