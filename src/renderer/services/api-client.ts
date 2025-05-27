import { get, post, put, del } from 'aws-amplify/api';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { authErrorHandler } from './authErrorHandler';
import { decodeJWTPayload } from '../utils/jwt';

export interface TimeEntry {
  id: string;
  userId?: string; // Added for API compatibility
  projectId: string;
  date: string;
  startTime?: string; // Added for API compatibility
  endTime?: string; // Added for API compatibility
  duration: number;
  description: string;
  isBillable: boolean;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt?: string; // Added for API compatibility
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  approvedBy?: string;
  rejectedBy?: string;
  comments?: string;
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  description?: string;
  budget?: {
    hours?: number;
    amount?: number;
  };
  hourlyRate: number;
  status: 'active' | 'inactive' | 'completed';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
  };
  billingAddress?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  hourlyRate?: number;
  teamId?: string;
  department?: string;
  isActive: boolean;
  contactInfo?: {
    phone?: string;
    address?: string;
    emergencyContact?: string;
  };
  profilePicture?: string;
  jobTitle?: string;
  startDate: string;
  lastLogin?: string;
  permissions: {
    features: string[];
    projects: string[];
  };
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    timezone: string;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  projectIds: string[];
  timeEntryIds: string[];
  amount: number;
  tax?: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issueDate: string;
  dueDate: string;
  sentDate?: string;
  paidDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserInvitation {
  id: string;
  email: string;
  invitedBy: string;
  role: 'admin' | 'manager' | 'employee';
  teamId?: string;
  department?: string;
  jobTitle?: string;
  hourlyRate?: number;
  permissions: {
    features: string[];
    projects: string[];
  };
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  invitationToken?: string; // Only returned on creation
  expiresAt: string;
  acceptedAt?: string;
  onboardingCompleted: boolean;
  personalMessage?: string;
  createdAt: string;
  updatedAt: string;
  emailSentAt: string;
  resentCount: number;
  lastResentAt?: string;
}

export interface CreateInvitationRequest {
  email: string;
  role: 'admin' | 'manager' | 'employee';
  teamId?: string;
  department?: string;
  jobTitle?: string;
  hourlyRate?: number;
  permissions: {
    features: string[];
    projects: string[];
  };
  personalMessage?: string;
}

export interface InvitationFilters {
  status?: 'pending' | 'accepted' | 'expired' | 'cancelled';
  limit?: string;
  offset?: string;
  sortBy?: 'createdAt' | 'expiresAt' | 'email';
  sortOrder?: 'asc' | 'desc';
}

export interface ResendInvitationOptions {
  extendExpiration?: boolean;
  personalMessage?: string;
}

export interface InvitationValidation {
  invitation: {
    id: string;
    email: string;
    role: 'admin' | 'manager' | 'employee';
    teamId?: string;
    department?: string;
    jobTitle?: string;
    hourlyRate?: number;
    permissions: {
      features: string[];
      projects: string[];
    };
    expiresAt: string;
    isExpired: boolean;
  };
}

export interface AcceptInvitationRequest {
  token: string;
  userData: {
    name: string;
    password: string;
    contactInfo?: {
      phone?: string;
      address?: string;
      emergencyContact?: string;
    };
    preferences: {
      theme: 'light' | 'dark';
      notifications: boolean;
      timezone: string;
    };
  };
}

export interface AcceptInvitationResponse {
  user: User;
  invitation: UserInvitation;
}

class AerotageApiClient {
  private apiName = 'AerotageAPI';

