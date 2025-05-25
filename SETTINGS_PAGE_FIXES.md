# Settings Page Fixes

## Issues Identified

1. **403 Forbidden Error on Preferences API**: The backend was returning "You can only access your own preferences" 
2. **Security Tab Causing Logout**: The `authErrorHandler` was automatically triggering logout on 403 errors
3. **User ID Mismatch**: Frontend was using `amplifyUser.userId` but backend expected JWT token's `sub` claim

## Root Cause Analysis

The main issue was a **user ID mismatch** between frontend and backend:

- **Frontend**: Using `amplifyUser.userId` or `amplifyUser.username` from Amplify's `getCurrentUser()`
- **Backend**: Extracting user ID from JWT token's `sub` claim for authorization

This mismatch caused the backend to reject requests with "You can only access your own preferences" because the user ID in the URL didn't match the authenticated user ID from the token.

## Fixes Applied

### 1. Fixed User ID Extraction (`src/renderer/components/auth/ProtectedRoute.tsx`)

**Before:**
```typescript
const userId = amplifyUser.userId || amplifyUser.username;
```

**After:**
```typescript
// Get JWT token and extract user ID from 'sub' claim
const session = await fetchAuthSession();
const idToken = session.tokens?.idToken;
const tokenPayload = decodeJWTPayload(idToken.toString());
const userId = tokenPayload.sub; // This matches what backend expects
```

### 2. Created JWT Utility Functions (`src/renderer/utils/jwt.ts`)

Added safe JWT token decoding utilities:
- `decodeJWTPayload()` - Safely decode JWT payload
- `extractUserIdFromToken()` - Extract user ID from token
- `isTokenExpired()` - Check token expiration
- `getTokenExpiration()` - Get expiration date

### 3. Fixed Auth Error Handling (`src/renderer/services/profileApi.ts`)

**Before:**
```typescript
} else if (response.status === 403) {
  // All 403 errors triggered logout
  const sessionError = new Error('Your session has been terminated...');
  await authErrorHandler.handleAuthError(sessionError);
}
```

**After:**
```typescript
} else if (response.status === 403) {
  const errorMessage = data.error?.message || data.message || '';
  if (errorMessage.includes('No active sessions') || errorMessage.includes('session')) {
    // Only session-related 403s trigger logout
    const sessionError = new Error('Your session has been terminated...');
    await authErrorHandler.handleAuthError(sessionError);
  }
  
  // Don't trigger logout for user permission errors
  if (errorMessage.includes('You can only access your own') || 
      errorMessage.includes('UNAUTHORIZED_PROFILE_ACCESS')) {
    // Let it fall through to normal API error handling
  }
}
```

### 4. Enhanced Error Messages (`src/renderer/services/profileApi.ts`)

Added specific error handling for preferences API:
```typescript
// Handle specific error cases
if (error && typeof error === 'object' && 'code' in error) {
  const apiError = error as ApiError;
  switch (apiError.code) {
    case 'UNAUTHORIZED_PROFILE_ACCESS':
      throw new Error('You do not have permission to access these preferences. Please contact your administrator.');
    default:
      throw new Error(apiError.message || 'Failed to load preferences.');
  }
}
```

### 5. Improved User Experience (`src/renderer/components/settings/SecuritySettings.tsx`)

Better loading state message:
```typescript
if (!user) {
  return (
    <div className="text-center py-8">
      <p className="text-neutral-500">Please wait while we load your user information...</p>
      <p className="text-sm text-neutral-400 mt-2">If this persists, please refresh the page.</p>
    </div>
  );
}
```

### 6. Enhanced Debugging

Added comprehensive logging to track:
- JWT token payload contents
- User ID extraction process
- API request/response details
- Error handling flow

## Expected Results

After these fixes:

1. ✅ **No more 403 errors**: User ID in API requests now matches authenticated user
2. ✅ **No automatic logout**: Permission errors don't trigger session termination
3. ✅ **Better error messages**: Users see helpful messages instead of generic errors
4. ✅ **Stable security tab**: No more redirects to login screen
5. ✅ **Improved debugging**: Better logs for troubleshooting

## Testing

To verify the fixes:

1. **Login to the application**
2. **Navigate to Settings page**
3. **Check all tabs (Profile, Preferences, Security, Notifications)**
4. **Verify no console errors**
5. **Confirm no automatic logout**

## Technical Notes

- The JWT token's `sub` claim is the standard way to identify users in OAuth/OIDC
- AWS Cognito uses the `sub` claim as the primary user identifier
- The backend correctly validates that API requests match the authenticated user
- Frontend now aligns with this security model

## Future Considerations

- Consider caching the decoded JWT payload to avoid repeated decoding
- Add token expiration monitoring for proactive refresh
- Implement proper error boundaries for auth-related errors
- Consider adding user ID validation middleware 