import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface ProjectListProps {
  onEditProject: (projectId: string) => void;
  onCreateProject: () => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ onEditProject, onCreateProject }) => {
  const { state, dispatch } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'completed'>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');

  const filteredProjects = state.projects.filter(project => {
    const matchesSearch = 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesClient = clientFilter === 'all' || project.clientId === clientFilter;
    
    return matchesSearch && matchesStatus && matchesClient;
  });

  const handleDeleteProject = (projectId: string) => {
    const project = state.projects.find(p => p.id === projectId);
    const associatedTimeEntries = state.timeEntries.filter(te => te.projectId === projectId);
    
    let confirmMessage = `Are you sure you want to delete "${project?.name}"?`;
    if (associatedTimeEntries.length > 0) {
      confirmMessage += `\n\nThis will also delete ${associatedTimeEntries.length} associated time entries.`;
    }
    
    if (window.confirm(confirmMessage)) {
      dispatch({ type: 'DELETE_PROJECT', payload: projectId });
    }
  };

  const toggleProjectStatus = (projectId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    dispatch({
      type: 'UPDATE_PROJECT',
      payload: {
        id: projectId,
        updates: { 
          status: newStatus as 'active' | 'inactive' | 'completed',
          isActive: newStatus === 'active'
        }
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-neutral-100 text-neutral-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  const calculateProjectProgress = (project: any) => {
    const timeEntries = state.timeEntries.filter(te => te.projectId === project.id);
    const totalMinutes = timeEntries.reduce((sum, te) => sum + te.duration, 0);
    const totalHours = totalMinutes / 60;
    
    if (project.budget?.hours) {
      return {
        hoursUsed: totalHours,
        budgetHours: project.budget.hours,
        percentage: Math.min((totalHours / project.budget.hours) * 100, 100),
      };
    }
    
    return {
      hoursUsed: totalHours,
      budgetHours: null,
      percentage: 0,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Projects</h2>
          <p className="text-sm text-neutral-600">Manage your projects and track progress</p>
        </div>
        <button
          onClick={onCreateProject}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-neutral-400" />
          </div>
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="block w-full pl-3 pr-10 py-2 border border-neutral-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Client Filter */}
        <div className="relative">
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 border border-neutral-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">All Clients</option>
            {state.clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-neutral-400 text-lg mb-2">
            {searchTerm || statusFilter !== 'all' || clientFilter !== 'all' 
              ? 'No projects found' 
              : 'No projects yet'}
          </div>
          <p className="text-neutral-600 text-sm mb-4">
            {searchTerm || statusFilter !== 'all' || clientFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by creating your first project'}
          </p>
          {!searchTerm && statusFilter === 'all' && clientFilter === 'all' && (
            <button
              onClick={onCreateProject}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Create Your First Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const progress = calculateProjectProgress(project);
            const timeEntryCount = state.timeEntries.filter(te => te.projectId === project.id).length;
            
            return (
              <div
                key={project.id}
                className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-md transition-shadow"
              >
                {/* Project Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                      {project.name}
                    </h3>
                    <p className="text-sm text-neutral-600 mb-2">
                      {project.client?.name || 'Unknown Client'}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}
                      >
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {timeEntryCount} time entr{timeEntryCount !== 1 ? 'ies' : 'y'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onEditProject(project.id)}
                      className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit project"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete project"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Project Description */}
                {project.description && (
                  <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}

                {/* Budget and Progress */}
                {project.budget && (
                  <div className="space-y-3 mb-4">
                    {/* Hours Progress */}
                    {project.budget.hours && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-neutral-600">Hours Used</span>
                          <span className="font-medium">
                            {progress.hoursUsed.toFixed(1)} / {project.budget.hours}h
                          </span>
                        </div>
                        <div className="w-full bg-neutral-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              progress.percentage > 90 
                                ? 'bg-red-500' 
                                : progress.percentage > 75 
                                ? 'bg-yellow-500' 
                                : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(progress.percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Budget Amount */}
                    {project.budget.amount && (
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600">Budget</span>
                        <span className="font-medium">
                          ${project.budget.amount.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Hourly Rate */}
                <div className="flex justify-between text-sm mb-4">
                  <span className="text-neutral-600">Hourly Rate</span>
                  <span className="font-medium">${project.hourlyRate}/hr</span>
                </div>

                {/* Quick Actions */}
                <div className="pt-4 border-t border-neutral-100 flex justify-between items-center">
                  <button
                    onClick={() => toggleProjectStatus(project.id, project.status)}
                    className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                      project.status === 'active'
                        ? 'text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100'
                        : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                    }`}
                  >
                    {project.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  
                  <div className="text-xs text-neutral-500">
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProjectList; 