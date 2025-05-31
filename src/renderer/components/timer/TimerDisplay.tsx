import React, { useState, useEffect } from 'react';
import { PlayIcon, PauseIcon, StopIcon } from '@heroicons/react/24/solid';
import { useAppContext } from '../../context/AppContext';

interface TimerDisplayProps {
  onTimeEntry?: (entry: { projectId: string; duration: number; description: string }) => void;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({ onTimeEntry }) => {
  const { state, dispatch } = useAppContext();
  const { timer } = state;
  const [displayTime, setDisplayTime] = useState(timer.elapsedTime);

  // Update display time every second when timer is running
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer.isRunning) {
      interval = setInterval(() => {
        const now = Date.now();
        const startTime = timer.startTime ? new Date(timer.startTime).getTime() : now;
        const elapsedMinutes = Math.floor((now - startTime) / 60000);
        setDisplayTime(elapsedMinutes);
        dispatch({ type: 'UPDATE_TIMER_TIME', payload: elapsedMinutes });
      }, 1000);
    } else {
      setDisplayTime(timer.elapsedTime);
    }
    return () => clearInterval(interval);
  }, [timer.isRunning, timer.startTime, timer.elapsedTime, dispatch]);

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (!timer.currentProjectId) {
      alert('Please select a project first');
      return;
    }
    dispatch({ 
      type: 'START_TIMER', 
      payload: {
        projectId: timer.currentProjectId,
        description: timer.currentDescription
      }
    });
  };

  const handlePause = () => {
    // For simplicity, we'll treat pause as stop for now
    handleStop();
  };

  const handleResume = () => {
    handleStart();
  };

  const handleStop = () => {
    if (displayTime > 0 && timer.currentProjectId) {
      // Save time entry
      onTimeEntry?.({
        projectId: timer.currentProjectId,
        duration: displayTime,
        description: timer.currentDescription
      });
    }
    dispatch({ type: 'STOP_TIMER' });
    setDisplayTime(0);
  };

  return (
    <div 
      className="rounded-lg shadow-lg p-6 border"
      style={{
        backgroundColor: 'var(--surface-color)',
        borderColor: 'var(--border-color)',
        boxShadow: 'var(--shadow)'
      }}
    >
      <div className="text-center">
        <div 
          className="text-6xl font-mono font-bold mb-6"
          style={{ color: 'var(--text-primary)' }}
        >
          {formatTime(displayTime)}
        </div>
        
        <div className="flex justify-center space-x-4">
          {!timer.isRunning ? (
            <button
              onClick={displayTime > 0 ? handleResume : handleStart}
              className="flex items-center px-6 py-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{
                backgroundColor: 'var(--color-success-600)',
                color: 'var(--color-text-on-success)',
                '--tw-ring-color': 'var(--color-success-600)'
              } as React.CSSProperties}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-success-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-success-600)';
              }}
              disabled={!timer.currentProjectId}
            >
              <PlayIcon className="w-5 h-5 mr-2" />
              {displayTime > 0 ? 'Resume' : 'Start'}
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex items-center px-6 py-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{
                backgroundColor: 'var(--color-warning-600)',
                color: 'var(--color-text-on-primary)',
                '--tw-ring-color': 'var(--color-warning-600)'
              } as React.CSSProperties}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-warning-700)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-warning-600)';
              }}
            >
              <PauseIcon className="w-5 h-5 mr-2" />
              Pause
            </button>
          )}
          
          {displayTime > 0 && (
            <button
              onClick={handleStop}
              className="flex items-center px-6 py-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{
                backgroundColor: 'var(--color-error-600)',
                color: 'var(--color-text-on-error)',
                '--tw-ring-color': 'var(--color-error-600)'
              } as React.CSSProperties}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-error-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-error-600)';
              }}
            >
              <StopIcon className="w-5 h-5 mr-2" />
              Stop
            </button>
          )}
        </div>
        
        {!timer.currentProjectId && (
          <p 
            className="text-sm mt-4"
            style={{ color: 'var(--color-error-600)' }}
          >
            Please select a project to start tracking time
          </p>
        )}
      </div>
    </div>
  );
};

export default TimerDisplay; 