import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types
export interface TimeEntry {
  id: string;
  projectId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  duration: number; // in minutes
  description: string;
  isBillable: boolean;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  createdAt: string;
  // Approval workflow fields
  submittedAt?: string;
  submittedBy?: string;
  approverId?: string;
  approvedAt?: string;
  rejectedAt?: string;
  comment?: string; // Approval/rejection comment
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
  isActive: boolean; // For backward compatibility
  createdAt: string;
  updatedAt: string;
  // Populated fields
  client?: Client;
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
    features: string[]; // e.g., ['timeTracking', 'approvals', 'reporting', 'invoicing', 'userManagement']
    projects: string[]; // Project IDs user has access to
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

export interface Team {
  id: string;
  name: string;
  description?: string;
  managerId: string;
  memberIds: string[];
  department?: string;
  parentTeamId?: string; // For hierarchical team structure
  permissions: {
    defaultRole: 'manager' | 'employee';
    projectAccess: string[]; // Project IDs this team has access to
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface TimerState {
  isRunning: boolean;
  startTime: string | null;
  currentProjectId: string | null;
  currentDescription: string;
  elapsedTime: number;
}

// Invoice Types
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
  // Populated fields
  client?: Client;
  projects?: Project[];
  timeEntries?: TimeEntry[];
}

export interface AppState {
  timeEntries: TimeEntry[];
  projects: Project[];
  clients: Client[];
  users: User[];
  teams: Team[];
  invoices: Invoice[];
  userSessions: UserSession[];
  userInvitations: UserInvitation[];
  userActivity: UserActivity[];
  permissions: PermissionMatrix;
  timer: TimerState;
  user: User | null;
  loading: {
    [key: string]: boolean;
  };
  errors: {
    [key: string]: string | null;
  };
}

// Actions
type AppAction =
  // Time Entry Actions
  | { type: 'ADD_TIME_ENTRY'; payload: Omit<TimeEntry, 'id' | 'createdAt'> }
  | { type: 'UPDATE_TIME_ENTRY'; payload: { id: string; updates: Partial<TimeEntry> } }
  | { type: 'DELETE_TIME_ENTRY'; payload: string }
  | { type: 'SET_TIME_ENTRIES'; payload: TimeEntry[] }
  
  // Approval Workflow Actions
  | { type: 'SUBMIT_TIME_ENTRIES'; payload: string[] } // Array of time entry IDs
  | { type: 'APPROVE_TIME_ENTRIES'; payload: { ids: string[]; approverId: string; comment?: string } }
  | { type: 'REJECT_TIME_ENTRIES'; payload: { ids: string[]; approverId: string; comment: string } }
  | { type: 'BULK_UPDATE_TIME_ENTRY_STATUS'; payload: { ids: string[]; status: TimeEntry['status']; userId?: string; comment?: string } }
  
  // Timer Actions
  | { type: 'START_TIMER'; payload: { projectId: string; description: string } }
  | { type: 'STOP_TIMER' }
  | { type: 'UPDATE_TIMER_TIME'; payload: number }
  
