import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TimerState } from '../../types';

const initialState: TimerState = {
  isRunning: false,
  startTime: null,
  pausedDuration: 0,
  currentProjectId: null,
  currentDescription: '',
};

const timerSlice = createSlice({
  name: 'timer',
  initialState,
  reducers: {
    startTimer: (state, action: PayloadAction<{ projectId: string; description?: string }>) => {
      state.isRunning = true;
      state.startTime = new Date().toISOString();
      state.currentProjectId = action.payload.projectId;
      state.currentDescription = action.payload.description || '';
      state.pausedDuration = 0;
    },
    pauseTimer: (state) => {
      if (state.isRunning && state.startTime) {
        const now = new Date().getTime();
        const start = new Date(state.startTime).getTime();
        const currentDuration = Math.floor((now - start) / 1000 / 60); // in minutes
        state.pausedDuration += currentDuration;
        state.isRunning = false;
        state.startTime = null;
      }
    },
    resumeTimer: (state) => {
      if (!state.isRunning) {
        state.isRunning = true;
        state.startTime = new Date().toISOString();
      }
    },
    stopTimer: (state) => {
      state.isRunning = false;
      state.startTime = null;
      state.pausedDuration = 0;
      state.currentProjectId = null;
      state.currentDescription = '';
    },
    updateDescription: (state, action: PayloadAction<string>) => {
      state.currentDescription = action.payload;
    },
    updateProject: (state, action: PayloadAction<string>) => {
      state.currentProjectId = action.payload;
    },
  },
});

export const {
  startTimer,
  pauseTimer,
  resumeTimer,
  stopTimer,
  updateDescription,
  updateProject,
} = timerSlice.actions;

// Selectors
export const selectTimerState = (state: { timer: TimerState }) => state.timer;
export const selectIsTimerRunning = (state: { timer: TimerState }) => state.timer.isRunning;
export const selectCurrentDuration = (state: { timer: TimerState }) => {
  const timer = state.timer;
  if (!timer.startTime) return timer.pausedDuration;
  
  const now = new Date().getTime();
  const start = new Date(timer.startTime).getTime();
  const currentDuration = Math.floor((now - start) / 1000 / 60); // in minutes
  return timer.pausedDuration + currentDuration;
};

export default timerSlice.reducer; 