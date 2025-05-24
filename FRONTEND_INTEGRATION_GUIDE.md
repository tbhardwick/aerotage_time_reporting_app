# Frontend Integration Guide

## 🎯 **Connect Your Electron App to AWS Backend**

Your AWS backend is now live! Follow these steps to integrate your frontend application with the deployed infrastructure.

## 🔗 **Backend Configuration**

### **Environment Variables**

Create or update your frontend configuration with these live endpoints:

```typescript
// src/config/aws-config.ts
export const awsConfig = {
  // API Gateway
  apiGatewayUrl: 'https://0sty9mf3f7.execute-api.us-east-1.amazonaws.com/dev/',
  
  // Cognito Authentication
  region: 'us-east-1',
  userPoolId: 'us-east-1_EsdlgX9Qg',
  userPoolClientId: '148r35u6uultp1rmfdu22i8amb',
  identityPoolId: 'us-east-1:d79776bb-4b8e-4654-a10a-a45b1adaa787',
  
  // Optional: S3 Buckets (for file uploads)
  storageBucket: 'aerotage-time-storage-dev',
  invoicesBucket: 'aerotage-time-invoices-dev',
  exportsBucket: 'aerotage-time-exports-dev',
};
```

### **AWS Amplify Configuration**

Install and configure AWS Amplify in your Electron app:

```bash
cd ../  # Go back to main project directory
npm install aws-amplify @aws-amplify/ui-react
```

Configure Amplify in your main App component:

```typescript
// src/renderer/App.tsx
import { Amplify } from 'aws-amplify';
import { awsConfig } from './config/aws-config';

// Configure Amplify
Amplify.configure({
  Auth: {
    region: awsConfig.region,
    userPoolId: awsConfig.userPoolId,
    userPoolWebClientId: awsConfig.userPoolClientId,
    identityPoolId: awsConfig.identityPoolId,
  },
  API: {
    endpoints: [
      {
        name: 'AerotageAPI',
        endpoint: awsConfig.apiGatewayUrl,
        region: awsConfig.region,
      }
    ]
  }
});
```

## 🔐 **Authentication Integration**

### **Login Component Update**

```typescript
// src/renderer/components/auth/LoginForm.tsx
import { Auth } from 'aws-amplify';

export const LoginForm: React.FC = () => {
  const handleLogin = async (email: string, password: string) => {
    try {
      const user = await Auth.signIn(email, password);
      console.log('Login successful:', user);
      // Update your AppContext with user data
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  // Your existing login form JSX
};
```

### **Protected Routes**

```typescript
// src/renderer/components/auth/ProtectedRoute.tsx
import { Auth } from 'aws-amplify';
import { useEffect, useState } from 'react';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      await Auth.currentAuthenticatedUser();
      setIsAuthenticated(true);
    } catch {
      setIsAuthenticated(false);
    }
    setLoading(false);
  };

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <LoginForm />;
  
  return <>{children}</>;
};
```

## 📡 **API Service Layer**

### **API Client**

```typescript
// src/renderer/services/api-client.ts
import { API, Auth } from 'aws-amplify';

class AerotageApiClient {
  private apiName = 'AerotageAPI';

  async request<T>(path: string, options: any = {}): Promise<T> {
    try {
      const response = await API.get(this.apiName, path, {
        headers: {
          Authorization: `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}`,
        },
        ...options,
      });
      return response;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Time Entries
  async getTimeEntries(filters?: any) {
    const params = filters ? `?${new URLSearchParams(filters)}` : '';
    return this.request(`/time-entries${params}`);
  }

  async createTimeEntry(entry: any) {
    return this.request('/time-entries', {
      body: entry,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Projects
  async getProjects() {
    return this.request('/projects');
  }

  async createProject(project: any) {
    return this.request('/projects', {
      body: project,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Add methods for all other endpoints...
}

export const apiClient = new AerotageApiClient();
```

### **Context Integration**

Update your AppContext to use the real API:

```typescript
// src/renderer/context/AppContext.tsx
import { apiClient } from '../services/api-client';

// Update your reducer actions to call the API
const handleAddTimeEntry = async (entry: TimeEntry) => {
  try {
    const newEntry = await apiClient.createTimeEntry(entry);
    dispatch({ type: 'ADD_TIME_ENTRY', payload: newEntry });
  } catch (error) {
    console.error('Failed to create time entry:', error);
  }
};
```

## 🧪 **Testing the Integration**

### **Create Test Admin User**

First, create an admin user in AWS Console:

```bash
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_EsdlgX9Qg \
  --username admin@aerotage.com \
  --user-attributes Name=email,Value=admin@aerotage.com Name=given_name,Value=Admin Name=family_name,Value=User \
  --temporary-password TempPassword123! \
  --message-action SUPPRESS --profile aerotage-dev

aws cognito-idp admin-add-user-to-group \
  --user-pool-id us-east-1_EsdlgX9Qg \
  --username admin@aerotage.com \
  --group-name admin --profile aerotage-dev
```

### **Test API Endpoints**

You can test the API endpoints using curl:

```bash
# Get JWT token first (after login)
curl -X GET "https://0sty9mf3f7.execute-api.us-east-1.amazonaws.com/dev/users" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🚀 **Next Steps**

1. **Update Frontend**: Implement the API integration in your Electron app
2. **Test Authentication**: Verify login/logout functionality works
3. **Test CRUD Operations**: Verify time entries, projects, clients work
4. **Deploy to Production**: Once tested, deploy backend to prod environment

## 📊 **Monitoring & Debugging**

- **CloudWatch Logs**: Monitor Lambda function logs for errors
- **API Gateway**: Check API Gateway logs for request/response details
- **Dashboard**: Use the CloudWatch dashboard for system health

**Dashboard URL**: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=AerotageTimeAPI-dev

Your backend is now live and ready for integration! 🎉 