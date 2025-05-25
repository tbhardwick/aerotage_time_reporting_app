import { fetchAuthSession } from 'aws-amplify/auth';
import { 
  UserProfile, 
  UserPreferences, 
  UpdateUserProfileRequest, 
  UpdateUserPreferencesRequest,
  ApiError,
  ChangePasswordRequest,
  UserSecuritySettings,
  UpdateUserSecuritySettingsRequest,
  UserSession,
} from '../types/user-profile-api';
import { authErrorHandler } from './authErrorHandler';
import { decodeJWTPayload } from '../utils/jwt';

const API_BASE_URL = 'https://0z6kxagbh2.execute-api.us-east-1.amazonaws.com/dev';

class ProfileApiService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    try {
      console.log('🔐 Getting auth session...');
      const session = await fetchAuthSession({ forceRefresh: false });
      console.log('📧 Session received:', { 
        hasTokens: !!session.tokens,
        hasIdToken: !!session.tokens?.idToken 
      });
      
      const token = session.tokens?.idToken?.toString();
      
      if (!token) {
        console.error('❌ No authentication token found in session');
        throw new Error('No authentication token available');
      }

      // Session validation will be handled by backend
      const storedSessionId = localStorage.getItem('currentSessionId');
      if (storedSessionId) {
        console.log('🔍 Current session ID:', storedSessionId.substring(0, 8) + '...');
      }

      console.log('✅ Token retrieved successfully, length:', token.length);
      
