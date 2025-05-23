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

export interface AppState {
  timeEntries: TimeEntry[];
  projects: Project[];
  clients: Client[];
  users: User[];
  teams: Team[];
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