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
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      <div className="text-center">
        <div className="text-6xl font-mono font-bold text-gray-800 mb-6">
          {formatTime(displayTime)}
        </div>
        
        <div className="flex justify-center space-x-4">
          {!timer.isRunning ? (
            <button
              onClick={displayTime > 0 ? handleResume : handleStart}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              disabled={!timer.currentProjectId}
            >
              <PlayIcon className="w-5 h-5 mr-2" />
              {displayTime > 0 ? 'Resume' : 'Start'}
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex items-center px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              <PauseIcon className="w-5 h-5 mr-2" />
              Pause
            </button>
          )}
          
          {displayTime > 0 && (
            <button
              onClick={handleStop}
              className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <StopIcon className="w-5 h-5 mr-2" />
              Stop
            </button>
          )}
        </div>
        
        {!timer.currentProjectId && (
          <p className="text-sm text-red-600 mt-4">
            Please select a project to start tracking time
          </p>
        )}
      </div>
    </div>
  );
};

export default TimerDisplay; 