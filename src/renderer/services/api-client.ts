import { get, post, put, del } from 'aws-amplify/api';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

export interface TimeEntry {
  id: string;
  projectId: string;
  date: string;
  duration: number;
  description: string;
  isBillable: boolean;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  createdAt: string;
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

      let response;
      switch (method) {
        case 'GET':
          response = await get({ apiName: this.apiName, path, options: { headers, ...options } });
          break;
        case 'POST':
          response = await post({ apiName: this.apiName, path, options: { headers, body: options.body, ...options } });
          break;
        case 'PUT':
          response = await put({ apiName: this.apiName, path, options: { headers, body: options.body, ...options } });
          break;
        case 'DELETE':
          response = await del({ apiName: this.apiName, path, options: { headers, ...options } });
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      return response.response as T;
    } catch (error) {
      console.error(`API Error (${method} ${path}):`, error);
      throw error;
    }
  }

  // Authentication methods
  async getCurrentUser(): Promise<User> {
    const cognitoUser = await getCurrentUser();
    return this.request<User>('GET', `/users/${cognitoUser.userId}`);
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
}

export const apiClient = new AerotageApiClient(); 