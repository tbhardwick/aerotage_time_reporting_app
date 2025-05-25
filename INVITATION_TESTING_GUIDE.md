# User Invitation System - Testing Guide

## 🎯 Overview

This guide provides comprehensive testing instructions for the newly implemented user invitation system in the Aerotage Time Reporting Application. The system replaces direct user creation with secure email-based invitations.

## 🔧 Setup Requirements

### Backend Requirements
- ✅ **Backend API deployed** with invitation endpoints
- ✅ **AWS SES configured** for email sending  
- ✅ **DynamoDB UserInvitations table** created with proper indexes
- ✅ **Email templates configured** in AWS SES

### Frontend Requirements  
- ✅ **Frontend updated** with invitation components
- ✅ **API client methods** for invitation management
- ✅ **React Context** updated with invitation actions
- ✅ **Router configured** for invitation acceptance page

## 🧪 Testing Checklist

### Phase 1: Basic Frontend Integration ✅

#### 1.1 Component Rendering
- [ ] **InvitationForm** renders without errors
- [ ] **InvitationList** displays properly
- [ ] **AcceptInvitationPage** loads correctly
- [ ] **Users page tabs** switch between users and invitations

#### 1.2 Form Validation
- [ ] Email validation works correctly
- [ ] Role selection updates permissions automatically
- [ ] Required fields show validation errors
- [ ] Personal message character limit enforced

#### 1.3 UI/UX Testing
- [ ] Form is responsive on different screen sizes
- [ ] Loading states display during API calls
- [ ] Success/error messages show appropriately
- [ ] Modal forms open and close correctly

### Phase 2: API Integration Testing

#### 2.1 Create Invitation
**Test Case:** Send a new user invitation

```typescript
// Test Data
const testInvitation = {
  email: "test.user@example.com",
  role: "employee",
  department: "Engineering", 
  jobTitle: "Software Developer",
  hourlyRate: 75,
  permissions: {
    features: ["timeTracking", "reporting"],
    projects: ["project_123"]
  },
  personalMessage: "Welcome to the team!"
};
```

**Expected Results:**
- [ ] API call succeeds with 200/201 status
- [ ] Invitation appears in invitation list
- [ ] Email sent to specified address (check backend logs)
- [ ] Context state updated with new invitation

#### 2.2 List Invitations
**Test Case:** Fetch and display invitations

**Expected Results:**
- [ ] All invitations load on component mount
- [ ] Status filtering works (pending, accepted, expired, cancelled)
- [ ] Pagination works if implemented
- [ ] Invitation details display correctly

#### 2.3 Resend Invitation
**Test Case:** Resend a pending invitation

**Expected Results:**
- [ ] Resend button only appears for pending invitations
- [ ] Maximum resends (3) enforced
- [ ] Expiration extended when resending
- [ ] Resend count incremented

#### 2.4 Cancel Invitation
**Test Case:** Cancel a pending invitation

**Expected Results:**
- [ ] Cancel button only appears for pending invitations
- [ ] Invitation status changes to cancelled
- [ ] Cancelled invitations cannot be resent
- [ ] UI updates immediately

### Phase 3: Invitation Acceptance Testing

#### 3.1 Token Validation
**Test Case:** Access invitation with valid token

1. **Valid Token:**
   ```
   http://localhost:3000/accept-invitation?token=abc123validtoken456
   ```
   - [ ] Page loads with invitation details
   - [ ] Registration form displays
   - [ ] Invitation details pre-populated

2. **Invalid Token:**
   ```
   http://localhost:3000/accept-invitation?token=invalidtoken
   ```
   - [ ] Error message displays
   - [ ] No registration form shown
   - [ ] Clear error messaging

3. **Expired Token:**
   ```
   http://localhost:3000/accept-invitation?token=expiredtoken
   ```
   - [ ] Expiration error message
   - [ ] Instructions to contact admin
   - [ ] No form access

#### 3.2 Registration Process
**Test Case:** Complete invitation acceptance

**Test Data:**
```typescript
const registrationData = {
  name: "John Doe",
  password: "SecurePass123!",
  confirmPassword: "SecurePass123!",
  contactInfo: {
    phone: "+1 (555) 123-4567",
    address: "123 Main St, City, State 12345",
    emergencyContact: "Jane Doe - +1 (555) 987-6543"
  },
  preferences: {
    theme: "light",
    notifications: true,
    timezone: "America/New_York"
  }
};
```

**Expected Results:**
- [ ] Form validation works correctly
- [ ] Password requirements enforced
- [ ] Account creation succeeds
- [ ] Success message displays
- [ ] Redirect to login page occurs

### Phase 4: Error Handling Testing

#### 4.1 Network Errors
- [ ] **Connection Lost:** Graceful handling with retry options
- [ ] **Timeout:** Appropriate timeout messages
- [ ] **Server Errors:** User-friendly error messages

