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
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Projects & Clients</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your projects, clients, and team assignments</p>
      </div>

      {/* Tab Navigation */}
      <div style={{ borderBottom: '1px solid var(--border-color)' }}>
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('projects')}
            className="py-2 px-1 border-b-2 font-medium text-sm transition-colors"
            style={{
              color: activeTab === 'projects' ? 'var(--color-primary-600)' : 'var(--text-secondary)',
              borderColor: activeTab === 'projects' ? 'var(--color-primary-600)' : 'transparent'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'projects') {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'projects') {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'transparent';
              }
            }}
          >
            Projects
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className="py-2 px-1 border-b-2 font-medium text-sm transition-colors"
            style={{
              color: activeTab === 'clients' ? 'var(--color-primary-600)' : 'var(--text-secondary)',
              borderColor: activeTab === 'clients' ? 'var(--color-primary-600)' : 'transparent'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'clients') {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'clients') {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'transparent';
              }
            }}
          >
            Clients
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="rounded-xl shadow-sm p-6" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
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