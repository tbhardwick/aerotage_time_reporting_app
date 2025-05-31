import { get, post, put, del } from 'aws-amplify/api';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { authErrorHandler } from './authErrorHandler';
import { decodeJWTPayload } from '../utils/jwt';
import { healthCheckService, type HealthCheckResponse, type APIConnectionStatus } from './health-check';

// TEMPORARY DEBUG FLAG - Set to true to disable automatic logout on API errors
const DISABLE_AUTO_LOGOUT_FOR_DEBUG = true;

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
  name: string;
  clientId: string;
  clientName: string;
  description?: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  defaultBillable: boolean;
  defaultHourlyRate?: number;
  budget?: {
    type: 'hours' | 'amount';
    value: number;
    spent: number;
  };
  deadline?: string; // ISO date format (YYYY-MM-DD)
  teamMembers: Array<{
    userId: string;
    name?: string;
    role: string;
  }>;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
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
  clientName?: string;
  projectIds: string[];
  timeEntryIds: string[];
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  sentDate?: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  lineItems: Array<{
    id?: string;
    type: 'time' | 'expense' | 'fixed' | 'discount';
    description: string;
    quantity: number;
    rate: number;
    amount: number;
    taxable: boolean;
  }>;
  paymentTerms: string;
  isRecurring: boolean;
  recurringConfig?: {
    frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    interval: number;
    startDate: string;
    endDate?: string;
    maxInvoices?: number;
    autoSend?: boolean;
    generateDaysBefore?: number;
  };
  remindersSent: number;
  notes?: string;
  clientNotes?: string;
  customFields?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
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

// Daily/Weekly Time Tracking Interfaces
export interface WorkDaySchedule {
  start: string | null; // HH:MM format or null for non-working days
  end: string | null; // HH:MM format or null for non-working days
  targetHours: number;
}

export interface UserWorkSchedule {
  userId: string;
  schedule: {
    monday: WorkDaySchedule;
    tuesday: WorkDaySchedule;
    wednesday: WorkDaySchedule;
    thursday: WorkDaySchedule;
    friday: WorkDaySchedule;
    saturday: WorkDaySchedule;
    sunday: WorkDaySchedule;
  };
  timezone: string;
  weeklyTargetHours: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TimeGap {
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  duration: number; // in hours
  type: 'start_of_day' | 'between_entries' | 'end_of_day' | 'lunch_break';
  suggestedDescription?: string;
}

export interface ProjectTimeBreakdown {
  projectId: string;
  projectName: string;
  clientName: string;
  hours: number;
  billableHours: number;
  percentage: number;
}

export interface DailySummary {
  date: string; // YYYY-MM-DD format
  dayOfWeek: string;
  totalHours: number;
  billableHours: number;
  targetHours: number;
  completionPercentage: number;
  entriesCount: number;
  projectBreakdown: ProjectTimeBreakdown[];
  timeGaps: TimeGap[];
  workingHours: {
    firstEntry: string | null; // HH:MM format
    lastEntry: string | null; // HH:MM format
    totalSpan: string; // "Xh Ym" format
  };
}

export interface WeeklyOverview {
  weekInfo: {
    weekStartDate: string; // YYYY-MM-DD format (Monday)
    weekEndDate: string; // YYYY-MM-DD format (Friday)
    weekNumber: number;
    year: number;
  };
  dailySummaries: DailySummary[];
  weeklyTotals: {
    totalHours: number;
    billableHours: number;
    targetHours: number;
    completionPercentage: number;
  };
  patterns: {
    mostProductiveDay: string;
    leastProductiveDay: string;
    averageStartTime: string; // HH:MM format
    averageEndTime: string; // HH:MM format
  };
  projectDistribution: ProjectTimeBreakdown[];
  comparison?: {
    previousWeek: {
      totalHours: number;
      change: string; // "+3.5" or "-1.2"
      changePercentage: string; // "+10.0%" or "-5.5%"
    };
  };
}

export interface DailySummaryResponse {
  summaries: DailySummary[];
  periodSummary: {
    totalDays: number;
    workDays: number;
    totalHours: number;
    averageHoursPerDay: number;
    targetHours: number;
    completionPercentage: number;
  };
}

export interface QuickTimeEntryRequest {
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  projectId: string;
  description: string;
  isBillable: boolean;
  fillGap?: boolean; // Whether this entry is filling a detected gap
}

class AerotageApiClient {
  private apiName = 'AerotageAPI';

