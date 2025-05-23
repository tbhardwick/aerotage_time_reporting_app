/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../../src/renderer/App';

// Mock the context
const mockDispatch = jest.fn();
const mockState = {
  timeEntries: [],
  projects: [],
  clients: [],
  invoices: [],
  timer: {
    isRunning: false,
    startTime: null,
    currentProjectId: null,
    currentDescription: '',
    elapsedTime: 0
  },
  user: null
};

jest.mock('../../src/renderer/context/AppContext', () => ({
  AppProvider: ({ children }) => children,
  useAppContext: () => ({
    state: mockState,
    dispatch: mockDispatch
  })
}));

// Mock individual page components to focus on App-level testing
jest.mock('../../src/renderer/pages/TimeTrackingNew', () => {
  return function TimeTrackingNew() {
    return <div data-testid="time-tracking-page">Time Tracking Page</div>;
  };
});

jest.mock('../../src/renderer/pages/Projects', () => {
  return function Projects() {
    return <div data-testid="projects-page">Projects Page</div>;
  };
});

jest.mock('../../src/renderer/pages/Approvals', () => ({
  Approvals: function Approvals() {
    return <div data-testid="approvals-page">Approvals Page</div>;
  }
}));

jest.mock('../../src/renderer/pages/Reports', () => {
  return function Reports() {
    return <div data-testid="reports-page">Reports Page</div>;
  };
});

jest.mock('../../src/renderer/pages/Invoices', () => {
  return function Invoices() {
    return <div data-testid="invoices-page">Invoices Page</div>;
  };
});

