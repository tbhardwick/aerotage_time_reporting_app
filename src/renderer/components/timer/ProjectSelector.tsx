import React from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useAppContext } from '../../context/AppContext';

const ProjectSelector: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { timer, projects } = state;

  const handleProjectChange = (projectId: string) => {
    // Update timer state with selected project
    dispatch({ 
      type: 'START_TIMER', 
      payload: { projectId, description: timer.currentDescription }
    });
  };

  const handleDescriptionChange = (description: string) => {
    if (timer.currentProjectId) {
      dispatch({ 
        type: 'START_TIMER', 
        payload: { projectId: timer.currentProjectId, description }
      });
    }
  };

  const selectedProject = projects.find(p => p.id === timer.currentProjectId);

  return (
    <div 
      className="rounded-lg shadow-lg p-6"
      style={{
        backgroundColor: 'var(--surface-color)',
        border: '1px solid var(--border-color)'
      }}
    >
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Project & Task Details</h3>
      
      {/* Project Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          Project
        </label>
        <div className="relative">
          <select
            value={timer.currentProjectId || ''}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-offset-2 appearance-none"
            style={{
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--surface-color)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="">Select a project...</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} - {project.client?.name || 'Unknown Client'}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: 'var(--text-secondary)' }} />
        </div>
      </div>

      {/* Task Description */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          Task Description
        </label>
        <textarea
          value={timer.currentDescription}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="What are you working on?"
          rows={3}
          className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-offset-2 resize-none"
          style={{
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--surface-color)',
            color: 'var(--text-primary)'
          }}
        />
      </div>

      {/* Current Selection Display */}
      {selectedProject && (
        <div 
          className="border rounded-lg p-4"
          style={{
            backgroundColor: 'var(--color-primary-50)',
            borderColor: 'var(--color-primary-200)'
          }}
        >
          <div className="flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-3"
              style={{ backgroundColor: 'var(--color-primary-500)' }}
            ></div>
            <div>
              <p 
                className="font-medium"
                style={{ color: 'var(--color-primary-900)' }}
              >
                {selectedProject.name}
              </p>
              <p 
                className="text-sm"
                style={{ color: 'var(--color-primary-700)' }}
              >
                {selectedProject.client?.name || 'Unknown Client'}
              </p>
            </div>
          </div>
          {timer.currentDescription && (
            <p 
              className="text-sm mt-2 italic"
              style={{ color: 'var(--color-primary-800)' }}
            >
              "{timer.currentDescription}"
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectSelector; 