      // Debug: Decode token to see what user ID it contains
      const tokenPayload = decodeJWTPayload(token);
      if (tokenPayload) {
        console.log('🔍 Token contains user ID:', tokenPayload.sub);
        console.log('🔍 Token email:', tokenPayload.email);
      }
      
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };
    } catch (error) {
      console.error('❌ Failed to get auth headers:', error);
      
      // Check for session validation errors
      if (this.isSessionValidationError(error)) {
        console.log('🔍 ProfileAPI: Auth headers failed due to session validation, triggering logout');
        
        const sessionError = { 
          code: 'SESSION_VALIDATION_FAILED', 
          statusCode: 403, 
          shouldLogout: true, 
          message: 'Your session is no longer valid. Please sign in again.' 
        };
        
        // Handle session validation error automatically (non-blocking)
        authErrorHandler.handleAuthError(sessionError).catch(console.error);
      }
      
      throw new Error('Authentication required. Please sign in again.');
    }
  }

  private async handleApiResponse<T>(response: Response): Promise<T> {
    const data = await response.json();
    console.log('🔍 handleApiResponse - Response status:', response.status);
    console.log('🔍 handleApiResponse - Response data:', data);
    
    if (!response.ok) {
      // Handle enhanced backend session validation errors
      if (response.status === 401) {
        const sessionError = new Error('Authentication token is invalid or expired. Please sign in again.');
        (sessionError as any).code = 'AUTHENTICATION_FAILED';
        (sessionError as any).statusCode = 401;
        (sessionError as any).shouldLogout = true;
        
        // Handle authentication error automatically
        await authErrorHandler.handleAuthError(sessionError);
        throw sessionError;
      } else if (response.status === 403) {
        // Check if this is a session validation error
        const errorMessage = data.error?.message || data.message || '';
        
        // Only trigger logout for session-related 403 errors
        if (errorMessage.includes('No active sessions') || 
            errorMessage.includes('session has been terminated') ||
            errorMessage.includes('Authentication required')) {
          const sessionError = new Error('Your session has been terminated. Please sign in again.');
          (sessionError as any).code = 'SESSION_TERMINATED';
          (sessionError as any).statusCode = 403;
          (sessionError as any).shouldLogout = true;
          
          // Handle session termination error automatically
          await authErrorHandler.handleAuthError(sessionError);
          throw sessionError;
        }
        
        // For user permission errors (like "You can only access your own preferences"),
        // don't trigger logout - just let it fall through to normal API error handling
        console.log('🔍 403 error is a permission error, not a session error:', errorMessage);
      }

      const apiError: ApiError = {
        code: data.error?.code || 'UNKNOWN_ERROR',
        message: data.error?.message || `HTTP ${response.status}: ${response.statusText}`,
        details: data.error?.details
      };
      throw apiError;
    }

    if (!data.success) {
      const apiError: ApiError = {
        code: data.error?.code || 'API_ERROR',
        message: data.error?.message || 'API request failed',
        details: data.error?.details
      };
      throw apiError;
    }

    return data.data;
  }

  /**
   * Enhanced error detection for session validation issues
   * Handles cases where CORS/network errors indicate authorization rejection
   */
  private isSessionValidationError(error: any): boolean {
    const errorMessage = error?.message || '';
    
    // Network errors when backend is rejecting authorization
    if (errorMessage.includes('NetworkError') || 
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('TypeError: Failed to fetch')) {
      return true;
    }
    
    // CORS errors often indicate authorization rejection
    if (errorMessage.includes('CORS') || 
        errorMessage.includes('Access-Control-Allow-Origin') ||
        errorMessage.includes('has been blocked by CORS policy')) {
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

  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      console.log('👤 Fetching user profile for ID:', userId);
      const headers = await this.getAuthHeaders();
      const url = `${API_BASE_URL}/users/${userId}/profile`;
      console.log('🔗 Making request to:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      console.log('📡 Response status:', response.status, response.statusText);
      const result = await this.handleApiResponse<UserProfile>(response);
      console.log('✅ Profile fetched successfully:', { id: result.id, name: result.name, email: result.email });
      return result;
    } catch (error) {
      console.error('❌ Failed to fetch user profile:', error);
      
      // Check for session validation errors (including CORS/network errors)
      if (this.isSessionValidationError(error)) {
        console.log('🔍 ProfileAPI: Detected session validation error, triggering automatic logout');
        
        const sessionError = { 
          code: 'SESSION_VALIDATION_FAILED', 
          statusCode: 403, 
          shouldLogout: true, 
          message: 'Your session is no longer valid. Please sign in again.' 
        };
        
        // Handle session validation error automatically
        await authErrorHandler.handleAuthError(sessionError);
        throw new Error('Your session is no longer valid. Please sign in again.');
      }
      
      if (error instanceof Error && error.message.includes('Authentication')) {
        throw error;
      }
      throw new Error('Failed to load profile. Please try again.');
    }
  }

  async updateUserProfile(userId: string, updates: UpdateUserProfileRequest): Promise<UserProfile> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/users/${userId}/profile`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });

      return await this.handleApiResponse<UserProfile>(response);
    } catch (error) {
      console.error('Failed to update user profile:', error);
      
      // Handle specific error cases
      if (error && typeof error === 'object' && 'code' in error) {
        const apiError = error as ApiError;
        switch (apiError.code) {
          case 'UNAUTHORIZED_PROFILE_ACCESS':
            throw new Error('You do not have permission to update this profile.');
          case 'INVALID_PROFILE_DATA':
            throw new Error(`Invalid data: ${apiError.message}`);
          case 'PROFILE_NOT_FOUND':
            throw new Error('Profile not found.');
          default:
            throw new Error(apiError.message || 'Failed to update profile.');
        }
      }
      
      if (error instanceof Error && error.message.includes('Authentication')) {
        throw error;
      }
      throw new Error('Failed to update profile. Please try again.');
    }
  }

  async getUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      console.log('⚙️ Fetching user preferences for ID:', userId);
      const headers = await this.getAuthHeaders();
      const url = `${API_BASE_URL}/users/${userId}/preferences`;
      console.log('🔗 Making request to:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      console.log('📡 Response status:', response.status, response.statusText);
      const result = await this.handleApiResponse<UserPreferences>(response);
      console.log('✅ Preferences fetched successfully:', { theme: result.theme, timezone: result.timezone });
      return result;
    } catch (error) {
      console.error('❌ Failed to fetch user preferences:', error);
      console.log('🔍 Error type:', typeof error);
      console.log('🔍 Error structure:', error);
      
      // Handle specific error cases
      if (error && typeof error === 'object' && 'code' in error) {
        const apiError = error as ApiError;
        console.log('🔍 API Error code:', apiError.code);
        console.log('🔍 API Error message:', apiError.message);
        
        switch (apiError.code) {
          case 'UNAUTHORIZED_PROFILE_ACCESS':
            console.log('🔍 Handling UNAUTHORIZED_PROFILE_ACCESS - not triggering logout');
            throw new Error('You do not have permission to access these preferences. Please contact your administrator.');
          default:
            throw new Error(apiError.message || 'Failed to load preferences.');
        }
      }
      
      if (error instanceof Error && error.message.includes('Authentication')) {
        throw error;
      }
      throw new Error('Failed to load preferences. Please try again.');
    }
  }

  async updateUserPreferences(userId: string, updates: UpdateUserPreferencesRequest): Promise<UserPreferences> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/users/${userId}/preferences`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });

      return await this.handleApiResponse<UserPreferences>(response);
    } catch (error) {
      console.error('Failed to update user preferences:', error);
      
      // Handle specific error cases
      if (error && typeof error === 'object' && 'code' in error) {
        const apiError = error as ApiError;
        switch (apiError.code) {
          case 'INVALID_TIMEZONE':
            throw new Error('Invalid timezone selected. Please choose a valid timezone.');
          case 'INVALID_CURRENCY':
            throw new Error('Invalid currency selected. Please choose a valid currency.');
          case 'INVALID_TIME_FORMAT':
            throw new Error('Invalid time format selected.');
          default:
            throw new Error(apiError.message || 'Failed to update preferences.');
        }
      }
      
      if (error instanceof Error && error.message.includes('Authentication')) {
        throw error;
      }
      throw new Error('Failed to update preferences. Please try again.');
    }
  }

  // Phase 2 Security Methods

  async changePassword(userId: string, request: ChangePasswordRequest): Promise<{ message: string }> {
    try {
      console.log('🔒 Changing password for user ID:', userId);
      const headers = await this.getAuthHeaders();
      const url = `${API_BASE_URL}/users/${userId}/password`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(request),
      });

      const result = await this.handleApiResponse<{ message: string }>(response);
      console.log('✅ Password changed successfully');
      return result;
    } catch (error) {
      console.error('❌ Failed to change password:', error);
      
      // Handle specific error cases
      if (error && typeof error === 'object' && 'code' in error) {
        const apiError = error as ApiError;
        switch (apiError.code) {
          case 'INVALID_CURRENT_PASSWORD':
            throw new Error('Current password is incorrect.');
          case 'PASSWORD_POLICY_VIOLATION':
            throw new Error('New password does not meet security requirements.');
          case 'PASSWORD_RECENTLY_USED':
            throw new Error('This password was recently used. Please choose a different password.');
          case 'ACCOUNT_LOCKED':
            throw new Error('Account is temporarily locked due to failed login attempts.');
          default:
            throw new Error(apiError.message || 'Failed to change password.');
        }
      }
      
      if (error instanceof Error && error.message.includes('Authentication')) {
        throw error;
      }
      throw new Error('Failed to change password. Please try again.');
    }
  }

  async getSecuritySettings(userId: string): Promise<UserSecuritySettings> {
    try {
      console.log('🛡️ Fetching security settings for user ID:', userId);
      const headers = await this.getAuthHeaders();
      const url = `${API_BASE_URL}/users/${userId}/security-settings`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      const result = await this.handleApiResponse<UserSecuritySettings>(response);
      console.log('✅ Security settings fetched successfully');
      return result;
    } catch (error) {
      console.error('❌ Failed to fetch security settings:', error);
      if (error instanceof Error && error.message.includes('Authentication')) {
        throw error;
      }
      throw new Error('Failed to load security settings. Please try again.');
    }
  }

  async updateSecuritySettings(userId: string, updates: UpdateUserSecuritySettingsRequest): Promise<UserSecuritySettings> {
    try {
      console.log('🛡️ Updating security settings for user ID:', userId);
      const headers = await this.getAuthHeaders();
      const url = `${API_BASE_URL}/users/${userId}/security-settings`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });

      const result = await this.handleApiResponse<UserSecuritySettings>(response);
      console.log('✅ Security settings updated successfully');
      return result;
    } catch (error) {
      console.error('❌ Failed to update security settings:', error);
      
      // Handle specific error cases
      if (error && typeof error === 'object' && 'code' in error) {
        const apiError = error as ApiError;
        switch (apiError.code) {
          case 'INVALID_SESSION_TIMEOUT':
            throw new Error('Invalid session timeout value. Must be between 15 minutes and 30 days.');
          case 'INVALID_PASSWORD_CHANGE_FREQUENCY':
            throw new Error('Invalid password change frequency. Must be between 0 and 365 days.');
          default:
            throw new Error(apiError.message || 'Failed to update security settings.');
        }
      }
      
      if (error instanceof Error && error.message.includes('Authentication')) {
        throw error;
      }
      throw new Error('Failed to update security settings. Please try again.');
    }
  }

  async getUserSessions(userId: string): Promise<UserSession[]> {
    try {
      console.log('📱 Fetching user sessions for user ID:', userId);
      const headers = await this.getAuthHeaders();
      const url = `${API_BASE_URL}/users/${userId}/sessions`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      const result = await this.handleApiResponse<UserSession[]>(response);
      console.log('✅ User sessions fetched successfully, count:', result.length);
      return result;
    } catch (error) {
      console.error('❌ Failed to fetch user sessions:', error);
      if (error instanceof Error && error.message.includes('Authentication')) {
        throw error;
      }
      throw new Error('Failed to load user sessions. Please try again.');
    }
  }

  async terminateSession(userId: string, sessionId: string): Promise<{ message: string }> {
    try {
      console.log('🚫 Terminating session:', sessionId, 'for user ID:', userId);
      const headers = await this.getAuthHeaders();
      const url = `${API_BASE_URL}/users/${userId}/sessions/${sessionId}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers,
      });

      const result = await this.handleApiResponse<{ message: string }>(response);
      console.log('✅ Session terminated successfully');
      return result;
    } catch (error) {
      console.error('❌ Failed to terminate session:', error);
      
      // Handle specific error cases
      if (error && typeof error === 'object' && 'code' in error) {
        const apiError = error as ApiError;
        switch (apiError.code) {
          case 'SESSION_NOT_FOUND':
            throw new Error('Session not found or already terminated.');
          case 'CANNOT_TERMINATE_CURRENT_SESSION':
            throw new Error('Cannot terminate your current session.');
          default:
            throw new Error(apiError.message || 'Failed to terminate session.');
        }
      }
      
      if (error instanceof Error && error.message.includes('Authentication')) {
        throw error;
      }
      throw new Error('Failed to terminate session. Please try again.');
    }
  }

  async createSession(userId: string, sessionData?: {
    userAgent?: string;
    loginTime?: string;
    ipAddress?: string;
  }): Promise<UserSession> {
    try {
      console.log('🆕 Creating session record for user:', userId);
      const headers = await this.getAuthHeaders();
      const url = `${API_BASE_URL}/users/${userId}/sessions`;
      
      // Prepare session data according to the integration guide
      const body = {
        userAgent: sessionData?.userAgent || navigator.userAgent,
        loginTime: sessionData?.loginTime || new Date().toISOString(),
        ...(sessionData?.ipAddress && { ipAddress: sessionData.ipAddress })
        // Note: ipAddress is optional - backend will auto-detect if not provided
      };
      
      console.log('📤 Session data being sent:', body);
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();
      
      if (!data.success) {
        console.error('❌ Session creation failed:', data.error);
        throw new Error(data.error?.message || 'Failed to create session');
      }
      
      const result = data.data;
      console.log('✅ Session record created successfully:', result.id);
      return result;
    } catch (error) {
      console.error('❌ Failed to create session:', error);
      
      // Handle specific error cases from the integration guide
      if (error && typeof error === 'object' && 'code' in error) {
        const apiError = error as ApiError;
        switch (apiError.code) {
          case 'INVALID_PROFILE_DATA':
            throw new Error('Invalid session data provided.');
          case 'UNAUTHORIZED_PROFILE_ACCESS':
            throw new Error('You can only create sessions for yourself.');
          case 'UNAUTHORIZED_SESSION_ACCESS':
            throw new Error('You do not have permission to create sessions.');
          case 'SESSION_LIMIT_EXCEEDED':
            throw new Error('Maximum number of sessions reached. Please terminate some sessions.');
          default:
            throw new Error(apiError.message || 'Failed to create session.');
        }
      }
      
      if (error instanceof Error && error.message.includes('Authentication')) {
        throw error;
      }
      throw new Error('Failed to create session. Please try again.');
    }
  }
}

export const profileApi = new ProfileApiService(); 