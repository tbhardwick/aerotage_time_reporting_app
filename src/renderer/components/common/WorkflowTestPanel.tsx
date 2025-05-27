import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useApiOperations } from '../../hooks/useApiOperations';
import { useDataLoader } from '../../hooks/useDataLoader';

const WorkflowTestPanel: React.FC = () => {
  const { state } = useAppContext();
  const { createTimeEntry, submitTimeEntries, approveTimeEntries } = useApiOperations();
  const { loadTimeEntries } = useDataLoader();
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Check user permissions
  const currentUser = state.user;
  const canApprove = currentUser?.role === 'manager' || currentUser?.role === 'admin';
  const userRole = currentUser?.role || 'unknown';

  const createTestTimeEntry = async () => {
    setIsCreating(true);
    try {
      const activeProject = state.projects.find(p => p.status === 'active');
      if (!activeProject) {
        addResult('❌ No active projects found. Please create a project first.');
        return;
      }

      const testEntry = {
        projectId: activeProject.id,
        date: new Date().toISOString().split('T')[0],
        duration: 60, // 1 hour
        description: `Test Entry - ${new Date().toLocaleTimeString()}`,
        isBillable: true,
        status: 'draft' as const,
      };

      const newEntry = await createTimeEntry(testEntry);
      addResult(`✅ Created test time entry: ${newEntry.description} (ID: ${newEntry.id})`);
      return newEntry.id;
    } catch (error: any) {
      addResult(`❌ Failed to create time entry: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const submitTestEntries = async () => {
    setIsSubmitting(true);
    try {
      const draftEntries = state.timeEntries.filter(entry => entry.status === 'draft');
      if (draftEntries.length === 0) {
        addResult('❌ No draft entries found to submit.');
        return;
      }

      const entryIds = draftEntries.slice(0, 3).map(entry => entry.id); // Submit up to 3 entries
      await submitTimeEntries(entryIds);
      addResult(`✅ Submitted ${entryIds.length} time entries for approval`);
    } catch (error: any) {
      addResult(`❌ Failed to submit time entries: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const approveTestEntries = async () => {
    setIsApproving(true);
    try {
      const submittedEntries = state.timeEntries.filter(entry => entry.status === 'submitted');
      if (submittedEntries.length === 0) {
        addResult('❌ No submitted entries found to approve.');
        return;
      }

      // Only approve entries that were recently submitted (within last 5 minutes)
      const recentlySubmitted = submittedEntries.filter(entry => {
        if (!entry.submittedAt) return false;
        const submittedTime = new Date(entry.submittedAt).getTime();
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        return submittedTime > fiveMinutesAgo;
      });

      if (recentlySubmitted.length === 0) {
        addResult('❌ No recently submitted entries found to approve. Try submitting some entries first.');
        return;
      }

      const entryIds = recentlySubmitted.slice(0, 3).map(entry => entry.id); // Approve up to 3 entries
      addResult(`🔄 Attempting to approve ${entryIds.length} recently submitted entries...`);
      
      await approveTimeEntries(entryIds, 'Test approval via workflow panel');
      addResult(`✅ Approved ${entryIds.length} time entries`);
    } catch (error: any) {
      addResult(`❌ Failed to approve time entries: ${error.message}`);
      
      // Provide more specific guidance based on the error
      if (error.message?.includes('INSUFFICIENT_APPROVAL_PERMISSIONS')) {
        addResult('💡 Tip: Make sure your user has manager or admin role to approve entries.');
      } else if (error.message?.includes('400')) {
        addResult('💡 Tip: Some entries may already be approved or have permission restrictions.');
      }
    } finally {
      setIsApproving(false);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await loadTimeEntries();
      addResult('✅ Refreshed time entries data from backend');
    } catch (error: any) {
      addResult(`❌ Failed to refresh data: ${error.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const runFullWorkflowTest = async () => {
    addResult('🚀 Starting full workflow test...');
    
    // Step 1: Create test entry
    addResult('📝 Step 1: Creating test time entry...');
    const entryId = await createTestTimeEntry();
    if (!entryId) {
      addResult('❌ Workflow test failed - could not create test entry');
      return;
    }

    // Step 2: Submit for approval
    addResult('📤 Step 2: Submitting test entry for approval...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    
    try {
      await submitTimeEntries([entryId]); // Submit only the entry we just created
      addResult('✅ Test entry submitted successfully');
    } catch (error: any) {
      addResult(`❌ Failed to submit test entry: ${error.message}`);
      return;
    }

    // Step 3: Approve entry
    addResult('✅ Step 3: Approving submitted test entry...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    
    try {
      await approveTimeEntries([entryId], 'Test approval via full workflow test');
      addResult('✅ Test entry approved successfully');
    } catch (error: any) {
      addResult(`❌ Failed to approve test entry: ${error.message}`);
      if (error.message?.includes('INSUFFICIENT_APPROVAL_PERMISSIONS')) {
        addResult('💡 Note: Your user may not have approval permissions. This is expected for employee roles.');
      }
      // Continue with refresh even if approval fails
    }

    // Step 4: Refresh data
    addResult('🔄 Step 4: Refreshing data from backend...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    await refreshData();

    addResult('🎉 Full workflow test completed!');
    addResult('📊 Check the status counters above to see the results.');
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // Count entries by status
  const entryCounts = {
    draft: state.timeEntries.filter(e => e.status === 'draft').length,
    submitted: state.timeEntries.filter(e => e.status === 'submitted').length,
    approved: state.timeEntries.filter(e => e.status === 'approved').length,
    rejected: state.timeEntries.filter(e => e.status === 'rejected').length,
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Workflow Test Panel</h3>
      
      {/* User Info */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Current User Info</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-blue-700 font-medium">Name:</span>
            <p className="text-blue-900">{currentUser?.name || 'Unknown'}</p>
          </div>
          <div>
            <span className="text-blue-700 font-medium">Role:</span>
            <p className="text-blue-900 capitalize">{userRole}</p>
          </div>
          <div>
            <span className="text-blue-700 font-medium">Can Approve:</span>
            <p className={`font-medium ${canApprove ? 'text-green-600' : 'text-orange-600'}`}>
              {canApprove ? '✅ Yes' : '❌ No (Employee role)'}
            </p>
          </div>
          <div>
            <span className="text-blue-700 font-medium">Email:</span>
            <p className="text-blue-900">{currentUser?.email || 'Unknown'}</p>
          </div>
        </div>
        {!canApprove && (
          <div className="mt-2 text-xs text-orange-700 bg-orange-100 p-2 rounded">
            💡 Note: Only managers and admins can approve time entries. Approval tests may fail for employee users.
          </div>
        )}
      </div>

      {/* Current State */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Current Time Entry Status</h4>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="bg-gray-100 p-2 rounded text-center">
            <div className="font-medium">{entryCounts.draft}</div>
            <div className="text-gray-600">Draft</div>
          </div>
          <div className="bg-yellow-100 p-2 rounded text-center">
            <div className="font-medium">{entryCounts.submitted}</div>
            <div className="text-gray-600">Submitted</div>
          </div>
          <div className="bg-green-100 p-2 rounded text-center">
            <div className="font-medium">{entryCounts.approved}</div>
            <div className="text-gray-600">Approved</div>
          </div>
          <div className="bg-red-100 p-2 rounded text-center">
            <div className="font-medium">{entryCounts.rejected}</div>
            <div className="text-gray-600">Rejected</div>
          </div>
        </div>
      </div>

      {/* Test Actions */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Test Actions</h4>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={createTestTimeEntry}
            disabled={isCreating}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creating...' : 'Create Test Entry'}
          </button>
          
          <button
            onClick={submitTestEntries}
            disabled={isSubmitting || entryCounts.draft === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Draft Entries'}
          </button>
          
          <button
            onClick={approveTestEntries}
            disabled={isApproving || entryCounts.submitted === 0 || !canApprove}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title={!canApprove ? 'Approval requires manager or admin role' : ''}
          >
            {isApproving ? 'Approving...' : 'Approve Submitted'}
          </button>
          
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
        
        <div className="mt-3 flex space-x-3">
          <button
            onClick={runFullWorkflowTest}
            disabled={isCreating || isSubmitting || isApproving || isRefreshing}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Run Full Workflow Test
          </button>
          
          <button
            onClick={clearResults}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Clear Results
          </button>
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Test Results</h4>
          <div className="bg-gray-50 rounded-md p-3 max-h-64 overflow-y-auto">
            {testResults.map((result, index) => (
              <div key={index} className="text-sm font-mono text-gray-800 mb-1">
                {result}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Testing Guide for Non-Approvers */}
      {!canApprove && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">📋 Manual Testing Guide</h4>
          <p className="text-sm text-yellow-700 mb-3">
            Since you don't have approval permissions, here's how to test the full workflow:
          </p>
          <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
            <li>Use the buttons above to create and submit time entries</li>
            <li>Ask a manager or admin to approve your submitted entries</li>
            <li>Once approved, go to <strong>Invoices → Generate</strong> to see them available for invoicing</li>
            <li>Alternatively, have a manager/admin user test the approval workflow</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default WorkflowTestPanel; 