import { get, post, del } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import { authErrorHandler } from './authErrorHandler';

// Email Change Types
export interface CreateEmailChangeRequest {
  newEmail: string;
  reason: 'name_change' | 'company_change' | 'personal_preference' | 'security_concern' | 'other';
  customReason?: string;
  currentPassword: string;
}

export interface EmailChangeRequest {
  id: string;
  userId: string;
  currentEmail: string;
  newEmail: string;
  status: 'pending_verification' | 'pending_approval' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  reason: string;
  customReason?: string;
  currentEmailVerified: boolean;
  newEmailVerified: boolean;
  requestedAt: string;
  verifiedAt?: string;
  approvedAt?: string;
  completedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  estimatedCompletionTime?: string;
  verificationStatus: {
    currentEmailVerified: boolean;
    newEmailVerified: boolean;
  };
}

export interface EmailChangeRequestFilters {
  status?: 'pending_verification' | 'pending_approval' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  limit?: number;
  offset?: number;
  sortBy?: 'requestedAt' | 'status' | 'reason';
  sortOrder?: 'asc' | 'desc';
}

export interface EmailVerificationRequest {
  token: string;
  emailType: 'current' | 'new';
}

export interface ResendVerificationRequest {
  emailType: 'current' | 'new';
}

export interface ApproveEmailChangeRequest {
  approvalNotes?: string;
}

export interface RejectEmailChangeRequest {
  rejectionReason: string;
}

export interface EmailChangeResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp?: string;
}

// Error codes from the API documentation
export enum EmailChangeErrorCodes {
  EMAIL_CHANGE_REQUEST_NOT_FOUND = 'EMAIL_CHANGE_REQUEST_NOT_FOUND',
  ACTIVE_REQUEST_EXISTS = 'ACTIVE_REQUEST_EXISTS',
  COOLDOWN_ACTIVE = 'COOLDOWN_ACTIVE',
  INVALID_NEW_EMAIL = 'INVALID_NEW_EMAIL',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  SAME_AS_CURRENT_EMAIL = 'SAME_AS_CURRENT_EMAIL',
  INVALID_VERIFICATION_TOKEN = 'INVALID_VERIFICATION_TOKEN',
  VERIFICATION_TOKEN_EXPIRED = 'VERIFICATION_TOKEN_EXPIRED',
  EMAIL_ALREADY_VERIFIED = 'EMAIL_ALREADY_VERIFIED',
  VERIFICATION_RATE_LIMITED = 'VERIFICATION_RATE_LIMITED',
  INSUFFICIENT_APPROVAL_PERMISSIONS = 'INSUFFICIENT_APPROVAL_PERMISSIONS',
  REQUEST_NOT_PENDING_APPROVAL = 'REQUEST_NOT_PENDING_APPROVAL',
  CANNOT_APPROVE_OWN_REQUEST = 'CANNOT_APPROVE_OWN_REQUEST',
  EMAIL_SEND_FAILED = 'EMAIL_SEND_FAILED',
  EMAIL_CHANGE_FAILED = 'EMAIL_CHANGE_FAILED'
}

class EmailChangeService {
  private apiName = 'AerotageAPI';

