import React, { useState } from 'react';
import { 
  DocumentTextIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  PaperAirplaneIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useAppContext, Invoice } from '../../context/AppContext';
import { apiClient } from '../../services/api-client';

const InvoiceList: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Invoice['status'] | 'all'>('all');

  // Get client and project names for display
  const getClientName = (clientId: string) => {
    const client = state.clients.find(c => c.id === clientId);
    return client?.name || 'Unknown Client';
  };

  const getProjectNames = (projectIds: string[]) => {
    return projectIds.map(id => {
      const project = state.projects.find(p => p.id === id);
      return project?.name || 'Unknown Project';
    }).join(', ');
  };

  // Filter invoices
  const filteredInvoices = state.invoices.filter(invoice => {
    const clientName = invoice.clientName || getClientName(invoice.clientId);
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        // Note: Delete endpoint not mentioned in API docs, using context for now
        dispatch({ type: 'DELETE_INVOICE', payload: invoiceId });
      } catch (error: any) {
        console.error('Failed to delete invoice:', error);
        alert(`Failed to delete invoice: ${error.message}`);
      }
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      await apiClient.sendInvoice(invoiceId, {
        attachPdf: true,
        sendCopy: true
      });
      
      // Update the invoice status in context
      dispatch({
        type: 'UPDATE_INVOICE',
        payload: {
          id: invoiceId,
          updates: {
            status: 'sent',
            sentDate: new Date().toISOString(),
          },
        },
      });
      
      alert('Invoice sent successfully!');
    } catch (error: any) {
      console.error('Failed to send invoice:', error);
      alert(`Failed to send invoice: ${error.message}`);
    }
  };

  const handleMarkPaid = async (invoiceId: string) => {
    const invoice = state.invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;
    
    try {
      const updatedInvoice = await apiClient.updateInvoiceStatus(invoiceId, 'paid', {
        amount: invoice.totalAmount,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'Manual Entry',
        reference: `MANUAL-${Date.now()}`,
        notes: 'Payment marked as received manually'
      });
      
      // Update the invoice in context
      dispatch({
        type: 'UPDATE_INVOICE',
        payload: {
          id: invoiceId,
          updates: updatedInvoice,
        },
      });
      
      alert('Invoice marked as paid!');
    } catch (error: any) {
      console.error('Failed to mark invoice as paid:', error);
      alert(`Failed to mark invoice as paid: ${error.message}`);
    }
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    
    switch (status) {
      case 'draft':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case 'sent':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'viewed':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'paid':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'overdue':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'cancelled':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case 'refunded':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Invoices</h2>
        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {filteredInvoices.length} of {state.invoices.length} invoices
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search invoices..."
            className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--background-color)',
              color: 'var(--text-primary)'
            }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          style={{
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--background-color)',
            color: 'var(--text-primary)'
          }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as Invoice['status'] | 'all')}
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Invoice Grid */}
      {filteredInvoices.length === 0 ? (
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12" style={{ color: 'var(--text-secondary)' }} />
          <h3 className="mt-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>No invoices found</h3>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by generating your first invoice.'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
              style={{
                backgroundColor: 'var(--surface-color)',
                border: '1px solid var(--border-color)'
              }}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {invoice.invoiceNumber}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {invoice.clientName || getClientName(invoice.clientId)}
                  </p>
                </div>
                <span className={getStatusBadge(invoice.status)}>
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </span>
              </div>

              {/* Amount */}
              <div className="mb-4">
                <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(invoice.totalAmount, invoice.currency)}
                </div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {formatCurrency(invoice.subtotal, invoice.currency)} + {formatCurrency(invoice.taxAmount, invoice.currency)} tax
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>Issue Date:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{formatDate(invoice.issueDate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>Due Date:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{formatDate(invoice.dueDate)}</span>
                </div>
                <div className="text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>Projects:</span>
                  <div className="mt-1" style={{ color: 'var(--text-primary)' }}>
                    {getProjectNames(invoice.projectIds)}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  className="flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
                  style={{
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--border-color)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--text-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--border-color)';
                  }}
                  title="View Invoice"
                >
                  <EyeIcon className="w-4 h-4" />
                  View
                </button>
                
                {invoice.status === 'draft' && (
                  <>
                    <button
                      onClick={() => handleSendInvoice(invoice.id)}
                      className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                      title="Send Invoice"
                    >
                      <PaperAirplaneIcon className="w-4 h-4" />
                    </button>
                    <button
                      className="px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center"
                      style={{
                        color: 'var(--text-primary)',
                        backgroundColor: 'var(--border-color)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--text-secondary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--border-color)';
                      }}
                      title="Edit Invoice"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  </>
                )}
                
                {invoice.status === 'sent' && (
                  <button
                    onClick={() => handleMarkPaid(invoice.id)}
                    className="px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                    title="Mark as Paid"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => handleDeleteInvoice(invoice.id)}
                  className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                  title="Delete Invoice"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvoiceList; 