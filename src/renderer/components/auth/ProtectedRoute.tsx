import React, { useEffect, useState } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import { fetchAuthSession } from 'aws-amplify/auth';
import { LoginForm } from './LoginForm';
import { useAppContext } from '../../context/AppContext';
import { decodeJWTPayload } from '../../utils/jwt';
import { clearBootstrapErrorIfLoggedIn } from '../../utils/bootstrapUtils';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const { state, dispatch } = useAppContext();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const amplifyUser = await getCurrentUser();
      console.log('🔍 Amplify user:', amplifyUser);
      
      // Get the JWT token to extract the correct user ID
      const session = await fetchAuthSession({ forceRefresh: false });
      const token = session.tokens?.idToken?.toString();
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      // Extract user ID from JWT token (this matches what backend expects)
      const tokenPayload = decodeJWTPayload(token);
      if (!tokenPayload || !tokenPayload.sub) {
        throw new Error('Invalid token payload');
      }
      
      const userId = tokenPayload.sub;
      const email = tokenPayload.email || amplifyUser.signInDetails?.loginId || 'user@example.com';
      const name = tokenPayload.name || amplifyUser.signInDetails?.loginId?.split('@')[0] || 'Test User';
      
      console.log('🔍 User ID from token:', userId);
      console.log('🔍 Email from token:', email);
      
      // Create user object for context
      const user = {
        id: userId,
        email: email,
        name: name,
        role: 'employee' as const, // Default role, will be updated from API
        hourlyRate: 50,
        teamId: undefined,
        department: undefined,
        isActive: true,
        contactInfo: {},
        profilePicture: undefined,
        jobTitle: undefined,
        startDate: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        permissions: {
          features: ['timeTracking', 'approvals', 'reporting'],
          projects: [],
        },
        preferences: {
          theme: 'light' as const,
          notifications: true,
          timezone: 'UTC',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
      };
      
      console.log('✅ Setting user in context:', user);
      
      // Set user in context
      dispatch({ type: 'SET_USER', payload: user });
      
      // Clear any old bootstrap errors since user is successfully authenticated
      clearBootstrapErrorIfLoggedIn();
      
      setIsAuthenticated(true);
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      setIsAuthenticated(false);
      dispatch({ type: 'SET_USER', payload: null });
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    // Re-check auth status to get user data and set in context
    checkAuthStatus();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  return <>{children}</>;
}; 