  private async getAuthToken(): Promise<string> {
    try {
      const session = await fetchAuthSession({ forceRefresh: false });
      
      if (session.tokens?.accessToken) {
        return session.tokens.accessToken.toString();
      }
      
      if (session.tokens?.idToken) {
        console.warn('⚠️ Using IdToken as fallback - AccessToken preferred for API calls');
        return session.tokens.idToken.toString();
      }
      
      throw new Error('No valid authentication token found');
    } catch (error) {
      console.error('Failed to get auth token:', error);
      throw new Error('Authentication required. Please sign in again.');
    }
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'DELETE',
    path: string,
    options: any = {}
  ): Promise<T> {
    try {
      const token = await this.getAuthToken();
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      };

      console.log(`📤 Email Change API Request: ${method} ${path}`, options.body ? JSON.stringify(options.body, null, 2) : '');

      let restResponse;
      switch (method) {
        case 'GET':
          restResponse = await get({ apiName: this.apiName, path, options: { headers, ...options } });
          break;
        case 'POST':
          restResponse = await post({ apiName: this.apiName, path, options: { headers, body: options.body, ...options } });
          break;
        case 'DELETE':
          restResponse = await del({ apiName: this.apiName, path, options: { headers, ...options } });
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      const response = await restResponse.response;
      console.log(`🔍 Raw Email Change API response for ${method} ${path}:`, response);

      let responseData;
      if (response && typeof response === 'object' && 'body' in response) {
        const body = (response as any).body;
        
        if (body instanceof ReadableStream) {
          const reader = body.getReader();
          const decoder = new TextDecoder();
          let result = '';
          let done = false;
          
          while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) {
              result += decoder.decode(value, { stream: !done });
            }
          }
          
          responseData = result ? JSON.parse(result) : null;
        } else if (typeof body === 'string') {
          responseData = JSON.parse(body);
        } else {
          responseData = body;
        }
      } else {
        responseData = response;
      }

      console.log(`✅ Parsed Email Change API data for ${method} ${path}:`, responseData);

      // Handle API response format
      if (responseData && typeof responseData === 'object' && 'success' in responseData) {
        if (responseData.success) {
          return responseData.data as T;
        } else {
          // Handle API error response
          const errorMessage = responseData.error?.message || 'Unknown error occurred';
          const errorCode = responseData.error?.code;
          
          const error = new Error(this.getErrorMessage(errorCode, errorMessage));
          (error as any).code = errorCode;
          (error as any).details = responseData.error?.details;
          throw error;
        }
      }

