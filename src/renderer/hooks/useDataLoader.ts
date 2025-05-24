import { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { apiClient } from '../services/api-client';

export const useDataLoader = () => {
  const { dispatch } = useAppContext();

  const setLoading = useCallback((key: string, loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: { key, loading } });
  }, [dispatch]);

  const setError = useCallback((key: string, error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: { key, error } });
  }, [dispatch]);

  const loadTimeEntries = useCallback(async (filters?: {
    userId?: string;
    projectId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }) => {
    try {
      console.log('🔄 Loading time entries...', filters);
      setLoading('timeEntries', true);
      setError('timeEntries', null);
      const timeEntries = await apiClient.getTimeEntries(filters);
      console.log('✅ Time entries loaded:', timeEntries);
      const validTimeEntries = Array.isArray(timeEntries) ? timeEntries : [];
      dispatch({ type: 'SET_TIME_ENTRIES', payload: validTimeEntries });
    } catch (error: any) {
      console.error('❌ Failed to load time entries:', error);
      setError('timeEntries', error.message || 'Failed to load time entries');
      dispatch({ type: 'SET_TIME_ENTRIES', payload: [] });
    } finally {
      setLoading('timeEntries', false);
    }
  }, [dispatch, setLoading, setError]);

  const loadProjects = useCallback(async (filters?: { clientId?: string; status?: string }) => {
    try {
      console.log('🔄 Loading projects...', filters);
      setLoading('projects', true);
      setError('projects', null);
      const projects = await apiClient.getProjects(filters);
      console.log('✅ Projects loaded:', projects);
      const validProjects = Array.isArray(projects) ? projects : [];
      dispatch({ type: 'SET_PROJECTS', payload: validProjects });
    } catch (error: any) {
      console.error('❌ Failed to load projects:', error);
      setError('projects', error.message || 'Failed to load projects');
      dispatch({ type: 'SET_PROJECTS', payload: [] });
    } finally {
      setLoading('projects', false);
    }
  }, [dispatch, setLoading, setError]);

  const loadClients = useCallback(async () => {
    try {
      console.log('🔄 Loading clients...');
      setLoading('clients', true);
      setError('clients', null);
      const clients = await apiClient.getClients();
      console.log('✅ Clients loaded:', clients);
      const validClients = Array.isArray(clients) ? clients : [];
      dispatch({ type: 'SET_CLIENTS', payload: validClients });
    } catch (error: any) {
      console.error('❌ Failed to load clients:', error);
      setError('clients', error.message || 'Failed to load clients');
      dispatch({ type: 'SET_CLIENTS', payload: [] });
    } finally {
      setLoading('clients', false);
    }
  }, [dispatch, setLoading, setError]);

  const loadUsers = useCallback(async () => {
    try {
      console.log('🔄 Loading users...');
      setLoading('users', true);
      setError('users', null);
      const users = await apiClient.getUsers();
      console.log('✅ Users loaded:', users);
      const validUsers = Array.isArray(users) ? users : [];
      dispatch({ type: 'SET_USERS', payload: validUsers });
    } catch (error: any) {
      console.error('❌ Failed to load users:', error);
      setError('users', error.message || 'Failed to load users');
      dispatch({ type: 'SET_USERS', payload: [] });
    } finally {
      setLoading('users', false);
    }
  }, [dispatch, setLoading, setError]);

  const loadInvoices = useCallback(async (filters?: { clientId?: string; status?: string }) => {
    try {
      console.log('🔄 Loading invoices...', filters);
      setLoading('invoices', true);
      setError('invoices', null);
      const invoices = await apiClient.getInvoices(filters);
      console.log('✅ Invoices loaded:', invoices);
      const validInvoices = Array.isArray(invoices) ? invoices : [];
      dispatch({ type: 'SET_INVOICES', payload: validInvoices });
    } catch (error: any) {
      console.error('❌ Failed to load invoices:', error);
      setError('invoices', error.message || 'Failed to load invoices');
      dispatch({ type: 'SET_INVOICES', payload: [] });
    } finally {
      setLoading('invoices', false);
    }
  }, [dispatch, setLoading, setError]);

  const loadCurrentUser = useCallback(async () => {
    try {
      console.log('🔄 Loading current user...');
      setLoading('currentUser', true);
      setError('currentUser', null);
      const user = await apiClient.getCurrentUser();
      console.log('✅ Current user loaded:', user);
      dispatch({ type: 'SET_USER', payload: user });
      return user;
    } catch (error: any) {
      console.error('❌ Failed to load current user:', error);
      setError('currentUser', error.message || 'Failed to load user data');
      throw error;
    } finally {
      setLoading('currentUser', false);
    }
  }, [dispatch, setLoading, setError]);

  const loadAllData = useCallback(async () => {
    console.log('🚀 Starting to load all application data...');
    try {
      setLoading('initialLoad', true);
      setError('initialLoad', null);

      // Load data in parallel where possible, handling individual failures
      const results = await Promise.allSettled([
        loadCurrentUser(),
        loadClients(),
        loadProjects(),
        loadTimeEntries(),
        loadUsers(),
        loadInvoices(),
      ]);

      console.log('📊 Data loading results:', results);

      // Check if any critical operations failed
      const failures = results
        .map((result, index) => ({ result, index }))
        .filter(({ result }) => result.status === 'rejected')
        .map(({ result, index }) => {
          const operations = ['user data', 'clients', 'projects', 'time entries', 'users', 'invoices'];
          return `${operations[index]}: ${(result as PromiseRejectedResult).reason?.message || 'Unknown error'}`;
        });

      if (failures.length > 0) {
        console.warn('⚠️ Some data failed to load:', failures);
        // Only set error if critical data (user, clients, projects) failed
        const criticalFailures = failures.filter(failure => 
          failure.includes('user data') || 
          failure.includes('clients') || 
          failure.includes('projects')
        );
        
        if (criticalFailures.length > 0) {
          console.error('💥 Critical data loading failed:', criticalFailures);
          setError('initialLoad', `Failed to load critical data: ${criticalFailures.join(', ')}`);
        } else {
          console.log('✅ Critical data loaded successfully, some non-critical data failed');
        }
      } else {
        console.log('🎉 All data loaded successfully!');
      }
    } catch (error: any) {
      console.error('💥 Failed to load application data:', error);
      setError('initialLoad', error.message || 'Failed to load application data');
    } finally {
      console.log('🏁 Data loading completed');
      setLoading('initialLoad', false);
    }
  }, [loadCurrentUser, loadClients, loadProjects, loadTimeEntries, loadUsers, loadInvoices, setLoading, setError]);

  return {
    loadTimeEntries,
    loadProjects,
    loadClients,
    loadUsers,
    loadInvoices,
    loadCurrentUser,
    loadAllData,
  };
}; 