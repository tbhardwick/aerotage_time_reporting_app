# React Context Setup Guide

This document explains how the Aerotage Time Reporting Application is configured to properly load and use React Context for state management.

## Overview

The application uses React Context API with `useReducer` for centralized state management instead of Redux. This provides a simpler, more lightweight solution that's perfect for the current scope while remaining scalable.

## Context Architecture

### AppContext Structure

```typescript
// src/renderer/context/AppContext.tsx

interface AppState {
  timeEntries: TimeEntry[];
  projects: Project[];
  timer: TimerState;
  user: User | null;
}

interface TimerState {
  isRunning: boolean;
  startTime: string | null;
  currentProjectId: string | null;
  currentDescription: string;
  elapsedTime: number;
}

type AppAction = 
  | { type: 'ADD_TIME_ENTRY'; payload: Omit<TimeEntry, 'id' | 'createdAt'> }
  | { type: 'UPDATE_TIME_ENTRY'; payload: { id: string; updates: Partial<TimeEntry> } }
  | { type: 'DELETE_TIME_ENTRY'; payload: string }
  | { type: 'START_TIMER'; payload: { projectId: string; description: string } }
  | { type: 'STOP_TIMER' }
  | { type: 'UPDATE_TIMER_TIME'; payload: number }
  | { type: 'SET_USER'; payload: AppState['user'] };
```

## Required Setup Steps

### 1. Context Provider Configuration

The app must be wrapped with the `AppProvider` to make context available to all components:

```typescript
// src/renderer/App.tsx
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import ErrorBoundary from './components/ErrorBoundary';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Router>
          {/* Your app content */}
        </Router>
      </AppProvider>
    </ErrorBoundary>
  );
};
```

**⚠️ Critical:** The `AppProvider` must wrap all components that need access to the context. It should be placed:
- Inside the `ErrorBoundary` for error handling
- Outside the `Router` to ensure context is available across all routes
- At the top level of your component tree

### 2. Root Application Rendering

```typescript
// src/renderer/index.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);

root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
```

### 3. Using Context in Components

```typescript
// Any component that needs access to state
import React from 'react';
import { useAppContext } from '../context/AppContext';

const MyComponent: React.FC = () => {
  const { state, dispatch } = useAppContext();
  
  // Access state
  const { timeEntries, projects, timer, user } = state;
  
  // Dispatch actions
  const handleStartTimer = () => {
    dispatch({
      type: 'START_TIMER',
      payload: { 
        projectId: 'project-1', 
        description: 'Working on feature' 
      }
    });
  };
  
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};
```

## Context Hook Usage

### useAppContext Hook

The `useAppContext` hook provides type-safe access to the context:

```typescript
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
```

**Error Handling:** The hook automatically throws an error if used outside of an `AppProvider`, helping catch configuration issues early.

## State Management Patterns

### 1. Timer Operations

```typescript
// Start timer
dispatch({
  type: 'START_TIMER',
  payload: { projectId: selectedProject, description: taskDescription }
});

// Stop timer (automatically creates time entry)
dispatch({ type: 'STOP_TIMER' });

// Update timer time (called by interval)
dispatch({ type: 'UPDATE_TIMER_TIME', payload: elapsedSeconds });
```

### 2. Time Entry Management

```typescript
// Add new time entry
dispatch({
  type: 'ADD_TIME_ENTRY',
  payload: {
    projectId: 'project-1',
    date: '2024-01-15',
    duration: 120, // minutes
    description: 'Completed feature implementation',
    isBillable: true,
    status: 'draft'
  }
});

// Update existing entry
dispatch({
  type: 'UPDATE_TIME_ENTRY',
  payload: {
    id: 'entry-123',
    updates: { status: 'submitted' }
  }
});

// Delete entry
dispatch({
  type: 'DELETE_TIME_ENTRY',
  payload: 'entry-123'
});
```

### 3. User Management

```typescript
// Set user information
dispatch({
  type: 'SET_USER',
  payload: {
    name: 'John Doe',
    email: 'john@aerotage.com'
  }
});
```

## Common Issues and Solutions

### Issue 1: "useAppContext must be used within an AppProvider"

**Cause:** Component is trying to use context outside of the provider.

**Solution:** Ensure your component tree is properly wrapped:
```typescript
// ❌ Wrong - Context used outside provider
<Router>
  <AppProvider>
    <SomeComponent />
  </AppProvider>
  <AnotherComponent /> {/* This won't have access to context */}
</Router>

// ✅ Correct - All components inside provider
<AppProvider>
  <Router>
    <SomeComponent />
    <AnotherComponent />
  </Router>
</AppProvider>
```

