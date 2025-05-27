import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useApiOperations } from '../../hooks/useApiOperations';
import { useDataLoader } from '../../hooks/useDataLoader';

const ApiIntegrationTest: React.FC = () => {
  const { state } = useAppContext();
  const { createTimeEntry, createProject, createClient } = useApiOperations();
  const { loadAllData } = useDataLoader();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runApiTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      addResult('🚀 Starting API Integration Tests...');
      
      // Test 1: Data Loading
      addResult('📊 Testing data loading...');
      await loadAllData();
      addResult(`✅ Data loaded - ${state.clients.length} clients, ${state.projects.length} projects, ${state.timeEntries.length} time entries`);
      
      // Test 2: Create Client
      addResult('👤 Testing client creation...');
      const clientResponse = await createClient({
        name: `Test Client ${Date.now()}`,
        contactInfo: {
          email: 'test@example.com',
          phone: '555-0123'
        },
        isActive: true
      });
      
      // Extract the actual client data from the API response
      // The API returns either the client directly or wrapped in a response object
      const testClient = (clientResponse as any).data || clientResponse;
      addResult(`✅ Client created: ${testClient.name}`);
      
      // Test 3: Create Project
      addResult('📁 Testing project creation...');
      
      // Debug: Log the testClient object
      console.log('🔍 Test Client object:', testClient);
      addResult(`🔍 Client ID: ${testClient.id}, Client Name: ${testClient.name}`);
      
      const projectPayload = {
        name: `Test Project ${Date.now()}`,
        clientId: testClient.id,
        clientName: testClient.name,
        description: 'API Integration Test Project',
        status: 'active' as const,
        defaultBillable: true,
        defaultHourlyRate: 100,
        budget: {
          type: 'hours' as const,
          value: 100,
          spent: 0
        },
        deadline: '2024-12-31',
        teamMembers: [],
        tags: []
      };
      
      // Debug: Log the project payload
      console.log('🔍 Project payload being sent:', projectPayload);
      addResult(`🔍 Project payload: ${JSON.stringify(projectPayload, null, 2)}`);
      
      const testProject = await createProject(projectPayload);
      
      // Extract the actual project data from the API response
      const actualProject = (testProject as any).data || testProject;
      addResult(`✅ Project created: ${actualProject.name}`);
      
      // Test 4: Create Time Entry
      addResult('⏱️ Testing time entry creation...');
      const testTimeEntry = await createTimeEntry({
        projectId: actualProject.id,
        date: new Date().toISOString().split('T')[0],
        duration: 60, // 1 hour
        description: 'API Integration Test Entry',
        isBillable: true,
        status: 'draft'
      });
      addResult(`✅ Time entry created: ${testTimeEntry.description}`);
      
      addResult('🎉 All API tests passed successfully!');
      
    } catch (error) {
      console.error('API Test Error:', error);
      addResult(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">API Integration Test</h3>
      
      <div className="mb-4">
        <button
          onClick={runApiTests}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isRunning ? 'Running Tests...' : 'Run API Tests'}
        </button>
      </div>
      
      <div className="space-y-2">
        <h4 className="font-medium">Test Results:</h4>
        <div className="bg-gray-50 p-3 rounded-lg max-h-64 overflow-y-auto">
          {testResults.length === 0 ? (
            <p className="text-gray-500">No tests run yet</p>
          ) : (
            testResults.map((result, index) => (
              <div key={index} className="text-sm font-mono">
                {result}
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Current State:</strong></p>
        <ul className="list-disc list-inside">
          <li>Clients: {state.clients.length}</li>
          <li>Projects: {state.projects.length}</li>
          <li>Time Entries: {state.timeEntries.length}</li>
          <li>Loading: {Object.keys(state.loading).filter(key => state.loading[key]).join(', ') || 'None'}</li>
          <li>Errors: {Object.keys(state.errors).filter(key => state.errors[key]).join(', ') || 'None'}</li>
        </ul>
      </div>
    </div>
  );
};

export default ApiIntegrationTest; 