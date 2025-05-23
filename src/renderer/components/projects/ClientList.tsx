import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface ClientListProps {
  onEditClient: (clientId: string) => void;
  onCreateClient: () => void;
}

const ClientList: React.FC<ClientListProps> = ({ onEditClient, onCreateClient }) => {
  const { state, dispatch } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = state.clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contactInfo.email?.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Clients</h2>
          <p className="text-sm text-neutral-600">Manage your client accounts and contact information</p>
        </div>
        <button
          onClick={onCreateClient}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Client
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-neutral-400" />
        </div>
        <input
          type="text"
          placeholder="Search clients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-neutral-400 text-lg mb-2">
            {searchTerm ? 'No clients found' : 'No clients yet'}
          </div>
          <p className="text-neutral-600 text-sm mb-4">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first client'}
          </p>
          {!searchTerm && (
            <button
              onClick={onCreateClient}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
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
                className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-md transition-shadow"
              >
                {/* Client Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                      {client.name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          client.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-neutral-100 text-neutral-800'
                        }`}
                      >
                        {client.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {projectCount} project{projectCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onEditClient(client.id)}
                      className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit client"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClient(client.id)}
                      className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete client"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-2">
                  {client.contactInfo.email && (
                    <div className="flex items-center text-sm">
                      <span className="text-neutral-500 w-12">Email:</span>
                      <span className="text-neutral-900">{client.contactInfo.email}</span>
                    </div>
                  )}
                  {client.contactInfo.phone && (
                    <div className="flex items-center text-sm">
                      <span className="text-neutral-500 w-12">Phone:</span>
                      <span className="text-neutral-900">{client.contactInfo.phone}</span>
                    </div>
                  )}
                  {client.contactInfo.address && (
                    <div className="flex items-start text-sm">
                      <span className="text-neutral-500 w-12 mt-0.5">Address:</span>
                      <span className="text-neutral-900 flex-1">{client.contactInfo.address}</span>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="mt-4 pt-4 border-t border-neutral-100 flex justify-between items-center">
                  <button
                    onClick={() => toggleClientStatus(client.id, client.isActive)}
                    className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                      client.isActive
                        ? 'text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100'
                        : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                    }`}
                  >
                    {client.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  
                  <div className="text-xs text-neutral-500">
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