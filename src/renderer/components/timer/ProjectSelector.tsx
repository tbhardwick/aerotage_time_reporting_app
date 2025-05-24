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
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Project & Task Details</h3>
      
      {/* Project Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Project
        </label>
        <div className="relative">
          <select
            value={timer.currentProjectId || ''}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
          >
            <option value="">Select a project...</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} - {project.client?.name || 'Unknown Client'}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Task Description */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Task Description
        </label>
        <textarea
          value={timer.currentDescription}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="What are you working on?"
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
      </div>

      {/* Current Selection Display */}
      {selectedProject && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
            <div>
              <p className="font-medium text-blue-900">{selectedProject.name}</p>
              <p className="text-sm text-blue-700">{selectedProject.client?.name || 'Unknown Client'}</p>
            </div>
          </div>
          {timer.currentDescription && (
            <p className="text-sm text-blue-800 mt-2 italic">
              "{timer.currentDescription}"
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectSelector; 