# Aerotage Time Reporting Application

Professional desktop time tracking and billing application built with Electron, React, and TypeScript for Aerotage Design Group, Inc.

## 🏗️ Architecture

This is the **frontend repository** in a two-repository architecture:

- **Frontend** (this repo): Electron desktop application with React/TypeScript
- **Backend**: AWS serverless infrastructure (separate repository)

### Technology Stack

- **Desktop Framework**: Electron
- **Frontend**: React 18 + TypeScript
- **State Management**: React Context API with useReducer
- **Styling**: Tailwind CSS + Headless UI
- **Forms**: React Hook Form + Zod validation
- **Charts**: Chart.js with react-chartjs-2
- **Backend Integration**: AWS Amplify (connects to serverless API)
- **Testing**: Jest + React Testing Library + Playwright

## 🚀 Getting Started

### Prerequisites

1. **Node.js 18+** and npm
2. **Backend Infrastructure**: Deploy the backend API first
3. **AWS Configuration**: Update `src/renderer/config/aws-config.ts` with backend endpoints

### Installation

```bash
# Install dependencies
npm install

# Check dependency stability (REQUIRED before any dependency changes)
npm run check-deps

# Start development server
npm run dev
```

### Development Scripts

```bash
# Development
npm run dev                # Start Electron app in development
npm run dev:manual         # Start without auto-restart
npm run dev:renderer       # Start frontend only

# Testing
npm test                   # Run Jest tests
npm run test:coverage      # Run tests with coverage (minimum 80% required)
npm run test:e2e          # Run Playwright e2e tests
npm run test:watch         # Run tests in watch mode

# Building & Distribution
npm run build             # Build for production
npm run build:renderer    # Build renderer only
npm run build:mac         # Build for macOS
npm run dist              # Package for distribution

# Code Quality
npm run lint              # Run ESLint
npm run lint:fix          # Fix ESLint issues
npm run lint:check        # Check with zero warnings
npm run check-deps        # ⚠️ CRITICAL: Check for unstable dependencies
```

## 📁 Project Structure

```
src/renderer/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── common/         # Shared UI components
│   ├── projects/       # Project management
│   ├── time-tracking/  # Time tracking features
│   ├── timer/          # Timer functionality
│   ├── users/          # User management
│   ├── reports/        # Reporting components
│   ├── invoices/       # Invoice generation
│   ├── approvals/      # Approval workflow
│   └── settings/       # Application settings
├── pages/              # Main application pages
├── context/            # React Context (AppContext.tsx)
├── services/           # API client services
├── config/             # AWS and API configuration
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript definitions
└── styles/             # Global styles and Tailwind config

docs/
├── README.md                    # Documentation index
├── [FEATURE_NAME].md           # Core feature documentation
├── api-integration/            # API specs and backend coordination
├── implementation-guides/      # Step-by-step development guides
├── troubleshooting/           # Debugging and issue resolution
└── archive/                   # Completed work and resolved issues
```

## 🎯 Development Guidelines

### ✅ Required Patterns

#### React Context State Management
```typescript
// ALWAYS use useAppContext() hook
const { state, dispatch } = useAppContext();

// ALWAYS dispatch typed actions
dispatch({ type: 'ADD_TIME_ENTRY', payload: timeEntry });

// NEVER mutate state directly
```

#### Component Structure
```typescript
// ALWAYS define props interface
interface ComponentProps {
  title: string;
  onSave: (data: FormData) => void;
}

// ALWAYS use functional components
export const Component: React.FC<ComponentProps> = ({ title, onSave }) => {
  // Component logic
};
```

#### API Integration
```typescript
// ALWAYS use centralized API client
import { apiClient } from '@/services/api-client';

// ALWAYS handle errors properly
try {
  const result = await apiClient.createTimeEntry(data);
  dispatch({ type: 'ADD_TIME_ENTRY', payload: result });
} catch (error) {
  console.error('API Error:', error);
  // Handle error appropriately
}
```

### 🚫 Critical Prohibitions

#### Dependency Management ⚠️ CRITICAL
- **NEVER install alpha, beta, RC, or pre-release dependencies**
- **ALWAYS run `npm run check-deps` before dependency changes**
- **ALWAYS use stable versions with caret ranges (^1.2.3)**
- **NEVER add AWS CDK or infrastructure code to this repository**

#### Code Standards
- **NEVER use deprecated React patterns (class components)**
- **NEVER ignore TypeScript errors or use 'any' type**
- **NEVER store sensitive data in localStorage**
- **NEVER create .js files - TypeScript only**
  - ⚠️ **EXCEPTION**: Critical Electron infrastructure files:
    - `src/main/main.js` (Electron main process entry point)
    - `src/preload/preload.js` (Electron preload security bridge)

#### Documentation Rules
- **NEVER create .md files in root directory** (except README.md)
- **ALWAYS place documentation in `/docs` folder**
- **ALWAYS use organized subdirectories for logical grouping**

## 📱 Application Features

### ✅ Implemented (Phase 1-2 Complete)
- **Time Tracking**: Timer functionality with manual entry support
- **Project Management**: Create and manage projects and clients
- **User Authentication**: AWS Cognito integration with password reset
- **Session Management**: Multi-device session tracking with auto-cleanup
- **Password Reset**: Complete email-based password reset flow
- **Real-time Timer**: Persistent timer across app restarts
- **Data Export**: CSV and PDF export capabilities
- **Professional UI**: Modern, responsive design with enhanced UX
- **Error Handling**: Comprehensive error handling with user-friendly messages

