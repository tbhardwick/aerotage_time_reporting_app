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
- **State Management**: Redux Toolkit + RTK Query
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

### 2.2 Time Tracking
- **Timer Interface** (start/stop/pause)
- **Manual Time Entry** (add time retroactively)
- **Time Categories** (billable/non-billable)
- **Project Selection** dropdown
- **Task Description** text field
- **Daily/Weekly Time Sheets**
- **Time Approval Workflow** (submit → review → approve)

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

## 3. Database Schema (DynamoDB)

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

## 4. Application Structure

```
src/
├── main/                          # Electron main process
│   ├── main.js                   # Main entry point
│   ├── menu.js                   # Application menu
│   └── windows/                  # Window management
├── renderer/                     # React frontend
│   ├── components/               # Reusable UI components
│   │   ├── common/              # Generic components
│   │   ├── timer/               # Timer-specific components
│   │   ├── projects/            # Project management
│   │   ├── reports/             # Reporting components
│   │   └── invoices/            # Invoice components
│   ├── pages/                   # Main application pages
│   │   ├── Dashboard.tsx
│   │   ├── TimeTracking.tsx
│   │   ├── Projects.tsx
│   │   ├── Reports.tsx
│   │   ├── Invoices.tsx
│   │   └── Settings.tsx
│   ├── store/                   # Redux store
│   │   ├── slices/              # Feature-based slices
│   │   └── api/                 # RTK Query API definitions
│   ├── services/                # API services
│   ├── utils/                   # Utility functions
│   └── types/                   # TypeScript type definitions
├── preload/                     # Electron preload scripts
└── shared/                      # Shared utilities
```

## 5. Development Phases

### Phase 1: Foundation (Weeks 1-2)
- [ ] Set up React + TypeScript in Electron
- [ ] Configure Tailwind CSS and component library
- [ ] Implement basic routing and navigation
- [ ] Create authentication flow with AWS Cognito
- [ ] Set up Redux store and basic state management

### Phase 2: Core Time Tracking (Weeks 3-4)
- [ ] Build timer interface (start/stop/pause)
- [ ] Implement manual time entry forms
- [ ] Create project selection and management
- [ ] Add time entry validation and storage
- [ ] Build daily/weekly timesheet views

### Phase 3: Project & Client Management (Weeks 5-6)
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

## 6. Key Dependencies to Add

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@reduxjs/toolkit": "^1.9.7",
    "react-redux": "^8.1.3",
    "react-router-dom": "^6.16.0",
    "react-hook-form": "^7.47.0",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.2",
    "tailwindcss": "^3.3.5",
    "@headlessui/react": "^1.7.17",
    "@heroicons/react": "^2.0.18",
    "date-fns": "^2.30.0",
    "chart.js": "^4.4.0",
    "react-chartjs-2": "^5.2.0",
    "aws-amplify": "^5.3.11",
    "jspdf": "^2.5.1",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@types/react": "^18.2.31",
    "@types/react-dom": "^18.2.14",
    "typescript": "^5.2.2",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31"
  }
}
```

## 7. AWS Backend Structure (Separate Repository)

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

## 8. Security Considerations

- **Data Encryption**: All data encrypted in transit and at rest
- **Authentication**: AWS Cognito with MFA
- **Authorization**: Role-based access control
- **API Security**: JWT tokens, rate limiting
- **Local Storage**: Encrypted local data storage
- **Audit Logging**: Track all user actions

## 9. Deployment Strategy

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

## 10. Future Enhancements

- **Mobile App**: React Native companion app
- **Integrations**: QuickBooks, Xero, Slack, Jira
- **Advanced Analytics**: Machine learning insights
- **API Access**: Public API for third-party integrations
- **White-label**: Customizable branding for resellers

## 11. Success Metrics

- **User Adoption**: Number of active users
- **Time Tracking Accuracy**: Percentage of billable time captured
- **Invoice Generation**: Time from work completion to invoice
- **User Satisfaction**: App store ratings and user feedback
- **Performance**: App responsiveness and reliability

---

This plan provides a comprehensive roadmap for developing a professional time tracking application that can compete with established solutions while being tailored to Aerotage Design Group's specific needs. 