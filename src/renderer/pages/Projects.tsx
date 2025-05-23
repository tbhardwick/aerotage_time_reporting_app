import React, { useState } from 'react';
import ClientList from '../components/projects/ClientList';
import ClientForm from '../components/projects/ClientForm';
import ProjectList from '../components/projects/ProjectList';
import ProjectForm from '../components/projects/ProjectForm';

type TabType = 'projects' | 'clients';

const Projects: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('projects');
  const [showClientForm, setShowClientForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | undefined>();
  const [editingProjectId, setEditingProjectId] = useState<string | undefined>();

  const handleCreateClient = () => {
    setEditingClientId(undefined);
    setShowClientForm(true);
  };

  const handleEditClient = (clientId: string) => {
    setEditingClientId(clientId);
    setShowClientForm(true);
  };

  const handleCreateProject = () => {
    setEditingProjectId(undefined);
    setShowProjectForm(true);
  };

  const handleEditProject = (projectId: string) => {
    setEditingProjectId(projectId);
    setShowProjectForm(true);
  };

  const handleCloseClientForm = () => {
    setShowClientForm(false);
    setEditingClientId(undefined);
  };

  const handleCloseProjectForm = () => {
    setShowProjectForm(false);
    setEditingProjectId(undefined);
  };

  const handleClientFormSuccess = () => {
    // Optionally switch to projects tab after creating a client
    // setActiveTab('projects');
  };

  const handleProjectFormSuccess = () => {
    // Form will close automatically
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Projects & Clients</h1>
        <p className="text-neutral-600">Manage your projects, clients, and team assignments</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-neutral-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('projects')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'projects'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            Projects
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'clients'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            Clients
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        {activeTab === 'projects' && (
          <ProjectList
            onEditProject={handleEditProject}
            onCreateProject={handleCreateProject}
          />
        )}
        
        {activeTab === 'clients' && (
          <ClientList
            onEditClient={handleEditClient}
            onCreateClient={handleCreateClient}
          />
        )}
      </div>

      {/* Modals */}
      {showClientForm && (
        <ClientForm
          clientId={editingClientId}
          onClose={handleCloseClientForm}
          onSuccess={handleClientFormSuccess}
        />
      )}

      {showProjectForm && (
        <ProjectForm
          projectId={editingProjectId}
          onClose={handleCloseProjectForm}
          onSuccess={handleProjectFormSuccess}
        />
      )}
    </div>
  );
};

export default Projects; 