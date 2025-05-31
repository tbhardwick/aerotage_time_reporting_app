import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useApiOperations } from '../../hooks/useApiOperations';
import { useDataLoader } from '../../hooks/useDataLoader';

const WorkflowTestPanel: React.FC = () => {
  const { state } = useAppContext();
  const { createTimeEntry, submitTimeEntries, approveTimeEntries } = useApiOperations();
  const { loadTimeEntries, loadCurrentUser } = useDataLoader();
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRefreshingUser, setIsRefreshingUser] = useState(false);
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

      // Filter out entries submitted by the current user (can't approve own entries)
      const otherUsersEntries = submittedEntries.filter(entry => 
        entry.submittedBy && entry.submittedBy !== currentUser?.id
      );

      if (otherUsersEntries.length === 0) {
        addResult('⚠️ No entries from other users found to approve.');
        addResult('💡 Note: Users cannot approve their own time entries (business rule).');
        addResult('📋 To test approval workflow:');
        addResult('   1. Have another user submit time entries, OR');
        addResult('   2. Use a different admin/manager account to approve entries');
        return;
      }

      // Only approve entries that were recently submitted (within last 5 minutes)
      const recentlySubmitted = otherUsersEntries.filter(entry => {
        if (!entry.submittedAt) return false;
        const submittedTime = new Date(entry.submittedAt).getTime();
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        return submittedTime > fiveMinutesAgo;
      });

      if (recentlySubmitted.length === 0) {
        addResult('❌ No recently submitted entries from other users found to approve.');
        addResult('💡 Try having another user submit entries, then approve them here.');
        return;
      }

      const entryIds = recentlySubmitted.slice(0, 3).map(entry => entry.id); // Approve up to 3 entries
      addResult(`🔄 Attempting to approve ${entryIds.length} entries from other users...`);
      
      await approveTimeEntries(entryIds, 'Test approval via workflow panel');
      addResult(`✅ Approved ${entryIds.length} time entries from other users`);
    } catch (error: any) {
      addResult(`❌ Failed to approve time entries: ${error.message}`);
      
      // Provide more specific guidance based on the error
      if (error.message?.includes('INSUFFICIENT_APPROVAL_PERMISSIONS') || 
          error.message?.includes('Cannot approve your own time entry')) {
        addResult('💡 Business Rule: Users cannot approve their own time entries.');
        addResult('📋 To test approval workflow:');
        addResult('   1. Create entries with a different user account, OR');
        addResult('   2. Have another user submit entries for you to approve');
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
      addResult('🔄 Refreshing time entries from backend...');
      await loadTimeEntries();
      addResult('✅ Time entries refreshed successfully');
    } catch (error: any) {
      addResult(`❌ Failed to refresh data: ${error.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const refreshCurrentUser = async () => {
    setIsRefreshingUser(true);
    try {
      addResult('🔄 Refreshing current user data from API...');
      const userData = await loadCurrentUser();
      addResult(`✅ Current user refreshed: ${userData.name} (${userData.role})`);
      addResult(`📊 User permissions: ${userData.permissions.features.join(', ')}`);
    } catch (error: any) {
      addResult(`❌ Failed to refresh user data: ${error.message}`);
    } finally {
      setIsRefreshingUser(false);
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

    // Step 3: Approve entry (with business rule handling)
    addResult('✅ Step 3: Attempting to approve submitted test entry...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    
    try {
      await approveTimeEntries([entryId], 'Test approval via full workflow test');
      addResult('✅ Test entry approved successfully');
    } catch (error: any) {
      addResult(`❌ Failed to approve test entry: ${error.message}`);
      if (error.message?.includes('INSUFFICIENT_APPROVAL_PERMISSIONS') || 
          error.message?.includes('Cannot approve your own time entry')) {
        addResult('💡 Business Rule: Users cannot approve their own time entries.');
        addResult('📋 This is expected behavior for security reasons.');
        addResult('🔄 Continuing with workflow test...');
      } else {
        addResult('💡 Note: Approval failed, but continuing with workflow test.');
      }
    }

    // Step 4: Refresh data
    addResult('🔄 Step 4: Refreshing data from backend...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    await refreshData();

    addResult('🎉 Full workflow test completed!');
    addResult('📊 Check the status counters above to see the results.');
    
    // Additional guidance for approval testing
    if (currentUser?.role === 'admin' || currentUser?.role === 'manager') {
      addResult('');
      addResult('📋 To test the approval workflow completely:');
      addResult('   1. Have another user create and submit time entries');
      addResult('   2. Then use the "Approve Submitted" button to approve them');
      addResult('   3. Or create a second admin/manager account for testing');
    }
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
    <div className="rounded-lg shadow p-6" style={{ backgroundColor: 'var(--surface-color)' }}>
      <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Workflow Test Panel</h3>
      
      {/* User Info */}
      <div 
        className="mb-6 p-4 rounded-lg"
        style={{
          backgroundColor: 'var(--color-primary-50)',
          border: '1px solid var(--color-primary-200)'
        }}
      >
        <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--color-primary-900)' }}>Current User Info</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium" style={{ color: 'var(--color-primary-700)' }}>Name:</span>
            <p style={{ color: 'var(--color-primary-900)' }}>{currentUser?.name || 'Unknown'}</p>
          </div>
          <div>
            <span className="font-medium" style={{ color: 'var(--color-primary-700)' }}>Role:</span>
            <p className="capitalize" style={{ color: 'var(--color-primary-900)' }}>{userRole}</p>
          </div>
          <div>
            <span className="font-medium" style={{ color: 'var(--color-primary-700)' }}>Can Approve:</span>
            <p 
              className="font-medium"
              style={{ color: canApprove ? 'var(--color-success-600)' : 'var(--color-warning-600)' }}
            >
              {canApprove ? '✅ Yes' : '❌ No (Employee role)'}
            </p>
          </div>
          <div>
            <span className="font-medium" style={{ color: 'var(--color-primary-700)' }}>Email:</span>
            <p style={{ color: 'var(--color-primary-900)' }}>{currentUser?.email || 'Unknown'}</p>
          </div>
        </div>
        {!canApprove && (
          <div 
            className="mt-2 text-xs p-2 rounded"
            style={{
              color: 'var(--color-warning-700)',
              backgroundColor: 'var(--color-warning-100)'
            }}
          >
            💡 Note: Only managers and admins can approve time entries. Approval tests may fail for employee users.
          </div>
        )}
        {canApprove && (
          <div 
            className="mt-2 text-xs p-2 rounded"
            style={{
              color: 'var(--color-primary-700)',
              backgroundColor: 'var(--color-primary-100)'
            }}
          >
            💡 Business Rule: Users cannot approve their own time entries. To test approval, you need entries from other users.
          </div>
        )}
      </div>

      {/* Current State */}
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Current Time Entry Status</h4>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div 
            className="p-2 rounded text-center"
            style={{ backgroundColor: 'var(--color-secondary-100)' }}
          >
            <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{entryCounts.draft}</div>
            <div style={{ color: 'var(--text-secondary)' }}>Draft</div>
          </div>
          <div 
            className="p-2 rounded text-center"
            style={{ backgroundColor: 'var(--color-warning-100)' }}
          >
            <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{entryCounts.submitted}</div>
            <div style={{ color: 'var(--text-secondary)' }}>Submitted</div>
          </div>
          <div 
            className="p-2 rounded text-center"
            style={{ backgroundColor: 'var(--color-success-100)' }}
          >
            <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{entryCounts.approved}</div>
            <div style={{ color: 'var(--text-secondary)' }}>Approved</div>
          </div>
          <div 
            className="p-2 rounded text-center"
            style={{ backgroundColor: 'var(--color-error-100)' }}
          >
            <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{entryCounts.rejected}</div>
            <div style={{ color: 'var(--text-secondary)' }}>Rejected</div>
          </div>
        </div>
      </div>

      {/* Test Actions */}
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Test Actions</h4>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={createTestTimeEntry}
            disabled={isCreating}
            className="px-4 py-2 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{
              color: 'var(--color-text-on-primary)',
              backgroundColor: 'var(--color-primary-600)'
            }}
            onMouseEnter={(e) => {
              if (!isCreating) {
                e.currentTarget.style.backgroundColor = 'var(--color-primary-700)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isCreating) {
                e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
              }
            }}
          >
            {isCreating ? 'Creating...' : 'Create Test Entry'}
          </button>
          
          <button
            onClick={submitTestEntries}
            disabled={isSubmitting || entryCounts.draft === 0}
            className="px-4 py-2 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{
              color: 'var(--color-text-on-warning)',
              backgroundColor: 'var(--color-warning-600)'
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting && entryCounts.draft > 0) {
                e.currentTarget.style.backgroundColor = 'var(--color-warning-700)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting && entryCounts.draft > 0) {
                e.currentTarget.style.backgroundColor = 'var(--color-warning-600)';
              }
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Draft Entries'}
          </button>
          
          <button
            onClick={approveTestEntries}
            disabled={isApproving || entryCounts.submitted === 0 || !canApprove}
            className="px-4 py-2 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{
              color: 'var(--color-text-on-success)',
              backgroundColor: 'var(--color-success-600)'
            }}
            onMouseEnter={(e) => {
              if (!isApproving && entryCounts.submitted > 0 && canApprove) {
                e.currentTarget.style.backgroundColor = 'var(--color-success-700)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isApproving && entryCounts.submitted > 0 && canApprove) {
                e.currentTarget.style.backgroundColor = 'var(--color-success-600)';
              }
            }}
            title={!canApprove ? 'Approval requires manager or admin role' : ''}
          >
            {isApproving ? 'Approving...' : 'Approve Submitted'}
          </button>
          
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className="px-4 py-2 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{
              color: 'var(--color-text-on-secondary)',
              backgroundColor: 'var(--color-secondary-600)'
            }}
            onMouseEnter={(e) => {
              if (!isRefreshing) {
                e.currentTarget.style.backgroundColor = 'var(--color-secondary-700)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isRefreshing) {
                e.currentTarget.style.backgroundColor = 'var(--color-secondary-600)';
              }
            }}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>

          <button
            onClick={refreshCurrentUser}
            disabled={isRefreshingUser}
            className="px-4 py-2 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{
              color: 'var(--color-text-on-secondary)',
              backgroundColor: 'var(--color-secondary-600)'
            }}
            onMouseEnter={(e) => {
              if (!isRefreshingUser) {
                e.currentTarget.style.backgroundColor = 'var(--color-secondary-700)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isRefreshingUser) {
                e.currentTarget.style.backgroundColor = 'var(--color-secondary-600)';
              }
            }}
          >
            {isRefreshingUser ? 'Refreshing...' : 'Refresh User Role'}
          </button>
        </div>
        
        <div className="mt-3 flex space-x-3">
          <button
            onClick={runFullWorkflowTest}
            disabled={isCreating || isSubmitting || isApproving || isRefreshing}
            className="px-4 py-2 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{
              color: 'var(--color-text-on-secondary)',
              backgroundColor: 'var(--color-secondary-600)'
            }}
            onMouseEnter={(e) => {
              if (!(isCreating || isSubmitting || isApproving || isRefreshing)) {
                e.currentTarget.style.backgroundColor = 'var(--color-secondary-700)';
              }
            }}
            onMouseLeave={(e) => {
              if (!(isCreating || isSubmitting || isApproving || isRefreshing)) {
                e.currentTarget.style.backgroundColor = 'var(--color-secondary-600)';
              }
            }}
          >
            Run Full Workflow Test
          </button>
          
          <button
            onClick={clearResults}
            className="px-4 py-2 text-sm font-medium rounded-md transition-colors"
            style={{
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--color-secondary-200)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-secondary-300)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-secondary-200)';
            }}
          >
            Clear Results
          </button>
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Test Results</h4>
          <div 
            className="rounded-md p-3 max-h-64 overflow-y-auto"
            style={{ backgroundColor: 'var(--color-secondary-50)' }}
          >
            {testResults.map((result, index) => (
              <div key={index} className="text-sm font-mono mb-1" style={{ color: 'var(--text-primary)' }}>
                {result}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Testing Guide for Non-Approvers */}
      {!canApprove && (
        <div 
          className="mt-6 p-4 rounded-lg"
          style={{
            backgroundColor: 'var(--color-warning-50)',
            border: '1px solid var(--color-warning-200)'
          }}
        >
          <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--color-warning-800)' }}>📋 Manual Testing Guide</h4>
          <p className="text-sm mb-3" style={{ color: 'var(--color-warning-700)' }}>
            Since you don't have approval permissions, here's how to test the full workflow:
          </p>
          <ol className="text-sm space-y-1 list-decimal list-inside" style={{ color: 'var(--color-warning-700)' }}>
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