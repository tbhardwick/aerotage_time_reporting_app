// Debug utilities for data loading and API testing
import { apiClient } from '../services/api-client';

export const dataDebugUtils = {
  // Test API endpoints directly
  async testClients() {
    console.log('🧪 Testing clients API...');
    try {
      const clients = await apiClient.getClients();
      console.log('✅ Clients API response:', clients);
      console.log('✅ Type:', typeof clients, 'Array:', Array.isArray(clients));
      console.log('✅ Length:', Array.isArray(clients) ? clients.length : 'N/A');
      return clients;
    } catch (error) {
      console.error('❌ Clients API failed:', error);
      throw error;
    }
  },

  async testProjects() {
    console.log('🧪 Testing projects API...');
    try {
      const projects = await apiClient.getProjects();
      console.log('✅ Projects API response:', projects);
      console.log('✅ Type:', typeof projects, 'Array:', Array.isArray(projects));
      console.log('✅ Length:', Array.isArray(projects) ? projects.length : 'N/A');
      return projects;
    } catch (error) {
      console.error('❌ Projects API failed:', error);
      throw error;
    }
  },

  async testTimeEntries() {
    console.log('🧪 Testing time entries API...');
    try {
      const timeEntries = await apiClient.getTimeEntries();
      console.log('✅ Time entries API response:', timeEntries);
      console.log('✅ Type:', typeof timeEntries, 'Array:', Array.isArray(timeEntries));
      console.log('✅ Length:', Array.isArray(timeEntries) ? timeEntries.length : 'N/A');
      return timeEntries;
    } catch (error) {
      console.error('❌ Time entries API failed:', error);
      throw error;
    }
  },

  async testAllApis() {
    console.log('🧪 Testing all APIs...');
    const results = await Promise.allSettled([
      this.testClients(),
      this.testProjects(),
      this.testTimeEntries(),
    ]);

    console.log('📊 API Test Results:');
    results.forEach((result, index) => {
      const apiNames = ['Clients', 'Projects', 'Time Entries'];
      if (result.status === 'fulfilled') {
        console.log(`✅ ${apiNames[index]}: Success`);
      } else {
        console.log(`❌ ${apiNames[index]}: Failed -`, result.reason?.message);
      }
    });

    return results;
  },

  // Check current app state
  getAppState() {
    try {
      // Try to access React DevTools global hook
      const reactDevTools = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (reactDevTools && reactDevTools.renderers) {
        const renderer = reactDevTools.renderers.get(1);
        if (renderer) {
          // Find the app root fiber
          const appRoot = renderer.findFiberByHostInstance?.(document.querySelector('#root'));
          if (appRoot) {
            // Navigate to find the AppProvider context
            let current = appRoot;
            while (current) {
              if (current.type?.name === 'AppProvider' || current.memoizedState) {
                console.log('📊 Current App State:', current.memoizedState);
                return current.memoizedState;
              }
              current = current.child || current.sibling || current.return;
            }
          }
        }
      }
      console.warn('⚠️ Could not access app state via React DevTools');
      return null;
    } catch (error) {
      console.error('❌ Error accessing app state:', error);
      return null;
    }
  },

  // Check localStorage debug data
  getDebugData() {
    console.log('📂 Debug data in localStorage:');
    const clients = localStorage.getItem('aerotage_debug_clients');
    const projects = localStorage.getItem('aerotage_debug_projects');
    
    console.log('Clients:', clients ? JSON.parse(clients) : 'None');
    console.log('Projects:', projects ? JSON.parse(projects) : 'None');
    
    return {
      clients: clients ? JSON.parse(clients) : [],
      projects: projects ? JSON.parse(projects) : [],
    };
  },

  // Clear debug data
  clearDebugData() {
    console.log('🧹 Clearing debug data...');
    localStorage.removeItem('aerotage_debug_clients');
    localStorage.removeItem('aerotage_debug_projects');
    console.log('✅ Debug data cleared');
  },

  // Create test data
  async createTestClient() {
    console.log('🧪 Creating test client...');
    try {
      const testClient = {
        name: `Test Client ${Date.now()}`,
        contactInfo: {
          email: 'test@example.com',
          phone: '555-0123',
        },
        isActive: true,
      };
      
      const result = await apiClient.createClient(testClient);
      console.log('✅ Test client created:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to create test client:', error);
      throw error;
    }
  },

  async createTestProject(clientId?: string) {
    console.log('🧪 Creating test project...');
    try {
      // If no clientId provided, try to get one from existing clients
      if (!clientId) {
        const clients = await this.testClients();
        if (Array.isArray(clients) && clients.length > 0) {
          clientId = clients[0].id;
        } else {
          console.log('No clients found, creating one first...');
          const newClient = await this.createTestClient();
          clientId = newClient.id;
        }
      }

      const testProject = {
        name: `Test Project ${Date.now()}`,
        clientId: clientId!,
        clientName: 'Test Client',
        description: 'A test project for debugging',
        status: 'active' as const,
        defaultBillable: true,
        defaultHourlyRate: 100,
        teamMembers: [],
        tags: ['test'],
      };
      
      const result = await apiClient.createProject(testProject);
      console.log('✅ Test project created:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to create test project:', error);
      throw error;
    }
  },

  // Full debug workflow
  async runFullDebug() {
    console.log('🚀 Running full debug workflow...');
    
    console.log('\n1. Testing API endpoints...');
    await this.testAllApis();
    
    console.log('\n2. Checking current app state...');
    this.getAppState();
    
    console.log('\n3. Checking debug data...');
    this.getDebugData();
    
    console.log('\n4. Creating test data...');
    try {
      await this.createTestClient();
      await this.createTestProject();
    } catch (error) {
      console.log('⚠️ Test data creation failed, but continuing...');
    }
    
    console.log('\n5. Re-testing APIs after data creation...');
    await this.testAllApis();
    
    console.log('\n✅ Full debug workflow complete!');
  }
};

// Make it available globally for console access
(window as any).dataDebugUtils = dataDebugUtils;

console.log('🔧 Data debug utils loaded. Use window.dataDebugUtils in console for testing.'); 