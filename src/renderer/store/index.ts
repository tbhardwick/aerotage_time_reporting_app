import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

// Import slices
import authSlice from './slices/authSlice';
import timerSlice from './slices/timerSlice';
import uiSlice from './slices/uiSlice';

// Import API slices
import { apiSlice } from './api/apiSlice';

// Configure store
export const store = configureStore({
  reducer: {
    auth: authSlice,
    timer: timerSlice,
    ui: uiSlice,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(apiSlice.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

// Setup listeners for RTK Query
setupListeners(store.dispatch);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 