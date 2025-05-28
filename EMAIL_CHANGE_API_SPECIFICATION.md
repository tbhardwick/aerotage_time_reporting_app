# 📧 Email Change Workflow - API Specification for Backend Team

## 🎯 **Overview**

This document provides complete API specifications for implementing the secure email change workflow in the Aerotage Time Reporting Application backend. The workflow supports user-initiated email changes with dual verification, admin approval, and comprehensive audit trails.

## 🏗️ **Architecture Requirements**

### **Database Schema**

#### **1. EmailChangeRequests Table**
```sql
CREATE TABLE EmailChangeRequests (
    id VARCHAR(36) PRIMARY KEY,
    userId VARCHAR(36) NOT NULL,
    currentEmail VARCHAR(255) NOT NULL,
    newEmail VARCHAR(255) NOT NULL,
    status ENUM('pending_verification', 'pending_approval', 'approved', 'rejected', 'completed', 'cancelled') NOT NULL,
    reason ENUM('name_change', 'company_change', 'personal_preference', 'security_concern', 'other') NOT NULL,
    customReason TEXT,
    
    -- Verification tracking
    currentEmailVerified BOOLEAN DEFAULT FALSE,
    newEmailVerified BOOLEAN DEFAULT FALSE,
    currentEmailVerificationToken VARCHAR(255),
    newEmailVerificationToken VARCHAR(255),
    verificationTokensExpiresAt TIMESTAMP,
    
    -- Approval tracking
    approvedBy VARCHAR(36),
    approvedAt TIMESTAMP NULL,
    rejectedBy VARCHAR(36),
    rejectedAt TIMESTAMP NULL,
    rejectionReason TEXT,
    
    -- Completion tracking
    completedAt TIMESTAMP NULL,
    estimatedCompletionTime TIMESTAMP,
    
    -- Audit fields
    requestedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verifiedAt TIMESTAMP NULL,
    cancelledAt TIMESTAMP NULL,
    cancelledBy VARCHAR(36),
    
    -- Metadata
    ipAddress VARCHAR(45),
    userAgent TEXT,
    
    FOREIGN KEY (userId) REFERENCES Users(id),
    FOREIGN KEY (approvedBy) REFERENCES Users(id),
    FOREIGN KEY (rejectedBy) REFERENCES Users(id),
    FOREIGN KEY (cancelledBy) REFERENCES Users(id),
    
    INDEX idx_user_status (userId, status),
    INDEX idx_status_created (status, requestedAt),
    INDEX idx_email_verification (currentEmailVerificationToken, newEmailVerificationToken)
);
```

#### **2. EmailChangeAuditLog Table**
```sql
CREATE TABLE EmailChangeAuditLog (
    id VARCHAR(36) PRIMARY KEY,
    requestId VARCHAR(36) NOT NULL,
    action ENUM('created', 'current_email_verified', 'new_email_verified', 'approved', 'rejected', 'completed', 'cancelled', 'verification_resent') NOT NULL,
    performedBy VARCHAR(36),
    performedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details JSON,
    ipAddress VARCHAR(45),
    userAgent TEXT,
    
    FOREIGN KEY (requestId) REFERENCES EmailChangeRequests(id),
    FOREIGN KEY (performedBy) REFERENCES Users(id),
    
    INDEX idx_request_action (requestId, action),
    INDEX idx_performed_at (performedAt)
);
```

### **Configuration Settings**
```typescript
interface EmailChangeConfig {
  verificationTokenExpiryHours: number; // Default: 24
  maxActiveRequestsPerUser: number; // Default: 1
  requestCooldownHours: number; // Default: 24
  autoApprovalReasons: string[]; // ['personal_preference', 'name_change']
  adminApprovalRequired: {
    roles: string[]; // ['admin', 'manager']
    reasons: string[]; // ['company_change', 'security_concern', 'other']
    domainChanges: boolean; // true
  };
  emailTemplates: {
    verificationSubject: string;
    verificationTemplate: string;
    approvalNotificationTemplate: string;
    completionNotificationTemplate: string;
  };
}
```

