# End-to-End Testing Guide

## Overview
This guide helps you test the Aerotage Time Reporting Application with the deployed backend to ensure all mock data has been removed and the frontend properly connects to your AWS infrastructure.

## Prerequisites
- ✅ Backend infrastructure deployed in AWS
- ✅ Frontend mock data removed
- ✅ AWS configuration updated in `src/renderer/config/aws-config.ts`
- ✅ Valid user accounts created in Cognito User Pool

## Backend Infrastructure Verification

### 1. AWS Cognito User Pool
```bash
# Check your user pool exists and has users
aws cognito-idp list-users --user-pool-id us-east-1_EsdlgX9Qg
```

### 2. API Gateway Endpoint
```bash
# Test the API endpoint is accessible
curl -X GET https://0z6kxagbh2.execute-api.us-east-1.amazonaws.com/dev/health
```

### 3. DynamoDB Tables
```bash
# Verify tables exist
aws dynamodb list-tables --region us-east-1
```

## Frontend Testing Steps

### Phase 1: Authentication Flow
1. **Launch the Application**
   ```bash
   npm run dev
   ```

2. **Test Login**
   - Enter valid Cognito user credentials
   - Verify loading spinner shows "Loading application data..."
   - Check browser network tab for API calls to:
     - `/users/me` (current user)
     - `/clients`
     - `/projects` 
     - `/time-entries`
     - `/invoices`
     - `/users`

3. **Expected Behavior**
   - No mock data should appear
   - Loading states should show while data loads
   - Any API errors should display user-friendly messages
   - Empty states should show if no data exists in backend

### Phase 2: Data Loading Verification

#### Check Console for Errors
Open browser DevTools → Console and look for:
- ✅ Successful API calls
- ❌ 401/403 errors (authentication issues)
- ❌ 500 errors (backend issues)
- ❌ Network errors (connectivity issues)

#### Verify Empty States
If backend has no data, you should see:
- Empty time entries list
- Empty projects dropdown
- Empty clients list
- Empty reports/analytics

#### Test Data Loading
1. **Go to Projects page** - should load from backend
2. **Go to Time Tracking** - should load user's time entries
3. **Check Reports section** - should show real data or empty states

### Phase 3: CRUD Operations Testing

#### Create New Client
1. Go to Projects → Clients
2. Click "Add Client"
3. Fill out form and save
4. **Verify**: Network call to `POST /clients`
5. **Verify**: Client appears in list without page refresh

#### Create New Project  
1. Go to Projects
2. Click "Add Project"
3. Select the client you just created
4. Fill form and save
5. **Verify**: Network call to `POST /projects`
6. **Verify**: Project appears in timer dropdown

#### Create Time Entry
1. Go to Time Tracking
2. Start timer for the new project
3. Stop timer after a few seconds
4. **Verify**: Network call to `POST /time-entries`
5. **Verify**: Entry appears in time list

#### Test Manual Time Entry
1. Click "Add Manual Entry"
2. Select project and enter time
3. Save entry
4. **Verify**: API call and context update

### Phase 4: Real-time Features Testing

#### Timer Functionality
1. Start timer for a project
2. **Verify**: Timer state persists across app restarts
3. **Verify**: Time updates every second
4. Stop timer
5. **Verify**: Creates time entry via API

#### Data Synchronization
1. Create data in one browser tab
2. **Verify**: Data appears in other tabs (if refresh is needed, that's OK)
3. Test offline/online behavior if applicable

### Phase 5: Error Handling Testing

#### Test Invalid Data
1. Try creating project with empty name
2. **Verify**: Validation prevents submission
3. **Verify**: API errors show user-friendly messages

#### Test Network Issues
1. Disable internet briefly
2. Try creating data
3. **Verify**: Error messages appear
4. Re-enable internet
5. **Verify**: Retry works

#### Test Authentication Expiry
1. Let auth token expire (or manually clear it)
2. Try to perform actions
3. **Verify**: Redirects to login or refreshes token

## Data Verification Checklist

### ✅ No Mock Data Present
- [ ] Time entries come from backend only
- [ ] Projects list loads from API
- [ ] Clients list loads from API  
- [ ] User data comes from Cognito + backend
- [ ] Reports show real data only

### ✅ API Integration Working
- [ ] All GET requests succeed
- [ ] Create operations call POST endpoints
- [ ] Update operations call PUT endpoints
- [ ] Delete operations call DELETE endpoints
- [ ] Error responses handled gracefully

### ✅ Context State Management
- [ ] Context updates after API calls
- [ ] Loading states show during operations
- [ ] Error states clear after successful operations
- [ ] Optimistic updates work correctly

## Debugging Common Issues

### Authentication Problems
```javascript
// Check if user is properly authenticated
console.log('Current user:', await getCurrentUser());
console.log('Auth tokens:', await fetchAuthSession());
```

### API Configuration Issues
```javascript
// Verify API configuration
console.log('API Config:', amplifyConfig.API);
console.log('Auth Config:', amplifyConfig.Auth);
```

### Missing Data
1. Check DynamoDB tables have data
2. Verify user permissions in Cognito
3. Check API Gateway logs
4. Verify Lambda function execution

### Performance Testing
1. Monitor load times with large datasets
2. Test pagination if implemented
3. Check memory usage during data loading
4. Verify no memory leaks with timer

## Success Criteria

### ✅ Application Ready for Production When:
- [ ] All mock data removed
- [ ] Authentication flow works end-to-end
- [ ] CRUD operations succeed
- [ ] Error handling works properly
- [ ] Performance is acceptable
- [ ] No console errors
- [ ] Data persists correctly in backend
- [ ] User experience is smooth

### ✅ Backend Integration Complete When:
- [ ] All API endpoints respond correctly
- [ ] Data flows from frontend to backend
- [ ] Authentication integrates with Cognito
- [ ] Real-time features work as expected
- [ ] Error scenarios handled gracefully

## Test Data Creation

### Sample Test Flow
1. **Create Test Client**: "Test Company Inc"
2. **Create Test Project**: "Website Redesign" for Test Company
3. **Log Time**: 2 hours of "Frontend development"
4. **Submit Time**: For approval workflow testing
5. **Generate Report**: Verify calculations
6. **Create Invoice**: From approved time entries

### Cleanup After Testing
```javascript
// Optional: Add cleanup utilities for test data
// Note: Only use in development environment
const cleanupTestData = async () => {
  // Remove test entries, projects, clients
  // Reset to clean state for next test run
};
```

## Monitoring & Logging

### Frontend Logs to Monitor
```javascript
// Enable detailed logging during testing
console.log('Data loaded:', {
  timeEntries: state.timeEntries.length,
  projects: state.projects.length,
  clients: state.clients.length,
  user: state.user?.email
});
```

### Backend Logs to Check
1. **CloudWatch Logs**: Lambda function execution
2. **API Gateway**: Request/response logs
3. **Cognito**: Authentication events
4. **DynamoDB**: Read/write operations

## Performance Benchmarks

### Expected Load Times
- **Initial data load**: < 3 seconds
- **Create operations**: < 1 second
- **Page navigation**: < 500ms
- **Timer updates**: Real-time (1 second intervals)

### Memory Usage
- **Initial load**: < 50MB
- **After extended use**: < 100MB
- **No memory leaks**: Stable over time

This testing guide ensures your frontend properly integrates with the deployed backend and all mock data has been successfully removed. 