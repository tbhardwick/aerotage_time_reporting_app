# Settings Page Fixes - Final Resolution

## 🎯 **Root Cause Analysis**

The Settings page was causing automatic logout due to **two separate but related issues**:

### **Issue 1: User ID Mismatch (FIXED)**
- **Problem**: Frontend was using `amplifyUser.userId` but backend expected JWT token's `sub` claim
- **Result**: 403 "You can only access your own preferences" errors
- **Impact**: API calls failed with permission errors

### **Issue 2: Bootstrap Error Persistence (FIXED)**
- **Problem**: Old `sessionBootstrapError` in localStorage was causing DataInitializer to show bootstrap error screen
- **Result**: User redirected to bootstrap error screen instead of Settings page
- **Impact**: App appeared to "force login" when it was actually showing bootstrap error

## ✅ **Fixes Applied**

### **1. Fixed User ID Extraction** (`src/renderer/components/auth/ProtectedRoute.tsx`)

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

### **2. Created JWT Utility Functions** (`src/renderer/utils/jwt.ts`)

Added safe JWT token decoding utilities:
- `decodeJWTPayload()` - Safely decode JWT payload
- `extractUserIdFromToken()` - Extract user ID from token
- `isTokenExpired()` - Check token expiration
- `getTokenExpiration()` - Get expiration date

### **3. Enhanced Auth Error Handling** (`src/renderer/services/authErrorHandler.ts`)

**Before:**
```typescript
// All 403 errors triggered logout
if (error.statusCode === 401 || error.statusCode === 403) {
  return true;
}
```

**After:**
```typescript
// Only session-related 403 errors trigger logout
if (error.statusCode === 403) {
  const message = error.message || '';
  
  // Session-related 403 errors that should trigger logout
  if (message.includes('No active sessions') || 
      message.includes('session has been terminated')) {
    return true;
  }
  
  // Permission-related 403 errors that should NOT trigger logout
  if (message.includes('You can only access your own') ||
      message.includes('UNAUTHORIZED_PROFILE_ACCESS')) {
    return false;
  }
}
```

### **4. Fixed Bootstrap Error Persistence** (`src/renderer/components/common/DataInitializer.tsx`)

**Before:**
```typescript
// Always showed bootstrap error if it existed
if (errorData.requiresManualResolution && !errorData.success) {
  setBootstrapError(errorData);
  return;
}
```

**After:**
```typescript
// Only show bootstrap error for fresh login failures
const hasExistingSession = localStorage.getItem('currentSessionId');

if (errorData.requiresManualResolution && !errorData.success && !hasExistingSession) {
  setBootstrapError(errorData);
  return;
} else {
  // Clear old bootstrap errors if we have a session
  localStorage.removeItem('sessionBootstrapError');
}
```

### **5. Added Bootstrap Utilities** (`src/renderer/utils/bootstrapUtils.ts`)

Created helper functions to manage bootstrap errors:
- `clearBootstrapErrorIfLoggedIn()` - Clear errors when user has active session
- `shouldShowBootstrapError()` - Intelligent check for when to show bootstrap error
- `clearAllBootstrapData()` - Clean slate for logout

### **6. Enhanced API Error Handling** (`src/renderer/services/profileApi.ts`)

Added specific error handling for preferences API:
```typescript
switch (apiError.code) {
  case 'UNAUTHORIZED_PROFILE_ACCESS':
    throw new Error('You do not have permission to access these preferences. Please contact your administrator.');
  default:
    throw new Error(apiError.message || 'Failed to load preferences.');
}
```

### **7. Improved User Experience** (`src/renderer/components/settings/SecuritySettings.tsx`)

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

## 🧪 **Testing Results**

After applying these fixes:

1. ✅ **No more 403 errors**: User ID in API requests now matches authenticated user
2. ✅ **No automatic logout**: Permission errors don't trigger session termination
3. ✅ **No bootstrap error screen**: Old errors are cleared when user has active session
4. ✅ **Stable Settings page**: All tabs (Profile, Preferences, Security, Notifications) work
5. ✅ **Better error messages**: Users see helpful messages instead of generic errors

## 🔍 **How to Verify the Fix**

1. **Login to the application**
2. **Navigate to Settings page**
3. **Check all tabs (Profile, Preferences, Security, Notifications)**
4. **Verify no console errors**
5. **Confirm no automatic logout or bootstrap error screen**

## 🛠️ **Technical Details**

### **JWT Token Structure**
The JWT token contains the correct user ID in the `sub` claim:
```json
{
  "sub": "0408a498-40c1-7071-acc9-90665ef117c3",
  "email": "user@example.com",
  "name": "User Name",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### **Error Flow**
1. **API Call**: Frontend makes request with JWT token
2. **Backend**: Extracts user ID from JWT `sub` claim for authorization
3. **Validation**: Checks if URL user ID matches JWT user ID
4. **Success**: Request proceeds if IDs match
5. **Error Handling**: Permission errors don't trigger logout

### **Bootstrap Logic**
1. **Login**: Bootstrap runs during initial login
2. **Success**: Bootstrap error cleared, app loads normally
3. **Failure**: Bootstrap error stored for manual resolution
4. **Navigation**: Old bootstrap errors cleared if user has session
5. **Persistence**: Bootstrap errors only shown for fresh login failures

## 🚀 **Future Considerations**

- **Token Refresh**: Monitor JWT token expiration and refresh proactively
- **Error Boundaries**: Add React error boundaries for auth-related errors
- **User ID Validation**: Consider adding middleware to validate user ID consistency
- **Session Monitoring**: Add real-time session validation monitoring
- **Cache Management**: Implement proper cache invalidation for auth state changes

## 📋 **Files Modified**

1. `src/renderer/components/auth/ProtectedRoute.tsx` - Fixed user ID extraction
2. `src/renderer/utils/jwt.ts` - Added JWT utilities (NEW)
3. `src/renderer/services/authErrorHandler.ts` - Enhanced 403 error handling
4. `src/renderer/components/common/DataInitializer.tsx` - Fixed bootstrap error persistence
5. `src/renderer/utils/bootstrapUtils.ts` - Added bootstrap utilities (NEW)
6. `src/renderer/services/profileApi.ts` - Enhanced API error handling
7. `src/renderer/components/settings/SecuritySettings.tsx` - Improved UX
8. `src/renderer/hooks/useUserPreferences.ts` - Better error handling

## ✅ **Resolution Status: COMPLETE**

The Settings page now works correctly without causing automatic logout or showing bootstrap error screens. Users can navigate freely between all settings tabs and receive appropriate error messages for any permission issues. 