## 🔌 **API Endpoints**

### **1. Submit Email Change Request**

#### **POST /api/users/{userId}/email-change-request**

**Description**: User initiates an email change request

**Authentication**: Required (JWT token)

**Authorization**: User can only change their own email OR admin can initiate for any user

**Request Body**:
```typescript
interface EmailChangeRequestBody {
  newEmail: string; // Valid email format, different from current
  reason: 'name_change' | 'company_change' | 'personal_preference' | 'security_concern' | 'other';
  customReason?: string; // Required if reason is 'other'
}
```

**Validation Rules**:
- `newEmail`: Valid email format, not same as current email, not already in use
- `reason`: Must be one of the allowed enum values
- `customReason`: Required and non-empty if reason is 'other', max 500 characters
- User cannot have more than 1 active request (pending_verification, pending_approval, approved)
- Must respect cooldown period (24 hours) since last request

**Response**:
```typescript
interface EmailChangeRequestResponse {
  success: boolean;
  data: {
    requestId: string;
    status: 'pending_verification';
    currentEmail: string;
    newEmail: string;
    reason: string;
    customReason?: string;
    requestedAt: string; // ISO datetime
    estimatedCompletionTime: string; // ISO datetime
    verificationRequired: {
      currentEmail: boolean; // true
      newEmail: boolean; // true
    };
    nextSteps: string[];
  };
  message: string;
}
```

**Success Response (201)**:
```json
{
  "success": true,
  "data": {
    "requestId": "req_1234567890abcdef",
    "status": "pending_verification",
    "currentEmail": "user@company.com",
    "newEmail": "user@newcompany.com",
    "reason": "company_change",
    "requestedAt": "2024-05-28T10:30:00Z",
    "estimatedCompletionTime": "2024-05-30T10:30:00Z",
    "verificationRequired": {
      "currentEmail": true,
      "newEmail": true
    },
    "nextSteps": [
      "Check your current email (user@company.com) for verification link",
      "Check your new email (user@newcompany.com) for verification link",
      "Admin approval will be required after verification"
    ]
  },
  "message": "Email change request submitted successfully"
}
```

**Error Responses**:
```typescript
// 400 Bad Request - Validation errors
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "New email address is already in use",
  "details": {
    "field": "newEmail",
    "code": "EMAIL_ALREADY_EXISTS"
  }
}

// 409 Conflict - Active request exists
{
  "success": false,
  "error": "ACTIVE_REQUEST_EXISTS",
  "message": "You already have an active email change request",
  "details": {
    "activeRequestId": "req_existing123",
    "status": "pending_verification"
  }
}

// 429 Too Many Requests - Cooldown period
{
  "success": false,
  "error": "COOLDOWN_ACTIVE",
  "message": "Please wait 24 hours before submitting another request",
  "details": {
    "cooldownExpiresAt": "2024-05-29T10:30:00Z"
  }
}
```

**Implementation Notes**:
1. Generate unique verification tokens for both emails
2. Set token expiry (24 hours)
3. Send verification emails to both addresses
4. Log audit entry for request creation
5. Determine if admin approval will be required based on config
6. Calculate estimated completion time based on approval requirements

---

### **2. Verify Email Address**

#### **POST /api/email-change/verify**

**Description**: Verify ownership of current or new email address

**Authentication**: Not required (token-based verification)

**Request Body**:
```typescript
interface EmailVerificationRequest {
  token: string; // Verification token from email
  emailType: 'current' | 'new';
}
```

