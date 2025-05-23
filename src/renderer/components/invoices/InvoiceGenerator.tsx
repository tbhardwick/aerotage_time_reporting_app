import React, { useState, useMemo } from 'react';
import { PlusIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { useAppContext } from '../../context/AppContext';
import { format } from 'date-fns';

const InvoiceGenerator: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [selectedTimeEntryIds, setSelectedTimeEntryIds] = useState<string[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    // Default to 30 days from now
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');

  // Get approved time entries that haven't been invoiced yet
  const availableTimeEntries = useMemo(() => {
    return state.timeEntries.filter(entry => {
      // Only approved and billable entries
      if (entry.status !== 'approved' || !entry.isBillable) return false;
      
      // Not already on an invoice
      const isAlreadyInvoiced = state.invoices.some(invoice => 
        invoice.timeEntryIds.includes(entry.id)
      );
      return !isAlreadyInvoiced;
    });
  }, [state.timeEntries, state.invoices]);

  // Group time entries by client
  const timeEntriesByClient = useMemo(() => {
    const grouped: Record<string, typeof availableTimeEntries> = {};
    
    availableTimeEntries.forEach(entry => {
      const project = state.projects.find(p => p.id === entry.projectId);
      if (project) {
        const clientId = project.clientId;
        if (!grouped[clientId]) {
          grouped[clientId] = [];
        }
        grouped[clientId].push(entry);
      }
    });
    
    return grouped;
  }, [availableTimeEntries, state.projects]);

  // Get filtered time entries based on selected client
  const filteredTimeEntries = useMemo(() => {
    if (!selectedClientId) return [];
    return timeEntriesByClient[selectedClientId] || [];
  }, [timeEntriesByClient, selectedClientId]);

  // Calculate totals for selected entries
  const calculationSummary = useMemo(() => {
    const selectedEntries = filteredTimeEntries.filter(entry => 
      selectedTimeEntryIds.includes(entry.id)
    );
    
    const totalMinutes = selectedEntries.reduce((sum, entry) => sum + entry.duration, 0);
    const totalHours = totalMinutes / 60;
    
    // Get project rates
    let totalAmount = 0;
    const projectBreakdown: Record<string, { hours: number; rate: number; amount: number; name: string }> = {};
    
    selectedEntries.forEach(entry => {
      const project = state.projects.find(p => p.id === entry.projectId);
      const rate = project?.hourlyRate || 100;
      const hours = entry.duration / 60;
      const amount = hours * rate;
      
      if (!projectBreakdown[entry.projectId]) {
        projectBreakdown[entry.projectId] = {
          hours: 0,
          rate,
          amount: 0,
          name: project?.name || 'Unknown Project'
        };
      }
      
      projectBreakdown[entry.projectId].hours += hours;
      projectBreakdown[entry.projectId].amount += amount;
      totalAmount += amount;
    });
    
    const tax = totalAmount * 0.1; // 10% tax
    const grandTotal = totalAmount + tax;
    
    return {
      totalHours,
      totalAmount,
      tax,
      grandTotal,
      projectBreakdown: Object.values(projectBreakdown),
      selectedCount: selectedEntries.length
    };
  }, [filteredTimeEntries, selectedTimeEntryIds, state.projects]);

  const handleTimeEntryToggle = (entryId: string) => {
    setSelectedTimeEntryIds(prev => 
      prev.includes(entryId)
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
  };

  const handleSelectAllForClient = () => {
    const allIds = filteredTimeEntries.map(entry => entry.id);
    setSelectedTimeEntryIds(allIds);
  };

  const handleGenerateInvoice = () => {
    if (selectedTimeEntryIds.length === 0) {
      alert('Please select at least one time entry.');
      return;
    }
    
    if (!selectedClientId) {
      alert('Please select a client.');
      return;
    }
    
    // Get unique project IDs from selected entries
    const projectIds = [...new Set(
      filteredTimeEntries
        .filter(entry => selectedTimeEntryIds.includes(entry.id))
        .map(entry => entry.projectId)
    )];
    
    dispatch({
      type: 'GENERATE_INVOICE',
      payload: {
        clientId: selectedClientId,
        timeEntryIds: selectedTimeEntryIds,
        projectIds,
        dueDate,
        notes: notes.trim() || undefined,
      },
    });
    
    // Reset form
    setSelectedTimeEntryIds([]);
    setSelectedClientId('');
    setNotes('');
    alert('Invoice generated successfully!');
  };

  const getProjectName = (projectId: string) => {
    const project = state.projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  const getClientName = (clientId: string) => {
    const client = state.clients.find(c => c.id === clientId);
    return client?.name || 'Unknown Client';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-neutral-900">Generate Invoice</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Create invoices from approved time entries
        </p>
      </div>

      {availableTimeEntries.length === 0 ? (
        <div className="text-center py-12">
          <CalendarDaysIcon className="mx-auto h-12 w-12 text-neutral-400" />
          <h3 className="mt-2 text-sm font-medium text-neutral-900">No approved time entries</h3>
          <p className="mt-1 text-sm text-neutral-500">
            You need approved billable time entries to generate invoices.
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Selection */}
          <div className="space-y-6">
            {/* Client Selection */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Select Client
              </label>
              <select
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={selectedClientId}
                onChange={(e) => {
                  setSelectedClientId(e.target.value);
                  setSelectedTimeEntryIds([]); // Clear selections when client changes
                }}
              >
                <option value="">Choose a client...</option>
                {Object.keys(timeEntriesByClient).map(clientId => (
                  <option key={clientId} value={clientId}>
                    {getClientName(clientId)} ({timeEntriesByClient[clientId].length} entries)
                  </option>
                ))}
              </select>
            </div>

            {/* Time Entries Selection */}
            {selectedClientId && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-neutral-700">
                    Select Time Entries
                  </label>
                  <button
                    onClick={handleSelectAllForClient}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Select All
                  </button>
                </div>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredTimeEntries.map(entry => {
                    const project = state.projects.find(p => p.id === entry.projectId);
                    const rate = project?.hourlyRate || 100;
                    const amount = (entry.duration / 60) * rate;
                    
                    return (
                      <div
                        key={entry.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedTimeEntryIds.includes(entry.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                        onClick={() => handleTimeEntryToggle(entry.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedTimeEntryIds.includes(entry.id)}
                                onChange={() => {}} // Handled by div click
                                className="text-blue-600"
                              />
                              <div>
                                <div className="font-medium text-sm">{getProjectName(entry.projectId)}</div>
                                <div className="text-sm text-neutral-500">{entry.description}</div>
                                <div className="text-xs text-neutral-400">
                                  {format(new Date(entry.date), 'MMM d, yyyy')}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{formatDuration(entry.duration)}</div>
                            <div className="text-sm text-neutral-500">{formatCurrency(amount)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Invoice Settings */}
            {selectedTimeEntryIds.length > 0 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Additional notes for the invoice..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Summary */}
          {selectedTimeEntryIds.length > 0 && (
            <div className="bg-neutral-50 rounded-xl p-6">
              <h3 className="text-lg font-medium text-neutral-900 mb-4">Invoice Summary</h3>
              
              {/* Project Breakdown */}
              <div className="space-y-3 mb-6">
                {calculationSummary.projectBreakdown.map((project, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div>
                      <div className="font-medium">{project.name}</div>
                      <div className="text-neutral-500">
                        {project.hours.toFixed(1)}h @ {formatCurrency(project.rate)}/hr
                      </div>
                    </div>
                    <div className="font-medium">{formatCurrency(project.amount)}</div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-neutral-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({calculationSummary.totalHours.toFixed(1)} hours)</span>
                  <span>{formatCurrency(calculationSummary.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax (10%)</span>
                  <span>{formatCurrency(calculationSummary.tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t border-neutral-200 pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(calculationSummary.grandTotal)}</span>
                </div>
              </div>

              <button
                onClick={handleGenerateInvoice}
                className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Generate Invoice
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InvoiceGenerator; 