### 🚧 Current Phase: Project Management (Phase 3)
- **Team Management**: User roles and permissions
- **Client/Project CRUD**: Enhanced project management features
- **User Management**: Advanced user administration

### 🔮 Future Phases
- **Approval Workflow**: Time entry approval process (Phase 4)
- **Advanced Reporting**: Custom reports and analytics (Phase 5)
- **Invoice Generation**: Automated invoice creation (Phase 6)

### 🔐 Security Features
- **Session Management**: Multi-device session tracking with automatic cleanup
- **Session Termination**: Secure logout with backend session cleanup
- **Auto-refresh**: Real-time session monitoring and terminated session detection
- **Password Reset**: Secure email-based reset with 6-digit codes
- **Password Policy**: Enforced complexity requirements
- **Rate Limiting**: Built-in protection against abuse
- **No Information Leakage**: Security-compliant error messages

## 🔄 Backend Integration

This frontend connects to a separate AWS serverless backend:

- **Backend API Documentation**: https://djfreip4iwrq0.cloudfront.net/
- **Current API Base URL**: `https://k60bobrd9h.execute-api.us-east-1.amazonaws.com/dev/`

### Integration Steps
1. **Deploy Backend**: Follow setup instructions in the backend repository
2. **Configure Frontend**: Update `src/renderer/config/aws-config.ts` with:
   - API Gateway URLs
   - Cognito User Pool IDs
   - S3 bucket names
3. **Test Connection**: Run the application and verify authentication works

## 🧪 Testing Requirements

- **Unit Tests**: Jest with React Testing Library
- **Integration Tests**: API integration testing
- **E2E Tests**: Playwright for full application workflows
- **Coverage**: Minimum 80% code coverage required
- **Context Testing**: Mock Context provider in tests

```bash
# Run all tests
npm test

# Run with coverage (must maintain 80%+)
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](./docs/) directory:

### Core Documentation
- **[Documentation Index](./docs/README.md)** - Complete documentation overview
- **[Development Guide](./docs/DEVELOPMENT.md)** - Setup and development workflow
- **[Testing Guide](./docs/TESTING.md)** - Testing strategies and examples
- **[React Context Setup](./docs/REACT_CONTEXT_SETUP.md)** - State management architecture
- **[Dependency Analysis](./docs/DEPENDENCY_ANALYSIS.md)** - Dependency management and security

### Feature Documentation
- **[Session Management](./docs/SESSION_MANAGEMENT.md)** - Multi-device session tracking
- **[Theme System](./docs/THEME_SYSTEM_DOCUMENTATION.md)** - UI theming implementation
- **[User Management](./docs/USER_MANAGEMENT_CONFIRMATION_DIALOGS.md)** - User administration features

### Project Planning
- **[Project Plan](./docs/AEROTAGE_TIME_APP_PLAN.md)** - Comprehensive project roadmap
- **[Progress Tracking](./docs/aerotage_Time_app_plan_progress.md)** - Development progress

### Implementation Guides
- **[API Integration](./docs/api-integration/)** - Backend coordination guides
- **[Implementation Guides](./docs/implementation-guides/)** - Step-by-step development guides
- **[Troubleshooting](./docs/troubleshooting/)** - Debugging and issue resolution

## 🛡️ Security & Quality

- **TypeScript**: Strict type checking for reliability
- **Dependency Management**: Automated stability checking (`npm run check-deps`)
- **Authentication**: Secure AWS Cognito integration
- **Local Storage**: Encrypted data storage
- **Content Security Policy**: Secure Electron configuration
- **Code Quality**: ESLint with strict rules, zero warnings policy

## 📦 Distribution

### Desktop Platforms
- **macOS**: Code-signed and notarized `.dmg` files
- **Windows**: Code-signed `.exe` installers (planned)
- **Linux**: `.AppImage` and `.deb` packages (planned)

### Auto-Updates
- Automatic update detection and installation
- Rollback capabilities for failed updates
- User-controlled update scheduling

## 🤝 Contributing

### Development Workflow
1. Follow the development guidelines in [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md)
2. **ALWAYS run `npm run check-deps`** before committing dependency changes
3. Maintain test coverage above 80%
4. Use conventional commit messages
5. Follow TypeScript strict mode - no `any` types
6. Use React Context API for state management
7. Place all documentation in `/docs` folder with proper organization

### Code Quality Standards
- **TypeScript**: Strict type checking, no `any` types
- **React**: Functional components only (except Error Boundaries)
- **Styling**: Tailwind CSS classes, no inline styles
- **Testing**: Jest + React Testing Library, 80%+ coverage
- **Linting**: ESLint with zero warnings policy

### Documentation Standards
- Create comprehensive documentation for all new features
- Update `/docs/README.md` index when adding new documentation
- Use clear, descriptive filenames with consistent naming conventions
- Include code examples and implementation details
- Document API integrations and backend coordination requirements

## 📄 License

Copyright (c) 2025 Aerotage Design Group, Inc.

---

**Professional Time Tracking Made Simple** - Built with enterprise-grade security and modern desktop technologies following strict development standards and comprehensive documentation practices. 