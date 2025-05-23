import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Client, Project, TimeEntry, User, Team } from '../../types';

// Mock data for development
const mockClients: Client[] = [
  {
    id: '1',
    name: 'TechCorp Solutions',
    contactInfo: {
      email: 'contact@techcorp.com',
      phone: '+1 (555) 123-4567',
      address: '123 Tech Street, Silicon Valley, CA 94000',
    },
    billingAddress: '123 Tech Street, Silicon Valley, CA 94000',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Green Energy Inc',
    contactInfo: {
      email: 'info@greenenergy.com',
      phone: '+1 (555) 987-6543',
      address: '456 Renewable Ave, Austin, TX 78701',
    },
    billingAddress: '456 Renewable Ave, Austin, TX 78701',
    isActive: true,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '3',
    name: 'Manufacturing Plus',
    contactInfo: {
      email: 'projects@mfgplus.com',
      phone: '+1 (555) 456-7890',
      address: '789 Industrial Blvd, Detroit, MI 48201',
    },
    billingAddress: '789 Industrial Blvd, Detroit, MI 48201',
    isActive: true,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
];

const mockProjects: Project[] = [
  {
    id: '1',
    clientId: '1',
    name: 'Mobile App Development',
    description: 'Developing a cross-platform mobile application for inventory management',
    budget: { hours: 500, amount: 75000 },
    hourlyRate: 150,
    status: 'active',
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z',
  },
  {
    id: '2',
    clientId: '1',
    name: 'API Integration',
    description: 'Integrating third-party APIs for data synchronization',
    budget: { hours: 200, amount: 30000 },
    hourlyRate: 150,
    status: 'active',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
  },
  {
    id: '3',
    clientId: '2',
    name: 'Solar Panel Monitoring System',
    description: 'IoT system for monitoring solar panel efficiency',
    budget: { hours: 800, amount: 100000 },
    hourlyRate: 125,
    status: 'active',
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
  },
  {
    id: '4',
    clientId: '3',
    name: 'Quality Control Dashboard',
    description: 'Real-time dashboard for manufacturing quality metrics',
    budget: { hours: 300, amount: 37500 },
    hourlyRate: 125,
    status: 'active',
    createdAt: '2024-02-05T00:00:00Z',
    updatedAt: '2024-02-05T00:00:00Z',
  },
];

const mockTimeEntries: TimeEntry[] = [
  {
    id: '1',
    userId: '3',
    projectId: '1',
    date: '2024-01-15',
    startTime: '09:00',
    endTime: '12:00',
    duration: 180,
    description: 'Implemented user authentication module',
    isBillable: true,
    status: 'approved',
    createdAt: '2024-01-15T12:00:00Z',
    updatedAt: '2024-01-15T12:00:00Z',
  },
  {
    id: '2',
    userId: '3',
    projectId: '1',
    date: '2024-01-15',
    startTime: '13:00',
    endTime: '17:00',
    duration: 240,
    description: 'Worked on UI components for login screen',
    isBillable: true,
    status: 'approved',
    createdAt: '2024-01-15T17:00:00Z',
    updatedAt: '2024-01-15T17:00:00Z',
  },
  {
    id: '3',
    userId: '3',
    projectId: '2',
    date: '2024-01-16',
    startTime: '09:00',
    endTime: '11:30',
    duration: 150,
    description: 'API endpoint design and documentation',
    isBillable: true,
    status: 'submitted',
    createdAt: '2024-01-16T11:30:00Z',
    updatedAt: '2024-01-16T11:30:00Z',
  },
];

// Mock API implementation
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      // In real implementation, add auth token here
      const token = (getState() as any).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Client', 'Project', 'TimeEntry', 'User', 'Team'],
  endpoints: (builder) => ({
    // Clients
    getClients: builder.query<Client[], void>({
      queryFn: () => ({ data: mockClients }),
      providesTags: ['Client'],
    }),
    getClient: builder.query<Client, string>({
      queryFn: (id) => {
        const client = mockClients.find(c => c.id === id);
        return client 
          ? { data: client } 
          : { error: { status: 404, data: 'Client not found' } };
      },
      providesTags: ['Client'],
    }),
    
    // Projects
    getProjects: builder.query<Project[], void>({
      queryFn: () => {
        const projectsWithClients = mockProjects.map(project => ({
          ...project,
          client: mockClients.find(c => c.id === project.clientId),
        }));
        return { data: projectsWithClients };
      },
      providesTags: ['Project'],
    }),
    getProject: builder.query<Project, string>({
      queryFn: (id) => {
        const project = mockProjects.find(p => p.id === id);
        if (project) {
          const projectWithClient = {
            ...project,
            client: mockClients.find(c => c.id === project.clientId),
          };
          return { data: projectWithClient };
        }
        return { error: { status: 404, data: 'Project not found' } };
      },
      providesTags: ['Project'],
    }),
    
    // Time Entries
    getTimeEntries: builder.query<TimeEntry[], { userId?: string; projectId?: string; date?: string }>({
      queryFn: (filters) => {
        let filteredEntries = [...mockTimeEntries];
        
        if (filters.userId) {
          filteredEntries = filteredEntries.filter(entry => entry.userId === filters.userId);
        }
        if (filters.projectId) {
          filteredEntries = filteredEntries.filter(entry => entry.projectId === filters.projectId);
        }
        if (filters.date) {
          filteredEntries = filteredEntries.filter(entry => entry.date === filters.date);
        }
        
        // Add populated fields
        const entriesWithDetails = filteredEntries.map(entry => ({
          ...entry,
          project: mockProjects.find(p => p.id === entry.projectId),
        }));
        
        return { data: entriesWithDetails };
      },
      providesTags: ['TimeEntry'],
    }),
    
    createTimeEntry: builder.mutation<TimeEntry, Partial<TimeEntry>>({
      queryFn: (newEntry) => {
        const entry: TimeEntry = {
          id: Date.now().toString(),
          userId: newEntry.userId || '3',
          projectId: newEntry.projectId || '1',
          date: newEntry.date || new Date().toISOString().split('T')[0],
          startTime: newEntry.startTime,
          endTime: newEntry.endTime,
          duration: newEntry.duration || 0,
          description: newEntry.description || '',
          isBillable: newEntry.isBillable || true,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        mockTimeEntries.push(entry);
        return { data: entry };
      },
      invalidatesTags: ['TimeEntry'],
    }),
  }),
});

export const {
  useGetClientsQuery,
  useGetClientQuery,
  useGetProjectsQuery,
  useGetProjectQuery,
  useGetTimeEntriesQuery,
  useCreateTimeEntryMutation,
} = apiSlice; 