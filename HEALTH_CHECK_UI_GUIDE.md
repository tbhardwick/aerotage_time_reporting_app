# Health Check UI Integration Guide

## 🏥 Where to Find API Health Status

The API Health Status is now integrated into the Aerotage Time Reporting application in multiple locations for easy monitoring. **Important**: The health check now uses authentication, so you must be logged in to see accurate status.

### 1. 🖥️ **Navigation Bar (Desktop)**
**Location**: Top navigation bar, next to the "Sign Out" button
**What you see**: Simple status indicator showing:
- ✅ **API Online** (green) - API is healthy and responding
- ❌ **API Offline** (red) - API is not responding or authentication failed
- ⚠️ **API Status Unknown** (yellow) - Status cannot be determined
- 🔄 **Checking...** (blue) - Currently checking status

**Features**:
- Auto-refreshes every 60 seconds
- Shows current API connectivity status
- Uses authenticated requests with your login token
- Compact design that doesn't interfere with navigation

### 2. 📱 **Mobile Menu**
**Location**: Mobile navigation menu (when hamburger menu is opened)
**What you see**: Same simple status indicator as desktop
**Access**: Tap the hamburger menu (☰) in the top-right corner

### 3. ⚙️ **Settings Page - API Health Tab**
**Location**: Settings → API Health tab
**What you see**: Comprehensive health monitoring dashboard

**How to access**:
1. Click "Settings" in the navigation
2. Click the "🏥 API Health" tab

**Detailed Information Includes**:
- **Current API Status**: Real-time health status with authentication
- **Response Times**: Performance metrics for both endpoints
- **Last Checked**: Timestamp of last health check
- **API Version**: Backend API version information
- **Environment**: Current environment (development/production)
- **Endpoint Comparison**: Side-by-side status of primary and backup URLs
- **Manual Refresh**: Button to trigger immediate health check
- **Authentication Status**: Shows if health check is authenticated

**Endpoint Status Details**:
- **Primary Endpoint**: `https://time-api-dev.aerotage.com` (custom domain)
- **Backup Endpoint**: `https://k60bobrd9h.execute-api.us-east-1.amazonaws.com/dev` (AWS URL)
- **Active Endpoint**: Shows which endpoint is currently recommended
- **Response Times**: Performance comparison between endpoints
- **Authentication**: Uses your JWT token for accurate health status

## 🔐 **Authentication Requirements**

### Why Authentication is Required
- The `/health` endpoint requires a valid JWT token
- Unauthenticated requests return 403 (Forbidden)
- Health checks use your current login session
- This ensures accurate health status for your user context

### What This Means
- **Must be logged in**: Health check only works when authenticated
- **Automatic token use**: Uses your current session token
- **Accurate status**: Shows real health status, not just connectivity
- **Security**: Prevents unauthorized health monitoring

## 🔄 **Auto-Refresh Behavior**

### Navigation Bar Status
- **Refresh Interval**: Every 60 seconds
- **Cache Duration**: 30 seconds (prevents excessive API calls)
- **Background Updates**: Updates automatically without user interaction
- **Authentication**: Uses current session token automatically

### Settings Page Detailed View
- **Refresh Interval**: Every 30 seconds (more frequent for detailed monitoring)
- **Manual Refresh**: Click "Refresh" button for immediate update
- **Real-time Updates**: Shows live performance metrics
- **Token Refresh**: Automatically handles token refresh if needed

## 🎨 **Visual Indicators**

### Status Icons
- ✅ **Green Circle**: API is healthy and responding normally (authenticated)
- ❌ **Red X**: API is not responding, authentication failed, or has errors
- ⚠️ **Yellow Triangle**: API status is unknown or uncertain
- 🔄 **Blue Spinner**: Currently checking API status

### Status Text
- **"API Online"**: Everything is working correctly (authenticated)
- **"API Offline"**: API is not accessible or authentication failed
- **"API Status Unknown"**: Unable to determine status
- **"Checking..."**: Health check in progress

### Authentication-Specific Messages
- **"Authentication required - please log in again"**: 401 error
- **"Access forbidden - insufficient permissions"**: 403 error
- **"API is healthy (XXXms response time)"**: Successful authenticated check

