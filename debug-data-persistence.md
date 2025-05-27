# Data Persistence Investigation

## 🔍 **Issue Analysis**

The problem is that clients and projects are not retained between app launches. Here's what's happening:

### **Current Flow:**
1. **App Startup** → `DataInitializer` → `loadAllData()` → API calls to fetch data
2. **User Creates Client** → API call → Context update → Data visible in UI
3. **App Restart** → `DataInitializer` → `loadAllData()` → Should fetch created data from API
4. **❌ Problem**: Data not appearing after restart

## 🚨 **Root Cause Analysis**

The issue is likely one of these:

### **1. API Data Loading Failure**
- `loadAllData()` is called but API calls are failing
- Data exists in backend but not being retrieved
- Authentication issues preventing API access
- Network/connectivity problems

### **2. API Response Format Issues**
- Backend returns data but in unexpected format
- Response unwrapping not working correctly
- Empty arrays being returned instead of actual data

### **3. Context State Management Issues**
- Data is loaded but not properly stored in context
- State updates not triggering UI re-renders
- Race conditions in data loading

## 🔧 **Debugging Steps**

### **Step 1: Check Console Logs**
Open browser dev tools and look for:
```
🔄 Loading clients...
✅ Clients loaded: [array of clients]
🔄 Loading projects...
✅ Projects loaded: [array of projects]
```

### **Step 2: Check Network Tab**
1. Open dev tools → Network tab
2. Restart app
3. Look for API calls to:
   - `GET /clients`
   - `GET /projects`
   - `GET /time-entries`
4. Check response status and data

### **Step 3: Check API Responses**
Look at the actual API responses:
```javascript
// In browser console
console.log('Current state:', window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.get(1).findFiberByHostInstance(document.querySelector('[data-testid="client-list"]')).return.memoizedState);
```

### **Step 4: Manual API Test**
Test API calls manually:
```javascript
// In browser console
import { apiClient } from './services/api-client';
apiClient.getClients().then(console.log).catch(console.error);
apiClient.getProjects().then(console.log).catch(console.error);
```

## 🛠️ **Potential Fixes**

### **Fix 1: Add Debug Logging**
Add more detailed logging to `useDataLoader.ts`:

```typescript
const loadClients = useCallback(async () => {
  try {
    console.log('🔄 Loading clients...');
    setLoading('clients', true);
    setError('clients', null);
    
    const clients = await apiClient.getClients();
    console.log('✅ Raw clients response:', clients);
    console.log('✅ Clients type:', typeof clients, Array.isArray(clients));
    
    const validClients = Array.isArray(clients) ? clients : [];
    console.log('✅ Valid clients to dispatch:', validClients);
    
    dispatch({ type: 'SET_CLIENTS', payload: validClients });
    console.log('✅ Clients dispatched to context');
  } catch (error: any) {
    console.error('❌ Failed to load clients:', error);
    console.error('❌ Error details:', error.message, error.statusCode);
    setError('clients', error.message || 'Failed to load clients');
    dispatch({ type: 'SET_CLIENTS', payload: [] });
  } finally {
    setLoading('clients', false);
  }
}, [dispatch, setLoading, setError]);
```

### **Fix 2: Add Data Persistence Fallback**
Add localStorage backup for development:

```typescript
// In AppContext.tsx
const saveToLocalStorage = (key: string, data: any) => {
  if (process.env.NODE_ENV === 'development') {
    localStorage.setItem(`aerotage_${key}`, JSON.stringify(data));
  }
};

const loadFromLocalStorage = (key: string) => {
  if (process.env.NODE_ENV === 'development') {
    const stored = localStorage.getItem(`aerotage_${key}`);
    return stored ? JSON.parse(stored) : [];
  }
  return [];
};

// In reducer
case 'SET_CLIENTS':
  const clients = Array.isArray(action.payload) ? action.payload : [];
  saveToLocalStorage('clients', clients); // Backup to localStorage
  return {
    ...state,
    clients,
    projects: state.projects.map(project => populateProjectWithClient(project, clients)),
  };
```

### **Fix 3: Add Retry Mechanism**
Add automatic retry for failed data loading:

```typescript
const loadAllData = useCallback(async (retryCount = 0) => {
  console.log(`🚀 Starting to load all application data (attempt ${retryCount + 1})...`);
  try {
    setLoading('initialLoad', true);
    setError('initialLoad', null);

    const results = await Promise.allSettled([
      loadCurrentUser(),
      loadClients(),
      loadProjects(),
      loadTimeEntries(),
      loadUsers(),
      loadInvoices(),
    ]);

    const failures = results.filter(result => result.status === 'rejected');
    
    if (failures.length > 0 && retryCount < 2) {
      console.log(`⚠️ ${failures.length} operations failed, retrying in 2 seconds...`);
      setTimeout(() => loadAllData(retryCount + 1), 2000);
      return;
    }
    
    // Handle results...
  } catch (error: any) {
    if (retryCount < 2) {
      console.log('❌ Data loading failed, retrying in 2 seconds...');
      setTimeout(() => loadAllData(retryCount + 1), 2000);
      return;
    }
    // Handle final failure...
  } finally {
    setLoading('initialLoad', false);
  }
}, [loadCurrentUser, loadClients, loadProjects, loadTimeEntries, loadUsers, loadInvoices, setLoading, setError]);
```

## 🧪 **Testing Plan**

### **Test 1: Verify API Calls**
1. Open browser dev tools
2. Restart app
3. Check console for data loading logs
4. Check network tab for API requests
5. Verify response data

### **Test 2: Manual Data Creation**
1. Create a client via UI
2. Check console for creation logs
3. Check network tab for POST request
4. Verify client appears in UI
5. Restart app
6. Check if client reappears

### **Test 3: Direct API Testing**
1. Open browser console
2. Test API calls directly
3. Verify authentication is working
4. Check response format

## 📋 **Next Steps**

1. **Run the app** and check browser console
2. **Look for error messages** in data loading
3. **Check network requests** in dev tools
4. **Test API endpoints** manually if needed
5. **Add debug logging** if issues found
6. **Implement fixes** based on findings

The most likely issue is that the API calls are failing silently or returning empty data, preventing the created clients and projects from being loaded on app restart. 