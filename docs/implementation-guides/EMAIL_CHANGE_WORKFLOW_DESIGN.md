# 📧 Email Change Workflow - Design & Implementation

## 🎯 **Overview**

A secure, user-friendly email change workflow that balances security requirements with user autonomy while maintaining proper audit trails and admin oversight.

## 🔐 **Security Requirements**

### **Core Security Principles**
- ✅ **Email verification required** for both old and new addresses
- ✅ **No immediate email changes** - verification process required
- ✅ **Admin notification** for all email change requests
- ✅ **Audit trail** of all email change attempts
- ✅ **Rollback capability** if unauthorized change detected
- ✅ **Session invalidation** after email change completion

## 🎨 **User Experience Flow**

### **Step 1: User Initiates Change**
```
Profile Settings → "Change Email" button → Email Change Form
```

### **Step 2: Verification Process**
```
New Email Input → Send Verification → Verify Both Emails → Admin Review (if required) → Complete Change
```

### **Step 3: Completion**
```
Email Updated → Sessions Invalidated → Re-login Required → Confirmation Sent
```

## 🏗️ **Implementation Architecture**

### **Frontend Components**

#### 1. **EmailChangeButton Component**
```typescript
// src/renderer/components/settings/EmailChangeButton.tsx
interface EmailChangeButtonProps {
  currentEmail: string;
  onEmailChangeRequest: () => void;
}

const EmailChangeButton: React.FC<EmailChangeButtonProps> = ({
  currentEmail,
  onEmailChangeRequest
}) => {
  return (
    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div>
        <p className="text-sm font-medium text-blue-900">Need to change your email?</p>
        <p className="text-xs text-blue-700">Current: {currentEmail}</p>
      </div>
      <button
        onClick={onEmailChangeRequest}
        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Change Email
      </button>
    </div>
  );
};
```

#### 2. **EmailChangeModal Component**
```typescript
// src/renderer/components/settings/EmailChangeModal.tsx
interface EmailChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string;
  onSubmit: (newEmail: string, reason: string) => Promise<void>;
}

const EmailChangeModal: React.FC<EmailChangeModalProps> = ({
  isOpen,
  onClose,
  currentEmail,
  onSubmit
}) => {
  const [newEmail, setNewEmail] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(newEmail, reason);
      onClose();
    } catch (error) {
      // Handle error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-lg font-medium">Change Email Address</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Current Email
          </label>
          <input
            type="email"
            value={currentEmail}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            New Email Address *
          </label>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Reason for Change *
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a reason</option>
            <option value="name_change">Name change (marriage, legal)</option>
            <option value="company_change">Company email change</option>
            <option value="personal_preference">Personal preference</option>
            <option value="security_concern">Security concern</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h4 className="text-sm font-medium text-yellow-800">
                Important Information
              </h4>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>You'll need to verify both your current and new email addresses</li>
                  <li>Admin approval may be required</li>
                  <li>You'll be logged out and need to sign in with your new email</li>
                  <li>This process may take 24-48 hours to complete</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !newEmail || !reason}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Request Email Change'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
```

#### 3. **EmailChangeStatus Component**
```typescript
// src/renderer/components/settings/EmailChangeStatus.tsx
interface EmailChangeRequest {
  id: string;
  currentEmail: string;
  newEmail: string;
  status: 'pending_verification' | 'pending_approval' | 'approved' | 'rejected' | 'completed';
  reason: string;
  requestedAt: string;
  verifiedAt?: string;
  approvedAt?: string;
  completedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

const EmailChangeStatus: React.FC<{ request: EmailChangeRequest }> = ({ request }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_verification': return 'text-yellow-600 bg-yellow-100';
      case 'pending_approval': return 'text-blue-600 bg-blue-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'completed': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending_verification': return 'Pending Email Verification';
      case 'pending_approval': return 'Pending Admin Approval';
      case 'approved': return 'Approved - Completing Change';
      case 'rejected': return 'Request Rejected';
      case 'completed': return 'Email Change Completed';
      default: return 'Unknown Status';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900">Email Change Request</h4>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
          {getStatusText(request.status)}
        </span>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">From:</span>
          <span className="text-gray-900">{request.currentEmail}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">To:</span>
          <span className="text-gray-900">{request.newEmail}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Reason:</span>
          <span className="text-gray-900">{request.reason}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Requested:</span>
          <span className="text-gray-900">{new Date(request.requestedAt).toLocaleDateString()}</span>
        </div>
      </div>

      {request.status === 'rejected' && request.rejectionReason && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">
            <strong>Rejection Reason:</strong> {request.rejectionReason}
          </p>
        </div>
      )}

      {request.status === 'pending_verification' && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            Please check both your current and new email addresses for verification links.
          </p>
        </div>
      )}
    </div>
  );
};
```

## 🔧 **Backend API Requirements**

### **New API Endpoints Needed**