**Response**:
```typescript
interface EmailVerificationResponse {
  success: boolean;
  data: {
    requestId: string;
    emailType: 'current' | 'new';
    verified: boolean;
    verificationStatus: {
      currentEmailVerified: boolean;
      newEmailVerified: boolean;
    };
    nextStep: 'verify_other_email' | 'pending_approval' | 'auto_approved' | 'processing';
    message: string;
  };
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "requestId": "req_1234567890abcdef",
    "emailType": "current",
    "verified": true,
    "verificationStatus": {
      "currentEmailVerified": true,
      "newEmailVerified": false
    },
    "nextStep": "verify_other_email",
    "message": "Current email verified successfully. Please verify your new email address."
  }
}
```

**Error Responses**:
```typescript
// 400 Bad Request - Invalid token
{
  "success": false,
  "error": "INVALID_TOKEN",
  "message": "Verification token is invalid or expired"
}

// 410 Gone - Already verified
{
  "success": false,
  "error": "ALREADY_VERIFIED",
  "message": "This email address has already been verified"
}
```

**Implementation Notes**:
1. Validate token and check expiry
2. Update verification status in database
3. Log audit entry for verification
4. If both emails verified, determine next step based on approval requirements
5. If auto-approval configured, proceed to completion
6. If admin approval required, update status to 'pending_approval' and notify admins
7. Update estimated completion time

---

### **3. Get User's Email Change Requests**

#### **GET /api/users/{userId}/email-change-requests**

**Description**: Retrieve all email change requests for a user

**Authentication**: Required (JWT token)

**Authorization**: User can view their own requests OR admin can view any user's requests

**Query Parameters**:
```typescript
interface EmailChangeRequestsQuery {
  status?: 'pending_verification' | 'pending_approval' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  limit?: number; // Default: 10, Max: 100
  offset?: number; // Default: 0
  sortBy?: 'requestedAt' | 'status'; // Default: 'requestedAt'
  sortOrder?: 'asc' | 'desc'; // Default: 'desc'
}
```

**Response**:
```typescript
interface EmailChangeRequestsResponse {
  success: boolean;
  data: {
    requests: EmailChangeRequest[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}

interface EmailChangeRequest {
  id: string;
  currentEmail: string;
  newEmail: string;
  status: string;
  reason: string;
  customReason?: string;
  requestedAt: string;
  verifiedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  rejectionReason?: string;
  estimatedCompletionTime?: string;
  verificationStatus: {
    currentEmailVerified: boolean;
    newEmailVerified: boolean;
  };
  approvedBy?: {
    id: string;
    name: string;
  };
  rejectedBy?: {
    id: string;
    name: string;
  };
}
```

---

### **4. Cancel Email Change Request**

#### **DELETE /api/email-change-requests/{requestId}**

**Description**: Cancel an active email change request

**Authentication**: Required (JWT token)

**Authorization**: User can cancel their own requests OR admin can cancel any request

**Response**:
```typescript
interface CancelRequestResponse {
  success: boolean;
  data: {
    requestId: string;
    status: 'cancelled';
    cancelledAt: string;
    cancelledBy: string;
  };
  message: string;
}
```

**Error Responses**:
```typescript
// 400 Bad Request - Cannot cancel
{
  "success": false,
  "error": "CANNOT_CANCEL",
  "message": "Request cannot be cancelled in current status",
  "details": {
    "currentStatus": "completed",
    "cancellableStatuses": ["pending_verification", "pending_approval"]
  }
}
```

**Implementation Notes**:
1. Only allow cancellation for 'pending_verification' and 'pending_approval' statuses
2. Update status to 'cancelled'
3. Log audit entry
4. Send notification email to user

---

### **5. Resend Verification Email**

#### **POST /api/email-change-requests/{requestId}/resend-verification**

**Description**: Resend verification email for current or new email address

**Authentication**: Required (JWT token)

**Authorization**: User can resend for their own requests OR admin can resend for any request

**Request Body**:
```typescript
interface ResendVerificationRequest {
  emailType: 'current' | 'new';
}
```

**Rate Limiting**: Max 3 resends per hour per request

