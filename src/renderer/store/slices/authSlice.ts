import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User } from '../../types';

// Mock users for development
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@aerotage.com',
    name: 'John Admin',
    role: 'admin',
    hourlyRate: 150,
    teamId: '1',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    email: 'manager@aerotage.com',
    name: 'Sarah Manager',
    role: 'manager',
    hourlyRate: 125,
    teamId: '1',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    email: 'engineer@aerotage.com',
    name: 'Mike Engineer',
    role: 'employee',
    hourlyRate: 100,
    teamId: '1',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  token: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = null;
      state.isLoading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  clearError,
  updateUser,
} = authSlice.actions;

// Mock authentication thunk
export const mockLogin = (email: string, password: string) => (dispatch: any) => {
  dispatch(loginStart());
  
  // Simulate API call delay
  setTimeout(() => {
    const user = mockUsers.find(u => u.email === email);
    
    if (user && password === 'password123') {
      const token = `mock-token-${user.id}-${Date.now()}`;
      dispatch(loginSuccess({ user, token }));
    } else {
      dispatch(loginFailure('Invalid email or password'));
    }
  }, 1000);
};

export default authSlice.reducer; 