#### 1. **POST /api/users/{userId}/email-change-request**
```typescript
interface EmailChangeRequest {
  newEmail: string;
  reason: 'name_change' | 'company_change' | 'personal_preference' | 'security_concern' | 'other';
  customReason?: string; // If reason is 'other'
}

interface EmailChangeResponse {
  success: boolean;
  data: {
    requestId: string;
    status: 'pending_verification';
    verificationRequired: {
      currentEmail: boolean;
      newEmail: boolean;
    };
    expiresAt: string; // ISO datetime
  };
}
```

#### 2. **POST /api/email-change/verify**
```typescript
interface EmailVerificationRequest {
  token: string;
  emailType: 'current' | 'new';
}

interface EmailVerificationResponse {
  success: boolean;
  data: {
    verified: boolean;
    nextStep: 'verify_other_email' | 'pending_approval' | 'auto_approved';
  };
}
```

#### 3. **GET /api/users/{userId}/email-change-requests**
```typescript
interface EmailChangeRequestsResponse {
  success: boolean;
  data: EmailChangeRequest[];
}
```

#### 4. **Admin Endpoints**
```typescript
// GET /api/admin/email-change-requests
// PUT /api/admin/email-change-requests/{requestId}/approve
// PUT /api/admin/email-change-requests/{requestId}/reject
```

## 🔄 **Complete Workflow**

### **Phase 1: User Request**
1. User clicks "Change Email" in profile settings
2. Modal opens with current email, new email input, and reason selection
3. User submits request
4. System creates email change request with `pending_verification` status
5. Verification emails sent to both current and new addresses

### **Phase 2: Email Verification**
1. User receives verification emails with unique tokens
2. User clicks verification links in both emails
3. System verifies tokens and updates request status
4. If both emails verified, moves to approval phase

### **Phase 3: Admin Review (Configurable)**
1. System checks if admin approval required (based on role, reason, etc.)
2. If required, admin receives notification
3. Admin reviews request in admin panel
4. Admin approves or rejects with reason

### **Phase 4: Email Change Execution**
1. System updates user email in database
2. Invalidates all user sessions
3. Sends confirmation emails to both old and new addresses
4. Updates audit logs
5. User must log in with new email

## 🛡️ **Security Considerations**

### **Verification Security**
- ✅ **Unique tokens** with expiration (24 hours)
- ✅ **Rate limiting** on email change requests (1 per 24 hours)
- ✅ **Both email verification** required
- ✅ **Session invalidation** after change
- ✅ **Audit logging** of all attempts

### **Admin Controls**
- ✅ **Configurable approval requirements** by role
- ✅ **Automatic approval** for certain reasons (if configured)
- ✅ **Emergency override** capability for admins
- ✅ **Bulk rejection** for suspicious patterns

### **Rollback Protection**
- ✅ **24-hour grace period** for rollback
- ✅ **Original email notification** of change
- ✅ **Emergency contact** notification option
- ✅ **Admin can reverse** recent changes

## 📋 **Business Rules**

### **Approval Requirements**
- **Automatic Approval**: Personal preference changes for employees
- **Admin Approval Required**: 
  - Role changes (admin/manager)
  - Security-related changes
  - Multiple requests in short timeframe
  - Domain changes (personal to business email)

### **Restrictions**
- ✅ **One active request** per user at a time
- ✅ **24-hour cooldown** between requests
- ✅ **Email uniqueness** validation
- ✅ **Domain whitelist** (if configured)
- ✅ **Blocked domains** list

## 🎯 **Implementation Priority**

### **Phase 1: Core Functionality**
1. ✅ Email change request modal
2. ✅ Email verification system
3. ✅ Basic admin approval workflow
4. ✅ Session invalidation

### **Phase 2: Enhanced Features**
1. ✅ Advanced admin controls
2. ✅ Audit trail dashboard
3. ✅ Automated approval rules
4. ✅ Rollback functionality

### **Phase 3: Advanced Security**
1. ✅ Suspicious pattern detection
2. ✅ Multi-factor verification
3. ✅ Integration with identity providers
4. ✅ Compliance reporting

## 📊 **User Experience Benefits**

### **For Users**
- ✅ **Self-service capability** with proper security
- ✅ **Clear process** with status updates
- ✅ **Transparent timeline** and requirements
- ✅ **Rollback protection** for security

### **For Administrators**
- ✅ **Centralized approval** workflow
- ✅ **Audit trail** for compliance
- ✅ **Configurable rules** for automation
- ✅ **Security monitoring** capabilities

### **For Business**
- ✅ **Reduced admin overhead** for routine changes
- ✅ **Enhanced security** with verification
- ✅ **Compliance support** with audit trails
- ✅ **Fraud prevention** with approval workflows

---

**Implementation Status**: 📋 **DESIGN COMPLETE** - Ready for development

**Next Steps**: 
1. Backend API development
2. Frontend component implementation  
3. Admin interface creation
4. Testing and security review 