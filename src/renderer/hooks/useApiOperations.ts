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
      const newEntry = await apiClient.createTimeEntry(entry);
      // ✅ AFTER: Clean code - returns TimeEntry object directly
      dispatch({ type: 'ADD_TIME_ENTRY', payload: newEntry });
      return newEntry;
    } catch (error: any) {
      console.error('Failed to create time entry:', error);
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
      await apiClient.submitTimeEntries(timeEntryIds);
      dispatch({ type: 'SUBMIT_TIME_ENTRIES', payload: timeEntryIds });
    } catch (error: any) {
      console.error('Failed to submit time entries:', error);
      setError('submitTimeEntries', error.message || 'Failed to submit time entries');
      throw error;
    } finally {
      setLoading('submitTimeEntries', false);
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
  const createInvoice = useCallback(async (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading('createInvoice', true);
      setError('createInvoice', null);
      const newInvoice = await apiClient.createInvoice(invoice);
      dispatch({ type: 'ADD_INVOICE', payload: {
        ...invoice,
        invoiceNumber: newInvoice.invoiceNumber,
      } });
      return newInvoice;
    } catch (error: any) {
      console.error('Failed to create invoice:', error);
      setError('createInvoice', error.message || 'Failed to create invoice');
      throw error;
    } finally {
      setLoading('createInvoice', false);
    }
  }, [dispatch, setLoading, setError]);

  const updateInvoice = useCallback(async (id: string, updates: Partial<Invoice>) => {
    try {
      setLoading('updateInvoice', true);
      setError('updateInvoice', null);
      const updatedInvoice = await apiClient.updateInvoice(id, updates);
      dispatch({ type: 'UPDATE_INVOICE', payload: { id, updates } });
      return updatedInvoice;
    } catch (error: any) {
      console.error('Failed to update invoice:', error);
      setError('updateInvoice', error.message || 'Failed to update invoice');
      throw error;
    } finally {
      setLoading('updateInvoice', false);
    }
  }, [dispatch, setLoading, setError]);

  return {
    // Time Entry operations
    createTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    submitTimeEntries,
    
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
    createInvoice,
    updateInvoice,
  };
}; 