# Aerotage Time Reporting Application - Development Plan

## Project Overview

**Company**: Aerotage Design Group, Inc  
**Application Type**: Desktop Time Tracking & Billing Application  
**Target Platforms**: macOS and Windows  
**Architecture**: Electron Desktop App + AWS Serverless Backend  
**Similar Applications**: HarvestApp, Toggl, Clockify, FreshBooks Time Tracking

## 1. Application Architecture

### Frontend (Electron Desktop App)
- **Framework**: Electron with modern web technologies
- **UI Framework**: React with TypeScript
- **State Management**: React Context API with useReducer
- **Styling**: Tailwind CSS + Headless UI components
- **Charts/Reports**: Chart.js or Recharts
- **Date/Time**: date-fns or Day.js
- **Forms**: React Hook Form with Zod validation

### Backend (AWS Serverless)
- **Authentication**: AWS Cognito
- **API**: AWS API Gateway + Lambda Functions
- **Database**: Amazon DynamoDB
- **File Storage**: Amazon S3 (for invoices, reports)
- **Email**: Amazon SES (for notifications, invoices)
- **Infrastructure**: AWS CDK or Terraform

## 2. Core Features & Modules

### 2.1 Authentication & User Management
- **Login/Logout** with AWS Cognito
- **Multi-factor Authentication** (MFA)
- **Password Reset** functionality
- **User Roles**: Admin, Manager, Employee
- **Team Management** (assign users to teams)

### 2.2 User Management & Administration ✅ ENHANCED
- **User Profile Management** (personal info, contact details, hourly rates)
- **User Creation & Onboarding** (admin-only functionality)
- **Role Assignment & Permissions** (Admin, Manager, Employee with granular permissions)
- **Team Structure Management** (create teams, assign managers, add/remove members)
- **User Status Management** (active/inactive/suspended users)
- **Permission Matrix** (role-based access control for all features)
- **User Activity Monitoring** (login history, last activity tracking)
- **Bulk User Operations** (bulk import, export, status updates)

### 2.2 Time Tracking ✅ COMPLETED
- **Timer Interface** (start/stop/pause) ✅
- **Manual Time Entry** (add time retroactively) ✅
- **Time Categories** (billable/non-billable) ✅
- **Project Selection** dropdown ✅
- **Task Description** text field ✅
- **Daily/Weekly Time Sheets** ✅
- **Time Approval Workflow** (submit → review → approve) 🚧

### 2.3 Client & Project Management
- **Client Accounts** (company info, billing details)
- **Project Creation** (linked to clients)
- **Project Budgets** (time/cost limits)
- **Project Status** (active/inactive/completed)
- **Hourly Rates** (per project, per user, or global)

### 2.4 Team Management & User Administration
- **User Profiles** (contact info, hourly rates, department assignment)
- **Team Creation & Management** (hierarchical team structure)
- **Manager Assignment** (team leads with approval permissions)
- **User Onboarding Workflow** (account creation, initial setup)
- **Permission Management** (granular view/edit access by role)
- **Manager Dashboard** (team time overview, user performance metrics)
- **User Directory** (searchable company directory with contact info)
- **Deactivation & Offboarding** (secure user removal process)

### 2.5 Reporting & Analytics
- **Time Reports** (by user, project, date range)
- **Productivity Analytics** (hours per day/week)
- **Project Profitability** reports
- **Billable vs Non-billable** breakdowns
- **Export Options** (PDF, CSV, Excel)

### 2.6 Invoicing & Billing
- **Invoice Generation** (from approved time entries)
- **Invoice Templates** (customizable)
- **Invoice Status** (draft, sent, paid)
- **Payment Tracking**
- **Recurring Invoices** (for retainer clients)

## 3. React Context State Management

