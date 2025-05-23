// User and Authentication Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  hourlyRate?: number;
  teamId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
}

// Client and Project Types
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

export interface Project {
  id: string;
  clientId: string;
  name: string;
  description?: string;
  budget?: {
    hours?: number;
    amount?: number;
  };
  hourlyRate?: number;
  status: 'active' | 'inactive' | 'completed';
  createdAt: string;
  updatedAt: string;
  // Populated fields
  client?: Client;
}

// Time Tracking Types
export interface TimeEntry {
  id: string;
  userId: string;
  projectId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  duration: number; // in minutes
  description: string;
  isBillable: boolean;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  // Populated fields
  user?: User;
  project?: Project;
}

export interface TimerState {
  isRunning: boolean;
  startTime: string | null;
  pausedDuration: number;
  currentProjectId: string | null;
  currentDescription: string;
}

// Team Types
export interface Team {
  id: string;
  name: string;
  managerId: string;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
  // Populated fields
  manager?: User;
  members?: User[];
}

// Invoice Types
export interface Invoice {
  id: string;
  clientId: string;
  projectIds: string[];
  timeEntryIds: string[];
  invoiceNumber: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: string;
  sentDate?: string;
  paidDate?: string;
  createdAt: string;
  updatedAt: string;
  // Populated fields
  client?: Client;
  projects?: Project[];
  timeEntries?: TimeEntry[];
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface TimeEntryForm {
  projectId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  description: string;
  isBillable: boolean;
}

export interface ProjectForm {
  clientId: string;
  name: string;
  description?: string;
  budget?: {
    hours?: number;
    amount?: number;
  };
  hourlyRate?: number;
  status: 'active' | 'inactive' | 'completed';
}

export interface ClientForm {
  name: string;
  contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
  };
  billingAddress?: string;
}

// Report Types
export interface TimeReport {
  userId?: string;
  projectId?: string;
  clientId?: string;
  startDate: string;
  endDate: string;
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  entries: TimeEntry[];
}

export interface ProjectReport {
  project: Project;
  totalHours: number;
  billableHours: number;
  totalAmount: number;
  budgetUsed?: {
    hours?: number;
    amount?: number;
  };
}

// UI State Types
export interface LoadingState {
  [key: string]: boolean;
}

export interface ErrorState {
  [key: string]: string | null;
}

// Filter and Sort Types
export interface TimeEntryFilters {
  userId?: string;
  projectId?: string;
  clientId?: string;
  startDate?: string;
  endDate?: string;
  status?: TimeEntry['status'];
  isBillable?: boolean;
}

export interface ProjectFilters {
  clientId?: string;
  status?: Project['status'];
  search?: string;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  createdAt: string;
} 