#### 4.2 Validation Errors
- [ ] **Email Already Exists:** Clear error message
- [ ] **Invalid Role:** Proper validation
- [ ] **Missing Required Fields:** Highlighted errors
- [ ] **Password Policy:** Specific requirement messages

#### 4.3 Edge Cases
- [ ] **Concurrent Access:** Multiple users accepting same invitation
- [ ] **Session Expiration:** Proper handling during long forms
- [ ] **Browser Refresh:** State preservation where appropriate

## 📋 Manual Testing Procedures

### Test Scenario 1: Complete Invitation Flow

1. **Admin Creates Invitation**
   ```bash
   1. Navigate to Users page
   2. Click "Invite User" button
   3. Fill invitation form:
      - Email: test@example.com
      - Role: Employee
      - Department: Engineering
      - Personal Message: "Welcome to our team!"
   4. Submit form
   5. Verify success message
   6. Switch to Invitations tab
   7. Confirm invitation appears in list
   ```

2. **User Receives Invitation**
   ```bash
   1. Check email inbox for invitation
   2. Verify email contains:
      - Professional branding
      - Role details
      - Personal message
      - Accept invitation button
   3. Note invitation expiration date
   ```

3. **User Accepts Invitation**
   ```bash
   1. Click "Accept Invitation" in email
   2. Verify redirect to acceptance page
   3. Complete registration form
   4. Submit and verify account creation
   5. Confirm redirect to login
   ```

4. **Admin Verifies Completion**
   ```bash
   1. Return to Users -> Invitations tab
   2. Verify invitation status changed to "accepted"
   3. Check Users tab for new user account
   4. Verify user has correct role and permissions
   ```

### Test Scenario 2: Invitation Management

1. **Test Resend Functionality**
   ```bash
   1. Create test invitation
   2. Click "Resend" button
   3. Verify new email sent
   4. Check resend count incremented
   5. Test maximum resends (3)
   ```

2. **Test Cancel Functionality**
   ```bash
   1. Create test invitation
   2. Click "Cancel" button
   3. Verify status changes to cancelled
   4. Confirm cancelled invitations cannot be resent
   ```

3. **Test Expiration Handling**
   ```bash
   1. Create invitation with short expiration (test only)
   2. Wait for expiration
   3. Attempt to accept expired invitation
   4. Verify appropriate error message
   ```

## 🔍 Browser Testing Matrix

### Desktop Testing
- [ ] **Chrome** (latest version)
- [ ] **Firefox** (latest version)
- [ ] **Safari** (latest version)
- [ ] **Edge** (latest version)

### Mobile Testing
- [ ] **iOS Safari**
- [ ] **Android Chrome**
- [ ] **Responsive design** (320px - 1920px)

### Feature Support
- [ ] **JavaScript enabled** (primary functionality)
- [ ] **JavaScript disabled** (graceful degradation)
- [ ] **Email client compatibility** (Gmail, Outlook, Apple Mail)

## 🛠️ Development Testing Tools

### Console Commands for Testing

1. **Create Test Invitation:**
   ```javascript
   // In browser console on Users page
   const testInvitation = {
     email: "test@example.com",
     role: "employee",
     permissions: { features: ["timeTracking"], projects: [] }
   };
   
   // Trigger via UI form or API directly
   ```

2. **Check Context State:**
   ```javascript
   // In React DevTools or console
   console.log(useAppContext().state.userInvitations);
   ```

3. **Simulate API Responses:**
   ```javascript
   // Mock successful invitation creation
   const mockInvitation = {
     id: "inv_123",
     email: "test@example.com",
     status: "pending",
     createdAt: new Date().toISOString(),
     expiresAt: new Date(Date.now() + 7*24*60*60*1000).toISOString()
   };
   ```

### Network Testing

1. **Throttle Network:**
   ```bash
   # Chrome DevTools -> Network -> Throttling
   - Test on Slow 3G
   - Test on Fast 3G  
   - Test offline behavior
   ```

2. **Monitor API Calls:**
   ```bash
   # Check Network tab for:
   - Correct HTTP methods
   - Proper request headers
   - Response status codes
   - Response data structure
   ```

## 📊 Performance Testing

### Load Testing Scenarios

1. **Concurrent Invitations:**
   ```bash
   - 10 admins sending invitations simultaneously
   - 50 users accepting invitations simultaneously
   - Monitor response times and error rates
   ```

2. **Large Data Sets:**
   ```bash
   - List page with 100+ invitations
   - Filtering and sorting performance
   - Pagination efficiency
   ```

3. **Memory Usage:**
   ```bash
   - Monitor React component memory leaks
   - Check context state size
   - Verify cleanup on unmount
   ```

## 🐛 Common Issues & Debugging

