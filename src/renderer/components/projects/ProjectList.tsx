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
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'completed' | 'cancelled'>('all');
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
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    dispatch({
      type: 'UPDATE_PROJECT',
      payload: {
        id: projectId,
        updates: { 
          status: newStatus as 'active' | 'paused' | 'completed' | 'cancelled'
        }
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  const calculateProjectProgress = (project: any) => {
    const timeEntries = state.timeEntries.filter(te => te.projectId === project.id);
    const totalMinutes = timeEntries.reduce((sum, te) => sum + te.duration, 0);
    const totalHours = totalMinutes / 60;
    
    if (project.budget?.type === 'hours') {
      return {
        hoursUsed: totalHours,
        budgetHours: project.budget.value,
        percentage: Math.min((totalHours / project.budget.value) * 100, 100),
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
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Projects</h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Manage your projects and track progress</p>
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
            <MagnifyingGlassIcon className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />
          </div>
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
            style={{
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--background-color)',
              color: 'var(--text-primary)'
            }}
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="block w-full pl-3 pr-10 py-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
            style={{
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--background-color)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Client Filter */}
        <div className="relative">
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
            style={{
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--background-color)',
              color: 'var(--text-primary)'
            }}
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
          <div className="text-lg mb-2" style={{ color: 'var(--text-secondary)' }}>
            {searchTerm || statusFilter !== 'all' || clientFilter !== 'all' 
              ? 'No projects found' 
              : 'No projects yet'}
          </div>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
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
                className="rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                style={{
                  backgroundColor: 'var(--surface-color)',
                  border: '1px solid var(--border-color)'
                }}
              >
                {/* Project Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                      {project.name}
                    </h3>
                    <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                      {project.client?.name || 'Unknown Client'}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}
                      >
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {timeEntryCount} time entr{timeEntryCount !== 1 ? 'ies' : 'y'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onEditProject(project.id)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#2563eb';
                        e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      title="Edit project"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#dc2626';
                        e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      title="Delete project"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Project Description */}
                {project.description && (
                  <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                    {project.description}
                  </p>
                )}

                {/* Budget and Progress */}
                {project.budget && (
                  <div className="space-y-3 mb-4">
                    {/* Hours Progress */}
                    {project.budget.type === 'hours' && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span style={{ color: 'var(--text-secondary)' }}>Hours Used</span>
                          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                            {progress.hoursUsed.toFixed(1)} / {project.budget.value}h
                          </span>
                        </div>
                        <div className="w-full rounded-full h-2" style={{ backgroundColor: 'var(--border-color)' }}>
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
                    {project.budget.type === 'amount' && (
                      <div className="flex justify-between text-sm">
                        <span style={{ color: 'var(--text-secondary)' }}>Budget</span>
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          ${project.budget.value.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Hourly Rate */}
                <div className="flex justify-between text-sm mb-4">
                  <span style={{ color: 'var(--text-secondary)' }}>Hourly Rate</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>${project.defaultHourlyRate}/hr</span>
                </div>

                {/* Quick Actions */}
                <div className="pt-4 flex justify-between items-center" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <button
                    onClick={() => toggleProjectStatus(project.id, project.status)}
                    className={`text-xs font-medium px-3 py-1 rounded-full transition-colors`}
                    style={{
                      color: project.status === 'active' ? 'var(--text-secondary)' : '#16a34a',
                      backgroundColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (project.status === 'active') {
                        e.currentTarget.style.color = 'var(--text-primary)';
                        e.currentTarget.style.backgroundColor = 'var(--border-color)';
                      } else {
                        e.currentTarget.style.color = '#15803d';
                        e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = project.status === 'active' ? 'var(--text-secondary)' : '#16a34a';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {project.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
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