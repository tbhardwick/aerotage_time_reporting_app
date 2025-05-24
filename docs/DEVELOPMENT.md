# Development Guide

This guide covers development workflows, best practices, and advanced topics for the Aerotage Time Reporting Application.

## Development Workflow

### Setting Up Your Development Environment

1. **Prerequisites**
   ```bash
   # Ensure you have the latest Node.js LTS
   node --version  # Should be 18+
   
   # Install dependencies
   npm install
   ```

2. **Development Mode**
   ```bash
   # Start with hot reload (recommended)
   npm run dev
   
   # This starts both:
   # - React development server on localhost:3000
   # - Electron app with hot reload
   ```

3. **Code Quality**
   ```bash
   # Lint your code
   npm run lint
   
   # Fix linting issues automatically
   npx eslint src/**/*.{js,ts,tsx} --fix
   ```

4. **Dependency Management** 🔒
   ```bash
   # ALWAYS check dependencies before installing new packages
   npm run check-deps
   
   # Install dependencies (use stable versions only)
   npm install package@^1.2.3
   
   # Re-check after installation
   npm run check-deps
   
   # Run security audit
   npm audit
   ```

### Dependency Guidelines

⚠️ **CRITICAL**: This project enforces **stable-only dependencies**.

#### Forbidden Versions
- ❌ Alpha releases (`2.0.0-alpha.1`)
- ❌ Beta releases (`3.0.0-beta.2`)
- ❌ Release candidates (`1.5.0-rc.1`)
- ❌ Pre-release versions (`4.0.0-pre.3`)
- ❌ Canary builds (`1.2.0-canary.45`)
- ❌ Next tags (`@next`)
- ❌ Dev/snapshot versions

#### Required Process
1. **Before adding dependencies**:
   - Run `npm run check-deps` to verify current state
   - Research the package to ensure it's stable and maintained
   - Check for security vulnerabilities

2. **Installing dependencies**:
   ```bash
   # Use exact stable versions
   npm install package@^1.2.3
   
   # NOT alpha/beta versions
   npm install package@2.0.0-alpha.1  # ❌ FORBIDDEN
   ```

3. **After installation**:
   - Run `npm run check-deps` again
   - Run `npm audit` for security check
   - Test the application thoroughly
   - Update documentation if needed

#### Exception Handling
If an unstable dependency is absolutely necessary:
1. Document the business justification in `DEPENDENCY_ANALYSIS.md`
2. Create isolated testing environment
3. Implement fallback strategies
4. Get team approval before merging
5. Plan migration path to stable version

#### Monitoring
- **Weekly**: Run `npm audit` for security vulnerabilities
- **Monthly**: Check `npm outdated` for available stable updates
- **Before releases**: Full dependency stability and security review

📚 **See [DEPENDENCY_ANALYSIS.md](./DEPENDENCY_ANALYSIS.md) for comprehensive guidelines**

## React Context State Management

The application uses React Context API with useReducer for centralized state management. This approach provides a simpler alternative to Redux while maintaining predictable state updates.

### Context Architecture

```typescript
// src/renderer/context/AppContext.tsx
interface AppState {
  timeEntries: TimeEntry[];
  projects: Project[];
  timer: TimerState;
  user: User | null;
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

### Setting Up Context in Components

1. **Provider Setup** (Already configured in App.tsx):
```typescript
// App.tsx
import { AppProvider } from './context/AppContext';

const App = () => (
  <ErrorBoundary>
    <AppProvider>
      <Router>
        {/* Your app components */}
      </Router>
    </AppProvider>
  </ErrorBoundary>
);
```

2. **Using Context in Components**:
```typescript
import { useAppContext } from '../context/AppContext';

const MyComponent = () => {
  const { state, dispatch } = useAppContext();
  
  // Access state
  const { timeEntries, projects, timer, user } = state;
  
  // Dispatch actions
  const handleStartTimer = () => {
    dispatch({
      type: 'START_TIMER',
      payload: { projectId: 'project-1', description: 'Working on feature' }
    });
  };
  
  const handleAddTimeEntry = () => {
    dispatch({
      type: 'ADD_TIME_ENTRY',
      payload: {
        projectId: 'project-1',
        date: new Date().toISOString().split('T')[0],
        duration: 120,
        description: 'Completed task',
        isBillable: true,
        status: 'draft'
      }
    });
  };
};
```

### Adding New State and Actions

1. **Update Types** in AppContext.tsx:
```typescript
// Add to AppState interface
interface AppState {
  // ... existing properties
  newFeature: NewFeatureState;
}

// Add to AppAction union type
type AppAction = 
  // ... existing actions
  | { type: 'UPDATE_NEW_FEATURE'; payload: NewFeatureState };
