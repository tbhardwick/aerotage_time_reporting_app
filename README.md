# Aerotage Time Reporting Application

A professional desktop time tracking and billing application built with Electron, React, and TypeScript for Aerotage Design Group, Inc.

## Features

- **Time Tracking**: Start/stop timer, manual time entry, project selection
- **Project Management**: Client accounts, project budgets, team assignments
- **Reporting**: Time reports, analytics, export capabilities
- **Invoicing**: Generate invoices from approved time entries
- **Team Management**: User roles, permissions, approval workflows
- **Modern UI**: Beautiful, responsive design with Tailwind CSS

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **State Management**: React Context API with useReducer
- **Styling**: Tailwind CSS + Headless UI
- **Desktop**: Electron
- **Build Tools**: Webpack + PostCSS
- **Future Backend**: AWS Serverless (Cognito, API Gateway, Lambda, DynamoDB)

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd aerotage_time_reporting_app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

This will start both the React development server (localhost:3000) and the Electron app.

### Available Scripts

- `npm run dev` - Start development mode (React dev server + Electron)
- `npm run dev:renderer` - Start only the React development server
- `npm start` - Start Electron app (production mode)
- `npm run build` - Build the app for production
- `npm run build:mac` - Build macOS app
- `npm run dist` - Create distributable packages
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## React Context State Management

The application uses React Context API with useReducer for state management instead of Redux. This provides a simpler, more lightweight solution for the current scope.

### Context Structure

```typescript
// AppContext.tsx provides:
interface AppState {
  timeEntries: TimeEntry[];
  projects: Project[];
  timer: TimerState;
  user: User | null;
}

// Available actions:
- ADD_TIME_ENTRY
- UPDATE_TIME_ENTRY  
- DELETE_TIME_ENTRY
- START_TIMER
- STOP_TIMER
- UPDATE_TIMER_TIME
- SET_USER
```

### Usage in Components

```typescript
import { useAppContext } from '../context/AppContext';

const MyComponent = () => {
  const { state, dispatch } = useAppContext();
  
  // Access state
  const { timeEntries, projects, timer } = state;
  
  // Dispatch actions
  dispatch({ type: 'START_TIMER', payload: { projectId, description } });
};
```

### Context Provider Setup

The app is properly wrapped with the context provider:

```typescript
// App.tsx
<ErrorBoundary>
  <AppProvider>
    <Router>
      {/* App content */}
    </Router>
  </AppProvider>
</ErrorBoundary>
```

## Project Structure

```
src/
├── main/                    # Electron main process
│   └── main.js             # Main entry point
├── renderer/               # React frontend
│   ├── components/         # Reusable UI components
│   │   ├── common/        # Generic components
│   │   ├── timer/         # Timer-specific components
│   │   ├── projects/      # Project management
│   │   ├── reports/       # Reporting components
│   │   └── invoices/      # Invoice components
│   ├── pages/             # Main application pages
│   ├── context/           # React Context providers and hooks
│   │   └── AppContext.tsx # Main application state
│   ├── services/          # API services
│   ├── utils/             # Utility functions
│   └── types/             # TypeScript definitions
├── preload/               # Electron preload scripts
└── shared/                # Shared utilities
```

## Current Status

### ✅ Completed (Phase 2 - Core Time Tracking)
- [x] React + TypeScript setup in Electron
- [x] Tailwind CSS configuration with pleasing color palette
- [x] React Context state management with useReducer
- [x] Basic routing and navigation
- [x] Timer interface implementation with start/stop functionality
- [x] Project selection and management
- [x] Time entry creation and management
- [x] Beautiful time tracking interface
- [x] TypeScript type definitions
- [x] Development workflow setup
- [x] Error boundary implementation

### 🚧 In Progress
- Advanced time entry features
- Project and client management
- Time entry validation and editing

### 📋 Upcoming (Phases 3-7)
- Project and client management
- Approval workflows
- Reporting and analytics
- Invoice generation
- AWS backend integration

## Design System

The app uses a modern, professional color palette:

- **Primary**: Sky blue (#0ea5e9) - for main actions and branding
- **Secondary**: Neutral grays - for text and subtle elements  
- **Accent**: Purple (#d946ef) - for highlights and special features
- **Success**: Emerald green (#10b981) - for positive actions
- **Warning**: Amber (#f59e0b) - for cautions
- **Error**: Red (#ef4444) - for errors and destructive actions

## Contributing

1. Follow the established file structure
2. Use TypeScript interfaces for all data
3. Use React Context API for state management
4. Implement proper error boundaries
5. Test new functionality thoroughly
6. Follow the development phases in order

## License

MIT License - see LICENSE file for details

---

**Aerotage Design Group, Inc** - Professional Engineering Services 