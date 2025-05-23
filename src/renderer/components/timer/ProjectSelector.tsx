import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { updateProject, updateDescription } from '../../store/slices/timerSlice';
import { selectTimerState } from '../../store/slices/timerSlice';

// Mock projects data - in real app this would come from API
const mockProjects = [
  { id: '1', name: 'Website Redesign', client: 'Acme Corp' },
  { id: '2', name: 'Mobile App Development', client: 'TechStart Inc' },
  { id: '3', name: 'Brand Identity', client: 'Creative Studio' },
  { id: '4', name: 'E-commerce Platform', client: 'Retail Plus' },
];

const ProjectSelector: React.FC = () => {
  const dispatch = useDispatch();
  const timerState = useSelector(selectTimerState);

  const handleProjectChange = (projectId: string) => {
    dispatch(updateProject(projectId));
  };

  const handleDescriptionChange = (description: string) => {
    dispatch(updateDescription(description));
  };

  const selectedProject = mockProjects.find(p => p.id === timerState.currentProjectId);

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
            value={timerState.currentProjectId || ''}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
          >
            <option value="">Select a project...</option>
            {mockProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} - {project.client}
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
          value={timerState.currentDescription}
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
              <p className="text-sm text-blue-700">{selectedProject.client}</p>
            </div>
          </div>
          {timerState.currentDescription && (
            <p className="text-sm text-blue-800 mt-2 italic">
              "{timerState.currentDescription}"
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectSelector; 