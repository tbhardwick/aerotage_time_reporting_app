# Aerotage Time Reporting - Authentication & API Integration

## 🎯 Overview

This guide will help you connect the Aerotage Time Reporting frontend application to the AWS serverless backend with full authentication integration.

## 🚀 Quick Start

### Prerequisites

1. **AWS CLI** configured with appropriate permissions
2. **Node.js 18+** installed
3. **AWS CDK** (will be installed automatically if needed)

### Step 1: Deploy Backend Infrastructure

Run the automated setup script:

```bash
./setup-backend.sh
```

This script will:
- ✅ Deploy AWS infrastructure (Cognito, API Gateway, DynamoDB, etc.)
- ✅ Create an initial admin user
- ✅ Update frontend configuration automatically
- ⏱️ Takes approximately 10-15 minutes

### Step 2: Start the Application

```bash
npm run dev
```

### Step 3: Login

- **Email**: `admin@aerotage.com`
- **Temporary Password**: `TempPassword123!`
- You'll be prompted to set a new password on first login

## 🔧 What Was Configured

### Backend Infrastructure

1. **AWS Cognito** - User authentication and authorization
2. **API Gateway** - RESTful API endpoints
3. **Lambda Functions** - Business logic (33 endpoints)
4. **DynamoDB** - Data storage (9 tables)
5. **S3 Buckets** - File storage
6. **CloudWatch** - Monitoring and logging

### Frontend Integration

1. **AWS Amplify** - Configured for authentication and API calls
2. **Login Form** - Professional login interface with MFA support
3. **Protected Routes** - Automatic authentication checking
4. **API Client** - Complete service layer for backend communication
5. **Logout Functionality** - Secure session termination

## 🔐 Authentication Features

### Login Process
- Email/password authentication
- Automatic new password setup for first-time users
- MFA support (SMS and TOTP)
- Remember device functionality
- Secure session management

### User Roles
- **Admin** - Full system access, user management
- **Manager** - Team oversight, approval capabilities  
- **Employee** - Time tracking and basic features

### Security Features
- JWT token-based authentication
- Automatic token refresh
- Session timeout and monitoring
- Password policies and complexity requirements
- Account lockout protection

## 📡 API Integration

### Service Layer
The `apiClient` provides methods for:

```typescript
// Authentication
await apiClient.getCurrentUser()

// Time Entries
await apiClient.getTimeEntries()
await apiClient.createTimeEntry(entry)
await apiClient.updateTimeEntry(id, updates)
await apiClient.deleteTimeEntry(id)

// Projects & Clients
await apiClient.getProjects()
await apiClient.createProject(project)
await apiClient.getClients()
await apiClient.createClient(client)

// Approval Workflow
await apiClient.submitTimeEntries(entryIds)
await apiClient.approveTimeEntries(entryIds, comment)
await apiClient.rejectTimeEntries(entryIds, comment)

// Reports & Analytics
await apiClient.getTimeReports(filters)
await apiClient.exportReport('pdf', filters)

// Invoicing
await apiClient.getInvoices()
await apiClient.createInvoice(invoice)
await apiClient.sendInvoice(id)
```

### Error Handling
- Automatic retry logic for network failures
- Proper error messages for user feedback
- Authentication error handling with redirect to login
- Loading states and progress indicators

## 🎨 UI/UX Features

### Login Interface
- Modern, responsive design
- Clear error messages
- Loading states and feedback
- Accessibility compliance (ARIA labels, keyboard navigation)
- Professional branding

### Navigation
- Role-based menu visibility
- Active state indicators
- Logout button with confirmation
- Responsive design for different screen sizes

### Protected Content
- Automatic authentication checking
- Seamless redirect to login when needed
- Loading states during authentication verification
- Error boundaries for graceful failure handling

## 🛠️ Development Workflow

### Local Development
```bash
# Start frontend with hot reload
npm run dev

# Run tests
npm test

# Check backend status
cd infrastructure && cdk list
```

### Environment Management
- **Development**: Automatic deployment with setup script
- **Staging**: `cd infrastructure && npm run deploy:staging`
- **Production**: `cd infrastructure && npm run deploy:prod`

### User Management
1. Login as admin
2. Navigate to Users section
3. Create new users with appropriate roles
4. Assign to teams and projects
5. Configure permissions and access levels

## 🔍 Troubleshooting

### Common Issues

#### Login Fails
- Verify AWS CLI is configured correctly
- Check if backend is deployed: `cd infrastructure && cdk list`
- Verify user exists in Cognito console
- Check browser console for detailed error messages

#### API Calls Fail
- Verify API Gateway URL in `aws-config.ts`
- Check CloudWatch logs for Lambda errors
- Ensure user has proper permissions for the endpoint
- Verify authentication token is valid

#### Build Errors
- Clear node_modules: `rm -rf node_modules && npm install`
- Check TypeScript configuration for JSX support
- Verify all AWS Amplify dependencies are installed

### Helpful Commands

```bash
# Check AWS authentication
aws sts get-caller-identity

# View deployed stacks
cd infrastructure && cdk list

# Check CloudWatch logs
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/aerotage

# Reset user password (admin only)
aws cognito-idp admin-set-user-password \
  --user-pool-id <USER_POOL_ID> \
  --username <EMAIL> \
  --password <NEW_PASSWORD> \
  --permanent
```

## 📊 Monitoring & Maintenance

### CloudWatch Dashboard
- Access via AWS Console > CloudWatch > Dashboards > AerotageTimeAPI-dev
- Monitor API performance, error rates, and Lambda metrics
- Set up custom alerts for production environments

### User Activity
- Login/logout tracking
- API usage monitoring
- Error rate analysis
- Performance optimization insights

### Cost Management
- DynamoDB on-demand pricing
- Lambda execution costs
- S3 storage optimization
- Regular cost analysis and optimization

## 🎉 Next Steps

1. **Create Additional Users** - Set up your team with appropriate roles
2. **Configure Projects** - Add clients and projects for time tracking
3. **Test Workflows** - Verify time entry, approval, and reporting features
4. **Customize Settings** - Configure hourly rates, teams, and permissions
5. **Production Deployment** - Deploy to staging/production when ready

## 📞 Support

- **AWS Console**: Monitor infrastructure health and logs
- **CloudWatch**: Track performance and errors
- **API Documentation**: See `infrastructure/API_REFERENCE.md`
- **Deployment Guide**: See `infrastructure/DEPLOYMENT_GUIDE.md`

---

Your Aerotage Time Reporting application is now fully connected to AWS with enterprise-grade authentication and a complete API backend! 🚀 