  // Project Actions
  | { type: 'ADD_PROJECT'; payload: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_PROJECT'; payload: { id: string; updates: Partial<Project> } }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'SET_PROJECTS'; payload: Project[] }
  
  // Client Actions
  | { type: 'ADD_CLIENT'; payload: Omit<Client, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_CLIENT'; payload: { id: string; updates: Partial<Client> } }
  | { type: 'DELETE_CLIENT'; payload: string }
  | { type: 'SET_CLIENTS'; payload: Client[] }
  
  // User Actions
  | { type: 'SET_USER'; payload: AppState['user'] }
  | { type: 'ADD_USER'; payload: Omit<User, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_USER'; payload: { id: string; updates: Partial<User> } }
  | { type: 'DELETE_USER'; payload: string }
  | { type: 'SET_USERS'; payload: User[] }
  
  // Team Actions
  | { type: 'ADD_TEAM'; payload: Omit<Team, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_TEAM'; payload: { id: string; updates: Partial<Team> } }
  | { type: 'DELETE_TEAM'; payload: string }
  | { type: 'SET_TEAMS'; payload: Team[] }
  
  // User Invitation Actions
  | { type: 'SET_USER_INVITATIONS'; payload: UserInvitation[] }
  | { type: 'ADD_USER_INVITATION'; payload: UserInvitation }
  | { type: 'UPDATE_USER_INVITATION'; payload: { id: string; updates: Partial<UserInvitation> } }
  | { type: 'DELETE_USER_INVITATION'; payload: string }
  | { type: 'RESEND_USER_INVITATION'; payload: { id: string; extendExpiration?: boolean; personalMessage?: string } }
  
  // Invoice Actions
  | { type: 'ADD_INVOICE'; payload: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_INVOICE'; payload: { id: string; updates: Partial<Invoice> } }
  | { type: 'DELETE_INVOICE'; payload: string }
  | { type: 'SET_INVOICES'; payload: Invoice[] }
  | { type: 'GENERATE_INVOICE'; payload: { clientId: string; timeEntryIds: string[]; projectIds: string[]; dueDate: string; notes?: string } }
  
  // UI State Actions
  | { type: 'SET_LOADING'; payload: { key: string; loading: boolean } }
  | { type: 'SET_ERROR'; payload: { key: string; error: string | null } };

// Initial state - now clean with no mock data
const initialState: AppState = {
  timeEntries: [],
  clients: [],
  projects: [],
  users: [],
  teams: [],
  invoices: [],
  timer: {
    isRunning: false,
    startTime: null,
    currentProjectId: null,
    currentDescription: '',
    elapsedTime: 0,
  },
  user: null, // Will be set after authentication
  userSessions: [],
  userInvitations: [],
  userActivity: [],
  permissions: {
    roles: {
      admin: {
        features: ['timeTracking', 'approvals', 'reporting', 'invoicing', 'userManagement', 'projectManagement', 'clientManagement'],
        permissions: {
          canCreateUsers: true,
          canEditUsers: true,
          canDeleteUsers: true,
          canViewAllReports: true,
        }
      },
      manager: {
        features: ['timeTracking', 'approvals', 'reporting', 'projectManagement'],
        permissions: {
          canCreateUsers: false,
          canEditUsers: false,
          canDeleteUsers: false,
          canViewAllReports: false,
        }
      },
      employee: {
        features: ['timeTracking'],
        permissions: {
          canCreateUsers: false,
          canEditUsers: false,
          canDeleteUsers: false,
          canViewAllReports: false,
        }
      }
    },
    features: {
      timeTracking: true,
      approvals: true,
      reporting: true,
      invoicing: true,
      userManagement: true,
      projectManagement: true,
      clientManagement: true,
    }
  },
  loading: {},
  errors: {},
};

// Helper function to populate project with client data
const populateProjectWithClient = (project: Project, clients: Client[]): Project => {
  const client = clients.find(c => c.id === project.clientId);
  return { ...project, client };
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    // Time Entry Actions
    case 'ADD_TIME_ENTRY':
      return {
        ...state,
        timeEntries: [
          ...state.timeEntries,
          {
            ...action.payload,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
          },
        ],
      };

    case 'UPDATE_TIME_ENTRY':
      return {
        ...state,
        timeEntries: state.timeEntries.map(entry =>
          entry.id === action.payload.id
            ? { ...entry, ...action.payload.updates }
            : entry
        ),
      };

    case 'DELETE_TIME_ENTRY':
      return {
        ...state,
        timeEntries: state.timeEntries.filter(entry => entry.id !== action.payload),
      };

    case 'SET_TIME_ENTRIES':
      return {
        ...state,
        timeEntries: Array.isArray(action.payload) ? action.payload : [],
      };

    // Approval Workflow Actions
    case 'SUBMIT_TIME_ENTRIES':
      return {
        ...state,
        timeEntries: state.timeEntries.map(entry =>
          action.payload.includes(entry.id)
            ? { 
                ...entry, 
                status: 'submitted', 
                submittedAt: new Date().toISOString(),
                submittedBy: state.user?.id 
              }
            : entry
        ),
      };

    case 'APPROVE_TIME_ENTRIES':
      return {
        ...state,
        timeEntries: state.timeEntries.map(entry =>
          action.payload.ids.includes(entry.id)
            ? { 
                ...entry, 
                status: 'approved', 
                approverId: action.payload.approverId, 
                approvedAt: new Date().toISOString(),
                comment: action.payload.comment 
              }
            : entry
        ),
      };

    case 'REJECT_TIME_ENTRIES':
      return {
        ...state,
        timeEntries: state.timeEntries.map(entry =>
          action.payload.ids.includes(entry.id)
            ? { 
                ...entry, 
                status: 'rejected', 
                approverId: action.payload.approverId, 
                rejectedAt: new Date().toISOString(),
                comment: action.payload.comment 
              }
            : entry
        ),
      };

    case 'BULK_UPDATE_TIME_ENTRY_STATUS':
      return {
        ...state,
        timeEntries: state.timeEntries.map(entry =>
          action.payload.ids.includes(entry.id)
            ? { 
                ...entry, 
                status: action.payload.status,
                comment: action.payload.comment,
                ...(action.payload.status === 'submitted' && {
                  submittedAt: new Date().toISOString(),
                  submittedBy: action.payload.userId
                }),
                ...(action.payload.status === 'approved' && {
                  approverId: action.payload.userId,
                  approvedAt: new Date().toISOString()
                }),
                ...(action.payload.status === 'rejected' && {
                  approverId: action.payload.userId,
                  rejectedAt: new Date().toISOString()
                })
              }
            : entry
        ),
      };

    // Timer Actions
    case 'START_TIMER':
      return {
        ...state,
        timer: {
          isRunning: true,
          startTime: new Date().toISOString(),
          currentProjectId: action.payload.projectId,
          currentDescription: action.payload.description,
          elapsedTime: 0,
        },
      };

    case 'STOP_TIMER':
      // Timer stop now only resets timer state
      // Time entry creation is handled via API in the component
      return {
        ...state,
        timer: {
          isRunning: false,
          startTime: null,
          currentProjectId: null,
          currentDescription: '',
          elapsedTime: 0,
        },
      };

    case 'UPDATE_TIMER_TIME':
      return {
        ...state,
        timer: {
          ...state.timer,
          elapsedTime: action.payload,
        },
      };

    // Project Actions
    case 'ADD_PROJECT':
      const newProject = {
        ...action.payload,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return {
        ...state,
        projects: [...state.projects, populateProjectWithClient(newProject, state.clients)],
      };

    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.id
            ? populateProjectWithClient({ ...project, ...action.payload.updates, updatedAt: new Date().toISOString() }, state.clients)
            : project
        ),
      };

    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(project => project.id !== action.payload),
      };

    case 'SET_PROJECTS':
      return {
        ...state,
        projects: Array.isArray(action.payload) 
          ? action.payload.map(project => populateProjectWithClient(project, state.clients))
          : [],
      };

    // Client Actions
    case 'ADD_CLIENT':
      const newClient = {
        ...action.payload,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return {
        ...state,
        clients: [...state.clients, newClient],
        // Re-populate projects with updated client data
        projects: state.projects.map(project => populateProjectWithClient(project, [...state.clients, newClient])),
      };

    case 'UPDATE_CLIENT':
      const updatedClients = state.clients.map(client =>
        client.id === action.payload.id
          ? { ...client, ...action.payload.updates, updatedAt: new Date().toISOString() }
          : client
      );
      return {
        ...state,
        clients: updatedClients,
        // Re-populate projects with updated client data
        projects: state.projects.map(project => populateProjectWithClient(project, updatedClients)),
      };

    case 'DELETE_CLIENT':
      const remainingClients = state.clients.filter(client => client.id !== action.payload);
      return {
        ...state,
        clients: remainingClients,
        // Remove projects associated with deleted client
        projects: state.projects.filter(project => project.clientId !== action.payload),
      };

    case 'SET_CLIENTS':
      const clients = Array.isArray(action.payload) ? action.payload : [];
      return {
        ...state,
        clients,
        // Re-populate projects with updated client data
        projects: state.projects.map(project => populateProjectWithClient(project, clients)),
      };

    // User Actions
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
      };

    case 'ADD_USER':
      return {
        ...state,
        users: [
          ...state.users,
          {
            ...action.payload,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      };

    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map(user =>
          user.id === action.payload.id
            ? { ...user, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : user
        ),
      };

    case 'DELETE_USER':
      return {
        ...state,
        users: state.users.filter(user => user.id !== action.payload),
      };

    case 'SET_USERS':
      return {
        ...state,
        users: Array.isArray(action.payload) ? action.payload : [],
      };

    // Team Actions
    case 'ADD_TEAM':
      return {
        ...state,
        teams: [
          ...state.teams,
          {
            ...action.payload,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      };

    case 'UPDATE_TEAM':
      return {
        ...state,
        teams: state.teams.map(team =>
          team.id === action.payload.id
            ? { ...team, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : team
        ),
      };

    case 'DELETE_TEAM':
      return {
        ...state,
        teams: state.teams.filter(team => team.id !== action.payload),
      };

    case 'SET_TEAMS':
      return {
        ...state,
        teams: Array.isArray(action.payload) ? action.payload : [],
      };

    // User Invitation Actions
    case 'SET_USER_INVITATIONS':
      return {
        ...state,
        userInvitations: Array.isArray(action.payload) ? action.payload : [],
      };

    case 'ADD_USER_INVITATION':
      return {
        ...state,
        userInvitations: [...state.userInvitations, action.payload],
      };

    case 'UPDATE_USER_INVITATION':
      return {
        ...state,
        userInvitations: state.userInvitations.map(invitation =>
          invitation.id === action.payload.id
            ? { ...invitation, ...action.payload.updates }
            : invitation
        ),
      };

    case 'DELETE_USER_INVITATION':
      return {
        ...state,
        userInvitations: state.userInvitations.filter(invitation => invitation.id !== action.payload),
      };

    case 'RESEND_USER_INVITATION':
      return {
        ...state,
        userInvitations: state.userInvitations.map(invitation =>
          invitation.id === action.payload.id
            ? { ...invitation, ...action.payload }
            : invitation
        ),
      };

    // Invoice Actions
    case 'ADD_INVOICE':
      return {
        ...state,
        invoices: [
          ...state.invoices,
          {
            ...action.payload,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      };

    case 'UPDATE_INVOICE':
      return {
        ...state,
        invoices: state.invoices.map(invoice =>
          invoice.id === action.payload.id
            ? { ...invoice, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : invoice
        ),
      };

    case 'DELETE_INVOICE':
      return {
        ...state,
        invoices: state.invoices.filter(invoice => invoice.id !== action.payload),
      };

    case 'SET_INVOICES':
      return {
        ...state,
        invoices: Array.isArray(action.payload) ? action.payload : [],
      };

    case 'GENERATE_INVOICE':
      // Calculate the total amount from time entries
      const relatedTimeEntries = state.timeEntries.filter(entry => 
        action.payload.timeEntryIds.includes(entry.id)
      );
      const totalHours = relatedTimeEntries.reduce((sum, entry) => sum + entry.duration, 0) / 60; // Convert minutes to hours
      const project = state.projects.find(p => action.payload.projectIds.includes(p.id));
      const hourlyRate = project?.hourlyRate || 100;
      const baseAmount = totalHours * hourlyRate;
      const tax = baseAmount * 0.1; // 10% tax
      const totalAmount = baseAmount + tax;
      
      // Generate invoice number
      const invoiceCount = state.invoices.length + 1;
      const year = new Date().getFullYear();
      const invoiceNumber = `INV-${year}-${String(invoiceCount).padStart(3, '0')}`;
      
      const newInvoice: Invoice = {
        id: Date.now().toString(),
        invoiceNumber,
        clientId: action.payload.clientId,
        projectIds: action.payload.projectIds,
        timeEntryIds: action.payload.timeEntryIds,
        amount: baseAmount,
        tax,
        totalAmount,
        status: 'draft',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: action.payload.dueDate,
        notes: action.payload.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      return {
        ...state,
        invoices: [...state.invoices, newInvoice],
      };

    // UI State Actions
    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.loading,
        },
      };

    case 'SET_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.key]: action.payload.error,
        },
      };

    default:
      return state;
  }
}

// Context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

// Provider
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// Hook
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// ✅ NEW - Phase 8 User Management Interfaces

export interface UserSession {
  id: string;
  userId: string;
  loginTime: string;
  lastActivity: string;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  logoutTime?: string;
  securityFlags: {
    mfaVerified: boolean;
    passwordChangeRequired: boolean;
  };
}

export interface UserInvitation {
  id: string;
  email: string;
  invitedBy: string; // User ID of inviter
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

export interface UserActivity {
  id: string;
  userId: string;
  action: string; // e.g., 'login', 'logout', 'create_project', 'approve_timesheet'
  resource: string; // e.g., 'user', 'project', 'timesheet', 'invoice'
  timestamp: string;
  details: {
    oldValue?: any;
    newValue?: any;
    metadata?: Record<string, any>;
  };
  ipAddress: string;
  userAgent: string;
  sessionId: string;
}

export interface PermissionMatrix {
  roles: {
    admin: {
      features: string[];
      permissions: Record<string, boolean>;
    };
    manager: {
      features: string[];
      permissions: Record<string, boolean>;
    };
    employee: {
      features: string[];
      permissions: Record<string, boolean>;
    };
  };
  features: {
    timeTracking: boolean;
    approvals: boolean;
    reporting: boolean;
    invoicing: boolean;
    userManagement: boolean;
    projectManagement: boolean;
    clientManagement: boolean;
  };
} 