      return responseData as T;
    } catch (error: any) {
      console.error(`❌ Email Change API Error (${method} ${path}):`, error);
      
      // Handle authentication errors
      if (error?.response?.status === 401) {
        await authErrorHandler.handleAuthError(error);
        throw new Error('Authentication failed. Please sign in again.');
      }

      // Re-throw with enhanced error message if it's already processed
      if (error.message && error.code) {
        throw error;
      }

      // Handle other HTTP errors
      if (error?.response) {
        const status = error.response.status || error.response.statusCode;
        let errorMessage = 'An unexpected error occurred';
        
        try {
          const errorBody = error.response.body;
          if (errorBody && typeof errorBody === 'object' && errorBody.error) {
            errorMessage = this.getErrorMessage(errorBody.error.code, errorBody.error.message);
          }
        } catch (parseError) {
          console.warn('Failed to parse error response:', parseError);
        }
        
        throw new Error(`${errorMessage} (Status: ${status})`);
      }

      throw new Error(error.message || 'Network error occurred');
    }
  }

  private getErrorMessage(errorCode?: string, defaultMessage?: string): string {
    switch (errorCode) {
      case EmailChangeErrorCodes.ACTIVE_REQUEST_EXISTS:
        return 'You already have an active email change request. Please complete or cancel it before submitting a new one.';
      case EmailChangeErrorCodes.COOLDOWN_ACTIVE:
        return 'Please wait before submitting another email change request. You can submit a new request in a few hours.';
      case EmailChangeErrorCodes.EMAIL_ALREADY_EXISTS:
        return 'This email address is already in use by another account. Please choose a different email address.';
      case EmailChangeErrorCodes.SAME_AS_CURRENT_EMAIL:
        return 'The new email address must be different from your current email address.';
      case EmailChangeErrorCodes.INVALID_VERIFICATION_TOKEN:
        return 'The verification link is invalid or has already been used. Please request a new verification email.';
      case EmailChangeErrorCodes.VERIFICATION_TOKEN_EXPIRED:
        return 'The verification link has expired. Please request a new verification email.';
      case EmailChangeErrorCodes.EMAIL_ALREADY_VERIFIED:
        return 'This email address has already been verified.';
      case EmailChangeErrorCodes.INSUFFICIENT_APPROVAL_PERMISSIONS:
        return 'You do not have permission to approve email change requests.';
      case EmailChangeErrorCodes.EMAIL_SEND_FAILED:
        return 'Failed to send verification email. Please try again or contact support.';
      case EmailChangeErrorCodes.VERIFICATION_RATE_LIMITED:
        return 'Too many verification attempts. Please wait before requesting another verification email.';
      default:
        return defaultMessage || 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Submit a new email change request
   */
  async submitRequest(data: CreateEmailChangeRequest): Promise<EmailChangeRequest> {
    return this.request<EmailChangeRequest>('POST', '/email-change', { body: data });
  }

  /**
   * Get email change requests (user's own or all if admin)
   */
  async getRequests(filters: EmailChangeRequestFilters = {}): Promise<{
    requests: EmailChangeRequest[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const path = queryString ? `/email-change?${queryString}` : '/email-change';
    
    return this.request('GET', path);
  }

  /**
   * Verify email address using token from email
   */
  async verifyEmail(token: string, emailType: 'current' | 'new'): Promise<{
    requestId: string;
    emailType: 'current' | 'new';
    verified: boolean;
    verificationStatus: {
      currentEmailVerified: boolean;
      newEmailVerified: boolean;
    };
    nextStep: string;
    message: string;
  }> {
    return this.request('POST', '/email-change/verify', {
      body: { token, emailType }
    });
  }

  /**
   * Cancel an email change request
   */
  async cancelRequest(requestId: string): Promise<{ message: string }> {
    return this.request('DELETE', `/email-change/${requestId}`);
  }

  /**
   * Resend verification email
   */
  async resendVerification(requestId: string, emailType: 'current' | 'new'): Promise<{ message: string }> {
    return this.request('POST', `/email-change/${requestId}/resend`, {
      body: { emailType }
    });
  }

  /**
   * Admin: Approve email change request
   */
  async approveRequest(requestId: string, approvalNotes?: string): Promise<{ message: string }> {
    return this.request('POST', `/email-change/${requestId}/approve`, {
      body: { approvalNotes }
    });
  }

  /**
   * Admin: Reject email change request
   */
  async rejectRequest(requestId: string, rejectionReason: string): Promise<{ message: string }> {
    return this.request('POST', `/email-change/${requestId}/reject`, {
      body: { rejectionReason }
    });
  }

  /**
   * Get a specific email change request by ID
   */
  async getRequestById(requestId: string): Promise<EmailChangeRequest> {
    return this.request('GET', `/email-change/${requestId}`);
  }

  /**
   * Check if user has any active email change requests
   */
  async hasActiveRequest(): Promise<boolean> {
    try {
      const response = await this.getRequests({
        status: 'pending_verification',
        limit: 1
      });
      
      if (response.requests.length > 0) {
        return true;
      }

      // Also check for pending approval
      const approvalResponse = await this.getRequests({
        status: 'pending_approval',
        limit: 1
      });

      return approvalResponse.requests.length > 0;
    } catch (error) {
      console.error('Failed to check for active requests:', error);
      return false;
    }
  }

  /**
   * Get the most recent active email change request
   */
  async getActiveRequest(): Promise<EmailChangeRequest | null> {
    try {
      // Check for pending verification first
      const pendingResponse = await this.getRequests({
        status: 'pending_verification',
        limit: 1,
        sortBy: 'requestedAt',
        sortOrder: 'desc'
      });

      if (pendingResponse.requests.length > 0) {
        return pendingResponse.requests[0];
      }

      // Check for pending approval
      const approvalResponse = await this.getRequests({
        status: 'pending_approval',
        limit: 1,
        sortBy: 'requestedAt',
        sortOrder: 'desc'
      });

      if (approvalResponse.requests.length > 0) {
        return approvalResponse.requests[0];
      }

      // Check for approved (processing)
      const approvedResponse = await this.getRequests({
        status: 'approved',
        limit: 1,
        sortBy: 'requestedAt',
        sortOrder: 'desc'
      });

      if (approvedResponse.requests.length > 0) {
        return approvedResponse.requests[0];
      }

      return null;
    } catch (error) {
      console.error('Failed to get active request:', error);
      return null;
    }
  }
}

// Export singleton instance
export const emailChangeService = new EmailChangeService();
export default emailChangeService; 