**Response**:
```typescript
interface ResendVerificationResponse {
  success: boolean;
  data: {
    requestId: string;
    emailType: 'current' | 'new';
    emailAddress: string;
    resentAt: string;
    expiresAt: string;
  };
  message: string;
}
```

**Implementation Notes**:
1. Check if request is in 'pending_verification' status
2. Check if specific email is not already verified
3. Generate new verification token
4. Send verification email
5. Log audit entry for resend action

---

## 🔧 **Admin Endpoints**

### **6. Get All Email Change Requests (Admin)**

#### **GET /api/admin/email-change-requests**

**Description**: Retrieve all email change requests for admin review

**Authentication**: Required (JWT token)

**Authorization**: Admin or Manager role required

**Query Parameters**:
```typescript
interface AdminEmailChangeRequestsQuery {
  status?: string;
  userId?: string;
  reason?: string;
  dateFrom?: string; // ISO date
  dateTo?: string; // ISO date
  limit?: number;
  offset?: number;
  sortBy?: 'requestedAt' | 'status' | 'reason';
  sortOrder?: 'asc' | 'desc';
}
```

**Response**: Same as user endpoint but includes all users' requests

---

### **7. Approve Email Change Request (Admin)**

#### **PUT /api/admin/email-change-requests/{requestId}/approve**

**Description**: Approve a pending email change request

**Authentication**: Required (JWT token)

**Authorization**: Admin or Manager role required

**Request Body**:
```typescript
interface ApproveRequestBody {
  approvalNotes?: string; // Optional notes for approval
}
```

**Response**:
```typescript
interface ApproveRequestResponse {
  success: boolean;
  data: {
    requestId: string;
    status: 'approved';
    approvedAt: string;
    approvedBy: {
      id: string;
      name: string;
    };
    estimatedCompletionTime: string;
  };
  message: string;
}
```

**Implementation Notes**:
1. Verify request is in 'pending_approval' status
2. Verify both emails are verified
3. Update status to 'approved'
4. Log audit entry
5. Send notification to user
6. Begin email change process
7. Update estimated completion time

---

### **8. Reject Email Change Request (Admin)**

#### **PUT /api/admin/email-change-requests/{requestId}/reject**

**Description**: Reject a pending email change request

**Authentication**: Required (JWT token)

**Authorization**: Admin or Manager role required

**Request Body**:
```typescript
interface RejectRequestBody {
  rejectionReason: string; // Required reason for rejection
}
```

**Response**:
```typescript
interface RejectRequestResponse {
  success: boolean;
  data: {
    requestId: string;
    status: 'rejected';
    rejectedAt: string;
    rejectedBy: {
      id: string;
      name: string;
    };
    rejectionReason: string;
  };
  message: string;
}
```

**Implementation Notes**:
1. Verify request is in 'pending_approval' status
2. Update status to 'rejected'
3. Store rejection reason
4. Log audit entry
5. Send notification to user with rejection reason

---

## 📧 **Email Templates**