```

2. **Update Reducer**:
```typescript
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    // ... existing cases
    case 'UPDATE_NEW_FEATURE':
      return {
        ...state,
        newFeature: action.payload
      };
    default:
      return state;
  }
}
```

3. **Update Initial State**:
```typescript
const initialState: AppState = {
  // ... existing properties
  newFeature: {
    // initial values
  }
};
```

## Project Architecture

### Process Architecture
- **Main Process** (`src/main/main.js`): Controls app lifecycle, creates renderer processes
- **Preload Script** (`src/preload/preload.js`): Secure bridge between main and renderer
- **Renderer Process** (`src/renderer/`): React UI with Context state management

### Security Model
This template follows Electron's security best practices:
- Context isolation enabled
- Node integration disabled in renderer
- Sandboxed renderer processes
- Secure IPC communication via context bridge

## Adding New Features

### 1. Adding IPC APIs

**Step 1: Add handler in main process**
```javascript
// In src/main/main.js, add to setupIpcHandlers()
ipcMain.handle('timeTracking:saveEntry', async (event, timeEntry) => {
  // Save time entry logic
  return result;
});
```

**Step 2: Expose in preload script**
```javascript
// In src/preload/preload.js, add to electronAPI
contextBridge.exposeInMainWorld('electronAPI', {
  // ... existing APIs
  timeTracking: {
    saveEntry: (timeEntry) => ipcRenderer.invoke('timeTracking:saveEntry', timeEntry)
  }
});
```

**Step 3: Use in renderer with Context**
```typescript
// In React component
const { dispatch } = useAppContext();

const saveTimeEntry = async (entry) => {
  try {
    const savedEntry = await window.electronAPI.timeTracking.saveEntry(entry);
    dispatch({ type: 'ADD_TIME_ENTRY', payload: savedEntry });
  } catch (error) {
    console.error('Failed to save time entry:', error);
  }
};
```

### 2. Adding New Pages

1. **Create Page Component**:
```typescript
// src/renderer/pages/NewPage.tsx
import React from 'react';
import { useAppContext } from '../context/AppContext';

const NewPage: React.FC = () => {
  const { state, dispatch } = useAppContext();
  
  return (
    <div>
      {/* Page content */}
    </div>
  );
};

export default NewPage;
```

2. **Add Route**:
```typescript
// In App.tsx
import NewPage from './pages/NewPage';

<Routes>
  {/* ... existing routes */}
  <Route path="/new-page" element={<NewPage />} />
</Routes>
```

### 3. Adding Context-Aware Components

```typescript
// src/renderer/components/TimerWidget.tsx
import React from 'react';
import { useAppContext } from '../context/AppContext';

const TimerWidget: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { timer } = state;
  
  const handleStartTimer = () => {
    dispatch({
      type: 'START_TIMER',
      payload: { projectId: 'current-project', description: 'Working' }
    });
  };
  
  return (
    <div>
      <div>{formatTime(timer.elapsedTime)}</div>
      <button onClick={handleStartTimer}>
        {timer.isRunning ? 'Stop' : 'Start'}
      </button>
    </div>
  );
};
```

## Error Handling

### Error Boundaries
The app uses React Error Boundaries to catch and handle errors gracefully:

```typescript
// ErrorBoundary.tsx (already implemented)
<ErrorBoundary>
  <AppProvider>
    {/* App content */}
  </AppProvider>
</ErrorBoundary>
```

### Context Error Handling
```typescript
// In useAppContext hook
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
```

## Styling and Theming

### Tailwind CSS Configuration
The app uses Tailwind CSS for styling with a custom configuration:

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0ea5e9',
        secondary: '#6b7280',
        // ... custom colors
      }
    }
  }
};
```

### Component Styling Best Practices
- Use Tailwind utility classes for consistent styling
- Create reusable component variants
- Follow the established color palette
- Ensure responsive design

## Testing

### Testing Context Components
```typescript
// Example test setup
import { render, screen } from '@testing-library/react';
import { AppProvider } from '../context/AppContext';
import MyComponent from '../components/MyComponent';

const renderWithContext = (component) => {
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

### Manual Testing Checklist
- [ ] App starts without errors
- [ ] Context state updates correctly
- [ ] Timer functionality works
- [ ] Time entries are created/updated/deleted
- [ ] Navigation between pages
- [ ] Error boundaries catch errors
- [ ] Responsive design on different screen sizes

## Performance Optimization

### Context Performance
- Use React.memo for components that don't need frequent re-renders
- Split context if state becomes too large
- Optimize reducer logic for complex state updates

### Bundle Size
- Use dynamic imports for large components
- Optimize Tailwind CSS purging
- Monitor bundle size with webpack-bundle-analyzer

## Debugging

### React DevTools
- Install React Developer Tools browser extension
- Use Context tab to inspect state
- Monitor component re-renders

### Context Debugging
```typescript
// Add logging to reducer for debugging
function appReducer(state: AppState, action: AppAction): AppState {
  console.log('Action dispatched:', action.type, action.payload);
  console.log('Current state:', state);
  
  // ... reducer logic
  
  console.log('New state:', newState);
  return newState;
}
```

### Common Issues
1. **Context not available**: Ensure component is wrapped in AppProvider
2. **State not updating**: Check reducer logic and action types
3. **Performance issues**: Use React.memo and optimize re-renders
4. **Type errors**: Ensure TypeScript interfaces are up to date

## Contributing

### Code Style
- Use TypeScript for all new code
- Follow existing naming conventions
- Use React Context for state management
- Add proper error handling
- Write meaningful commit messages

### Pull Request Process
1. Fork the repository
2. Create a feature branch
3. Implement changes with proper Context usage
4. Test thoroughly
5. Update documentation if needed
6. Submit a pull request

## Resources

- [React Context Documentation](https://react.dev/reference/react/useContext)
- [useReducer Hook](https://react.dev/reference/react/useReducer)
- [Electron Documentation](https://electronjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/) 