// User Profile API Types - Phase 1
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  jobTitle?: string;
  department?: string;
  hourlyRate?: number;
  role: 'admin' | 'manager' | 'employee';
  contactInfo?: {
    phone?: string;
    address?: string;
    emergencyContact?: string;
  };
  profilePicture?: string;
  startDate: string;
  lastLogin?: string;
  isActive: boolean;
  teamId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: boolean;
  timezone: string;
  timeTracking: {
    defaultTimeEntryDuration: number;
    autoStartTimer: boolean;
    showTimerInMenuBar: boolean;
    defaultBillableStatus: boolean;
    reminderInterval: number;
    workingHours: {
      start: string;
      end: string;
    };
    timeGoals: {
      daily: number;
      weekly: number;
      notifications: boolean;
    };
  };
  formatting: {
    currency: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
  };
  updatedAt: string;
}

export interface UpdateUserProfileRequest {
  name?: string;
  jobTitle?: string;
  department?: string;
  hourlyRate?: number;
  contactInfo?: {
    phone?: string;
    address?: string;
    emergencyContact?: string;
  };
}

export interface UpdateUserPreferencesRequest {
  theme?: 'light' | 'dark';
  notifications?: boolean;
  timezone?: string;
  timeTracking?: {
    defaultTimeEntryDuration?: number;
    autoStartTimer?: boolean;
    showTimerInMenuBar?: boolean;
    defaultBillableStatus?: boolean;
    reminderInterval?: number;
    workingHours?: {
      start?: string;
      end?: string;
    };
    timeGoals?: {
      daily?: number;
      weekly?: number;
      notifications?: boolean;
    };
  };
  formatting?: {
    currency?: string;
    dateFormat?: string;
    timeFormat?: '12h' | '24h';
  };
}

// Phase 2 Security Types
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UserSecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number; // minutes
  allowMultipleSessions: boolean;
  passwordChangeRequired: boolean;
  passwordLastChanged: string; // ISO datetime
  passwordExpiresAt?: string; // ISO datetime
  securitySettings: {
    requirePasswordChangeEvery: number; // days
    maxFailedLoginAttempts: number;
    accountLockoutDuration: number; // minutes
  };
}

export interface UpdateUserSecuritySettingsRequest {
  sessionTimeout?: number;
  allowMultipleSessions?: boolean;
  requirePasswordChangeEvery?: number;
}

export interface UserSession {
  id: string;
  ipAddress: string;
  userAgent: string;
  loginTime: string;
  lastActivity: string;
  isCurrent: boolean;
  location?: {
    city: string;
    country: string;
  };
}

export interface CreateSessionRequest {
  userAgent: string;
  loginTime?: string;
  ipAddress?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp?: string;
}

export type UserProfileResponse = ApiResponse<UserProfile>;
export type UserPreferencesResponse = ApiResponse<UserPreferences>;
export type UserSecuritySettingsResponse = ApiResponse<UserSecuritySettings>;
export type UserSessionsResponse = ApiResponse<UserSession[]>;
export type CreateSessionResponse = ApiResponse<UserSession>;

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
  timestamp: string;
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
} 