### **1. Email Verification Template**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Verify Your Email Address - Aerotage</title>
</head>
<body>
    <h2>Email Address Verification Required</h2>
    <p>Hello {{userName}},</p>
    
    <p>You have requested to change your email address in the Aerotage Time Reporting system.</p>
    
    <div style="background: #f5f5f5; padding: 15px; margin: 20px 0;">
        <strong>Email Change Details:</strong><br>
        From: {{currentEmail}}<br>
        To: {{newEmail}}<br>
        Reason: {{reason}}
    </div>
    
    <p>To verify ownership of this email address ({{emailAddress}}), please click the button below:</p>
    
    <a href="{{verificationUrl}}" style="background: #007cba; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
        Verify Email Address
    </a>
    
    <p>Or copy and paste this link into your browser:</p>
    <p>{{verificationUrl}}</p>
    
    <p><strong>Important:</strong></p>
    <ul>
        <li>This verification link expires in 24 hours</li>
        <li>You must verify both your current and new email addresses</li>
        <li>{{#if requiresApproval}}Admin approval will be required after verification{{/if}}</li>
    </ul>
    
    <p>If you did not request this email change, please contact your administrator immediately.</p>
    
    <p>Best regards,<br>Aerotage Team</p>
</body>
</html>
```

### **2. Admin Approval Notification Template**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Email Change Request Pending Approval - Aerotage</title>
</head>
<body>
    <h2>Email Change Request Requires Your Approval</h2>
    <p>Hello {{adminName}},</p>
    
    <p>A user has requested an email address change that requires administrative approval.</p>
    
    <div style="background: #f5f5f5; padding: 15px; margin: 20px 0;">
        <strong>Request Details:</strong><br>
        User: {{userName}} ({{userId}})<br>
        Current Email: {{currentEmail}}<br>
        New Email: {{newEmail}}<br>
        Reason: {{reason}}<br>
        {{#if customReason}}Custom Reason: {{customReason}}<br>{{/if}}
        Requested: {{requestedAt}}<br>
        Request ID: {{requestId}}
    </div>
    
    <p>Both email addresses have been verified by the user.</p>
    
    <a href="{{approvalUrl}}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin-right: 10px;">
        Review Request
    </a>
    
    <p>Please review this request in the admin panel and approve or reject as appropriate.</p>
    
    <p>Best regards,<br>Aerotage System</p>
</body>
</html>
```

### **3. Email Change Completion Template**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Email Address Successfully Changed - Aerotage</title>
</head>
<body>
    <h2>Your Email Address Has Been Updated</h2>
    <p>Hello {{userName}},</p>
    
    <p>Your email address change has been completed successfully.</p>
    
    <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <strong>Change Summary:</strong><br>
        Previous Email: {{oldEmail}}<br>
        New Email: {{newEmail}}<br>
        Changed: {{completedAt}}<br>
        Request ID: {{requestId}}
    </div>
    
    <p><strong>Important Security Information:</strong></p>
    <ul>
        <li>All your active sessions have been logged out for security</li>
        <li>Please sign in again using your new email address</li>
        <li>Your account data and time entries remain unchanged</li>
        <li>Future notifications will be sent to your new email address</li>
    </ul>
    
    <p>If you did not authorize this change, please contact your administrator immediately.</p>
    
    <a href="{{loginUrl}}" style="background: #007cba; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
        Sign In Now
    </a>
    
    <p>Best regards,<br>Aerotage Team</p>
</body>
</html>
```

## 🔒 **Security Implementation**

### **1. Token Generation**
```typescript
// Generate cryptographically secure verification tokens
function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Create verification URL with token
function createVerificationUrl(token: string, emailType: 'current' | 'new'): string {
  return `${process.env.FRONTEND_URL}/verify-email?token=${token}&type=${emailType}`;
}
```

### **2. Rate Limiting**
```typescript
// Rate limiting configuration
const rateLimits = {
  emailChangeRequest: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 1 // 1 request per 24 hours per user
  },
  verificationResend: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3 // 3 resends per hour per request
  },
  emailVerification: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10 // 10 verification attempts per 15 minutes per IP
  }
};
```

### **3. Input Validation**
```typescript
// Email validation schema
const emailChangeRequestSchema = {
  newEmail: {
    type: 'string',
    format: 'email',
    maxLength: 255,
    custom: [
      'notSameAsCurrent',
      'notAlreadyInUse',
      'allowedDomain' // if domain whitelist configured
    ]
  },
  reason: {
    type: 'string',
    enum: ['name_change', 'company_change', 'personal_preference', 'security_concern', 'other']
  },
  customReason: {
    type: 'string',
    maxLength: 500,
    required: { when: { reason: 'other' } }
  }
};
```

### **4. Audit Logging**
```typescript
// Audit log entry structure
interface AuditLogEntry {
  requestId: string;
  action: string;
  performedBy: string;
  performedAt: Date;
  details: {
    oldValue?: any;
    newValue?: any;
    metadata?: any;
  };
  ipAddress: string;
  userAgent: string;
}

