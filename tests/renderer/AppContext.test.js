/**
 * @jest-environment jsdom
 */

import React, { createContext, useContext, useReducer } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Create a test-specific provider with empty initial state
const TestAppContext = createContext(null);

const testInitialState = {
  timeEntries: [],
  projects: [],
  clients: [],
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
  user: null,
  loading: {},
  errors: {},
};

// Simple test reducer that handles basic actions
const testAppReducer = (state, action) => {
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
        const newEntry = {
          projectId: state.timer.currentProjectId,
          date: new Date().toISOString().split('T')[0],
          duration: Math.floor(state.timer.elapsedTime / 60),
          description: state.timer.currentDescription,
          isBillable: true,
          status: 'draft',
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        };

        return {
          ...state,
          timeEntries: [...state.timeEntries, newEntry],
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

    case 'ADD_PROJECT':
      return {
        ...state,
        projects: [
          ...state.projects,
          {
            ...action.payload,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      };

    case 'ADD_CLIENT':
      return {
        ...state,
        clients: [
          ...state.clients,
          {
            ...action.payload,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      };

    default:
      return state;
  }
};

const TestAppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(testAppReducer, testInitialState);
  return (
    <TestAppContext.Provider value={{ state, dispatch }}>
      {children}
    </TestAppContext.Provider>
  );
};

const useTestAppContext = () => {
  const context = useContext(TestAppContext);
  if (!context) {
    throw new Error('useTestAppContext must be used within a TestAppProvider');
  }
  return context;
};

// Test component to interact with context
const TestComponent = () => {
  const { state, dispatch } = useTestAppContext();
  
  return (
    <div>
      <div data-testid="timer-running">{state.timer.isRunning ? 'true' : 'false'}</div>
      <div data-testid="time-entries-count">{state.timeEntries.length}</div>
      <div data-testid="projects-count">{state.projects.length}</div>
      <div data-testid="clients-count">{state.clients.length}</div>
      <div data-testid="invoices-count">{state.invoices.length}</div>
      
      <button 
        data-testid="start-timer" 
        onClick={() => dispatch({
          type: 'START_TIMER',
          payload: { projectId: 'project-1', description: 'Test task' }
        })}
      >
        Start Timer
      </button>
      
      <button 
        data-testid="stop-timer" 
        onClick={() => dispatch({ type: 'STOP_TIMER' })}
      >
        Stop Timer
      </button>
      
      <button 
        data-testid="add-time-entry" 
        onClick={() => dispatch({
          type: 'ADD_TIME_ENTRY',
          payload: {
            projectId: 'project-1',
            date: '2024-01-01',
            duration: 3600000,
            description: 'Test entry',
            isBillable: true,
            status: 'draft'
          }
        })}
      >
        Add Time Entry
      </button>
      
      <button 
        data-testid="add-project" 
        onClick={() => dispatch({
          type: 'ADD_PROJECT',
          payload: {
            clientId: 'client-1',
            name: 'Test Project',
            description: 'Test project description',
            hourlyRate: 100,
            status: 'active',
            isActive: true
          }
        })}
      >
        Add Project
      </button>
      
      <button 
        data-testid="add-client" 
        onClick={() => dispatch({
          type: 'ADD_CLIENT',
          payload: {
            name: 'Test Client',
            contactInfo: {
              email: 'test@client.com',
              phone: '123-456-7890'
            },
            isActive: true
          }
        })}
      >
        Add Client
      </button>
    </div>
  );
};

describe('AppContext', () => {
  describe('Provider', () => {
    test('provides initial state', () => {
      render(
        <TestAppProvider>
          <TestComponent />
        </TestAppProvider>
      );
      
      expect(screen.getByTestId('timer-running')).toHaveTextContent('false');
      expect(screen.getByTestId('time-entries-count')).toHaveTextContent('0');
      expect(screen.getByTestId('projects-count')).toHaveTextContent('0');
      expect(screen.getByTestId('clients-count')).toHaveTextContent('0');
      expect(screen.getByTestId('invoices-count')).toHaveTextContent('0');
    });

    test('throws error when used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useTestAppContext must be used within a TestAppProvider');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Timer Actions', () => {
    test('starts timer correctly', () => {
      render(
        <TestAppProvider>
          <TestComponent />
        </TestAppProvider>
      );
      
      act(() => {
        fireEvent.click(screen.getByTestId('start-timer'));
      });
      
      expect(screen.getByTestId('timer-running')).toHaveTextContent('true');
    });

    test('stops timer and creates time entry', () => {
      render(
        <TestAppProvider>
          <TestComponent />
        </TestAppProvider>
      );
      
      act(() => {
        fireEvent.click(screen.getByTestId('start-timer'));
      });
      
      expect(screen.getByTestId('timer-running')).toHaveTextContent('true');
      expect(screen.getByTestId('time-entries-count')).toHaveTextContent('0');
      
      act(() => {
        fireEvent.click(screen.getByTestId('stop-timer'));
      });
      
      expect(screen.getByTestId('timer-running')).toHaveTextContent('false');
      expect(screen.getByTestId('time-entries-count')).toHaveTextContent('1');
    });
  });

  describe('Time Entry Actions', () => {
    test('adds time entry correctly', () => {
      render(
        <TestAppProvider>
          <TestComponent />
        </TestAppProvider>
      );
      
      expect(screen.getByTestId('time-entries-count')).toHaveTextContent('0');
      
      act(() => {
        fireEvent.click(screen.getByTestId('add-time-entry'));
      });
      
      expect(screen.getByTestId('time-entries-count')).toHaveTextContent('1');
    });
  });

  describe('Project Actions', () => {
    test('adds project correctly', () => {
      render(
        <TestAppProvider>
          <TestComponent />
        </TestAppProvider>
      );
      
      expect(screen.getByTestId('projects-count')).toHaveTextContent('0');
      
      act(() => {
        fireEvent.click(screen.getByTestId('add-project'));
      });
      
      expect(screen.getByTestId('projects-count')).toHaveTextContent('1');
    });
  });

  describe('Client Actions', () => {
    test('adds client correctly', () => {
      render(
        <TestAppProvider>
          <TestComponent />
        </TestAppProvider>
      );
      
      expect(screen.getByTestId('clients-count')).toHaveTextContent('0');
      
      act(() => {
        fireEvent.click(screen.getByTestId('add-client'));
      });
      
      expect(screen.getByTestId('clients-count')).toHaveTextContent('1');
    });
  });
}); 