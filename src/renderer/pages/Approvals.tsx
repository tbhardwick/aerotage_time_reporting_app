import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import { ClockIcon, CheckCircleIcon, DocumentTextIcon, UserIcon } from '@heroicons/react/24/outline';
import { useAppContext } from '../context/AppContext';
import { ApprovalQueue, BulkSubmission, ApprovalHistory } from '../components/approvals';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export function Approvals() {
  const { state } = useAppContext();
  const currentUser = state.user;

  // Check if user can approve (manager or admin)
  const canApprove = currentUser?.role === 'manager' || currentUser?.role === 'admin';

  // Get pending counts for badges
  const pendingCount = state.timeEntries.filter(entry => {
    if (entry.status !== 'submitted') return false;
    
    // If user is a manager, count entries from their team members
    if (currentUser?.role === 'manager') {
      const team = state.teams.find(team => team.managerId === currentUser.id);
      if (team) {
        const teamMemberIds = team.memberIds;
        const entryUser = state.users.find(u => u.id === entry.submittedBy);
        return entryUser && teamMemberIds.includes(entryUser.id);
      }
    }
    
    // If admin, count all pending entries
    if (currentUser?.role === 'admin') {
      return true;
    }
    
    return false;
  }).length;

  const draftCount = state.timeEntries.filter(entry => 
    entry.status === 'draft' && 
    (!entry.submittedBy || entry.submittedBy === currentUser?.id)
  ).length;

  // Tab configuration based on user role
  const tabs = [
    // Always show submission tab for employees
    {
      name: 'Submit Entries',
      icon: ClockIcon,
      component: <BulkSubmission userId={currentUser?.id} />,
      badge: draftCount > 0 ? draftCount : undefined,
      description: 'Submit your draft time entries for approval'
    },
    // Show approval queue for managers and admins
    ...(canApprove ? [{
      name: 'Approval Queue',
      icon: CheckCircleIcon,
      component: <ApprovalQueue managerId={currentUser?.role === 'manager' ? currentUser?.id : undefined} />,
      badge: pendingCount > 0 ? pendingCount : undefined,
      description: 'Review and approve submitted time entries'
    }] : []),
    // History tab for everyone
    {
      name: 'History',
      icon: DocumentTextIcon,
      component: <ApprovalHistory userId={currentUser?.role === 'employee' ? currentUser?.id : undefined} />,
      description: 'View approval history and audit trail'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <CheckCircleIcon className="h-8 w-8 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Time Entry Approvals</h1>
              <p className="text-sm text-gray-500">
                Manage time entry submissions and approvals
              </p>
            </div>
          </div>

          {/* User Role Context */}
          <div className="mt-4">
            <div className="flex items-center space-x-2 text-sm">
              <UserIcon className="h-4 w-4 text-gray-400" />
              <span className="text-gray-500">Logged in as:</span>
              <span className="font-medium text-gray-900">{currentUser?.name}</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                currentUser?.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                currentUser?.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }`}>
                {currentUser?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Interface */}
        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
            {tabs.map((tab, index) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                    'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                    selected
                      ? 'bg-white text-blue-700 shadow'
                      : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                  )
                }
              >
                <div className="flex items-center justify-center space-x-2">
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                  {tab.badge && (
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </div>
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels className="mt-6">
            {tabs.map((tab, index) => (
              <Tab.Panel
                key={index}
                className={classNames(
                  'rounded-xl bg-white p-6',
                  'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'
                )}
              >
                {/* Tab Description */}
                <div className="mb-6">
                  <p className="text-sm text-gray-600">{tab.description}</p>
                </div>

                {/* Tab Content */}
                {tab.component}
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>

        {/* Help Text for Different Roles */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Quick Guide</h3>
          <div className="text-sm text-blue-700 space-y-1">
            {currentUser?.role === 'employee' && (
              <>
                <p>• Use the "Submit Entries" tab to submit your draft time entries for approval</p>
                <p>• Check the "History" tab to see the status of your submitted entries</p>
                <p>• Entries must be approved before they can be included in invoices</p>
              </>
            )}
            {currentUser?.role === 'manager' && (
              <>
                <p>• Review your team's time entries in the "Approval Queue" tab</p>
                <p>• You can approve or reject entries with optional comments</p>
                <p>• Use bulk actions to approve multiple entries at once</p>
                <p>• Monitor approval history and team productivity in the "History" tab</p>
              </>
            )}
            {currentUser?.role === 'admin' && (
              <>
                <p>• You have access to all time entries across the organization</p>
                <p>• Use the approval queue to manage company-wide time entry approvals</p>
                <p>• Monitor approval metrics and audit trails in the history section</p>
                <p>• You can submit your own time entries in the "Submit Entries" tab</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 