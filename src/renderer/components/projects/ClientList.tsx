import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { EnvelopeIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline';

interface ClientListProps {
  onEditClient: (clientId: string) => void;
  onCreateClient: () => void;
}

const ClientList: React.FC<ClientListProps> = ({ onEditClient, onCreateClient }) => {
  const { state, dispatch } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = state.clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contactInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteClient = (clientId: string) => {
    const client = state.clients.find(c => c.id === clientId);
    const associatedProjects = state.projects.filter(p => p.clientId === clientId);
    
    let confirmMessage = `Are you sure you want to delete "${client?.name}"?`;
    if (associatedProjects.length > 0) {
      confirmMessage += `\n\nThis will also delete ${associatedProjects.length} associated project(s).`;
    }
    
    if (window.confirm(confirmMessage)) {
      dispatch({ type: 'DELETE_CLIENT', payload: clientId });
    }
  };

  const toggleClientStatus = (clientId: string, currentStatus: boolean) => {
    dispatch({
      type: 'UPDATE_CLIENT',
      payload: {
        id: clientId,
        updates: { isActive: !currentStatus }
      }
    });
  };

  const getClientStatusStyle = (isActive: boolean) => {
    return isActive
      ? {
          backgroundColor: 'var(--color-success-50)',
          color: 'var(--color-success-800)'
        }
      : {
          backgroundColor: 'var(--surface-secondary)',
          color: 'var(--text-secondary)'
        };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Clients</h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Manage your client accounts and contact information</p>
        </div>
        <button
          onClick={onCreateClient}
          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
          style={{
            backgroundColor: 'var(--color-primary-600)',
            color: 'var(--color-text-on-primary)',
            '--tw-ring-color': 'var(--color-primary-600)'
          } as React.CSSProperties}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
          }}
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Client
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />
        </div>
        <input
          type="text"
          placeholder="Search clients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 rounded-lg focus:ring-2 focus:ring-offset-2 text-sm"
          style={{
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--background-color)',
            color: 'var(--text-primary)',
            '--tw-ring-color': 'var(--color-primary-600)'
          } as React.CSSProperties}
        />
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-lg mb-2" style={{ color: 'var(--text-secondary)' }}>
            {searchTerm ? 'No clients found' : 'No clients yet'}
          </div>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first client'}
          </p>
          {!searchTerm && (
            <button
              onClick={onCreateClient}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors"
              style={{
                backgroundColor: 'var(--color-primary-600)',
                color: 'var(--color-text-on-primary)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
              }}
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Your First Client
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => {
            const projectCount = state.projects.filter(p => p.clientId === client.id).length;
            
            return (
              <div
                key={client.id}
                className="rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                style={{
                  backgroundColor: 'var(--surface-color)',
                  border: '1px solid var(--border-color)'
                }}
              >
                {/* Client Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                      {client.name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={getClientStatusStyle(client.isActive)}
                      >
                        {client.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {projectCount} project{projectCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onEditClient(client.id)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--color-primary-600)';
                        e.currentTarget.style.backgroundColor = 'var(--color-primary-50)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      title="Edit client"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClient(client.id)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--color-error-600)';
                        e.currentTarget.style.backgroundColor = 'var(--color-error-50)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      title="Delete client"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Contact Information */}
                {client.contactInfo && (
                  <div className="space-y-2 mb-4">
                    {client.contactInfo.email && (
                      <div className="flex items-center text-sm">
                        <EnvelopeIcon className="w-4 h-4 mr-2" style={{ color: 'var(--text-secondary)' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{client.contactInfo.email}</span>
                      </div>
                    )}
                    {client.contactInfo.phone && (
                      <div className="flex items-center text-sm">
                        <PhoneIcon className="w-4 h-4 mr-2" style={{ color: 'var(--text-secondary)' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{client.contactInfo.phone}</span>
                      </div>
                    )}
                    {client.contactInfo.address && (
                      <div className="flex items-start text-sm">
                        <MapPinIcon className="w-4 h-4 mr-2 mt-0.5" style={{ color: 'var(--text-secondary)' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{client.contactInfo.address}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Actions */}
                <div className="pt-4 flex justify-between items-center" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <button
                    onClick={() => toggleClientStatus(client.id, client.isActive)}
                    className="text-xs font-medium px-3 py-1 rounded-full transition-colors"
                    style={{
                      color: client.isActive ? 'var(--text-secondary)' : 'var(--color-success-600)',
                      backgroundColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (client.isActive) {
                        e.currentTarget.style.color = 'var(--text-primary)';
                        e.currentTarget.style.backgroundColor = 'var(--border-color)';
                      } else {
                        e.currentTarget.style.color = 'var(--color-success-700)';
                        e.currentTarget.style.backgroundColor = 'var(--color-success-50)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = client.isActive ? 'var(--text-secondary)' : 'var(--color-success-600)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {client.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Created {new Date(client.createdAt).toLocaleDateString()}
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

export default ClientList; 