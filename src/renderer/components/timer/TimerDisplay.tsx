import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { PlayIcon, PauseIcon, StopIcon } from '@heroicons/react/24/solid';
import { startTimer, pauseTimer, resumeTimer, stopTimer } from '../../store/slices/timerSlice';
import { selectTimerState, selectCurrentDuration } from '../../store/slices/timerSlice';

interface TimerDisplayProps {
  onTimeEntry?: (entry: { projectId: string; duration: number; description: string }) => void;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({ onTimeEntry }) => {
  const dispatch = useDispatch();
  const timerState = useSelector(selectTimerState);
  const currentDuration = useSelector(selectCurrentDuration);
  const [displayTime, setDisplayTime] = useState(0);

  // Update display time every second when timer is running
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerState.isRunning) {
      interval = setInterval(() => {
        setDisplayTime(currentDuration);
      }, 1000);
    } else {
      setDisplayTime(currentDuration);
    }
    return () => clearInterval(interval);
  }, [timerState.isRunning, currentDuration]);

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (!timerState.currentProjectId) {
      alert('Please select a project first');
      return;
    }
    dispatch(startTimer({
      projectId: timerState.currentProjectId,
      description: timerState.currentDescription
    }));
  };

  const handlePause = () => {
    dispatch(pauseTimer());
  };

  const handleResume = () => {
    dispatch(resumeTimer());
  };

  const handleStop = () => {
    if (displayTime > 0 && timerState.currentProjectId) {
      // Save time entry
      onTimeEntry?.({
        projectId: timerState.currentProjectId,
        duration: displayTime,
        description: timerState.currentDescription
      });
    }
    dispatch(stopTimer());
    setDisplayTime(0);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      <div className="text-center">
        <div className="text-6xl font-mono font-bold text-gray-800 mb-6">
          {formatTime(displayTime)}
        </div>
        
        <div className="flex justify-center space-x-4">
          {!timerState.isRunning ? (
            <button
              onClick={displayTime > 0 ? handleResume : handleStart}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              disabled={!timerState.currentProjectId}
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
        
        {!timerState.currentProjectId && (
          <p className="text-sm text-red-600 mt-4">
            Please select a project to start tracking time
          </p>
        )}
      </div>
    </div>
  );
};

export default TimerDisplay; 