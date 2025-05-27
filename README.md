# Aerotage Time Reporting Application

Professional desktop time tracking and billing application built with Electron, React, and TypeScript for Aerotage Design Group, Inc.

## 🏗️ Architecture

This is the **frontend repository** in a two-repository architecture:

- **Frontend** (this repo): Electron desktop application with React/TypeScript
- **Backend**: AWS serverless infrastructure ([aerotage-time-reporting-api](https://github.com/aerotage/aerotage-time-reporting-api))

### Technology Stack

- **Desktop Framework**: Electron
- **Frontend**: React 18 + TypeScript
- **State Management**: React Context API
- **Styling**: Tailwind CSS + Headless UI
- **Forms**: React Hook Form + Zod validation
- **Charts**: Chart.js with react-chartjs-2
- **Backend Integration**: AWS Amplify (connects to serverless API)

## 🚀 Getting Started

### Prerequisites

1. **Node.js 18+** and npm
2. **Backend Infrastructure**: Deploy the [backend API](https://github.com/aerotage/aerotage-time-reporting-api) first
3. **AWS Configuration**: Update `src/renderer/config/aws-config.ts` with backend endpoints

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Package for distribution
npm run package
```

### Development Scripts

```bash
# Development
npm run dev                # Start Electron app in development
npm run dev:frontend       # Start frontend only
npm run dev:main           # Start main process only

# Testing
npm test                   # Run Jest tests
npm run test:coverage      # Run tests with coverage
npm run test:e2e          # Run Playwright e2e tests

# Building & Packaging
npm run build             # Build for production
npm run package           # Package for current platform
npm run package:all       # Package for all platforms

# Code Quality
npm run lint              # Run ESLint
npm run lint:fix          # Fix ESLint issues
npm run check-deps        # Check for unstable dependencies
```

## 📱 Application Features

### ✅ Implemented
- **Time Tracking**: Timer functionality with manual entry support
- **Project Management**: Create and manage projects and clients
- **User Authentication**: AWS Cognito integration with password reset
- **Session Management**: Multi-device session tracking with auto-cleanup and termination
- **Password Reset**: Complete email-based password reset flow with security best practices
- **Real-time Timer**: Persistent timer across app restarts
- **Data Export**: CSV and PDF export capabilities
- **Professional UI**: Modern, responsive design with enhanced UX
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Security Features**: No user existence revelation, rate limiting, password policy enforcement

### 🚧 In Development
- **Team Management**: User roles and permissions
- **Approval Workflow**: Time entry approval process
- **Advanced Reporting**: Custom reports and analytics
- **Invoice Generation**: Automated invoice creation

### 🔐 Security Features
- **Session Management**: Multi-device session tracking with automatic cleanup
- **Session Termination**: Secure logout with backend session cleanup
- **Auto-refresh**: Real-time session monitoring and terminated session detection
- **Password Reset**: Secure email-based reset with 6-digit codes
- **Password Policy**: Enforced complexity requirements (8+ chars, uppercase, lowercase, numbers)
- **Code Expiration**: 15-minute expiration for reset codes
- **Rate Limiting**: Built-in protection against abuse
- **No Information Leakage**: Security-compliant error messages
- **Client-side Validation**: Real-time password policy checking

## 🛡️ Security & Quality

- **TypeScript**: Strict type checking for reliability
- **Dependency Management**: Automated stability checking (`npm run check-deps`)
- **Authentication**: Secure AWS Cognito integration
- **Local Storage**: Encrypted data storage
- **Content Security Policy**: Secure Electron configuration

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](./docs/) directory:

- **[Development Guide](./docs/DEVELOPMENT.md)** - Setup and development workflow
- **[Testing Guide](./docs/TESTING.md)** - Testing strategies and examples
- **[React Context Setup](./docs/REACT_CONTEXT_SETUP.md)** - State management architecture
- **[Dependency Analysis](./docs/DEPENDENCY_ANALYSIS.md)** - Dependency management and security

### Security & Authentication Documentation
- **[Session Management](./docs/SESSION_MANAGEMENT.md)** - Multi-device session tracking and management
- **[Frontend Implementation](./docs/FRONTEND_PASSWORD_RESET_IMPLEMENTATION.md)** - Complete implementation guide
- **[Backend Requirements](./docs/PASSWORD_RESET_BACKEND_REQUIREMENTS.md)** - Backend team requirements
- **[Integration Guide](./FRONTEND_PASSWORD_RESET_INTEGRATION_GUIDE.md)** - End-to-end integration instructions

### Architecture Documentation
- **[Project Plan](./AEROTAGE_TIME_APP_PLAN.md)** - Comprehensive project roadmap
- **[Progress Tracking](./aerotage_Time_app_plan_progress.md)** - Development progress

## 🔄 Backend Integration

This frontend connects to a separate AWS serverless backend:

1. **Deploy Backend**: Follow setup instructions in [aerotage-time-reporting-api](https://github.com/aerotage/aerotage-time-reporting-api)
2. **Configure Frontend**: Update `src/renderer/config/aws-config.ts` with:
   - API Gateway URLs
   - Cognito User Pool IDs
   - S3 bucket names
3. **Test Connection**: Run the application and verify authentication works

## 📦 Distribution

### Desktop Platforms
- **macOS**: Code-signed and notarized `.dmg` files
- **Windows**: Code-signed `.exe` installers
- **Linux**: `.AppImage` and `.deb` packages

### Auto-Updates
- Automatic update detection and installation
- Rollback capabilities for failed updates
- User-controlled update scheduling

## 🧪 Testing

- **Unit Tests**: Jest with React Testing Library
- **Integration Tests**: API integration testing
- **E2E Tests**: Playwright for full application workflows
- **Performance Tests**: Memory and CPU usage monitoring

## 🤝 Contributing

1. Follow the development guidelines in [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md)
2. Run `npm run check-deps` before committing to ensure dependency stability
3. Maintain test coverage above 80%
4. Use conventional commit messages

## 📄 License

Copyright (c) 2025 Aerotage Design Group, Inc.

---

**Professional Time Tracking Made Simple** - Built with enterprise-grade security and modern desktop technologies. 