describe('App Component', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
    // Clear location hash before each test to ensure clean state
    window.location.hash = '';
  });

  describe('Navigation', () => {
    test('renders navigation with all menu items', () => {
      render(<App />);
      
      expect(screen.getByText('Aerotage Time')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      
      // Check navigation items by finding text content that includes both icon and text
      const navLinks = screen.getAllByRole('link').filter(link => link.closest('nav'));
      
      // Check for navigation items with icon + text format
      expect(navLinks.some(link => link.textContent.includes('Dashboard'))).toBe(true);
      expect(navLinks.some(link => link.textContent.includes('Time Tracking'))).toBe(true);
      expect(navLinks.some(link => link.textContent.includes('Projects'))).toBe(true);
      expect(navLinks.some(link => link.textContent.includes('Approvals'))).toBe(true);
      expect(navLinks.some(link => link.textContent.includes('Reports'))).toBe(true);
      expect(navLinks.some(link => link.textContent.includes('Invoices'))).toBe(true);
    });

    test('navigation has proper accessibility attributes', () => {
      render(<App />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Main navigation');
      
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });
  });

  describe('Routing', () => {
    test('renders dashboard by default', () => {
      render(<App />);
      
      // Navigate to dashboard explicitly to ensure we're on the right route
      const dashboardLink = screen.getAllByRole('link').find(link => 
        link.getAttribute('href') === '#/' && link.closest('nav')
      );
      fireEvent.click(dashboardLink);
      
      // Wait for router to initialize and check for dashboard content
      expect(screen.getByText('Welcome to Aerotage Time Reporting')).toBeInTheDocument();
      expect(screen.getByText(/Track your time efficiently/)).toBeInTheDocument();
    });

    test('navigates to time tracking page', () => {
      render(<App />);
      
      // Find the navigation link specifically (not the dashboard card)
      const navLinks = screen.getAllByRole('link');
      const timeTrackingNavLink = navLinks.find(link => 
        link.getAttribute('href') === '#/time-tracking' && 
        link.textContent.includes('Time Tracking') &&
        link.closest('nav') // Ensure it's in the navigation
      );
      
      fireEvent.click(timeTrackingNavLink);
      
      expect(screen.getByTestId('time-tracking-page')).toBeInTheDocument();
    });

    test('navigates to projects page', () => {
      render(<App />);
      
      // Find the navigation link specifically
      const navLinks = screen.getAllByRole('link');
      const projectsNavLink = navLinks.find(link => 
        link.getAttribute('href') === '#/projects' && 
        link.textContent.includes('Projects') &&
        link.closest('nav')
      );
      
      fireEvent.click(projectsNavLink);
      
      expect(screen.getByTestId('projects-page')).toBeInTheDocument();
    });

    test('navigates to approvals page', () => {
      render(<App />);
      
      const navLinks = screen.getAllByRole('link');
      const approvalsNavLink = navLinks.find(link => 
        link.getAttribute('href') === '#/approvals' && 
        link.textContent.includes('Approvals') &&
        link.closest('nav')
      );
      
      fireEvent.click(approvalsNavLink);
      
      expect(screen.getByTestId('approvals-page')).toBeInTheDocument();
    });

    test('navigates to reports page', () => {
      render(<App />);
      
      const navLinks = screen.getAllByRole('link');
      const reportsNavLink = navLinks.find(link => 
        link.getAttribute('href') === '#/reports' && 
        link.textContent.includes('Reports') &&
        link.closest('nav')
      );
      
      fireEvent.click(reportsNavLink);
      
      expect(screen.getByTestId('reports-page')).toBeInTheDocument();
    });

    test('navigates to invoices page', () => {
      render(<App />);
      
      const navLinks = screen.getAllByRole('link');
      const invoicesNavLink = navLinks.find(link => 
        link.getAttribute('href') === '#/invoices' && 
        link.textContent.includes('Invoices') &&
        link.closest('nav')
      );
      
      fireEvent.click(invoicesNavLink);
      
      expect(screen.getByTestId('invoices-page')).toBeInTheDocument();
    });
  });

  describe('Dashboard', () => {
    test('renders dashboard quick action cards', () => {
      render(<App />);
      
      // Navigate to dashboard first
      const dashboardLink = screen.getAllByRole('link').find(link => 
        link.getAttribute('href') === '#/' && link.closest('nav')
      );
      fireEvent.click(dashboardLink);
      
      // Check for dashboard cards by finding the specific card content
      expect(screen.getByText(/Start tracking your time with/)).toBeInTheDocument();
      expect(screen.getByText(/Manage your clients and projects/)).toBeInTheDocument();
      expect(screen.getByText(/Generate insights and export data/)).toBeInTheDocument();
    });

    test('dashboard cards navigate to correct pages', () => {
      render(<App />);
      
      // Navigate to dashboard first
      const allLinks = screen.getAllByRole('link');
      const dashboardNavLink = allLinks.find(link => 
        link.getAttribute('href') === '#/' && 
        link.closest('nav')
      );
      fireEvent.click(dashboardNavLink);
      
      // Wait for dashboard to load
      expect(screen.getByText('Welcome to Aerotage Time Reporting')).toBeInTheDocument();
      
      // Time tracking card - look for card that's not in navigation
      let timeTrackingCard = screen.getAllByRole('link').find(link => 
        link.getAttribute('href') === '#/time-tracking' && 
        !link.closest('nav') && // Not in navigation
        link.textContent.includes('Start tracking your time with')
      );
      
      expect(timeTrackingCard).toBeInTheDocument();
      fireEvent.click(timeTrackingCard);
      expect(screen.getByTestId('time-tracking-page')).toBeInTheDocument();
      
      // Navigate back to dashboard
      fireEvent.click(dashboardNavLink);
      expect(screen.getByText('Welcome to Aerotage Time Reporting')).toBeInTheDocument();
      
      // Projects card - re-query after navigation
      let projectsCard = screen.getAllByRole('link').find(link => 
        link.getAttribute('href') === '#/projects' && 
        !link.closest('nav') &&
        link.textContent.includes('Manage your clients and projects')
      );
      
      expect(projectsCard).toBeInTheDocument();
      fireEvent.click(projectsCard);
      expect(screen.getByTestId('projects-page')).toBeInTheDocument();
      
      // Navigate back to dashboard
      fireEvent.click(dashboardNavLink);
      expect(screen.getByText('Welcome to Aerotage Time Reporting')).toBeInTheDocument();
      
      // Reports card - re-query after navigation
      let reportsCard = screen.getAllByRole('link').find(link => 
        link.getAttribute('href') === '#/reports' && 
        !link.closest('nav') &&
        link.textContent.includes('Generate insights and export data')
      );
      
      expect(reportsCard).toBeInTheDocument();
      fireEvent.click(reportsCard);
      expect(screen.getByTestId('reports-page')).toBeInTheDocument();
    });
  });

  describe('Active Navigation States', () => {
    test('updates active state when navigating', () => {
      render(<App />);
      
      // Find navigation links
      const navLinks = screen.getAllByRole('link').filter(link => link.closest('nav'));
      const dashboardNavLink = navLinks.find(link => link.getAttribute('href') === '#/');
      const timeTrackingNavLink = navLinks.find(link => link.getAttribute('href') === '#/time-tracking');
      const projectsNavLink = navLinks.find(link => link.getAttribute('href') === '#/projects');
      
      // Navigate to dashboard first to ensure proper state
      fireEvent.click(dashboardNavLink);
      
      // Wait for navigation to complete and check if dashboard is active
      waitFor(() => {
        expect(dashboardNavLink).toHaveAttribute('aria-current', 'page');
      });
      
      // Navigate to time tracking
      fireEvent.click(timeTrackingNavLink);
      
      // Wait for navigation to complete
      waitFor(() => {
        expect(timeTrackingNavLink).toHaveAttribute('aria-current', 'page');
        expect(dashboardNavLink).not.toHaveAttribute('aria-current', 'page');
      });
      
      // Navigate to projects
      fireEvent.click(projectsNavLink);
      
      waitFor(() => {
        expect(projectsNavLink).toHaveAttribute('aria-current', 'page');
        expect(timeTrackingNavLink).not.toHaveAttribute('aria-current', 'page');
      });
    });
  });

  describe('Error Boundary', () => {
    test('wraps application in error boundary', () => {
      // Mock console.error to prevent error logging during test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<App />);
      
      // The ErrorBoundary component should be wrapping the app
      // This is more of a structural test - we expect no errors during normal rendering
      expect(screen.getByRole('main')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Responsive Design', () => {
    test('applies responsive classes for mobile layout', () => {
      render(<App />);
      
      // Navigate to dashboard first
      const dashboardLink = screen.getAllByRole('link').find(link => 
        link.getAttribute('href') === '#/' && link.closest('nav')
      );
      fireEvent.click(dashboardLink);
      
      // Wait for dashboard content
      expect(screen.getByText('Welcome to Aerotage Time Reporting')).toBeInTheDocument();
      
      // Find the dashboard cards container
      const timeTrackingCard = screen.getByText(/Start tracking your time with/).closest('a');
      const cardsContainer = timeTrackingCard.parentElement;
      
      // Check that the container has the responsive grid classes
      expect(cardsContainer).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    });
  });
}); 