  private async getAuthToken(): Promise<string> {
    try {
      // Get the session with forceRefresh to bypass caching issues
      const session = await fetchAuthSession({ forceRefresh: false });
      
      // Use AccessToken as specified in the API documentation (NOT IdToken)
      if (session.tokens?.accessToken) {
        return session.tokens.accessToken.toString();
      }
      
      // Fallback to ID token if access token is not available
      if (session.tokens?.idToken) {
        console.warn('⚠️ Using IdToken as fallback - AccessToken preferred for API calls');
        return session.tokens.idToken.toString();
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
      
      // ✅ AUTOMATIC UNWRAPPING: Extract data if response is wrapped
      if (responseData && typeof responseData === 'object' && 'success' in responseData && 'data' in responseData) {
        console.log(`🔄 Unwrapping response data for ${method} ${path}:`, responseData.data);
        return responseData.data as T; // Return unwrapped data
      }

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
            
            // Handle authentication error automatically (unless debugging)
            if (!DISABLE_AUTO_LOGOUT_FOR_DEBUG) {
              const authError = { 
                code: 'AUTHENTICATION_FAILED', 
                statusCode: 401, 
                shouldLogout: true, 
                message: errorMessage 
              };
              authErrorHandler.handleAuthError(authError).catch(console.error);
            } else {
              console.log('🚫 Auto-logout DISABLED for debugging - 401 error logged but not triggering logout');
            }
          } else if (statusCodeNum === 403) {
            // Check if this is a session validation error
            if (errorBody && (
              errorBody.message?.includes('No active sessions') ||
              errorBody.error?.message?.includes('No active sessions') ||
              errorBody.message?.includes('session') ||
              errorBody.error?.message?.includes('session')
            )) {
              errorMessage = 'Your session has been terminated. Please sign in again.';
              
              // Handle session termination error automatically (unless debugging)
              if (!DISABLE_AUTO_LOGOUT_FOR_DEBUG) {
                const sessionError = { 
                  code: 'SESSION_TERMINATED', 
                  statusCode: 403, 
                  shouldLogout: true, 
                  message: errorMessage 
                };
                authErrorHandler.handleAuthError(sessionError).catch(console.error);
              } else {
                console.log('🚫 Auto-logout DISABLED for debugging - 403 session error logged but not triggering logout');
              }
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
        
        // Handle session validation error automatically (unless debugging)
        if (!DISABLE_AUTO_LOGOUT_FOR_DEBUG) {
          authErrorHandler.handleAuthError(sessionError).catch(console.error);
          console.log('🚪 Auto-logout triggered by session validation error');
        } else {
          console.log('🚫 Auto-logout DISABLED for debugging - session validation error logged but not triggering logout');
        }
        
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
    
    // Use AccessToken as specified in the API documentation
    let token = session.tokens?.accessToken?.toString();
    
    // Fallback to IdToken if AccessToken is not available
    if (!token && session.tokens?.idToken) {
      console.warn('⚠️ Using IdToken as fallback for user ID extraction');
      token = session.tokens.idToken.toString();
    }
    
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    const tokenPayload = decodeJWTPayload(token);
    if (!tokenPayload || !tokenPayload.sub) {
      throw new Error('Invalid token payload');
    }
    
    const userId = tokenPayload.sub;
    console.log('🔍 getCurrentUser - Fetching user data for ID:', userId);
    
    const response = await this.request<any>('GET', `/users/${userId}`);
    console.log('🔍 getCurrentUser - Raw API response:', response);
    console.log('🔍 getCurrentUser - Response type:', typeof response);
    console.log('🔍 getCurrentUser - Response keys:', response ? Object.keys(response) : 'null');
    
    // Handle the response format after automatic unwrapping
    // The API returns: { success: true, data: { user: {...} } }
    // After automatic unwrapping, we receive: { user: {...} }
    let userData = null;
    
    // Most likely case: Auto-unwrapped response gives us { user: {...} }
    if (response && response.user && typeof response.user === 'object') {
      console.log('✅ getCurrentUser - Auto-unwrapped format: { user: {...} }');
      userData = response.user;
    }
    // Fallback: Direct user object (if unwrapping extracted user directly)
    else if (response && response.id && response.email) {
      console.log('✅ getCurrentUser - Direct user object');
      userData = response;
    }
    // Fallback: Full response structure (if unwrapping didn't happen)
    else if (response && response.success && response.data && response.data.user) {
      console.log('✅ getCurrentUser - Full response structure');
      userData = response.data.user;
    }
    // Fallback: Response data contains user directly
    else if (response && response.success && response.data && response.data.id) {
      console.log('✅ getCurrentUser - Response data is user object');
      userData = response.data;
    }
    
    if (!userData) {
      console.error('❌ getCurrentUser - No valid user data found in response:', response);
      console.error('❌ getCurrentUser - Response structure analysis:');
      if (response) {
        console.error('  - Response type:', typeof response);
        console.error('  - Response keys:', Object.keys(response));
        console.error('  - Has user property:', 'user' in response);
        console.error('  - Has id property:', 'id' in response);
        console.error('  - Has email property:', 'email' in response);
        console.error('  - Has success property:', 'success' in response);
        console.error('  - Has data property:', 'data' in response);
        
        if (response.user) {
          console.error('  - user type:', typeof response.user);
          console.error('  - user keys:', Object.keys(response.user));
        }
      }
      throw new Error('Invalid user data received from API');
    }
    
    // Validate that we have minimum required user properties
    if (!userData.id) {
      console.error('❌ getCurrentUser - User data missing ID:', userData);
      throw new Error('User data missing required ID field');
    }
    
    if (!userData.email) {
      console.error('❌ getCurrentUser - User data missing email:', userData);
      throw new Error('User data missing required email field');
    }
    
    console.log('✅ getCurrentUser - Successfully parsed user data:', {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role
    });
    
    return userData;
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
    const response = await this.request<any>('GET', '/users');
    
    // Handle the real API response format: { success: true, data: { users: [...], total: number } }
    if (response && response.success && response.data && Array.isArray(response.data.users)) {
      console.log('✅ Real API users response:', response.data.users.length, 'users loaded');
      return response.data.users;
    }
    
    // Handle direct array response (fallback)
    if (Array.isArray(response)) {
      return response;
    }
    
    // Handle legacy format with users array
    if (response && Array.isArray(response.users)) {
      return response.users;
    }
    
    console.warn('⚠️ Unexpected users API response format:', response);
    return [];
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
  async getInvoices(filters?: { clientId?: string; status?: string; projectId?: string; dateFrom?: string; dateTo?: string; limit?: number; offset?: number; sortBy?: string; sortOrder?: string }): Promise<Invoice[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const queryString = params.toString();
    const response = await this.request<any>('GET', `/invoices${queryString ? `?${queryString}` : ''}`);
    
    // Handle the real API response format: { success: true, data: { items: [...], pagination: {...} } }
    if (response && response.success && response.data && Array.isArray(response.data.items)) {
      console.log('✅ Real API invoices response:', response.data.items.length, 'invoices loaded');
      return response.data.items;
    }
    
    // Handle direct array response (fallback)
    if (Array.isArray(response)) {
      return response;
    }
    
    // Handle legacy format with invoices array
    if (response && Array.isArray(response.invoices)) {
      return response.invoices;
    }
    
    console.warn('⚠️ Unexpected invoices API response format:', response);
    return [];
  }

  async createInvoice(invoice: {
    clientId: string;
    projectIds?: string[];
    timeEntryIds?: string[];
    issueDate?: string;
    dueDate?: string;
    paymentTerms?: string;
    currency?: string;
    taxRate?: number;
    discountRate?: number;
    additionalLineItems?: Array<{
      type: 'time' | 'expense' | 'fixed' | 'discount';
      description: string;
      quantity: number;
      rate: number;
      amount: number;
      taxable: boolean;
    }>;
    notes?: string;
    clientNotes?: string;
    isRecurring?: boolean;
    recurringConfig?: {
      frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
      interval: number;
      startDate: string;
      endDate?: string;
      maxInvoices?: number;
      autoSend?: boolean;
      generateDaysBefore?: number;
    };
  }): Promise<Invoice> {
    const response = await this.request<any>('POST', '/invoices', { body: invoice });
    
    // Handle the real API response format: { success: true, data: {...} }
    if (response && response.success && response.data) {
      console.log('✅ Invoice created successfully:', response.data.invoiceNumber);
      return response.data;
    }
    
    // Handle direct invoice object response (fallback)
    if (response && response.id) {
      return response;
    }
    
    console.warn('⚠️ Unexpected create invoice API response format:', response);
    throw new Error('Invalid invoice data received from API');
  }

  async updateInvoice(id: string, updates: {
    dueDate?: string;
    paymentTerms?: string;
    taxRate?: number;
    discountRate?: number;
    lineItems?: Array<{
      id?: string;
      type: 'time' | 'expense' | 'fixed' | 'discount';
      description: string;
      quantity: number;
      rate: number;
      amount: number;
      taxable: boolean;
    }>;
    notes?: string;
    clientNotes?: string;
    customFields?: Record<string, any>;
  }): Promise<Invoice> {
    const response = await this.request<any>('PUT', `/invoices/${id}`, { body: updates });
    
    // Handle the real API response format: { success: true, data: {...} }
    if (response && response.success && response.data) {
      console.log('✅ Invoice updated successfully:', response.data.invoiceNumber);
      return response.data;
    }
    
    // Handle direct invoice object response (fallback)
    if (response && response.id) {
      return response;
    }
    
    console.warn('⚠️ Unexpected update invoice API response format:', response);
    throw new Error('Invalid invoice data received from API');
  }

  async sendInvoice(id: string, options?: {
    recipientEmails?: string[];
    subject?: string;
    message?: string;
    attachPdf?: boolean;
    sendCopy?: boolean;
    scheduleDate?: string;
  }): Promise<void> {
    const response = await this.request<any>('POST', `/invoices/${id}/send`, { body: options || {} });
    
    // Handle the real API response format
    if (response && response.success) {
      console.log('✅ Invoice sent successfully');
      return;
    }
    
    console.warn('⚠️ Unexpected send invoice API response format:', response);
    throw new Error('Failed to send invoice');
  }

  async updateInvoiceStatus(id: string, status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled' | 'refunded', paymentData?: {
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    reference: string;
    notes?: string;
    externalPaymentId?: string;
    processorFee?: number;
  }): Promise<Invoice> {
    const requestBody: any = { status };
    if (paymentData) {
      requestBody.paymentData = paymentData;
    }
    
    const response = await this.request<any>('PUT', `/invoices/${id}/status`, { body: requestBody });
    
    // Handle the real API response format: { success: true, data: {...} }
    if (response && response.success && response.data) {
      console.log('✅ Invoice status updated successfully:', status);
      return response.data;
    }
    
    // Handle direct invoice object response (fallback)
    if (response && response.id) {
      return response;
    }
    
    console.warn('⚠️ Unexpected update invoice status API response format:', response);
    throw new Error('Invalid invoice data received from API');
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
      // 2. Paginated format: { items: UserInvitation[], pagination: {...} }
      let invitations: UserInvitation[];
      
      if (Array.isArray(response)) {
        // Direct array response
        invitations = response;
        console.log('📋 API Client - Direct array format detected');
      } else if (response && Array.isArray(response.items)) {
        // Paginated format: { items: UserInvitation[], pagination: {...} }
        invitations = response.items;
        console.log('📋 API Client - Paginated format detected (items array)');
        console.log('📋 API Client - Pagination info:', response.pagination);
      } else if (response && Array.isArray(response.invitations)) {
        // Alternative format: { invitations: UserInvitation[], pagination: {...} }
        invitations = response.invitations;
        console.log('📋 API Client - Alternative format detected (invitations array)');
        console.log('📋 API Client - Pagination info:', response.pagination);
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

  // Daily/Weekly Time Tracking API
  async getDailySummary(filters: {
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    userId?: string;
    includeGaps?: boolean;
    targetHours?: number;
  }): Promise<DailySummaryResponse> {
    const params = new URLSearchParams();
    params.append('startDate', filters.startDate);
    params.append('endDate', filters.endDate);
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.includeGaps !== undefined) params.append('includeGaps', filters.includeGaps.toString());
    if (filters.targetHours) params.append('targetHours', filters.targetHours.toString());

    console.log('📅 API Client - Fetching daily summary:', filters);
    return this.request<DailySummaryResponse>('GET', `/time-entries/daily-summary?${params.toString()}`);
  }

  async getWeeklyOverview(filters: {
    weekStartDate: string; // YYYY-MM-DD (must be Monday)
    userId?: string;
    includeComparison?: boolean;
  }): Promise<WeeklyOverview> {
    const params = new URLSearchParams();
    params.append('weekStartDate', filters.weekStartDate);
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.includeComparison !== undefined) params.append('includeComparison', filters.includeComparison.toString());

    console.log('📊 API Client - Fetching weekly overview:', filters);
    return this.request<WeeklyOverview>('GET', `/time-entries/weekly-overview?${params.toString()}`);
  }

  async getUserWorkSchedule(userId?: string): Promise<UserWorkSchedule> {
    const path = userId ? `/users/${userId}/work-schedule` : '/users/work-schedule';
    console.log('⏰ API Client - Fetching work schedule for:', userId || 'current user');
    return this.request<UserWorkSchedule>('GET', path);
  }

  async updateUserWorkSchedule(schedule: Partial<UserWorkSchedule>, userId?: string): Promise<UserWorkSchedule> {
    const path = userId ? `/users/${userId}/work-schedule` : '/users/work-schedule';
    console.log('⏰ API Client - Updating work schedule for:', userId || 'current user', schedule);
    return this.request<UserWorkSchedule>('PUT', path, { body: schedule });
  }

  async createQuickTimeEntry(entry: QuickTimeEntryRequest): Promise<TimeEntry> {
    return this.request<TimeEntry>('POST', '/time-entries/quick-add', { body: entry });
  }

  // Health Check API
  async checkAPIHealth(useBackup: boolean = false): Promise<HealthCheckResponse> {
    return healthCheckService.checkAPIHealth(useBackup);
  }

  async testAPIConnectivity(): Promise<{
    primary: APIConnectionStatus;
    backup: APIConnectionStatus;
    recommendedEndpoint: string;
  }> {
    return healthCheckService.testConnectivity();
  }
}

export const apiClient = new AerotageApiClient(); 