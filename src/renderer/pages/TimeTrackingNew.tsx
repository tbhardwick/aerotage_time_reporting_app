import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useApiOperations } from '../hooks/useApiOperations';

const TimeTrackingNew: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { createTimeEntry, updateTimeEntry, deleteTimeEntry, submitTimeEntries } = useApiOperations();
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

  const handleStopTimer = async () => {
    if (state.timer.isRunning && state.timer.currentProjectId) {
      try {
        // Calculate start and end times
        const endTime = new Date();
        const startTime = new Date(state.timer.startTime!);
        const durationMinutes = Math.floor(state.timer.elapsedTime / 60); // Convert seconds to minutes
        
        // Ensure minimum duration of 1 minute
        const finalDuration = Math.max(durationMinutes, 1);
        
        // Create time entry via API with comprehensive data
        const timeEntryData = {
          projectId: state.timer.currentProjectId,
          date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
          duration: finalDuration,
          startTime: startTime.toISOString().split('T')[1].substring(0, 5), // HH:MM format
          endTime: endTime.toISOString().split('T')[1].substring(0, 5), // HH:MM format
          description: state.timer.currentDescription || 'Timer session',
          isBillable: true,
          status: 'draft' as const,
        };

        console.log('🚀 Creating time entry with data:', timeEntryData);
        console.log('📊 Timer state:', {
          isRunning: state.timer.isRunning,
          startTime: state.timer.startTime,
          elapsedTime: state.timer.elapsedTime,
          currentProjectId: state.timer.currentProjectId,
          currentDescription: state.timer.currentDescription
        });
        
        // Create time entry via API
        const result = await createTimeEntry(timeEntryData);
        console.log('✅ Time entry created successfully:', result);
        
        // Stop the timer (this will reset timer state)
        dispatch({ type: 'STOP_TIMER' });
        setDescription('');
        
        // Show success message
        console.log('🎉 Timer stopped and time entry saved successfully');
        
      } catch (error: any) {
        console.error('❌ Failed to create time entry:', error);
        console.error('📋 Error details:', {
          message: error.message,
          status: error.status,
          response: error.response,
          stack: error.stack
        });
        
        // Provide more specific error messages
        let errorMessage = 'Failed to save time entry. Please try again.';
        
        if (error.message?.includes('400')) {
          errorMessage = 'Invalid time entry data. Please check your project selection and try again.';
        } else if (error.message?.includes('401') || error.message?.includes('403')) {
          errorMessage = 'Authentication error. Please log in again.';
        } else if (error.message?.includes('404')) {
          errorMessage = 'Project not found. Please select a different project.';
        } else if (error.message?.includes('500')) {
          errorMessage = 'Server error. Please try again in a moment.';
        } else if (error.message?.includes('Network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        }
        
        alert(errorMessage);
        
        // Don't stop the timer if API call failed - let user try again
        console.log('⚠️ Timer kept running due to API error');
      }
    } else {
      // Just stop the timer if no project selected or timer not running
      dispatch({ type: 'STOP_TIMER' });
      setDescription('');
      console.log('🛑 Timer stopped without creating time entry');
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    const entry = state.timeEntries.find(e => e.id === entryId);
    
    // Check if entry can be deleted
    if (entry && (entry.status === 'submitted' || entry.status === 'approved')) {
      alert('Cannot delete time entries that have been submitted or approved.');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this time entry?')) {
      try {
        await deleteTimeEntry(entryId);
      } catch (error: any) {
        console.error('Failed to delete time entry:', error);
        
        // Show more specific error messages
        if (error.message?.includes('submitted or approved')) {
          alert('Cannot delete time entries that have been submitted or approved.');
        } else if (error.message?.includes('400')) {
          alert('This time entry cannot be deleted. It may have been submitted or approved.');
        } else {
          alert('Failed to delete time entry. Please try again.');
        }
      }
    }
  };

  const handleSubmitEntry = async (entryId: string) => {
    try {
      await submitTimeEntries([entryId]);
    } catch (error) {
      console.error('Failed to submit time entry:', error);
      alert('Failed to submit time entry. Please try again.');
    }
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
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          Time Tracking
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Track your time and manage your daily work activities</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timer Section */}
        <div style={{ 
          backgroundColor: 'var(--surface-color)', 
          padding: '1.5rem', 
          borderRadius: '0.5rem', 
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Timer
          </h3>
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <div style={{ 
              fontSize: '3rem', 
              fontFamily: 'monospace', 
              fontWeight: 'bold', 
              marginBottom: '1rem',
              color: state.timer.isRunning ? 'var(--color-success-600)' : 'var(--text-secondary)'
            }}>
              {formatTime(state.timer.elapsedTime)}
            </div>
            {state.timer.isRunning ? (
              <button 
                onClick={handleStopTimer}
                className="px-6 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: '2px solid #b91c1c',
                  '--tw-ring-color': '#dc2626',
                  marginRight: '0.5rem'
                } as React.CSSProperties}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#b91c1c';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                }}
              >
                Stop Timer
              </button>
            ) : (
              <button 
                onClick={handleStartTimer}
                disabled={!selectedProjectId}
                className="px-6 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: selectedProjectId ? '#22c55e' : '#e2e8f0',
                  color: selectedProjectId ? '#ffffff' : '#1e293b',
                  border: selectedProjectId ? '2px solid #16a34a' : '2px solid var(--border-color)',
                  '--tw-ring-color': 'var(--color-success-600)',
                  marginRight: '0.5rem'
                } as React.CSSProperties}
                onMouseEnter={(e) => {
                  if (selectedProjectId) {
                    e.currentTarget.style.backgroundColor = '#16a34a';
                  } else {
                    e.currentTarget.style.backgroundColor = '#cbd5e1';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedProjectId) {
                    e.currentTarget.style.backgroundColor = '#22c55e';
                  } else {
                    e.currentTarget.style.backgroundColor = '#e2e8f0';
                  }
                }}
              >
                Start Timer
              </button>
            )}
          </div>
          {state.timer.isRunning && (
            <div style={{ 
              backgroundColor: state.timer.isRunning ? 'rgba(34, 197, 94, 0.1)' : 'var(--border-color)', 
              padding: '0.75rem', 
              borderRadius: '0.5rem',
              border: '1px solid var(--color-success-600)',
              fontSize: '0.875rem',
              color: 'var(--text-primary)'
            }}>
              <strong>Current:</strong> {state.projects.find(p => p.id === state.timer.currentProjectId)?.name}<br/>
              <strong>Client:</strong> {state.projects.find(p => p.id === state.timer.currentProjectId)?.client?.name}<br/>
              <strong>Task:</strong> {state.timer.currentDescription}
            </div>
          )}
        </div>

        {/* Project Selection */}
        <div style={{ 
          backgroundColor: 'var(--surface-color)', 
          padding: '1.5rem', 
          borderRadius: '0.5rem', 
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Project Selection
          </h3>
          <select 
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            disabled={state.timer.isRunning}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              backgroundColor: state.timer.isRunning ? 'var(--border-color)' : 'var(--background-color)',
              color: 'var(--text-primary)'
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
              backgroundColor: 'var(--background-color)', 
              padding: '0.75rem', 
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              fontSize: '0.875rem',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)'
            }}>
              {(() => {
                const project = state.projects.find(p => p.id === selectedProjectId);
                return project ? (
                  <>
                    <div><strong>Client:</strong> {project.client?.name}</div>
                    <div><strong>Rate:</strong> ${project.defaultHourlyRate || 'Not set'}/hr</div>
                    {project.description && (
                      <div><strong>Description:</strong> {project.description}</div>
                    )}
                    {project.budget?.type === 'hours' && (
                      <div><strong>Budget:</strong> {project.budget.value} hours</div>
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
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              resize: 'none',
              backgroundColor: state.timer.isRunning ? 'var(--border-color)' : 'var(--background-color)',
              color: 'var(--text-primary)'
            }}
          />
        </div>

        {/* Time Entries */}
        <div style={{ 
          backgroundColor: 'var(--surface-color)', 
          padding: '1.5rem', 
          borderRadius: '0.5rem', 
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--border-color)'
        }} className="col-span-full">
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Time Entries
          </h3>
          
          {/* Summary */}
          <div style={{ 
            backgroundColor: 'var(--background-color)', 
            padding: '1rem', 
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Time</p>
                <p style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>{formatDuration(totalTime)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Billable</p>
                <p style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--color-success-600)' }}>{formatDuration(billableTime)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Non-billable</p>
                <p style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>{formatDuration(nonBillableTime)}</p>
              </div>
            </div>
          </div>
          
          {/* Time Entries List */}
          {state.timeEntries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              No time entries yet. Start the timer to create your first entry!
            </div>
          ) : (
            state.timeEntries
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map(entry => {
              const project = state.projects.find(p => p.id === entry.projectId);
              return (
                <div key={entry.id} style={{ 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '0.5rem', 
                  padding: '1rem',
                  marginBottom: '0.5rem',
                  backgroundColor: 'var(--background-color)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ 
                          backgroundColor: 
                            entry.status === 'draft' ? 'var(--border-color)' : 
                            entry.status === 'submitted' ? 'var(--color-warning-100)' :
                            entry.status === 'approved' ? 'var(--color-success-100)' : 
                            entry.status === 'rejected' ? 'var(--color-error-100)' : 'var(--border-color)', 
                          color: 
                            entry.status === 'draft' ? 'var(--text-primary)' : 
                            entry.status === 'submitted' ? 'var(--color-warning-800)' :
                            entry.status === 'approved' ? 'var(--color-success-800)' : 
                            entry.status === 'rejected' ? 'var(--color-error-600)' : 'var(--text-primary)', 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '9999px', 
                          fontSize: '0.75rem',
                          marginRight: '0.5rem',
                          textTransform: 'capitalize'
                        }}>
                          {entry.status}
                        </span>
                        <span style={{ 
                          backgroundColor: entry.isBillable ? 'var(--color-success-100)' : 'var(--color-warning-100)', 
                          color: entry.isBillable ? 'var(--color-success-800)' : 'var(--color-warning-800)', 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '9999px', 
                          fontSize: '0.75rem'
                        }}>
                          {entry.isBillable ? 'Billable' : 'Non-billable'}
                        </span>
                      </div>
                      <h4 style={{ fontWeight: '500', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>{project?.name || 'Unknown Project'}</h4>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        {project?.client?.name || 'Unknown Client'}
                      </p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{entry.description}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>{formatDuration(entry.duration)}</p>
                      <div style={{ marginTop: '0.5rem' }}>
                        {entry.status === 'draft' && (
                          <>
                            <button 
                              onClick={() => handleSubmitEntry(entry.id)}
                              className="px-3 py-1 text-sm rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 mr-2"
                              style={{
                                backgroundColor: '#2563eb',
                                color: '#ffffff',
                                border: '1px solid #1d4ed8',
                                '--tw-ring-color': '#2563eb'
                              } as React.CSSProperties}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#1d4ed8';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#2563eb';
                              }}
                            >
                              Submit
                            </button>
                            <button 
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="px-3 py-1 text-sm rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                              style={{
                                backgroundColor: '#dc2626',
                                color: '#ffffff',
                                border: '1px solid #b91c1c',
                                '--tw-ring-color': '#dc2626'
                              } as React.CSSProperties}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#b91c1c';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#dc2626';
                              }}
                            >
                              Delete
                            </button>
                          </>
                        )}
                        {entry.status === 'submitted' && (
                          <span style={{
                            color: 'var(--text-secondary)',
                            fontSize: '0.875rem',
                            fontStyle: 'italic'
                          }}>
                            Awaiting approval
                          </span>
                        )}
                        {entry.status === 'approved' && (
                          <span style={{
                            color: 'var(--color-success-600)',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                          }}>
                            ✓ Approved
                          </span>
                        )}
                        {entry.status === 'rejected' && (
                          <span style={{
                            color: 'var(--color-error-600)',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                          }}>
                            ✗ Rejected
                          </span>
                        )}
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