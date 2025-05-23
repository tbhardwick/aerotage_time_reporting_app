import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Notification, LoadingState, ErrorState } from '../../types';

interface UIState {
  notifications: Notification[];
  loading: LoadingState;
  errors: ErrorState;
  sidebarOpen: boolean;
  currentPage: string;
}

const initialState: UIState = {
  notifications: [],
  loading: {},
  errors: {},
  sidebarOpen: true,
  currentPage: 'dashboard',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'createdAt'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    setLoading: (state, action: PayloadAction<{ key: string; isLoading: boolean }>) => {
      state.loading[action.payload.key] = action.payload.isLoading;
    },
    setError: (state, action: PayloadAction<{ key: string; error: string | null }>) => {
      state.errors[action.payload.key] = action.payload.error;
    },
    clearError: (state, action: PayloadAction<string>) => {
      delete state.errors[action.payload];
    },
    clearAllErrors: (state) => {
      state.errors = {};
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setCurrentPage: (state, action: PayloadAction<string>) => {
      state.currentPage = action.payload;
    },
  },
});

export const {
  addNotification,
  removeNotification,
  clearNotifications,
  setLoading,
  setError,
  clearError,
  clearAllErrors,
  toggleSidebar,
  setSidebarOpen,
  setCurrentPage,
} = uiSlice.actions;

// Selectors
export const selectNotifications = (state: { ui: UIState }) => state.ui.notifications;
export const selectLoading = (state: { ui: UIState }, key: string) => state.ui.loading[key] || false;
export const selectError = (state: { ui: UIState }, key: string) => state.ui.errors[key] || null;
export const selectSidebarOpen = (state: { ui: UIState }) => state.ui.sidebarOpen;
export const selectCurrentPage = (state: { ui: UIState }) => state.ui.currentPage;

export default uiSlice.reducer; 