### Issue 2: State Not Updating

**Cause:** Incorrect action type or payload structure.

**Solution:** Verify action types match exactly:
```typescript
// ❌ Wrong - typo in action type
dispatch({ type: 'START_TIMR', payload: { ... } });

// ✅ Correct - exact action type
dispatch({ type: 'START_TIMER', payload: { ... } });
```

### Issue 3: TypeScript Errors

**Cause:** Payload doesn't match expected interface.

**Solution:** Ensure payload structure matches action definition:
```typescript
// Action definition expects this structure:
{ type: 'ADD_TIME_ENTRY'; payload: Omit<TimeEntry, 'id' | 'createdAt'> }

// ✅ Correct payload
dispatch({
  type: 'ADD_TIME_ENTRY',
  payload: {
    projectId: 'project-1',
    date: '2024-01-15',
    duration: 120,
    description: 'Task description',
    isBillable: true,
    status: 'draft'
    // Note: 'id' and 'createdAt' are omitted as expected
  }
});
```

## Performance Considerations

### 1. Component Re-renders

Use `React.memo` for components that don't need frequent updates:

```typescript
import React, { memo } from 'react';

const ExpensiveComponent = memo(() => {
  const { state } = useAppContext();
  // Only re-renders when state actually changes
  return <div>{/* Component content */}</div>;
});
```

### 2. Selective State Access

Only destructure the state properties you need:

```typescript
// ❌ Less efficient - causes re-render on any state change
const { state } = useAppContext();

// ✅ More efficient - only re-renders when timer changes
const { state: { timer } } = useAppContext();
```

## Testing Context Components

### Test Setup

```typescript
import { render, screen } from '@testing-library/react';
import { AppProvider } from '../context/AppContext';
import MyComponent from '../components/MyComponent';

const renderWithContext = (component: React.ReactElement) => {
  return render(
    <AppProvider>
      {component}
    </AppProvider>
  );
};

test('component uses context correctly', () => {
  renderWithContext(<MyComponent />);
  // Test assertions
});
```

### Mock Context for Testing

```typescript
import { createContext, useContext } from 'react';

const MockAppContext = createContext({
  state: {
    timeEntries: [],
    projects: [],
    timer: { isRunning: false, elapsedTime: 0 },
    user: null
  },
  dispatch: jest.fn()
});

const MockAppProvider = ({ children }) => (
  <MockAppContext.Provider value={mockValue}>
    {children}
  </MockAppContext.Provider>
);
```

## Debugging Context

### 1. Add Logging to Reducer

```typescript
function appReducer(state: AppState, action: AppAction): AppState {
  console.log('🔄 Action:', action.type, action.payload);
  console.log('📊 Current State:', state);
  
  const newState = /* reducer logic */;
  
  console.log('✅ New State:', newState);
  return newState;
}
```

### 2. React DevTools

- Install React Developer Tools browser extension
- Use the "Components" tab to inspect context values
- Monitor state changes in real-time

### 3. Context Inspector Component

```typescript
const ContextInspector = () => {
  const { state } = useAppContext();
  
  if (process.env.NODE_ENV === 'development') {
    return (
      <div style={{ position: 'fixed', bottom: 0, right: 0, background: 'white', padding: '10px' }}>
        <pre>{JSON.stringify(state, null, 2)}</pre>
      </div>
    );
  }
  
  return null;
};
```

## Migration from Redux

If migrating from Redux, here are the key differences:

| Redux | React Context |
|-------|---------------|
| `useSelector(state => state.timer)` | `const { state: { timer } } = useAppContext()` |
| `useDispatch()` | `const { dispatch } = useAppContext()` |
| `store.dispatch(action)` | `dispatch(action)` |
| Multiple reducers with `combineReducers` | Single reducer with nested state |
| Redux DevTools | React DevTools + custom logging |

## Best Practices

1. **Keep Context Focused**: Don't put everything in one context. Split if it grows too large.

2. **Use TypeScript**: Leverage type safety for actions and state.

3. **Error Boundaries**: Always wrap context providers with error boundaries.

4. **Consistent Action Naming**: Use clear, descriptive action types.

5. **Immutable Updates**: Always return new state objects from reducer.

6. **Testing**: Test components with context using proper test utilities.

---

This setup ensures that the React Context is properly configured and available throughout the application, providing a solid foundation for state management in the Aerotage Time Reporting Application. 