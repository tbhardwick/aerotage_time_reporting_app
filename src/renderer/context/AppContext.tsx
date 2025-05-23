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

export interface Project {
  id: string;
  name: string;
  client: string;
  hourlyRate: number;
  isActive: boolean;
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
  timer: TimerState;
  user: {
    name: string;
    email: string;
  } | null;
}

// Actions
type AppAction =
  | { type: 'ADD_TIME_ENTRY'; payload: Omit<TimeEntry, 'id' | 'createdAt'> }
  | { type: 'UPDATE_TIME_ENTRY'; payload: { id: string; updates: Partial<TimeEntry> } }
  | { type: 'DELETE_TIME_ENTRY'; payload: string }
  | { type: 'START_TIMER'; payload: { projectId: string; description: string } }
  | { type: 'STOP_TIMER' }
  | { type: 'UPDATE_TIMER_TIME'; payload: number }
  | { type: 'SET_USER'; payload: AppState['user'] };

// Initial state
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
  projects: [
    {
      id: '1',
      name: 'Website Redesign',
      client: 'Acme Corp',
      hourlyRate: 150,
      isActive: true,
    },
    {
      id: '2',
      name: 'Mobile App Development',
      client: 'TechStart Inc',
      hourlyRate: 125,
      isActive: true,
    },
    {
      id: '3',
      name: 'Brand Identity',
      client: 'Creative Studio',
      hourlyRate: 100,
      isActive: true,
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
    name: 'John Doe',
    email: 'john@example.com',
  },
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
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

    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
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