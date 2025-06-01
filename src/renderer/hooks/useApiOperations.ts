import { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { apiClient } from '../services/api-client';
import { TimeEntry, Project, Client, User, Invoice } from '../context/AppContext';

export const useApiOperations = () => {
  const { dispatch } = useAppContext();

  const setLoading = useCallback((key: string, loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: { key, loading } });
  }, [dispatch]);

  const setError = useCallback((key: string, error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: { key, error } });
  }, [dispatch]);

  // Time Entry Operations
  const createTimeEntry = useCallback(async (entry: Omit<TimeEntry, 'id' | 'createdAt'>) => {
    try {
      setLoading('createTimeEntry', true);
      setError('createTimeEntry', null);
      
      console.log('🚀 API Call: Creating time entry with data:', entry);
      const response = await apiClient.createTimeEntry(entry);
      console.log('📥 API Response received:', response);
      
      // Handle different API response formats
      let newEntry: TimeEntry;
      if (response && typeof response === 'object') {
        // Check if response is wrapped (has success/data structure)
        if ((response as any).success && (response as any).data) {
          newEntry = (response as any).data;
          console.log('✅ Extracted time entry from wrapped response:', newEntry);
        } else if ((response as any).id) {
          // Direct time entry object
          newEntry = response as TimeEntry;
          console.log('✅ Using direct time entry response:', newEntry);
        } else {
          console.error('❌ Unexpected API response format:', response);
          throw new Error('Invalid time entry data received from API');
        }
      } else {
        console.error('❌ Invalid API response:', response);
        throw new Error('No time entry data received from API');
      }
      
      // Validate the time entry has required fields
      if (!newEntry.id || !newEntry.projectId) {
        console.error('❌ Invalid time entry data - missing required fields:', newEntry);
        throw new Error('Invalid time entry data - missing required fields');
      }
      
      dispatch({ type: 'ADD_TIME_ENTRY', payload: newEntry });
      console.log('✅ Time entry added to context:', newEntry.id);
      return newEntry;
    } catch (error: any) {
      console.error('❌ Failed to create time entry:', error);
      console.error('📋 Error details:', {
        message: error.message,
        status: error.status,
        response: error.response
      });
      setError('createTimeEntry', error.message || 'Failed to create time entry');
      throw error;
    } finally {
      setLoading('createTimeEntry', false);
    }
  }, [dispatch, setLoading, setError]);

  const updateTimeEntry = useCallback(async (id: string, updates: Partial<TimeEntry>) => {
    try {
      setLoading('updateTimeEntry', true);
      setError('updateTimeEntry', null);
      const updatedEntry = await apiClient.updateTimeEntry(id, updates);
      dispatch({ type: 'UPDATE_TIME_ENTRY', payload: { id, updates } });
      return updatedEntry;
    } catch (error: any) {
      console.error('Failed to update time entry:', error);
      setError('updateTimeEntry', error.message || 'Failed to update time entry');
      throw error;
    } finally {
      setLoading('updateTimeEntry', false);
    }
  }, [dispatch, setLoading, setError]);

  const deleteTimeEntry = useCallback(async (id: string) => {
    try {
      setLoading('deleteTimeEntry', true);
      setError('deleteTimeEntry', null);
      await apiClient.deleteTimeEntry(id);
      dispatch({ type: 'DELETE_TIME_ENTRY', payload: id });
    } catch (error: any) {
      console.error('Failed to delete time entry:', error);
      setError('deleteTimeEntry', error.message || 'Failed to delete time entry');
      throw error;
    } finally {
      setLoading('deleteTimeEntry', false);
    }
  }, [dispatch, setLoading, setError]);

  const submitTimeEntries = useCallback(async (timeEntryIds: string[]) => {
    try {
      setLoading('submitTimeEntries', true);
      setError('submitTimeEntries', null);
      
      // Submit to backend API
      await apiClient.submitTimeEntries(timeEntryIds);
      
      // Update local state immediately for UI responsiveness
      dispatch({ type: 'SUBMIT_TIME_ENTRIES', payload: timeEntryIds });
      
      // Refresh time entries from backend to ensure synchronization
      try {
        const refreshedTimeEntries = await apiClient.getTimeEntries();
        
        // Handle paginated response format: {items: [...], pagination: {...}}
        let validTimeEntries = [];
        if (Array.isArray(refreshedTimeEntries)) {
          validTimeEntries = refreshedTimeEntries;
        } else if (refreshedTimeEntries && typeof refreshedTimeEntries === 'object' && Array.isArray((refreshedTimeEntries as any).items)) {
          validTimeEntries = (refreshedTimeEntries as any).items;
        }
        
        // Update state with fresh data from backend
        dispatch({ type: 'SET_TIME_ENTRIES', payload: validTimeEntries });
        console.log('✅ Time entries refreshed after submission:', validTimeEntries.length, 'entries');
      } catch (refreshError) {
        console.warn('⚠️ Failed to refresh time entries after submission:', refreshError);
        // Don't throw here - submission was successful, refresh just failed
      }
      
    } catch (error: any) {
      console.error('Failed to submit time entries:', error);
      setError('submitTimeEntries', error.message || 'Failed to submit time entries');
      throw error;
    } finally {
      setLoading('submitTimeEntries', false);
    }
  }, [dispatch, setLoading, setError]);

  const approveTimeEntries = useCallback(async (timeEntryIds: string[], comments?: string) => {
    try {
      setLoading('approveTimeEntries', true);
      setError('approveTimeEntries', null);
      
      // Approve via backend API
      await apiClient.approveTimeEntries(timeEntryIds, comments);
      
      // Update local state immediately for UI responsiveness
      dispatch({ 
        type: 'APPROVE_TIME_ENTRIES', 
        payload: { 
          ids: timeEntryIds, 
          approverId: '', // Will be set by backend
          comment: comments 
        } 
      });
      
      // Refresh time entries from backend to ensure synchronization
      try {
        const refreshedTimeEntries = await apiClient.getTimeEntries();
        
        // Handle paginated response format
        let validTimeEntries = [];
        if (Array.isArray(refreshedTimeEntries)) {
          validTimeEntries = refreshedTimeEntries;
        } else if (refreshedTimeEntries && typeof refreshedTimeEntries === 'object' && Array.isArray((refreshedTimeEntries as any).items)) {
          validTimeEntries = (refreshedTimeEntries as any).items;
        }
        
        dispatch({ type: 'SET_TIME_ENTRIES', payload: validTimeEntries });
        console.log('✅ Time entries refreshed after approval:', validTimeEntries.length, 'entries');
      } catch (refreshError) {
        console.warn('⚠️ Failed to refresh time entries after approval:', refreshError);
      }
      
    } catch (error: any) {
      console.error('Failed to approve time entries:', error);
      setError('approveTimeEntries', error.message || 'Failed to approve time entries');
      throw error;
    } finally {
      setLoading('approveTimeEntries', false);
    }
  }, [dispatch, setLoading, setError]);

  const rejectTimeEntries = useCallback(async (timeEntryIds: string[], comments: string) => {
    try {
      setLoading('rejectTimeEntries', true);
      setError('rejectTimeEntries', null);
      
      // Reject via backend API
      await apiClient.rejectTimeEntries(timeEntryIds, comments);
      
      // Update local state immediately for UI responsiveness
      dispatch({ 
        type: 'REJECT_TIME_ENTRIES', 
        payload: { 
          ids: timeEntryIds, 
          approverId: '', // Will be set by backend
          comment: comments 
        } 
      });
      
      // Refresh time entries from backend to ensure synchronization
      try {
        const refreshedTimeEntries = await apiClient.getTimeEntries();
        
        // Handle paginated response format
        let validTimeEntries = [];
        if (Array.isArray(refreshedTimeEntries)) {
          validTimeEntries = refreshedTimeEntries;
        } else if (refreshedTimeEntries && typeof refreshedTimeEntries === 'object' && Array.isArray((refreshedTimeEntries as any).items)) {
          validTimeEntries = (refreshedTimeEntries as any).items;
        }
        
        dispatch({ type: 'SET_TIME_ENTRIES', payload: validTimeEntries });
        console.log('✅ Time entries refreshed after rejection:', validTimeEntries.length, 'entries');
      } catch (refreshError) {
        console.warn('⚠️ Failed to refresh time entries after rejection:', refreshError);
      }
      
    } catch (error: any) {
      console.error('Failed to reject time entries:', error);
      setError('rejectTimeEntries', error.message || 'Failed to reject time entries');
      throw error;
    } finally {
      setLoading('rejectTimeEntries', false);
    }
  }, [dispatch, setLoading, setError]);

  // Project Operations
  const createProject = useCallback(async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading('createProject', true);
      setError('createProject', null);
      const newProject = await apiClient.createProject(project);
      // ✅ AFTER: Clean code - returns Project object directly
      dispatch({ type: 'ADD_PROJECT', payload: newProject });
      return newProject;
    } catch (error: any) {
      console.error('Failed to create project:', error);
      setError('createProject', error.message || 'Failed to create project');
      throw error;
    } finally {
      setLoading('createProject', false);
    }
  }, [dispatch, setLoading, setError]);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    try {
      setLoading('updateProject', true);
      setError('updateProject', null);
      const updatedProject = await apiClient.updateProject(id, updates);
      dispatch({ type: 'UPDATE_PROJECT', payload: { id, updates } });
      return updatedProject;
    } catch (error: any) {
      console.error('Failed to update project:', error);
      setError('updateProject', error.message || 'Failed to update project');
      throw error;
    } finally {
      setLoading('updateProject', false);
    }
  }, [dispatch, setLoading, setError]);

  const deleteProject = useCallback(async (id: string) => {
    try {
      setLoading('deleteProject', true);
      setError('deleteProject', null);
      await apiClient.deleteProject(id);
      dispatch({ type: 'DELETE_PROJECT', payload: id });
    } catch (error: any) {
      console.error('Failed to delete project:', error);
      setError('deleteProject', error.message || 'Failed to delete project');
      throw error;
    } finally {
      setLoading('deleteProject', false);
    }
  }, [dispatch, setLoading, setError]);

  // Client Operations
  const createClient = useCallback(async (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading('createClient', true);
      setError('createClient', null);
      const newClient = await apiClient.createClient(client);
      // ✅ AFTER: Clean code - returns Client object directly
      dispatch({ type: 'ADD_CLIENT', payload: newClient });
      return newClient;
    } catch (error: any) {
      console.error('Failed to create client:', error);
      setError('createClient', error.message || 'Failed to create client');
      throw error;
    } finally {
      setLoading('createClient', false);
    }
  }, [dispatch, setLoading, setError]);

  const updateClient = useCallback(async (id: string, updates: Partial<Client>) => {
    try {
      setLoading('updateClient', true);
      setError('updateClient', null);
      const updatedClient = await apiClient.updateClient(id, updates);
      // ✅ AFTER: Clean code - returns Client object directly
      // Use the original updates for the context, as the reducer expects Partial<Client>
      dispatch({ type: 'UPDATE_CLIENT', payload: { id, updates } });
      return updatedClient;
    } catch (error: any) {
      console.error('Failed to update client:', error);
      setError('updateClient', error.message || 'Failed to update client');
      throw error;
    } finally {
      setLoading('updateClient', false);
    }
  }, [dispatch, setLoading, setError]);

  const deleteClient = useCallback(async (id: string) => {
    try {
      setLoading('deleteClient', true);
      setError('deleteClient', null);
      await apiClient.deleteClient(id);
      dispatch({ type: 'DELETE_CLIENT', payload: id });
    } catch (error: any) {
      console.error('Failed to delete client:', error);
      setError('deleteClient', error.message || 'Failed to delete client');
      throw error;
    } finally {
      setLoading('deleteClient', false);
    }
  }, [dispatch, setLoading, setError]);

  // User Operations
  const createUser = useCallback(async (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading('createUser', true);
      setError('createUser', null);
      const newUser = await apiClient.createUser(user);
      // ✅ AFTER: Clean code - returns User object directly
      dispatch({ type: 'ADD_USER', payload: newUser });
      return newUser;
    } catch (error: any) {
      console.error('Failed to create user:', error);
      setError('createUser', error.message || 'Failed to create user');
      throw error;
    } finally {
      setLoading('createUser', false);
    }
  }, [dispatch, setLoading, setError]);

  const updateUser = useCallback(async (id: string, updates: Partial<User>) => {
    try {
      setLoading('updateUser', true);
      setError('updateUser', null);
      const updatedUser = await apiClient.updateUser(id, updates);
      dispatch({ type: 'UPDATE_USER', payload: { id, updates } });
      return updatedUser;
    } catch (error: any) {
      console.error('Failed to update user:', error);
      setError('updateUser', error.message || 'Failed to update user');
      throw error;
    } finally {
      setLoading('updateUser', false);
    }
  }, [dispatch, setLoading, setError]);

  const deleteUser = useCallback(async (id: string) => {
    try {
      setLoading('deleteUser', true);
      setError('deleteUser', null);
      await apiClient.deleteUser(id);
      dispatch({ type: 'DELETE_USER', payload: id });
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      setError('deleteUser', error.message || 'Failed to delete user');
      throw error;
    } finally {
      setLoading('deleteUser', false);
    }
  }, [dispatch, setLoading, setError]);

  // Invoice Operations
  const loadInvoices = async (filters?: { clientId?: string; status?: string; projectId?: string; dateFrom?: string; dateTo?: string; limit?: number; offset?: number; sortBy?: string; sortOrder?: string }) => {
    try {
      setLoading('loadInvoices', true);
      setError('loadInvoices', null);
      const invoices = await apiClient.getInvoices(filters);
      dispatch({ type: 'SET_INVOICES', payload: invoices });
      console.log('✅ Invoices loaded successfully:', invoices.length, 'invoices');
    } catch (error: any) {
      console.error('❌ Failed to load invoices:', error);
      setError('loadInvoices', error.message || 'Failed to load invoices');
    } finally {
      setLoading('loadInvoices', false);
    }
  };

  const createInvoice = async (invoiceData: {
    clientId: string;
    projectIds?: string[];
    timeEntryIds?: string[];
    issueDate?: string;
    dueDate?: string;
    paymentTerms?: string;
    currency?: string;
    taxRate?: number;
    discountRate?: number;
    additionalLineItems?: Array<{
      type: 'time' | 'expense' | 'fixed' | 'discount';
      description: string;
      quantity: number;
      rate: number;
      amount: number;
      taxable: boolean;
    }>;
    notes?: string;
    clientNotes?: string;
    isRecurring?: boolean;
    recurringConfig?: any;
  }) => {
    try {
      setLoading('createInvoice', true);
      setError('createInvoice', null);
      const newInvoice = await apiClient.createInvoice(invoiceData);
      dispatch({ type: 'ADD_INVOICE', payload: newInvoice });
      console.log('✅ Invoice created successfully:', newInvoice.invoiceNumber);
      return newInvoice;
    } catch (error: any) {
      console.error('❌ Failed to create invoice:', error);
      setError('createInvoice', error.message || 'Failed to create invoice');
      throw error;
    } finally {
      setLoading('createInvoice', false);
    }
  };

  const sendInvoice = async (invoiceId: string, options?: {
    recipientEmails?: string[];
    subject?: string;
    message?: string;
    attachPdf?: boolean;
    sendCopy?: boolean;
    scheduleDate?: string;
  }) => {
    try {
      setLoading('sendInvoice', true);
      setError('sendInvoice', null);
      await apiClient.sendInvoice(invoiceId, options);
      
      // Update invoice status in context
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
      
      console.log('✅ Invoice sent successfully');
    } catch (error: any) {
      console.error('❌ Failed to send invoice:', error);
      setError('sendInvoice', error.message || 'Failed to send invoice');
      throw error;
    } finally {
      setLoading('sendInvoice', false);
    }
  };

  const markInvoicePaid = async (invoiceId: string, paymentData: {
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    reference: string;
    notes?: string;
    externalPaymentId?: string;
    processorFee?: number;
  }) => {
    try {
      setLoading('markInvoicePaid', true);
      setError('markInvoicePaid', null);
      const updatedInvoice = await apiClient.updateInvoiceStatus(invoiceId, 'paid', paymentData);
      
      // Update invoice in context
      dispatch({
        type: 'UPDATE_INVOICE',
        payload: {
          id: invoiceId,
          updates: updatedInvoice,
        },
      });
      
      console.log('✅ Invoice marked as paid successfully');
      return updatedInvoice;
    } catch (error: any) {
      console.error('❌ Failed to mark invoice as paid:', error);
      setError('markInvoicePaid', error.message || 'Failed to mark invoice as paid');
      throw error;
    } finally {
      setLoading('markInvoicePaid', false);
    }
  };

  const updateInvoiceStatus = async (invoiceId: string, status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled' | 'refunded', paymentData?: any) => {
    try {
      setLoading('updateInvoiceStatus', true);
      setError('updateInvoiceStatus', null);
      const updatedInvoice = await apiClient.updateInvoiceStatus(invoiceId, status, paymentData);
      
      // Update invoice in context
      dispatch({
        type: 'UPDATE_INVOICE',
        payload: {
          id: invoiceId,
          updates: updatedInvoice,
        },
      });
      
      console.log('✅ Invoice status updated successfully:', status);
      return updatedInvoice;
    } catch (error: any) {
      console.error('❌ Failed to update invoice status:', error);
      setError('updateInvoiceStatus', error.message || 'Failed to update invoice status');
      throw error;
    } finally {
      setLoading('updateInvoiceStatus', false);
    }
  };

  return {
    // Time Entry operations
    createTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    submitTimeEntries,
    approveTimeEntries,
    rejectTimeEntries,
    
    // Project operations
    createProject,
    updateProject,
    deleteProject,
    
    // Client operations
    createClient,
    updateClient,
    deleteClient,
    
    // User operations
    createUser,
    updateUser,
    deleteUser,
    
    // Invoice operations
    loadInvoices,
    createInvoice,
    sendInvoice,
    markInvoicePaid,
    updateInvoiceStatus,
  };
}; 