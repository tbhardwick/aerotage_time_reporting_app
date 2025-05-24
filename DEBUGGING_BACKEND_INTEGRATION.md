# Debugging Backend Integration Issues

## 🔧 Quick Fixes Applied

The `action.payload.map is not a function` error has been fixed with:

1. **Defensive Reducer**: All `SET_*` actions now handle non-array payloads
2. **Safe Data Loading**: API responses are validated before dispatch
3. **Graceful Error Handling**: Empty arrays dispatched on API failures
4. **Partial Failure Support**: App continues working even if some APIs fail

## 🚀 Test the Fix

```bash
npm run dev
```

You should now see:
- ✅ No more `map is not a function` errors
- ✅ App loads even if backend APIs fail
- ✅ Empty states instead of crashes
- ✅ Detailed error logging in console

## 🔍 Common Issues & Solutions

### 1. API Returns Wrong Data Structure

**Problem**: Backend returns `{ data: [...] }` instead of `[...]`

**Solution**: Update `api-client.ts` to extract data:
```typescript
// In api-client.ts, update methods like:
async getProjects(): Promise<Project[]> {
  const response = await this.request('GET', '/projects');
  return response.data || response; // Handle both formats
}
```

### 2. CORS Errors

**Problem**: Browser blocks API calls

**Check Console For**:
```
Access to fetch at 'https://...' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution**: Verify API Gateway CORS settings in backend

### 3. Authentication Issues

**Problem**: 401/403 errors for all API calls

**Debug Steps**:
```javascript
// Add to browser console
console.log('Auth tokens:', await fetchAuthSession());
console.log('Current user:', await getCurrentUser());
```

**Solutions**:
- Check Cognito user pool configuration
- Verify API Gateway authorizer setup
- Ensure user has proper permissions

### 4. Missing Backend Endpoints

**Problem**: 404 errors for specific APIs

**Check**:
```bash
# Test endpoints manually
curl -X GET https://0sty9mf3f7.execute-api.us-east-1.amazonaws.com/dev/projects
curl -X GET https://0sty9mf3f7.execute-api.us-east-1.amazonaws.com/dev/clients
```

**Solution**: Deploy missing Lambda functions in backend

### 5. Empty Data States

**Problem**: App loads but shows no data

**Debug**:
1. Check browser Network tab for API calls
2. Look for successful 200 responses with empty arrays `[]`
3. Verify DynamoDB tables have data

**Expected**: Empty state UI should show, not errors

## 📊 Monitoring in Console

Add this to browser console to monitor data loading:

```javascript
// Monitor context state
window.debugAppState = () => {
  const { state } = useAppContext();
  console.table({
    'Time Entries': state.timeEntries.length,
    'Projects': state.projects.length,
    'Clients': state.clients.length,
    'Users': state.users.length,
    'Loading': Object.keys(state.loading).filter(k => state.loading[k]).join(', ') || 'None',
    'Errors': Object.keys(state.errors).filter(k => state.errors[k]).join(', ') || 'None'
  });
};

// Call it after login
window.debugAppState();
```

## 🎯 Success Indicators

### ✅ Working Integration
- Login successful
- Loading screen appears briefly
- No console errors
- Data appears or empty states show
- Navigation works smoothly

### ❌ Issues Remaining
- JavaScript errors in console
- Infinite loading screens
- White screen after login
- API 404/500 errors

## 🆘 Emergency Fallback

If backend is completely unavailable, temporarily enable minimal mock data:

```typescript
// In AppContext.tsx initialState, add minimal data:
const initialState: AppState = {
  // ... existing empty arrays ...
  
  // Temporary fallback data (remove when backend works)
  clients: process.env.NODE_ENV === 'development' ? [
    { 
      id: 'temp-1', 
      name: 'Test Client', 
      contactInfo: {}, 
      isActive: true, 
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ] : [],
  
  projects: process.env.NODE_ENV === 'development' ? [
    {
      id: 'temp-1',
      clientId: 'temp-1',
      name: 'Test Project',
      hourlyRate: 100,
      status: 'active' as const,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ] : [],
};
```

## 📞 Next Steps

1. **Test the fixed app** with your backend
2. **Follow END_TO_END_TESTING_GUIDE.md** for comprehensive testing
3. **Check console for any remaining errors**
4. **Verify all CRUD operations work**

The defensive programming should now prevent crashes and provide a smooth user experience even when APIs fail! 