### Response Time Colors
- **Green**: Fast response (< 500ms)
- **Yellow**: Moderate response (500ms - 1000ms)
- **Red**: Slow response (> 1000ms)

## 🛠️ **Troubleshooting with Health Status**

### If API Status Shows "Offline"
1. **Check if you're logged in**: Health check requires authentication
2. **Try logging out and back in**: Refresh your authentication token
3. **Check the detailed view** in Settings → API Health
4. **Look for error messages** in the detailed status
5. **Check both endpoints** to see if it's a specific endpoint issue
6. **Try manual refresh** to see if it's a temporary issue

### If You See Authentication Errors
1. **"Authentication required"**: Log out and log back in
2. **"Access forbidden"**: Contact administrator about permissions
3. **Token expired**: The app should automatically refresh, but try logging out/in
4. **Network issues**: Check your internet connection

### If Response Times are Slow
1. **Compare primary vs backup** endpoint performance
2. **Check your internet connection**
3. **Look for patterns** (always slow vs intermittently slow)
4. **Check if authentication is adding overhead**

### If Status Shows "Unknown"
1. **Verify you're logged in** with valid credentials
2. **Check browser console** for error messages
3. **Verify network connectivity**
4. **Try refreshing the page**
5. **Check if your session has expired**

## 🔧 **For Developers**

### Health Check Component Usage
```tsx
// Simple status indicator (used in navigation)
<HealthStatus />

// Detailed status view (used in settings)
<HealthStatus showDetails={true} />

// Custom styling
<HealthStatus className="custom-styles" />

// Custom refresh interval
<HealthStatus refreshInterval={30000} />
```

### Authentication Integration
```typescript
// Health check service automatically handles authentication
const health = await healthCheckService.checkAPIHealth();

// Uses fetchAuthSession() to get current JWT token
// Includes Authorization: Bearer ${token} header
// Handles 401/403 errors gracefully
```

### Integration Points
- **Navigation**: `src/renderer/App.tsx` (Navigation component)
- **Settings**: `src/renderer/pages/Settings.tsx` (API Health tab)
- **Component**: `src/renderer/components/common/HealthStatus.tsx`
- **Service**: `src/renderer/services/health-check.ts`

## 📊 **What the Health Check Tests**

### Authenticated Health Checks
- **Primary Domain**: Tests connection to custom domain with JWT token
- **Backup Domain**: Tests connection to AWS API Gateway URL with JWT token
- **Response Time**: Measures authenticated API response performance
- **Error Detection**: Identifies connection, authentication, and authorization issues

### Health Endpoint
- **URL**: `/health` on both primary and backup domains
- **Method**: GET request with Authorization header
- **Headers**: `Authorization: Bearer ${accessToken}`
- **Expected Response**: JSON with status information (200 OK)
- **Error Responses**: 401 (Unauthorized), 403 (Forbidden)
- **Timeout**: 10 seconds for health checks, 5 seconds for connectivity tests

### Automatic Failover Logic
- **Primary Preferred**: Always tries custom domain first
- **Backup Fallback**: Switches to AWS URL if primary fails
- **Performance Based**: Recommends fastest responding endpoint
- **Error Recovery**: Automatically retries failed connections
- **Authentication Aware**: Handles auth failures appropriately

## 🎯 **Benefits for Users**

1. **Authenticated Monitoring**: Accurate health status for your user context
2. **Proactive Monitoring**: Know about API issues before they affect your work
3. **Performance Insights**: See which endpoint is performing better
4. **Troubleshooting**: Quickly identify if issues are API-related or auth-related
5. **Transparency**: Clear visibility into system health and authentication status
6. **Reliability**: Automatic failover ensures continued service
7. **Security**: Health monitoring respects authentication requirements

## 🚨 **Important Notes**

1. **Login Required**: You must be logged in to see accurate health status
2. **Token Automatic**: Health checks automatically use your current session token
3. **Privacy**: Health checks only work with your authenticated session
4. **Fallback**: If authentication fails, health check gracefully degrades
5. **Real-time**: Status reflects actual API health for authenticated users

The health check system now provides comprehensive authenticated monitoring while staying out of your way during normal operation. Check the navigation bar for quick status, or dive into the Settings page for detailed analysis when needed. Remember that you must be logged in to see accurate health status! 