### Current Implementation ✅
```typescript
// AppContext.tsx - Centralized state management
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

### Enhanced Implementation for Phase 8 ✅ NEW
```typescript
// AppContext.tsx - Enhanced with User Management
interface AppState {
  timeEntries: TimeEntry[];
  projects: Project[];
  clients: Client[];
  invoices: Invoice[];
  timer: TimerState;
  user: User | null;
  users: User[]; // ✅ NEW - All users in the system
  teams: Team[]; // ✅ NEW - Team management
  userSessions: UserSession[]; // ✅ NEW - Session tracking
  userInvitations: UserInvitation[]; // ✅ NEW - Invitation management
  permissions: PermissionMatrix; // ✅ NEW - Role-based permissions
}

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  hourlyRate: number;
  teamId: string;
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
    features: string[];
    projects: string[];
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

interface Team {
  id: string;
  name: string;
  description?: string;
  managerId: string;
  memberIds: string[];
  department?: string;
  parentTeamId?: string;
  permissions: {
    defaultRole: 'manager' | 'employee';
    projectAccess: string[];
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

type AppAction = 
  // Existing actions
  | { type: 'ADD_TIME_ENTRY'; payload: Omit<TimeEntry, 'id' | 'createdAt'> }
  | { type: 'UPDATE_TIME_ENTRY'; payload: { id: string; updates: Partial<TimeEntry> } }
  | { type: 'DELETE_TIME_ENTRY'; payload: string }
  | { type: 'START_TIMER'; payload: { projectId: string; description: string } }
  | { type: 'STOP_TIMER' }
  | { type: 'UPDATE_TIMER_TIME'; payload: number }
  | { type: 'SET_USER'; payload: AppState['user'] }
  
  // ✅ NEW - User Management Actions
  | { type: 'ADD_USER'; payload: Omit<User, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_USER'; payload: { id: string; updates: Partial<User> } }
  | { type: 'DELETE_USER'; payload: string }
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'UPDATE_USER_STATUS'; payload: { id: string; isActive: boolean } }
  | { type: 'BULK_UPDATE_USERS'; payload: { userIds: string[]; updates: Partial<User> } }
  
  // ✅ NEW - Team Management Actions
  | { type: 'ADD_TEAM'; payload: Omit<Team, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_TEAM'; payload: { id: string; updates: Partial<Team> } }
  | { type: 'DELETE_TEAM'; payload: string }
  | { type: 'SET_TEAMS'; payload: Team[] }
  | { type: 'ADD_TEAM_MEMBER'; payload: { teamId: string; userId: string } }
  | { type: 'REMOVE_TEAM_MEMBER'; payload: { teamId: string; userId: string } }
  
  // ✅ NEW - Permission Management Actions
  | { type: 'UPDATE_USER_PERMISSIONS'; payload: { userId: string; permissions: User['permissions'] } }
  | { type: 'UPDATE_USER_ROLE'; payload: { userId: string; role: User['role'] } }
  | { type: 'SET_PERMISSION_MATRIX'; payload: PermissionMatrix }
  
  // ✅ NEW - Session Management Actions
  | { type: 'ADD_USER_SESSION'; payload: UserSession }
  | { type: 'UPDATE_USER_SESSION'; payload: { sessionId: string; updates: Partial<UserSession> } }
  | { type: 'LOGOUT_USER_SESSION'; payload: string }
  
  // ✅ NEW - Invitation Management Actions
  | { type: 'SEND_USER_INVITATION'; payload: Omit<UserInvitation, 'id' | 'createdAt'> }
  | { type: 'ACCEPT_USER_INVITATION'; payload: { invitationId: string; userId: string } }
  | { type: 'CANCEL_USER_INVITATION'; payload: string };
```

### Context Provider Setup ✅
```typescript
// App.tsx - Proper provider wrapping
<ErrorBoundary>
  <AppProvider>
    <Router>
      <Navigation />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/time-tracking" element={<TimeTrackingNew />} />
        {/* ... other routes */}
      </Routes>
    </Router>
  </AppProvider>
</ErrorBoundary>
```

### Usage Pattern ✅
```typescript
// Component usage
const { state, dispatch } = useAppContext();

// Timer operations
dispatch({ type: 'START_TIMER', payload: { projectId, description } });
dispatch({ type: 'STOP_TIMER' });

// Time entry management
dispatch({ type: 'ADD_TIME_ENTRY', payload: timeEntry });
dispatch({ type: 'UPDATE_TIME_ENTRY', payload: { id, updates } });
```

## 4. Database Schema (DynamoDB)

### Primary Tables
```
Users ✅ ENHANCED
- PK: userId
- email, name, role, hourlyRate, teamId, isActive, department
- contactInfo: { phone, address, emergencyContact }
- profilePicture, jobTitle, startDate, lastLogin
- permissions: { features: [], projects: [] }
- preferences: { theme, notifications, timezone }
- createdAt, updatedAt, createdBy

Teams ✅ ENHANCED
- PK: teamId
- name, description, managerId, memberIds[]
- department, parentTeamId (for hierarchical structure)
- permissions: { defaultRole, projectAccess[] }
- isActive, createdAt, updatedAt, createdBy

UserSessions ✅ NEW
- PK: sessionId
- userId, loginTime, lastActivity, ipAddress
- userAgent, isActive, logoutTime
- securityFlags: { mfaVerified, passwordChangeRequired }

UserInvitations ✅ NEW
- PK: invitationId
- email, invitedBy, role, teamId, status
- invitationToken, expiresAt, acceptedAt
- onboardingCompleted, createdAt

UserActivity ✅ NEW
- PK: activityId
- userId, action, resource, timestamp
- details: { oldValue, newValue, metadata }
- ipAddress, userAgent, sessionId

Clients
- PK: clientId
- name, contactInfo, billingAddress, isActive

Projects
- PK: projectId
- clientId, name, description, budget, hourlyRate, status

TimeEntries
- PK: timeEntryId
- userId, projectId, date, startTime, endTime, duration, description, isBillable, status

Invoices
- PK: invoiceId
- clientId, projectIds[], timeEntryIds[], amount, status, dueDate
```

## 5. Application Structure ✅ IMPLEMENTED

```
src/
├── main/                          # Electron main process
│   ├── main.js                   # Main entry point
│   ├── menu.js                   # Application menu
│   └── windows/                  # Window management
├── renderer/                     # React frontend ✅
│   ├── components/               # Reusable UI components
│   │   ├── common/              # Generic components
│   │   ├── timer/               # Timer-specific components
│   │   ├── projects/            # Project management
│   │   ├── reports/             # Reporting components
│   │   └── invoices/            # Invoice components
│   ├── pages/                   # Main application pages ✅
│   │   ├── Dashboard.tsx        # ✅ Basic dashboard
│   │   ├── TimeTrackingNew.tsx  # ✅ Full time tracking interface
│   │   ├── Projects.tsx         # 🚧 Placeholder
│   │   ├── Reports.tsx          # 🚧 Placeholder
│   │   ├── Invoices.tsx         # 🚧 Placeholder
│   │   └── Settings.tsx         # 📋 Planned
│   ├── context/                 # React Context ✅
│   │   └── AppContext.tsx       # ✅ Main state management
│   ├── services/                # API services
│   ├── utils/                   # Utility functions
│   └── types/                   # TypeScript type definitions ✅
├── preload/                     # Electron preload scripts ✅
└── shared/                      # Shared utilities
```

## 6. Development Phases

### Phase 1: Foundation ✅ COMPLETED (Weeks 1-2)
- [x] Set up React + TypeScript in Electron
- [x] Configure Tailwind CSS and component library
- [x] Implement basic routing and navigation
- [x] Set up React Context state management
- [x] Create error boundary system

### Phase 2: Core Time Tracking ✅ COMPLETED (Weeks 3-4)
- [x] Build timer interface (start/stop/pause)
- [x] Implement manual time entry forms
- [x] Create project selection and management
- [x] Add time entry validation and storage
- [x] Build daily/weekly timesheet views
- [x] Implement time entry CRUD operations
- [x] Add billable/non-billable categorization
- [x] Create time summary and analytics

### Phase 3: Project & Client Management 🚧 IN PROGRESS (Weeks 5-6)
- [ ] Client management interface
- [ ] Project creation and editing
- [ ] User and team management
- [ ] Permission system implementation
- [ ] Project assignment workflows

### Phase 4: Approval Workflow (Week 7)
- [ ] Time entry submission system
- [ ] Manager approval interface
- [ ] Status tracking and notifications
- [ ] Approval history and audit trail

### Phase 5: Reporting (Weeks 8-9)
- [ ] Basic time reports (user, project, date range)
- [ ] Charts and visualizations
- [ ] Export functionality (PDF, CSV)
- [ ] Advanced analytics and insights

### Phase 6: Invoicing (Weeks 10-11)
- [ ] Invoice generation from approved time
- [ ] Customizable invoice templates
- [ ] Invoice management (send, track, payment)
- [ ] Integration with payment systems (future)

### Phase 7: Polish & Testing (Week 12)
- [ ] UI/UX improvements
- [ ] Performance optimization
- [ ] Comprehensive testing
- [ ] Documentation and deployment

### Phase 8: User Management & Administration (Weeks 13-14) ✅ NEW PHASE
- [ ] **User Profile Management Interface**
  - Personal information editing (name, email, contact details)
  - Profile picture upload and management
  - Hourly rate configuration
  - Department and team assignment
  - User preferences and settings

- [ ] **User Creation & Onboarding System**
  - Admin-only user creation interface
  - Email invitation system for new users
  - Initial password setup and account activation
  - Onboarding checklist and guided setup
  - Welcome email templates and notifications

- [ ] **Role Assignment & Permission System**
  - Role selection interface (Admin, Manager, Employee)
  - Permission matrix configuration
  - Feature-level access control
  - Project-specific permissions
  - Time entry approval permissions by team

- [ ] **Team Structure Management**
  - Team creation and editing interface
  - Hierarchical team organization
  - Manager assignment and delegation
  - Team member addition and removal
  - Cross-team collaboration settings

- [ ] **User Status & Activity Management**
  - User status control (active/inactive/suspended)
  - Login history and activity tracking
  - Last activity timestamp monitoring
  - Session management and timeout settings
  - Security event logging

- [ ] **Advanced User Administration**
  - Bulk user import from CSV/Excel
  - User directory with advanced search
  - Bulk status updates and operations
  - User analytics and performance metrics
  - Deactivation and offboarding workflows

## 7. Current Implementation Status

### ✅ Working Features
1. **Timer System**
   - Start/stop timer with project selection
   - Real-time elapsed time display
   - Automatic time entry creation on stop
   - Visual feedback for running state

2. **Time Entry Management**
   - View all time entries with project details
   - Delete time entries with confirmation
   - Submit entries for approval
   - Billable/non-billable categorization
   - Status tracking (draft, submitted, approved)

3. **Project System**
   - Project selection dropdown
   - Project details (name, client, hourly rate)
   - Active/inactive project filtering

4. **State Management**
   - React Context with useReducer
   - Type-safe actions and state
   - Proper error handling
   - Component isolation

5. **UI/UX**
   - Modern, responsive design
   - Tailwind CSS styling
   - Error boundaries
   - Loading states and feedback

### 🚧 In Development
- Advanced time entry editing
- Project management interface
- Client management system
- User authentication integration

## 8. Key Dependencies & Stability Management

### Current Dependencies ✅ (All Stable Versions)

```json
{
  "dependencies": {
    "@headlessui/react": "^2.2.4",
    "@heroicons/react": "^2.2.0",
    "@hookform/resolvers": "^5.0.1",
    "@reduxjs/toolkit": "^2.8.2",
    "@types/react": "^19.1.5",
    "@types/react-dom": "^19.1.5",
    "aws-amplify": "^6.14.4",
    "chart.js": "^4.4.9",
    "date-fns": "^4.1.0",
    "electron-log": "^5.2.4",
    "electron-store": "^8.2.0",
    "electron-updater": "^6.3.9",
    "jspdf": "^3.0.1",
    "react": "^19.1.0",
    "react-chartjs-2": "^5.3.0",
    "react-dom": "^19.1.0",
    "react-hook-form": "^7.56.4",
    "react-redux": "^9.2.0",
    "react-router-dom": "^7.6.0",
    "redux-persist": "^6.0.0",
    "typescript": "^5.8.3",
    "xlsx": "^0.18.5",
    "zod": "^3.25.23"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@tailwindcss/forms": "^0.5.10",
    "@tailwindcss/typography": "^0.5.16",
    "@types/node": "^22.15.21",
    "autoprefixer": "^10.4.21",
    "concurrently": "^9.1.2",
    "css-loader": "^7.1.2",
    "electron": "^36.3.1",
    "electron-builder": "^25.1.8",
    "electron-reload": "^1.5.0",
    "electronmon": "^2.0.2",
    "eslint": "^8.57.0",
    "events": "^3.3.0",
    "html-webpack-plugin": "^5.6.3",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "playwright": "^1.40.0",
    "postcss": "^8.5.3",
    "postcss-loader": "^8.1.1",
    "style-loader": "^4.0.0",
    "tailwindcss": "^3.4.17",
    "ts-loader": "^9.5.2",
    "wait-on": "^8.0.3",
    "webpack": "^5.99.9",
    "webpack-cli": "^6.0.1",
    "webpack-dev-server": "^5.2.1"
  }
}
```

### 🔒 Dependency Stability Management

**Policy**: This project enforces **stable-only dependencies** for maximum reliability.

#### ✅ Stability Achievements
- **Zero unstable dependencies**: All alpha/beta/RC versions eliminated
- **Automated monitoring**: `npm run check-deps` script prevents unstable packages
- **Security tracking**: Regular `npm audit` for vulnerability monitoring
- **Breaking change management**: Systematic approach to major version updates

#### ⚠️ Known Issues
- **xlsx package**: Security vulnerabilities (Prototype Pollution & ReDoS)
  - **Status**: No upstream fix available
  - **Alternatives**: Evaluating `exceljs` or `papaparse`
  - **Risk**: Documented and accepted pending replacement

#### 🛠️ Dependency Tools
```bash
# Check for unstable dependencies
npm run check-deps

# Security audit
npm audit

# Check for updates
npm outdated
```

#### 📋 Recent Dependency Actions
- ✅ **electron-reload**: Replaced alpha version `2.0.0-alpha.1` → stable `1.5.0`
- ✅ **electron**: Updated to latest patch `36.3.1`
- ⚠️ **electron-store**: Reverted from `10.0.1` to `8.2.0` (v10+ is ESM-only breaking change)

#### 🔮 Planned Major Updates
- **electron-store v10+**: Requires ESM migration (planned for separate phase)
- **ESLint 9.x**: Major version update (breaking changes)
- **Tailwind CSS 4.x**: Major version update (significant changes expected)

📚 **See [DEPENDENCY_ANALYSIS.md](./DEPENDENCY_ANALYSIS.md) for comprehensive analysis**

## 9. AWS Backend Structure (Separate Repository)

### Infrastructure Components
- **API Gateway**: RESTful API endpoints
- **Lambda Functions**: Business logic
- **DynamoDB**: Data storage
- **Cognito**: User authentication
- **S3**: File storage for invoices/reports
- **SES**: Email notifications
- **CloudWatch**: Logging and monitoring

### API Endpoints ✅ ENHANCED FOR PHASE 8
```
Authentication:
POST /auth/login
POST /auth/logout
POST /auth/refresh

Users: ✅ ENHANCED
GET /users                    # List all users (admin/manager only)
POST /users                   # Create new user (admin only)
PUT /users/{id}              # Update user profile
DELETE /users/{id}           # Deactivate user (admin only)
GET /users/{id}/profile      # Get user profile
PUT /users/{id}/profile      # Update user profile
PUT /users/{id}/permissions  # Update user permissions (admin only)
PUT /users/{id}/role        # Update user role (admin only)
POST /users/invite          # Send user invitation (admin only)
GET /users/invitations      # List pending invitations

Teams: ✅ NEW
GET /teams                   # List all teams
POST /teams                  # Create new team (admin/manager only)
PUT /teams/{id}             # Update team details
DELETE /teams/{id}          # Delete team (admin only)
POST /teams/{id}/members    # Add team member
DELETE /teams/{id}/members/{userId}  # Remove team member
GET /teams/{id}/members     # List team members

Sessions: ✅ NEW
GET /sessions               # List active sessions (admin only)
DELETE /sessions/{id}       # Logout specific session
GET /users/{id}/sessions    # User's active sessions
POST /users/{id}/logout-all # Logout all user sessions

Activity: ✅ NEW
GET /activity               # System activity log (admin only)
GET /users/{id}/activity    # User activity history

Projects:
GET /projects
POST /projects
PUT /projects/{id}
DELETE /projects/{id}

Time Entries:
GET /time-entries
POST /time-entries
PUT /time-entries/{id}
DELETE /time-entries/{id}

Reports:
GET /reports/time
GET /reports/projects
GET /reports/users

Invoices:
GET /invoices
POST /invoices
PUT /invoices/{id}
POST /invoices/{id}/send
```

## 10. Security Considerations ✅ ENHANCED FOR PHASE 8

- **Data Encryption**: All data encrypted in transit and at rest
- **Authentication**: AWS Cognito with MFA
- **Authorization**: Enhanced role-based access control with granular permissions
- **API Security**: JWT tokens, rate limiting, request validation
- **Local Storage**: Encrypted local data storage
- **Audit Logging**: Track all user actions and administrative changes
- **Session Management**: Secure session handling with timeout controls
- **User Permissions**: Feature-level and project-level access control
- **Password Policies**: Strong password requirements and rotation
- **Account Security**: Account lockout, suspicious activity detection

## 11. Deployment Strategy

### Desktop App
- **macOS**: Code signing and notarization
- **Windows**: Code signing with certificate
- **Auto-updates**: Using electron-updater
- **Distribution**: Direct download or Mac App Store

### Backend
- **Infrastructure as Code**: AWS CDK or Terraform
- **CI/CD Pipeline**: GitHub Actions or AWS CodePipeline
- **Environment Management**: Dev, Staging, Production
- **Monitoring**: CloudWatch dashboards and alerts

## 12. Future Enhancements

- **Mobile App**: React Native companion app
- **Integrations**: QuickBooks, Xero, Slack, Jira
- **Advanced Analytics**: Machine learning insights
- **API Access**: Public API for third-party integrations
- **White-label**: Customizable branding for resellers
- **Single Sign-On**: Enterprise SSO integration
- **Advanced Reporting**: Custom report builder
- **Workflow Automation**: Automated approval and notification rules

## 13. Success Metrics ✅ ENHANCED FOR PHASE 8

- **User Adoption**: Number of active users
- **Time Tracking Accuracy**: Percentage of billable time captured
- **Invoice Generation**: Time from work completion to invoice
- **User Satisfaction**: App store ratings and user feedback
- **Performance**: App responsiveness and reliability
- **User Management Efficiency**: Time to onboard new users
- **Permission Compliance**: Proper access control adherence
- **Team Productivity**: Manager oversight and team performance metrics
- **Security Metrics**: Login success rates, security incidents
- **Administrative Efficiency**: Bulk operations and user management speed

---

This plan provides a comprehensive roadmap for developing a professional time tracking application that can compete with established solutions while being tailored to Aerotage Design Group's specific needs. The React Context implementation provides a solid foundation for the current scope while remaining scalable for future enhancements. **Phase 8 adds essential user management capabilities** that transform the application into a complete enterprise solution with proper user administration, team management, and security controls.