// Log all significant actions
function logAuditEntry(entry: AuditLogEntry): Promise<void> {
  return auditLogger.log(entry);
}
```

## 🚀 **Implementation Phases**

### **Phase 1: Core Infrastructure (Week 1)**
1. ✅ Database schema creation
2. ✅ Basic API endpoints (submit, verify, get requests)
3. ✅ Email verification system
4. ✅ Basic email templates
5. ✅ Audit logging framework

### **Phase 2: Admin Features (Week 2)**
1. ✅ Admin approval endpoints
2. ✅ Admin notification system
3. ✅ Enhanced email templates
4. ✅ Rate limiting implementation
5. ✅ Security validations

### **Phase 3: Advanced Features (Week 3)**
1. ✅ Auto-approval rules engine
2. ✅ Advanced audit reporting
3. ✅ Email change completion workflow
4. ✅ Session invalidation
5. ✅ Comprehensive error handling

### **Phase 4: Testing & Polish (Week 4)**
1. ✅ Unit tests for all endpoints
2. ✅ Integration tests
3. ✅ Security testing
4. ✅ Performance optimization
5. ✅ Documentation completion

## 📊 **Monitoring & Analytics**

### **Key Metrics to Track**
- Email change request volume
- Verification completion rates
- Admin approval times
- Request rejection rates
- Security incidents (failed verifications, suspicious patterns)

### **Alerting Rules**
- Multiple failed verification attempts from same IP
- Unusual spike in email change requests
- Admin approval queue backlog
- Token expiry without verification

## 🧪 **Testing Requirements**

### **Unit Tests**
- All endpoint handlers
- Validation logic
- Token generation and verification
- Email sending functionality
- Audit logging

### **Integration Tests**
- Complete email change workflow
- Admin approval process
- Error handling scenarios
- Rate limiting behavior
- Database transactions

### **Security Tests**
- Token manipulation attempts
- Rate limit bypass attempts
- Authorization boundary testing
- Input validation edge cases
- SQL injection prevention

## 📋 **Deployment Checklist**

### **Environment Configuration**
- [ ] Database schema deployed
- [ ] Email service configured (AWS SES)
- [ ] Rate limiting rules configured
- [ ] Frontend URL configured for verification links
- [ ] Admin notification email addresses configured
- [ ] Audit logging enabled
- [ ] Monitoring dashboards created

### **Security Verification**
- [ ] All endpoints require proper authentication
- [ ] Authorization rules implemented correctly
- [ ] Rate limiting active
- [ ] Input validation comprehensive
- [ ] Audit logging capturing all actions
- [ ] Email templates reviewed for security

### **Performance Optimization**
- [ ] Database indexes created
- [ ] Query performance optimized
- [ ] Email sending queued for high volume
- [ ] Caching implemented where appropriate
- [ ] Connection pooling configured

---

## 🎯 **Success Criteria**

### **Functional Requirements**
- ✅ Users can initiate email change requests
- ✅ Dual email verification works correctly
- ✅ Admin approval workflow functions properly
- ✅ Email changes complete successfully
- ✅ All actions are properly audited

### **Security Requirements**
- ✅ No unauthorized email changes possible
- ✅ All verification tokens are secure and expire properly
- ✅ Rate limiting prevents abuse
- ✅ Comprehensive audit trail maintained
- ✅ Session invalidation works correctly

### **Performance Requirements**
- ✅ API responses under 500ms (95th percentile)
- ✅ Email delivery within 2 minutes
- ✅ Support for 100+ concurrent requests
- ✅ Database queries optimized
- ✅ Proper error handling and recovery

---

**Document Version**: 1.0  
**Last Updated**: May 28, 2024  
**Next Review**: June 28, 2024  

**Contact**: Frontend Team for integration questions, Security Team for security review 