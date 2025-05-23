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

### 2.4 Team Management
- **User Profiles** (contact info, hourly rates)
- **Team Assignment** (users to projects)
- **Permission Management** (view/edit access)
- **Manager Dashboard** (team time overview)

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
Users
- PK: userId
- email, name, role, hourlyRate, teamId, isActive

Clients
- PK: clientId
- name, contactInfo, billingAddress, isActive

Projects
- PK: projectId
- clientId, name, description, budget, hourlyRate, status

TimeEntries
- PK: timeEntryId
- userId, projectId, date, startTime, endTime, duration, description, isBillable, status

Teams
- PK: teamId
- name, managerId, memberIds[]

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

## 8. Key Dependencies (Current)

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.16.0",
    "tailwindcss": "^3.3.5",
    "@types/react": "^18.2.31",
    "@types/react-dom": "^18.2.14",
    "typescript": "^5.2.2"
  },
  "devDependencies": {
    "electron": "^27.0.0",
    "webpack": "^5.89.0",
    "webpack-dev-server": "^4.15.1",
    "concurrently": "^8.2.2",
    "electronmon": "^2.0.2"
  }
}
```

### Future Dependencies
```json
{
  "planned": {
    "react-hook-form": "^7.47.0",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.2",
    "@headlessui/react": "^1.7.17",
    "@heroicons/react": "^2.0.18",
    "date-fns": "^2.30.0",
    "chart.js": "^4.4.0",
    "react-chartjs-2": "^5.2.0",
    "aws-amplify": "^5.3.11",
    "jspdf": "^2.5.1",
    "xlsx": "^0.18.5"
  }
}
```

## 9. AWS Backend Structure (Separate Repository)

### Infrastructure Components
- **API Gateway**: RESTful API endpoints
- **Lambda Functions**: Business logic
- **DynamoDB**: Data storage
- **Cognito**: User authentication
- **S3**: File storage for invoices/reports
- **SES**: Email notifications
- **CloudWatch**: Logging and monitoring

### API Endpoints
```
Authentication:
POST /auth/login
POST /auth/logout
POST /auth/refresh

Users:
GET /users
POST /users
PUT /users/{id}
DELETE /users/{id}

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

## 10. Security Considerations

- **Data Encryption**: All data encrypted in transit and at rest
- **Authentication**: AWS Cognito with MFA
- **Authorization**: Role-based access control
- **API Security**: JWT tokens, rate limiting
- **Local Storage**: Encrypted local data storage
- **Audit Logging**: Track all user actions

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

## 13. Success Metrics

- **User Adoption**: Number of active users
- **Time Tracking Accuracy**: Percentage of billable time captured
- **Invoice Generation**: Time from work completion to invoice
- **User Satisfaction**: App store ratings and user feedback
- **Performance**: App responsiveness and reliability

---

This plan provides a comprehensive roadmap for developing a professional time tracking application that can compete with established solutions while being tailored to Aerotage Design Group's specific needs. The React Context implementation provides a solid foundation for the current scope while remaining scalable for future enhancements. 