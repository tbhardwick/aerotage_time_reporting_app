import React, { useState, useMemo } from 'react';
import { PlusIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { useAppContext } from '../../context/AppContext';
import { format } from 'date-fns';
import { apiClient } from '../../services/api-client';

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
      const rate = project?.defaultHourlyRate || 100;
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

  const handleGenerateInvoice = async () => {
    if (selectedTimeEntryIds.length === 0) {
      alert('Please select at least one time entry.');
      return;
    }
    
    if (!selectedClientId) {
      alert('Please select a client.');
      return;
    }
    
    try {
      // Get unique project IDs from selected entries
      const projectIds = [...new Set(
        filteredTimeEntries
          .filter(entry => selectedTimeEntryIds.includes(entry.id))
          .map(entry => entry.projectId)
      )];
      
      // Create line items from selected time entries
      const additionalLineItems = filteredTimeEntries
        .filter(entry => selectedTimeEntryIds.includes(entry.id))
        .map(entry => {
          const project = state.projects.find(p => p.id === entry.projectId);
          const rate = project?.defaultHourlyRate || 100;
          const hours = entry.duration / 60;
          const amount = hours * rate;
          
          return {
            type: 'time' as const,
            description: `${project?.name || 'Project'}: ${entry.description}`,
            quantity: hours,
            rate,
            amount,
            taxable: true
          };
        });
      
      // Use the new API format for invoice creation
      const invoiceData = {
        clientId: selectedClientId,
        timeEntryIds: selectedTimeEntryIds,
        projectIds,
        dueDate,
        notes: notes.trim() || undefined,
        paymentTerms: 'Net 30',
        currency: 'USD',
        taxRate: 0.1, // 10% tax
        additionalLineItems
      };
      
      // Call the API to create the invoice
      const newInvoice = await apiClient.createInvoice(invoiceData);
      
      // Update the context with the new invoice
      dispatch({
        type: 'ADD_INVOICE',
        payload: newInvoice,
      });
      
      // Reset form
      setSelectedTimeEntryIds([]);
      setSelectedClientId('');
      setNotes('');
      alert(`Invoice ${newInvoice.invoiceNumber} generated successfully!`);
      
    } catch (error: any) {
      console.error('Failed to generate invoice:', error);
      alert(`Failed to generate invoice: ${error.message}`);
    }
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
        <h2 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Generate Invoice</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Create invoices from approved time entries
        </p>
      </div>

      {availableTimeEntries.length === 0 ? (
        <div className="text-center py-12">
          <CalendarDaysIcon className="mx-auto h-12 w-12" style={{ color: 'var(--text-secondary)' }} />
          <h3 className="mt-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>No approved time entries</h3>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            You need approved billable time entries to generate invoices.
          </p>
          <div className="mt-4 text-xs max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
            <p className="mb-2">To create invoices, follow these steps:</p>
            <ol className="text-left space-y-1">
              <li>1. Create time entries (Time Tracking page)</li>
              <li>2. Submit entries for approval (Approvals page)</li>
              <li>3. Approve submitted entries (manager/admin)</li>
              <li>4. Return here to generate invoices</li>
            </ol>
                            <p className="mt-2" style={{ color: 'var(--color-primary-600)' }}>
              💡 Use Settings → Workflow Test to test the complete flow
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Selection */}
          <div className="space-y-6">
            {/* Client Selection */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Select Client
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-offset-2"
                style={{
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--background-color)',
                  color: 'var(--text-primary)',
                  '--tw-ring-color': 'var(--color-primary-500)'
                } as React.CSSProperties}
              >
                <option value="">Choose a client...</option>
                {Object.keys(timeEntriesByClient).map(clientId => (
                  <option key={clientId} value={clientId}>
                    {getClientName(clientId)} ({timeEntriesByClient[clientId].length} entries)
                  </option>
                ))}
              </select>
            </div>

            {selectedClientId && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Select Time Entries
                  </label>
                  <button
                    onClick={handleSelectAllForClient}
                    className="text-sm transition-colors duration-200"
                    style={{ color: 'var(--color-primary-600)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--color-primary-800)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--color-primary-600)';
                    }}
                  >
                    Select All
                  </button>
                </div>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredTimeEntries.map(entry => {
                    const project = state.projects.find(p => p.id === entry.projectId);
                    const rate = project?.defaultHourlyRate || 100;
                    const amount = (entry.duration / 60) * rate;
                    
                    return (
                      <div
                        key={entry.id}
                        className="p-3 rounded-lg border cursor-pointer transition-colors"
                        style={{
                          border: selectedTimeEntryIds.includes(entry.id) 
                            ? '1px solid var(--color-primary-500)' 
                            : '1px solid var(--border-color)',
                          backgroundColor: selectedTimeEntryIds.includes(entry.id) 
                            ? 'var(--color-primary-50)' 
                            : 'var(--surface-color)'
                        }}
                        onClick={() => handleTimeEntryToggle(entry.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedTimeEntryIds.includes(entry.id)}
                              onChange={() => handleTimeEntryToggle(entry.id)}
                              className="h-4 w-4 rounded focus:ring-2 focus:ring-offset-2"
                              style={{ 
                                borderColor: 'var(--border-color)',
                                color: 'var(--color-primary-600)',
                                '--tw-ring-color': 'var(--color-primary-500)'
                              } as React.CSSProperties}
                            />
                            <div>
                              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                {getProjectName(entry.projectId)}
                              </p>
                              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                {entry.date} • {formatDuration(entry.duration)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                              {formatCurrency(amount)}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              {formatCurrency(rate)}/hr
                            </p>
                          </div>
                        </div>
                        {entry.description && (
                          <p className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {entry.description}
                          </p>
                        )}
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
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-offset-2"
                    style={{
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--background-color)',
                      color: 'var(--text-primary)',
                      '--tw-ring-color': 'var(--color-primary-500)'
                    } as React.CSSProperties}
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Notes (Optional)
                  </label>
                  <textarea
                    className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-offset-2"
                    style={{
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--background-color)',
                      color: 'var(--text-primary)',
                      '--tw-ring-color': 'var(--color-primary-500)'
                    } as React.CSSProperties}
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
            <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--border-color)' }}>
              <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Invoice Summary</h3>
              
              {/* Project Breakdown */}
              <div className="space-y-3 mb-6">
                {calculationSummary.projectBreakdown.map((project, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div>
                      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{project.name}</div>
                      <div style={{ color: 'var(--text-secondary)' }}>
                        {project.hours.toFixed(1)}h @ {formatCurrency(project.rate)}/hr
                      </div>
                    </div>
                    <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(project.amount)}</div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="pt-4 space-y-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>Subtotal ({calculationSummary.totalHours.toFixed(1)} hours)</span>
                  <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(calculationSummary.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>Tax (10%)</span>
                  <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(calculationSummary.tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-primary)' }}>Total</span>
                  <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(calculationSummary.grandTotal)}</span>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateInvoice}
                className="w-full mt-6 px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
                style={{
                  backgroundColor: 'var(--color-primary-600)',
                  color: 'var(--color-text-on-primary)',
                  '--tw-ring-color': 'var(--color-primary-500)'
                } as React.CSSProperties}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary-700)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
                }}
              >
                <PlusIcon className="w-4 h-4 mr-2 inline" />
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