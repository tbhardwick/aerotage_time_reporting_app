# Authentication Debugging Guide

This guide explains how to troubleshoot authentication issues in the Aerotage Time Reporting Application without being aggressively logged out during debugging.

## 🚫 Debug Mode Features

### Automatic Logout Prevention
We've implemented debug flags to prevent automatic logout when authentication errors occur, allowing you to troubleshoot issues effectively:

1. **profileApi.ts** - `DISABLE_AUTO_LOGOUT_FOR_DEBUG = true`
2. **api-client.ts** - `DISABLE_AUTO_LOGOUT_FOR_DEBUG = true`  
3. **authErrorHandler.ts** - `GLOBAL_DISABLE_AUTO_LOGOUT = false` (can be enabled if needed)

### Current Debug Status
✅ **Debug mode is ACTIVE** - Authentication errors will be logged but won't trigger logout automatically.

## 🔐 AuthDebugger Component

### Usage
Add the AuthDebugger component to any page for comprehensive authentication debugging:

```tsx
import { AuthDebugger } from '../components/debug/AuthDebugger';

// In your component:
const [showDebugger, setShowDebugger] = useState(false);

// Add this to your JSX:
{showDebugger && (
  <AuthDebugger onClose={() => setShowDebugger(false)} />
)}

// Add a button to show it:
<button onClick={() => setShowDebugger(true)}>🔐 Debug Auth</button>
```

### Features
- **Authentication Status Check** - Shows current user, tokens, and session details
- **API Test Suite** - Tests common API endpoints to identify which are failing
- **Error Details** - Shows detailed error information without triggering logout
- **Token Analysis** - Decodes and displays JWT token payloads

## 🔍 Debugging Steps

### 1. Check Browser Console
With debug mode active, detailed logs are available:
```
🔐 Getting auth session...
📧 Session received: { hasTokens: true, hasIdToken: true }
✅ Token retrieved successfully, length: 1234
🔍 Token contains user ID: abc123
🔍 Token email: user@example.com
```

### 2. Run API Test Suite
The AuthDebugger component includes an API test suite that will:
- Test `getCurrentUser()` to get your user ID
- Test profile API calls (`getUserProfile`, `getUserPreferences`, `getUserSessions`)
- Test main API calls (`getTimeEntries`, `getProjects`, `getClients`)

### 3. Analyze Authentication Errors
Common error patterns and their meanings:

#### 401 Errors
```
❌ Failed API Error: Authentication token is invalid or expired. Please sign in again. (401)
🚫 Auto-logout DISABLED for debugging - 401 error logged but not triggering logout
```
**Solution**: Token may be expired or invalid. Check token payload expiration.

#### 403 Permission Errors
```
❌ Failed API Error: You can only access your own preferences. (403)
🔍 403 error is a permission error, not a session error
```
**Solution**: This is a permission issue, not an authentication issue. Check if you're accessing resources you don't own.

#### 403 Session Errors
```
❌ Failed API Error: No active sessions found. (403)
🚫 Auto-logout DISABLED for debugging - 403 session error logged but not triggering logout
```
**Solution**: Session has been terminated. May need to create a new session.

#### Network/CORS Errors
```
❌ Failed API Error: NetworkError: A network error has occurred
🚫 Auto-logout DISABLED for debugging - session validation error logged but not triggering logout
```
**Solution**: Backend may be rejecting the request. Check token format and backend logs.

## 🛠️ Manual Debugging Steps

### Check Authentication Status
```typescript
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import { decodeJWTPayload } from '../utils/jwt';

// Get current auth session
const session = await fetchAuthSession({ forceRefresh: false });
console.log('Session:', session);

// Check tokens
const idToken = session.tokens?.idToken?.toString();
const accessToken = session.tokens?.accessToken?.toString();

// Decode token payload
if (idToken) {
  const payload = decodeJWTPayload(idToken);
  console.log('Token payload:', payload);
}
```

### Test Specific API Calls
```typescript
import { profileApi } from '../services/profileApi';
import { apiClient } from '../services/api-client';

try {
  // Test getting current user
  const user = await apiClient.getCurrentUser();
  console.log('Current user:', user);
  
  // Test profile API
  const profile = await profileApi.getUserProfile(user.id);
  console.log('User profile:', profile);
  
} catch (error) {
  console.error('API Error:', error);
  // Error will be logged but won't trigger logout in debug mode
}
```

## 🎛️ Debug Flag Configuration

### Enabling/Disabling Debug Mode

#### Per-Service Debug Flags
```typescript
// src/renderer/services/profileApi.ts
const DISABLE_AUTO_LOGOUT_FOR_DEBUG = true; // Currently enabled

// src/renderer/services/api-client.ts  
const DISABLE_AUTO_LOGOUT_FOR_DEBUG = true; // Currently enabled
```

#### Global Debug Flag
```typescript
// src/renderer/services/authErrorHandler.ts
const GLOBAL_DISABLE_AUTO_LOGOUT = false; // Currently disabled

// To enable globally (overrides all other flags):
const GLOBAL_DISABLE_AUTO_LOGOUT = true;
```

### Production Usage
**⚠️ IMPORTANT**: Before deploying to production, ensure all debug flags are set to `false`:

```typescript
const DISABLE_AUTO_LOGOUT_FOR_DEBUG = false;
const GLOBAL_DISABLE_AUTO_LOGOUT = false;
```

## 🔧 Common Issues & Solutions

### Issue: "No authentication token available"
**Symptoms**: API calls fail immediately
**Solution**: 
1. Check if user is properly signed in
2. Verify AWS Amplify configuration
3. Check token expiration

### Issue: "Your session is no longer valid"
**Symptoms**: 403 errors with session-related messages  
**Solution**:
1. Check if session exists in backend
2. May need to create new session via `profileApi.createSession()`
3. Verify user ID matches between token and API calls

### Issue: "You can only access your own preferences"
**Symptoms**: 403 errors with permission messages
**Solution**:
1. This is a permission error, not authentication
2. Check if user ID in API call matches authenticated user
3. Verify API call is using correct user ID

### Issue: CORS/Network Errors
**Symptoms**: Network errors or CORS policy errors
**Solution**:
1. Check if backend is running and accessible
2. Verify API Gateway configuration
3. Check if token format is correct for backend

## 📋 Debug Checklist

When troubleshooting authentication issues:

- [ ] Enable debug mode (flags set to `true`)
- [ ] Check browser console for detailed logs
- [ ] Use AuthDebugger component to run test suite
- [ ] Verify token payload contains correct user information
- [ ] Check token expiration time
- [ ] Test individual API endpoints to isolate issues
- [ ] Check backend logs if available
- [ ] Verify AWS Amplify configuration
- [ ] Check network connectivity to backend

## 🚀 Re-enabling Auto-Logout

Once debugging is complete, re-enable automatic logout by setting debug flags to `false`:

```typescript
// profileApi.ts
const DISABLE_AUTO_LOGOUT_FOR_DEBUG = false;

// api-client.ts  
const DISABLE_AUTO_LOGOUT_FOR_DEBUG = false;

// authErrorHandler.ts (if modified)
const GLOBAL_DISABLE_AUTO_LOGOUT = false;
```

This will restore normal authentication error handling where 401/403 session errors trigger automatic logout. 