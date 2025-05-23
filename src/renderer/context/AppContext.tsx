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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  name: string;
  managerId: string;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
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
  
  // Invoice Actions
  | { type: 'ADD_INVOICE'; payload: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_INVOICE'; payload: { id: string; updates: Partial<Invoice> } }
  | { type: 'DELETE_INVOICE'; payload: string }
  | { type: 'SET_INVOICES'; payload: Invoice[] }
  | { type: 'GENERATE_INVOICE'; payload: { clientId: string; timeEntryIds: string[]; projectIds: string[]; dueDate: string; notes?: string } }
  
  // UI State Actions
  | { type: 'SET_LOADING'; payload: { key: string; loading: boolean } }
  | { type: 'SET_ERROR'; payload: { key: string; error: string | null } };

// Initial state with mock data for development
const initialState: AppState = {
  timeEntries: [
    {
      id: '1',
      projectId: '1',
      date: new Date().toISOString().split('T')[0],
      duration: 120,
      description: 'Working on homepage design',
      isBillable: true,
      status: 'draft',
      createdAt: new Date().toISOString(),
    },
    // Submitted entries for approval workflow testing
    {
      id: '2',
      projectId: '2',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
      duration: 180,
      description: 'Mobile app wireframes and user flow design',
      isBillable: true,
      status: 'submitted',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      submittedAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      submittedBy: '3', // Bob Johnson (employee)
    },
    {
      id: '3',
      projectId: '1',
      date: new Date(Date.now() - 172800000).toISOString().split('T')[0], // 2 days ago
      duration: 240,
      description: 'Client meeting and requirements gathering',
      isBillable: true,
      status: 'submitted',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      submittedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      submittedBy: '3', // Bob Johnson (employee)
    },
    // Approved entry
    {
      id: '4',
      projectId: '3',
      date: new Date(Date.now() - 259200000).toISOString().split('T')[0], // 3 days ago
      duration: 300,
      description: 'Logo concepts and brand color exploration',
      isBillable: true,
      status: 'approved',
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      submittedAt: new Date(Date.now() - 86400000).toISOString(),
      submittedBy: '3', // Bob Johnson (employee)
      approverId: '2', // Jane Smith (manager)
      approvedAt: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
      comment: 'Great work on the logo concepts!',
    },
    // Rejected entry
    {
      id: '5',
      projectId: '2',
      date: new Date(Date.now() - 345600000).toISOString().split('T')[0], // 4 days ago
      duration: 60,
      description: 'Internal team meeting',
      isBillable: false,
      status: 'rejected',
      createdAt: new Date(Date.now() - 345600000).toISOString(),
      submittedAt: new Date(Date.now() - 259200000).toISOString(),
      submittedBy: '3', // Bob Johnson (employee)
      approverId: '2', // Jane Smith (manager)
      rejectedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      comment: 'This should not be billable to the client. Please resubmit as non-billable time.',
    },
    // More draft entries for testing bulk submission
    {
      id: '6',
      projectId: '1',
      date: new Date().toISOString().split('T')[0],
      duration: 90,
      description: 'Code review and testing',
      isBillable: true,
      status: 'draft',
      createdAt: new Date().toISOString(),
    },
    {
      id: '7',
      projectId: '3',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
      duration: 150,
      description: 'Typography selection and layout design',
      isBillable: true,
      status: 'draft',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ],
  clients: [
    {
      id: '1',
      name: 'Acme Corporation',
      contactInfo: {
        email: 'contact@acme.com',
        phone: '+1 (555) 123-4567',
        address: '123 Business St, Suite 100, New York, NY 10001',
      },
      billingAddress: '123 Business St, Suite 100, New York, NY 10001',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'TechStart Inc',
      contactInfo: {
        email: 'hello@techstart.com',
        phone: '+1 (555) 987-6543',
        address: '456 Innovation Ave, San Francisco, CA 94105',
      },
      billingAddress: '456 Innovation Ave, San Francisco, CA 94105',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      name: 'Creative Studio',
      contactInfo: {
        email: 'info@creativestudio.com',
        phone: '+1 (555) 456-7890',
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  projects: [
    {
      id: '1',
      clientId: '1',
      name: 'Website Redesign',
      description: 'Complete redesign of the company website with modern UI/UX',
      budget: {
        hours: 200,
        amount: 30000,
      },
      hourlyRate: 150,
      status: 'active',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      clientId: '2',
      name: 'Mobile App Development',
      description: 'Native iOS and Android app development',
      budget: {
        hours: 400,
        amount: 50000,
      },
      hourlyRate: 125,
      status: 'active',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      clientId: '3',
      name: 'Brand Identity',
      description: 'Logo design and brand guidelines',
      budget: {
        hours: 80,
        amount: 8000,
      },
      hourlyRate: 100,
      status: 'active',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  users: [
    {
      id: '1',
      email: 'john@aerotage.com',
      name: 'John Doe',
      role: 'admin',
      hourlyRate: 150,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      email: 'jane@aerotage.com',
      name: 'Jane Smith',
      role: 'manager',
      hourlyRate: 125,
      teamId: '1',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      email: 'bob@aerotage.com',
      name: 'Bob Johnson',
      role: 'employee',
      hourlyRate: 100,
      teamId: '1',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  teams: [
    {
      id: '1',
      name: 'Design Team',
      managerId: '2',
      memberIds: ['2', '3'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  invoices: [
    // Mock invoice data for development
    {
      id: '1',
      invoiceNumber: 'INV-2024-001',
      clientId: '1',
      projectIds: ['1'],
      timeEntryIds: ['4'], // Approved entry
      amount: 750.00, // 5 hours at $150/hr
      tax: 75.00, // 10% tax
      totalAmount: 825.00,
      status: 'sent',
      issueDate: new Date(Date.now() - 172800000).toISOString().split('T')[0], // 2 days ago
      dueDate: new Date(Date.now() + 1296000000).toISOString().split('T')[0], // 15 days from now
      sentDate: new Date(Date.now() - 172800000).toISOString(),
      notes: 'Logo design and brand exploration work',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ],
  timer: {
    isRunning: false,
    startTime: null,
    currentProjectId: null,
    currentDescription: '',
    elapsedTime: 0,
  },
  user: {
    id: '1',
    email: 'john@aerotage.com',
    name: 'John Doe',
    role: 'admin',
    hourlyRate: 150,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
      if (state.timer.isRunning && state.timer.currentProjectId) {
        const newEntry: Omit<TimeEntry, 'id' | 'createdAt'> = {
          projectId: state.timer.currentProjectId,
          date: new Date().toISOString().split('T')[0],
          duration: Math.floor(state.timer.elapsedTime / 60), // Convert to minutes
          description: state.timer.currentDescription,
          isBillable: true,
          status: 'draft',
        };

        return {
          ...state,
          timeEntries: [
            ...state.timeEntries,
            {
              ...newEntry,
              id: Date.now().toString(),
              createdAt: new Date().toISOString(),
            },
          ],
          timer: {
            isRunning: false,
            startTime: null,
            currentProjectId: null,
            currentDescription: '',
            elapsedTime: 0,
          },
        };
      }
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
        projects: action.payload.map(project => populateProjectWithClient(project, state.clients)),
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
      return {
        ...state,
        clients: action.payload,
        // Re-populate projects with updated client data
        projects: state.projects.map(project => populateProjectWithClient(project, action.payload)),
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
        users: action.payload,
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
        teams: action.payload,
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
        invoices: action.payload,
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