### Issue 1: Invitation Email Not Received
**Symptoms:** User reports no invitation email
**Debugging Steps:**
1. Check backend logs for email sending errors
2. Verify SES configuration and domain verification
3. Check spam/junk folders
4. Verify email address spelling
5. Test with known working email address

### Issue 2: Invitation Link Not Working
**Symptoms:** 404 or error when clicking invitation link
**Debugging Steps:**
1. Verify frontend routing configured for `/accept-invitation`
2. Check token parameter in URL
3. Verify backend validation endpoint working
4. Check token expiration
5. Test with manually crafted URL

### Issue 3: Form Submission Errors
**Symptoms:** Registration form fails to submit
**Debugging Steps:**
1. Check browser console for JavaScript errors
2. Verify form validation rules
3. Check network requests in DevTools
4. Verify API endpoint availability
5. Test with minimal required data

### Issue 4: Context State Not Updating
**Symptoms:** UI doesn't reflect invitation changes
**Debugging Steps:**
1. Check if AppProvider wraps components
2. Verify dispatch calls in components
3. Check reducer action handling
4. Test with React DevTools
5. Verify action type spelling

## ✅ Test Data Templates

### Valid Test Invitations
```javascript
const testInvitations = [
  {
    email: "admin.test@example.com",
    role: "admin",
    department: "Management",
    jobTitle: "System Administrator",
    hourlyRate: 125,
    permissions: {
      features: ["timeTracking", "approvals", "reporting", "invoicing", "userManagement", "projectManagement"],
      projects: []
    },
    personalMessage: "Welcome as our new admin!"
  },
  {
    email: "manager.test@example.com", 
    role: "manager",
    department: "Engineering",
    jobTitle: "Engineering Manager",
    hourlyRate: 100,
    permissions: {
      features: ["timeTracking", "approvals", "reporting", "projectManagement"],
      projects: ["proj_1", "proj_2"]
    },
    personalMessage: "Excited to have you lead the engineering team!"
  },
  {
    email: "employee.test@example.com",
    role: "employee", 
    department: "Design",
    jobTitle: "UI/UX Designer",
    hourlyRate: 75,
    permissions: {
      features: ["timeTracking"],
      projects: ["proj_3"]
    },
    personalMessage: "Looking forward to seeing your creative work!"
  }
];
```

### Registration Test Data
```javascript
const registrationTests = [
  {
    name: "Valid Registration",
    data: {
      name: "John Doe",
      password: "SecurePass123!",
      confirmPassword: "SecurePass123!",
      preferences: {
        theme: "light",
        notifications: true,
        timezone: "America/New_York"
      }
    },
    expected: "success"
  },
  {
    name: "Weak Password",
    data: {
      name: "Jane Doe", 
      password: "weak",
      confirmPassword: "weak"
    },
    expected: "validation_error"
  },
  {
    name: "Password Mismatch",
    data: {
      name: "Bob Smith",
      password: "SecurePass123!",
      confirmPassword: "DifferentPass456!"
    },
    expected: "validation_error"
  }
];
```

## 📈 Success Metrics

### Functional Metrics
- [ ] **100% test cases pass** for core invitation flow
- [ ] **Zero critical bugs** in invitation acceptance
- [ ] **Email delivery rate > 95%** for invitations
- [ ] **Registration completion rate > 90%** for valid invitations

### Performance Metrics
- [ ] **Page load time < 2 seconds** for invitation forms
- [ ] **API response time < 500ms** for invitation creation
- [ ] **Email delivery time < 30 seconds** for invitations
- [ ] **Zero memory leaks** in React components

### User Experience Metrics
- [ ] **Clear error messages** for all failure scenarios
- [ ] **Intuitive navigation** between invitation states
- [ ] **Responsive design** works on all target devices
- [ ] **Accessibility compliance** for screen readers

## 🚀 Deployment Testing

### Pre-Deployment Checklist
- [ ] All unit tests passing
- [ ] Integration tests passing  
- [ ] Manual test scenarios completed
- [ ] Cross-browser testing completed
- [ ] Performance benchmarks met

### Post-Deployment Verification
- [ ] Production invitation creation works
- [ ] Email delivery in production environment
- [ ] Database migrations applied correctly
- [ ] Monitoring and logging functional
- [ ] Error tracking configured

---

## 📞 Support & Troubleshooting

### Development Team Contacts
- **Frontend Issues:** Check React DevTools and browser console
- **Backend Issues:** Review API endpoint logs and database status
- **Email Issues:** Verify AWS SES configuration and delivery status

### Quick Debug Commands
```bash
# Check frontend build
npm run build

# Test API connectivity  
curl -X GET http://localhost:3000/api/user-invitations

# Verify database connection
# Check CloudWatch logs for Lambda functions

# Test email delivery
# Check SES dashboard for send statistics
```

This testing guide ensures comprehensive validation of the user invitation system across all components and use cases. Follow the checklist systematically to verify complete functionality before production deployment. 