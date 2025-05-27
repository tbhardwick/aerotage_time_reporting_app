import React, { useEffect, useState } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import { fetchAuthSession } from 'aws-amplify/auth';
import { LoginForm } from './LoginForm';
import { useAppContext } from '../../context/AppContext';
import { decodeJWTPayload } from '../../utils/jwt';
import { clearBootstrapErrorIfLoggedIn } from '../../utils/bootstrapUtils';
import { useDataLoader } from '../../hooks/useDataLoader';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const { state, dispatch } = useAppContext();
  const { loadCurrentUser } = useDataLoader();

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
      
      // Try to load real user data from API
      try {
        console.log('🔄 Loading real user data from API...');
        const realUserData = await loadCurrentUser();
        console.log('✅ Real user data loaded:', realUserData);
        setIsAuthenticated(true);
      } catch (apiError: any) {
        console.warn('⚠️ Failed to load user data from API, using fallback:', apiError.message);
        
        // Create fallback user object for context if API fails
        const fallbackUser = {
          id: userId,
          email: email,
          name: name,
          role: 'employee' as const, // Default role when API is unavailable
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
        
        console.log('⚠️ Setting fallback user in context:', fallbackUser);
        
        // Set fallback user in context
        dispatch({ type: 'SET_USER', payload: fallbackUser });
        setIsAuthenticated(true);
      }
      
      // Clear any old bootstrap errors since user is successfully authenticated
      clearBootstrapErrorIfLoggedIn();
      
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