  private async getAuthToken(): Promise<string> {
    try {
      // Try to get the session with forceRefresh to bypass caching issues
      const session = await fetchAuthSession({ forceRefresh: false });
      
      // Check if we have a valid ID token
      if (session.tokens?.idToken) {
        return session.tokens.idToken.toString();
      }
      
      // If we don't have an ID token but have access token, try that
      if (session.tokens?.accessToken) {
        return session.tokens.accessToken.toString();
      }
      
      throw new Error('No valid authentication token found');
    } catch (error) {
      console.error('Failed to get auth token via fetchAuthSession:', error);
      
      // If fetchAuthSession fails due to Identity Pool issues, throw a user-friendly error
      if (error instanceof Error && error.message?.includes('Invalid identity pool configuration')) {
        throw new Error('AWS Identity Pool configuration error. Please contact your administrator.');
      }
      
      // For other auth errors, provide a generic message
      throw new Error('Authentication required. Please sign in again.');
    }
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE', 
    path: string, 
    options: any = {},
  ): Promise<T> {
    try {
      const token = await this.getAuthToken();
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      };

      // Debug: Log the request payload
      if (options.body) {
        console.log(`📤 Request payload for ${method} ${path}:`, JSON.stringify(options.body, null, 2));
      }

      let restResponse;
      switch (method) {
        case 'GET':
          restResponse = await get({ apiName: this.apiName, path, options: { headers, ...options } });
          break;
        case 'POST':
          restResponse = await post({ apiName: this.apiName, path, options: { headers, body: options.body, ...options } });
          break;
        case 'PUT':
          restResponse = await put({ apiName: this.apiName, path, options: { headers, body: options.body, ...options } });
          break;
        case 'DELETE':
          restResponse = await del({ apiName: this.apiName, path, options: { headers, ...options } });
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      // Debug: Log the raw response to understand its structure
      console.log(`🔍 Raw API response for ${method} ${path}:`, restResponse);

      // Amplify v6 returns {response: Promise, cancel: function}
      // We need to await the response Promise first
      const response = await restResponse.response;
      
      console.log(`🔍 Awaited response for ${method} ${path}:`, response);

      // Handle different response formats
      let responseData;
      
      // Check if response has a body property
      if (response && typeof response === 'object' && 'body' in response) {
        const body = (response as any).body;
        
        // If body is a ReadableStream, read it
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
          
          // Parse the JSON string
          responseData = result ? JSON.parse(result) : null;
        } else if (typeof body === 'string') {
          // If body is already a string, parse it
          responseData = JSON.parse(body);
        } else {
          // If body is already parsed JSON
          responseData = body;
        }
      } else {
        // Direct response
        responseData = response;
      }

      console.log(`✅ Parsed API data for ${method} ${path}:`, responseData);
      return responseData as T;
    } catch (error: any) {
      console.error(`❌ Raw API Error (${method} ${path}):`, error);
      
      // Extract detailed error information
      let errorMessage = 'Unknown error';
      let statusCode = 'unknown';
      let errorDetails = null;

      try {
        // Check if this is an Amplify API error with response details
        if (error?.response) {
          const errorResponse = error.response;
          console.log(`🔍 Error response object:`, errorResponse);
          
          statusCode = errorResponse.status || errorResponse.statusCode || 'unknown';
          
          // Try to extract error body
          let errorBody = null;
          if (errorResponse.body) {
            if (typeof errorResponse.body === 'string') {
              try {
                errorBody = JSON.parse(errorResponse.body);
              } catch {
                errorBody = errorResponse.body;
              }
            } else {
              errorBody = errorResponse.body;
            }
          }
          
          console.log(`🔍 Error body:`, errorBody);
          
          // Handle enhanced backend session validation errors
          const statusCodeNum = parseInt(statusCode.toString(), 10);
          if (statusCodeNum === 401) {
            errorMessage = 'Authentication token is invalid or expired. Please sign in again.';
            
            // Handle authentication error automatically
            const authError = { 
              code: 'AUTHENTICATION_FAILED', 
              statusCode: 401, 
              shouldLogout: true, 
              message: errorMessage 
            };
            authErrorHandler.handleAuthError(authError).catch(console.error);
            
          } else if (statusCodeNum === 403) {
            // Check if this is a session validation error
            if (errorBody && (
              errorBody.message?.includes('No active sessions') ||
              errorBody.error?.message?.includes('No active sessions') ||
              errorBody.message?.includes('session') ||
              errorBody.error?.message?.includes('session')
            )) {
              errorMessage = 'Your session has been terminated. Please sign in again.';
              
              // Handle session termination error automatically
              const sessionError = { 
                code: 'SESSION_TERMINATED', 
                statusCode: 403, 
                shouldLogout: true, 
                message: errorMessage 
              };
              authErrorHandler.handleAuthError(sessionError).catch(console.error);
              
            } else {
              errorMessage = 'Access denied. You do not have permission to perform this action.';
            }
          } else if (statusCodeNum === 401 && errorBody && 
                     (errorBody.code === 'SESSION_MIGRATION_REQUIRED' || 
                      errorBody.error?.code === 'SESSION_MIGRATION_REQUIRED')) {
            // Handle session migration requirement
            console.log('🔄 Session migration required, clearing storage and forcing re-login');
            localStorage.clear();
            window.location.href = '/login';
            throw new Error('SESSION_MIGRATION_REQUIRED'); // Throw error to prevent further execution
          } else {
            // Extract meaningful error message for other status codes
            if (errorBody) {
              if (typeof errorBody === 'object') {
                // Handle nested error structure: { success: false, error: { code: "...", message: "..." } }
                if (errorBody.error && typeof errorBody.error === 'object') {
                  errorMessage = errorBody.error.message || errorBody.error.code || 'Server error';
                } else {
                  errorMessage = errorBody.message || errorBody.error || errorBody.errorMessage || `HTTP ${statusCode} Error`;
                }
                errorDetails = errorBody;
              } else {
                errorMessage = errorBody;
              }
            } else {
              errorMessage = `HTTP ${statusCode} Error`;
            }
          }
        } else if (error?.message) {
          errorMessage = error.message;
        }
      } catch (parseError) {
        console.warn('Failed to parse error response:', parseError);
      }

      // Check for session validation errors (including CORS/network errors)
      if (this.isSessionValidationError(error)) {
        console.log('🔍 Detected session validation error, triggering automatic logout');
        
        const sessionError = { 
          code: 'SESSION_VALIDATION_FAILED', 
          statusCode: statusCode === 'unknown' ? 403 : parseInt(statusCode.toString(), 10), 
          shouldLogout: true, 
          message: 'Your session is no longer valid. Please sign in again.' 
        };
        
        // Handle session validation error automatically
        authErrorHandler.handleAuthError(sessionError).catch(console.error);
        
        // Update error message for user
        errorMessage = 'Your session is no longer valid. Please sign in again.';
      }

      // Create a more descriptive error
      const apiError = new Error(`${errorMessage} (${statusCode})`);
      (apiError as any).statusCode = statusCode;
      (apiError as any).details = errorDetails;
      (apiError as any).originalError = error;

      console.error(`🚨 API Error (${method} ${path}): ${errorMessage}`, {
        statusCode,
        errorDetails,
        originalError: error
      });

      throw apiError;
    }
  }

  /**
   * Enhanced error detection for session validation issues
   * Handles cases where CORS blocks the actual HTTP status codes
   */
  private isSessionValidationError(error: any): boolean {
    const errorMessage = error?.message || '';
    
    // Network errors when backend is rejecting authorization
    if (errorMessage.includes('NetworkError: A network error has occurred')) {
      return true;
    }
    
    // CORS errors often indicate authorization rejection
    if (errorMessage.includes('CORS') || errorMessage.includes('Access-Control-Allow-Origin')) {
      return true;
    }
    
    // Specific backend validation error patterns
    if (errorMessage.includes('No active sessions') || 
        errorMessage.includes('session has been terminated') ||
        errorMessage.includes('Authentication required')) {
      return true;
    }
    
    return false;
  }

  // Authentication methods
  async getCurrentUser(): Promise<User> {
    // Get user ID from JWT token (consistent with backend expectations)
    const session = await fetchAuthSession({ forceRefresh: false });
    const token = session.tokens?.idToken?.toString();
    
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    const tokenPayload = decodeJWTPayload(token);
    if (!tokenPayload || !tokenPayload.sub) {
      throw new Error('Invalid token payload');
    }
    
    const userId = tokenPayload.sub;
    return this.request<User>('GET', `/users/${userId}`);
  }

  // Time Entries API
  async getTimeEntries(filters?: {
    userId?: string;
    projectId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<TimeEntry[]> {
    const params = filters ? `?${new URLSearchParams(filters)}` : '';
    return this.request<TimeEntry[]>('GET', `/time-entries${params}`);
  }

  async createTimeEntry(entry: Omit<TimeEntry, 'id' | 'createdAt'>): Promise<TimeEntry> {
    return this.request<TimeEntry>('POST', '/time-entries', { body: entry });
  }

  async updateTimeEntry(id: string, updates: Partial<TimeEntry>): Promise<TimeEntry> {
    return this.request<TimeEntry>('PUT', `/time-entries/${id}`, { body: updates });
  }

  async deleteTimeEntry(id: string): Promise<void> {
    return this.request<void>('DELETE', `/time-entries/${id}`);
  }

  async submitTimeEntries(timeEntryIds: string[]): Promise<void> {
    return this.request<void>('POST', '/time-entries/submit', { body: { timeEntryIds } });
  }

  async approveTimeEntries(timeEntryIds: string[], comments?: string): Promise<void> {
    return this.request<void>('POST', '/time-entries/approve', { 
      body: { timeEntryIds, comments }, 
    });
  }

  async rejectTimeEntries(timeEntryIds: string[], comments: string): Promise<void> {
    return this.request<void>('POST', '/time-entries/reject', { 
      body: { timeEntryIds, comments }, 
    });
  }

  // Projects API
  async getProjects(filters?: { clientId?: string; status?: string }): Promise<Project[]> {
    const params = filters ? `?${new URLSearchParams(filters)}` : '';
    return this.request<Project[]>('GET', `/projects${params}`);
  }

  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    return this.request<Project>('POST', '/projects', { body: project });
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    return this.request<Project>('PUT', `/projects/${id}`, { body: updates });
  }

  async deleteProject(id: string): Promise<void> {
    return this.request<void>('DELETE', `/projects/${id}`);
  }

  // Clients API
  async getClients(): Promise<Client[]> {
    return this.request<Client[]>('GET', '/clients');
  }

  async createClient(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> {
    return this.request<Client>('POST', '/clients', { body: client });
  }

  async updateClient(id: string, updates: Partial<Client>): Promise<Client> {
    return this.request<Client>('PUT', `/clients/${id}`, { body: updates });
  }

  async deleteClient(id: string): Promise<void> {
    return this.request<void>('DELETE', `/clients/${id}`);
  }

  // Users API
  async getUsers(): Promise<User[]> {
    return this.request<User[]>('GET', '/users');
  }

  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    return this.request<User>('POST', '/users', { body: user });
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    return this.request<User>('PUT', `/users/${id}`, { body: updates });
  }

  async deleteUser(id: string): Promise<void> {
    return this.request<void>('DELETE', `/users/${id}`);
  }

  // Invoices API
  async getInvoices(filters?: { clientId?: string; status?: string }): Promise<Invoice[]> {
    const params = filters ? `?${new URLSearchParams(filters)}` : '';
    return this.request<Invoice[]>('GET', `/invoices${params}`);
  }

  async createInvoice(invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    return this.request<Invoice>('POST', '/invoices', { body: invoice });
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    return this.request<Invoice>('PUT', `/invoices/${id}`, { body: updates });
  }

  async sendInvoice(id: string): Promise<void> {
    return this.request<void>('POST', `/invoices/${id}/send`);
  }

  async updateInvoiceStatus(id: string, status: Invoice['status']): Promise<Invoice> {
    return this.request<Invoice>('PUT', `/invoices/${id}/status`, { body: { status } });
  }

  // Reports API
  async getTimeReports(filters: {
    startDate: string;
    endDate: string;
    userId?: string;
    projectId?: string;
    groupBy?: 'user' | 'project' | 'date';
  }): Promise<any> {
    const params = `?${new URLSearchParams(filters)}`;
    return this.request<any>('GET', `/reports/time${params}`);
  }

  async getProjectReports(filters?: { 
    startDate?: string; 
    endDate?: string; 
    clientId?: string; 
  }): Promise<any> {
    const params = filters ? `?${new URLSearchParams(filters)}` : '';
    return this.request<any>('GET', `/reports/projects${params}`);
  }

  async getUserReports(filters?: { 
    startDate?: string; 
    endDate?: string; 
    teamId?: string; 
  }): Promise<any> {
    const params = filters ? `?${new URLSearchParams(filters)}` : '';
    return this.request<any>('GET', `/reports/users${params}`);
  }

  async exportReport(type: 'pdf' | 'csv' | 'excel', filters: any): Promise<Blob> {
    const response = await this.request<any>('POST', '/reports/export', { 
      body: { type, filters },
      headers: { 'Accept': 'application/octet-stream' },
    });
    return response;
  }

  // User Invitations API
  async createUserInvitation(invitation: CreateInvitationRequest): Promise<UserInvitation> {
    console.log('📧 Creating user invitation:', invitation);
    return this.request<UserInvitation>('POST', '/user-invitations', { body: invitation });
  }

  async getUserInvitations(filters?: InvitationFilters): Promise<UserInvitation[]> {
    let params = '';
    if (filters) {
      const searchParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value);
        }
      });
      params = searchParams.toString() ? `?${searchParams.toString()}` : '';
    }
    console.log('📋 API Client - Fetching user invitations with params:', params);
    console.log('🌐 API Client - Full URL will be: /user-invitations' + params);
    
    try {
      const response = await this.request<any>('GET', `/user-invitations${params}`);
      console.log('📋 API Client - getUserInvitations response received');
      
      // Handle different response formats:
      // 1. Direct array: UserInvitation[]
      // 2. Backend format: { success: boolean, data: { items: UserInvitation[], pagination: {...} } }
      // 3. API spec format: { success: boolean, data: { invitations: UserInvitation[], pagination: {...} } }
      let invitations: UserInvitation[];
      
      if (Array.isArray(response)) {
        // Direct array response
        invitations = response;
        console.log('📋 API Client - Direct array format detected');
      } else if (response && response.success && response.data) {
        if (Array.isArray(response.data.items)) {
          // Backend actual format: data.items
          invitations = response.data.items;
          console.log('📋 API Client - Backend format detected (data.items)');
          console.log('📋 API Client - Pagination info:', response.data.pagination);
        } else if (Array.isArray(response.data.invitations)) {
          // API spec format: data.invitations
          invitations = response.data.invitations;
          console.log('📋 API Client - API spec format detected (data.invitations)');
          console.log('📋 API Client - Pagination info:', response.data.pagination);
        } else if (Array.isArray(response.data)) {
          // Alternative format: data is direct array
          invitations = response.data;
          console.log('📋 API Client - Direct data array format detected');
        } else {
          console.error('📋 API Client - No invitations array found in response.data:', response.data);
          throw new Error('No invitations array found in response data');
        }
      } else {
        console.error('📋 API Client - Unexpected response format:', response);
        console.error('📋 API Client - Full response structure:', JSON.stringify(response, null, 2));
        throw new Error('Unexpected response format from getUserInvitations API');
      }
      
      console.log('📋 API Client - Processed invitations:', invitations);
      console.log('📋 API Client - Number of invitations:', invitations.length);
      
      return invitations;
    } catch (error) {
      console.error('📋 API Client - getUserInvitations FAILED:', error);
      throw error;
    }
  }

  async resendInvitation(invitationId: string, options?: ResendInvitationOptions): Promise<void> {
    console.log('🔄 Resending invitation:', invitationId, options);
    return this.request<void>('POST', `/user-invitations/${invitationId}/resend`, { body: options || {} });
  }

  async cancelInvitation(invitationId: string): Promise<void> {
    console.log('❌ Cancelling invitation:', invitationId);
    return this.request<void>('DELETE', `/user-invitations/${invitationId}`);
  }

  async validateInvitationToken(token: string): Promise<InvitationValidation> {
    console.log('🔍 Validating invitation token:', token.substring(0, 10) + '...');
    // Note: This is a public endpoint, so we override the request method to not include auth
    return this.requestPublic<InvitationValidation>('GET', `/user-invitations/validate/${token}`);
  }

  async acceptInvitation(acceptanceData: AcceptInvitationRequest): Promise<AcceptInvitationResponse> {
    console.log('✅ Accepting invitation for:', acceptanceData.userData.name);
    // Note: This is a public endpoint, so we override the request method to not include auth
    return this.requestPublic<AcceptInvitationResponse>('POST', '/user-invitations/accept', { body: acceptanceData });
  }

  // Public request method for invitation validation and acceptance (no auth required)
  private async requestPublic<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE', 
    path: string, 
    options: any = {},
  ): Promise<T> {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      let restResponse;
      switch (method) {
        case 'GET':
          restResponse = await get({ apiName: this.apiName, path, options: { headers, ...options } });
          break;
        case 'POST':
          restResponse = await post({ apiName: this.apiName, path, options: { headers, body: options.body, ...options } });
          break;
        case 'PUT':
          restResponse = await put({ apiName: this.apiName, path, options: { headers, body: options.body, ...options } });
          break;
        case 'DELETE':
          restResponse = await del({ apiName: this.apiName, path, options: { headers, ...options } });
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      console.log(`🔍 Raw public API response for ${method} ${path}:`, restResponse);

      const response = await restResponse.response;
      console.log(`🔍 Awaited public response for ${method} ${path}:`, response);

      // Handle different response formats (same logic as private request)
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

      console.log(`✅ Parsed public API data for ${method} ${path}:`, responseData);
      return responseData as T;
    } catch (error) {
      console.error(`Public API Error (${method} ${path}):`, error);
      throw error;
    }
  }
}

export const apiClient = new AerotageApiClient(); 