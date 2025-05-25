import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

const TimeTrackingNew: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [showManualEntry, setShowManualEntry] = useState(false);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (state.timer.isRunning) {
      interval = setInterval(() => {
        const startTime = new Date(state.timer.startTime!).getTime();
        const now = new Date().getTime();
        const elapsed = Math.floor((now - startTime) / 1000); // seconds
        dispatch({ type: 'UPDATE_TIMER_TIME', payload: elapsed });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [state.timer.isRunning, state.timer.startTime, dispatch]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = () => {
    if (!selectedProjectId) {
      alert('Please select a project first');
      return;
    }
    dispatch({
      type: 'START_TIMER',
      payload: {
        projectId: selectedProjectId,
        description: description || 'Working on project',
      },
    });
  };

  const handleStopTimer = () => {
    dispatch({ type: 'STOP_TIMER' });
    setDescription('');
  };

  const handleDeleteEntry = (entryId: string) => {
    if (window.confirm('Are you sure you want to delete this time entry?')) {
      dispatch({ type: 'DELETE_TIME_ENTRY', payload: entryId });
    }
  };

  const handleSubmitEntry = (entryId: string) => {
    dispatch({
      type: 'UPDATE_TIME_ENTRY',
      payload: {
        id: entryId,
        updates: { status: 'submitted' },
      },
    });
  };

  // Get active projects only
  const activeProjects = state.projects.filter(project => project.status === 'active');

  const totalTime = state.timeEntries.reduce((total, entry) => total + entry.duration, 0);
  const billableTime = state.timeEntries
    .filter(entry => entry.isBillable)
    .reduce((total, entry) => total + entry.duration, 0);
  const nonBillableTime = totalTime - billableTime;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
          Time Tracking
        </h1>
        <p style={{ color: '#4b5563' }}>Track your time and manage your daily work activities</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timer Section */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '1.5rem', 
          borderRadius: '0.5rem', 
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
            Timer
          </h3>
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <div style={{ 
              fontSize: '3rem', 
              fontFamily: 'monospace', 
              fontWeight: 'bold', 
              marginBottom: '1rem',
              color: state.timer.isRunning ? '#16a34a' : '#6b7280'
            }}>
              {formatTime(state.timer.elapsedTime)}
            </div>
            {state.timer.isRunning ? (
              <button 
                onClick={handleStopTimer}
                style={{
                  backgroundColor: '#dc2626',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  marginRight: '0.5rem'
                }}
              >
                Stop Timer
              </button>
            ) : (
              <button 
                onClick={handleStartTimer}
                disabled={!selectedProjectId}
                style={{
                  backgroundColor: selectedProjectId ? '#16a34a' : '#9ca3af',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: selectedProjectId ? 'pointer' : 'not-allowed',
                  marginRight: '0.5rem'
                }}
              >
                Start Timer
              </button>
            )}
          </div>
          {state.timer.isRunning && (
            <div style={{ 
              backgroundColor: '#f0fdf4', 
              padding: '0.75rem', 
              borderRadius: '0.5rem',
              border: '1px solid #16a34a',
              fontSize: '0.875rem'
            }}>
              <strong>Current:</strong> {state.projects.find(p => p.id === state.timer.currentProjectId)?.name}<br/>
              <strong>Client:</strong> {state.projects.find(p => p.id === state.timer.currentProjectId)?.client?.name}<br/>
              <strong>Task:</strong> {state.timer.currentDescription}
            </div>
          )}
        </div>

        {/* Project Selection */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '1.5rem', 
          borderRadius: '0.5rem', 
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
            Project Selection
          </h3>
          <select 
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            disabled={state.timer.isRunning}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              backgroundColor: state.timer.isRunning ? '#f9fafb' : 'white'
            }}
          >
            <option value="">Select a project...</option>
            {activeProjects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name} - {project.client?.name || 'Unknown Client'}
              </option>
            ))}
          </select>
          
          {/* Project Details */}
          {selectedProjectId && (
            <div style={{ 
              backgroundColor: '#f8fafc', 
              padding: '0.75rem', 
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              {(() => {
                const project = state.projects.find(p => p.id === selectedProjectId);
                return project ? (
                  <>
                    <div><strong>Client:</strong> {project.client?.name}</div>
                    <div><strong>Rate:</strong> ${project.hourlyRate}/hr</div>
                    {project.description && (
                      <div><strong>Description:</strong> {project.description}</div>
                    )}
                    {project.budget?.hours && (
                      <div><strong>Budget:</strong> {project.budget.hours} hours</div>
                    )}
                  </>
                ) : null;
              })()}
            </div>
          )}
          
          <textarea 
            placeholder="What are you working on?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={state.timer.isRunning}
            rows={3}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              resize: 'none',
              backgroundColor: state.timer.isRunning ? '#f9fafb' : 'white'
            }}
          />
        </div>

        {/* Time Entries */}
        <div className="bg-white p-6 rounded-lg shadow-md col-span-full">
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
            Time Entries
          </h3>
          
          {/* Summary */}
          <div style={{ 
            backgroundColor: '#f9fafb', 
            padding: '1rem', 
            borderRadius: '0.5rem',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>Total Time</p>
                <p style={{ fontSize: '1.125rem', fontWeight: '600' }}>{formatDuration(totalTime)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>Billable</p>
                <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#16a34a' }}>{formatDuration(billableTime)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>Non-billable</p>
                <p style={{ fontSize: '1.125rem', fontWeight: '600' }}>{formatDuration(nonBillableTime)}</p>
              </div>
            </div>
          </div>
          
          {/* Time Entries List */}
          {state.timeEntries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              No time entries yet. Start the timer to create your first entry!
            </div>
          ) : (
            state.timeEntries.map(entry => {
              const project = state.projects.find(p => p.id === entry.projectId);
              return (
                <div key={entry.id} style={{ 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '0.5rem', 
                  padding: '1rem',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ 
                          backgroundColor: entry.status === 'draft' ? '#f3f4f6' : '#dcfce7', 
                          color: entry.status === 'draft' ? '#374151' : '#166534', 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '9999px', 
                          fontSize: '0.75rem',
                          marginRight: '0.5rem'
                        }}>
                          {entry.status}
                        </span>
                        <span style={{ 
                          backgroundColor: entry.isBillable ? '#dcfce7' : '#fef3c7', 
                          color: entry.isBillable ? '#166534' : '#92400e', 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '9999px', 
                          fontSize: '0.75rem'
                        }}>
                          {entry.isBillable ? 'Billable' : 'Non-billable'}
                        </span>
                      </div>
                      <h4 style={{ fontWeight: '500', marginBottom: '0.25rem' }}>{project?.name || 'Unknown Project'}</h4>
                      <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.25rem' }}>
                        {project?.client?.name || 'Unknown Client'}
                      </p>
                      <p style={{ fontSize: '0.875rem' }}>{entry.description}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '1.125rem', fontWeight: '600' }}>{formatDuration(entry.duration)}</p>
                      <div style={{ marginTop: '0.5rem' }}>
                        {entry.status === 'draft' && (
                          <button 
                            onClick={() => handleSubmitEntry(entry.id)}
                            style={{
                              backgroundColor: '#2563eb',
                              color: 'white',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '0.25rem',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              marginRight: '0.5rem'
                            }}
                          >
                            Submit
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteEntry(entry.id)}
                          style={{
                            backgroundColor: '#dc2626',
                            color: 'white',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '0.25rem',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default TimeTrackingNew; 