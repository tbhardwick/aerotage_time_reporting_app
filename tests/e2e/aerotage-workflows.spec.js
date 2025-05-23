const { test, expect } = require('@playwright/test');

/**
 * Comprehensive E2E Tests for Aerotage Time Reporting App
 * Phase 7 - Polish & Testing
 * 
 * These tests cover complete user workflows from start to finish
 */

test.describe('Aerotage Time App - Complete User Workflows', () => {
  
  test.describe('Navigation & UI', () => {
    test('should navigate through all main pages', async ({ page }) => {
      // This test would navigate through the app using React Router
      // Since we're testing a web-based React app, we can use Playwright directly
      
      await page.goto('http://localhost:3000'); // Assuming dev server
      
      // Check dashboard loads
      await expect(page.locator('h1')).toContainText('Welcome to Aerotage Time Reporting');
      
      // Navigate to Time Tracking
      await page.click('a[href="#/time-tracking"]');
      await expect(page.locator('[data-testid="time-tracking-page"]')).toBeVisible();
      
      // Navigate to Projects
      await page.click('a[href="#/projects"]');
      await expect(page.locator('[data-testid="projects-page"]')).toBeVisible();
      
      // Navigate to Approvals
      await page.click('a[href="#/approvals"]');
      await expect(page.locator('[data-testid="approvals-page"]')).toBeVisible();
      
      // Navigate to Reports
      await page.click('a[href="#/reports"]');
      await expect(page.locator('[data-testid="reports-page"]')).toBeVisible();
      
      // Navigate to Invoices
      await page.click('a[href="#/invoices"]');
      await expect(page.locator('[data-testid="invoices-page"]')).toBeVisible();
    });

    test('should have responsive navigation', async ({ page }) => {
      await page.goto('http://localhost:3000');
      
      // Test navigation accessibility
      const nav = page.locator('nav[role="navigation"]');
      await expect(nav).toHaveAttribute('aria-label', 'Main navigation');
      
      // Test active states
      await page.click('a[href="#/time-tracking"]');
      const activeLink = page.locator('nav a[aria-current="page"]');
      await expect(activeLink).toContainText('Time Tracking');
    });
  });

  test.describe('Time Tracking Workflows', () => {
    test('complete timer workflow', async ({ page }) => {
      await page.goto('http://localhost:3000');
      await page.click('a[href="#/time-tracking"]');
      
      // Start timer
      await page.click('[data-testid="start-timer-btn"]');
      
      // Verify timer is running
      const timerDisplay = page.locator('[data-testid="timer-display"]');
      await expect(timerDisplay).toBeVisible();
      
      // Add description
      await page.fill('[data-testid="timer-description"]', 'Working on E2E tests');
      
      // Stop timer after a short time
      await page.waitForTimeout(2000);
      await page.click('[data-testid="stop-timer-btn"]');
      
      // Verify time entry was created
      const timeEntries = page.locator('[data-testid="time-entry"]');
      await expect(timeEntries.first()).toContainText('Working on E2E tests');
    });

    test('manual time entry workflow', async ({ page }) => {
      await page.goto('http://localhost:3000');
      await page.click('a[href="#/time-tracking"]');
      
      // Open manual entry form
      await page.click('[data-testid="manual-entry-btn"]');
      
      // Fill out manual entry
      await page.fill('[data-testid="manual-description"]', 'Manual time entry test');
      await page.fill('[data-testid="manual-duration"]', '2.5');
      await page.selectOption('[data-testid="manual-project"]', 'test-project-1');
      await page.check('[data-testid="manual-billable"]');
      
      // Submit entry
      await page.click('[data-testid="submit-manual-entry"]');
      
      // Verify entry appears in list
      const timeEntries = page.locator('[data-testid="time-entry"]');
      await expect(timeEntries).toContainText('Manual time entry test');
      await expect(timeEntries).toContainText('2.5 hours');
    });

    test('time entry editing and deletion', async ({ page }) => {
      await page.goto('http://localhost:3000');
      await page.click('a[href="#/time-tracking"]');
      
      // Create a test entry first
      await page.click('[data-testid="manual-entry-btn"]');
      await page.fill('[data-testid="manual-description"]', 'Entry to edit');
      await page.fill('[data-testid="manual-duration"]', '1.0');
      await page.click('[data-testid="submit-manual-entry"]');
      
      // Edit the entry
      await page.click('[data-testid="edit-entry-btn"]:first-of-type');
      await page.fill('[data-testid="edit-description"]', 'Edited entry description');
      await page.click('[data-testid="save-edit-btn"]');
      
      // Verify edit was saved
      await expect(page.locator('[data-testid="time-entry"]')).toContainText('Edited entry description');
      
      // Delete the entry
      await page.click('[data-testid="delete-entry-btn"]:first-of-type');
      await page.click('[data-testid="confirm-delete-btn"]');
      
      // Verify entry was deleted
      await expect(page.locator('[data-testid="time-entry"]')).not.toContainText('Edited entry description');
    });
  });

  test.describe('Project & Client Management Workflows', () => {
    test('complete client creation workflow', async ({ page }) => {
      await page.goto('http://localhost:3000');
      await page.click('a[href="#/projects"]');
      
      // Switch to Clients tab
      await page.click('[data-testid="clients-tab"]');
      
      // Create new client
      await page.click('[data-testid="new-client-btn"]');
      await page.fill('[data-testid="client-name"]', 'Test Client E2E');
      await page.fill('[data-testid="client-email"]', 'test@client.com');
      await page.fill('[data-testid="client-phone"]', '(555) 123-4567');
      await page.fill('[data-testid="client-address"]', '123 Test St, Test City, TC 12345');
      await page.click('[data-testid="save-client-btn"]');
      
      // Verify client appears in list
      const clientCards = page.locator('[data-testid="client-card"]');
      await expect(clientCards).toContainText('Test Client E2E');
      await expect(clientCards).toContainText('test@client.com');
    });

    test('complete project creation workflow', async ({ page }) => {
      await page.goto('http://localhost:3000');
      await page.click('a[href="#/projects"]');
      
      // Create new project
      await page.click('[data-testid="new-project-btn"]');
      await page.fill('[data-testid="project-name"]', 'E2E Test Project');
      await page.fill('[data-testid="project-description"]', 'Project created during E2E testing');
      await page.selectOption('[data-testid="project-client"]', 'test-client-1');
      await page.fill('[data-testid="project-hourly-rate"]', '150');
      await page.fill('[data-testid="project-budget-hours"]', '40');
      await page.click('[data-testid="save-project-btn"]');
      
      // Verify project appears in list
      const projectCards = page.locator('[data-testid="project-card"]');
      await expect(projectCards).toContainText('E2E Test Project');
      await expect(projectCards).toContainText('$150/hour');
    });

    test('project search and filtering', async ({ page }) => {
      await page.goto('http://localhost:3000');
      await page.click('a[href="#/projects"]');
      
      // Test search functionality
      await page.fill('[data-testid="project-search"]', 'E2E Test');
      const filteredProjects = page.locator('[data-testid="project-card"]:visible');
      await expect(filteredProjects).toContainText('E2E Test Project');
      
      // Test status filter
      await page.selectOption('[data-testid="status-filter"]', 'active');
      // Verify only active projects are shown
      
      // Clear filters
      await page.fill('[data-testid="project-search"]', '');
      await page.selectOption('[data-testid="status-filter"]', 'all');
    });
  });

  test.describe('Approval Workflows', () => {
    test('complete time entry submission workflow', async ({ page }) => {
      await page.goto('http://localhost:3000');
      
      // First create some time entries
      await page.click('a[href="#/time-tracking"]');
      await page.click('[data-testid="manual-entry-btn"]');
      await page.fill('[data-testid="manual-description"]', 'Entry for approval');
      await page.fill('[data-testid="manual-duration"]', '3.0');
      await page.click('[data-testid="submit-manual-entry"]');
      
      // Navigate to approvals
      await page.click('a[href="#/approvals"]');
      
      // Submit entries for approval
      await page.click('[data-testid="bulk-submission-tab"]');
      await page.check('[data-testid="select-entry"]:first-of-type');
      await page.click('[data-testid="submit-for-approval-btn"]');
      
      // Verify submission
      const submittedEntries = page.locator('[data-testid="submitted-entry"]');
      await expect(submittedEntries).toContainText('Entry for approval');
    });

    test('manager approval workflow', async ({ page }) => {
      await page.goto('http://localhost:3000');
      await page.click('a[href="#/approvals"]');
      
      // Switch to approval queue
      await page.click('[data-testid="approval-queue-tab"]');
      
      // Approve an entry
      await page.click('[data-testid="approve-entry-btn"]:first-of-type');
      await page.fill('[data-testid="approval-comment"]', 'Approved - good work!');
      await page.click('[data-testid="confirm-approval-btn"]');
      
      // Verify approval
      const approvedEntries = page.locator('[data-testid="approved-entry"]');
      await expect(approvedEntries).toContainText('Approved - good work!');
    });

    test('approval history tracking', async ({ page }) => {
      await page.goto('http://localhost:3000');
      await page.click('a[href="#/approvals"]');
      
      // View approval history
      await page.click('[data-testid="approval-history-tab"]');
      
      // Filter by date range
      await page.fill('[data-testid="history-start-date"]', '2024-01-01');
      await page.fill('[data-testid="history-end-date"]', '2024-12-31');
      await page.click('[data-testid="apply-history-filter"]');
      
      // Verify history displays
      const historyEntries = page.locator('[data-testid="history-entry"]');
      await expect(historyEntries.first()).toBeVisible();
    });
  });

  test.describe('Reporting & Analytics Workflows', () => {
    test('generate time reports with filtering', async ({ page }) => {
      await page.goto('http://localhost:3000');
      await page.click('a[href="#/reports"]');
      
      // Set date range
      await page.selectOption('[data-testid="date-range-filter"]', 'this-month');
      
      // Filter by project
      await page.selectOption('[data-testid="project-filter"]', 'test-project-1');
      
      // Apply filters
      await page.click('[data-testid="apply-filters-btn"]');
      
      // Verify report displays
      const reportSummary = page.locator('[data-testid="report-summary"]');
      await expect(reportSummary).toContainText('Total Hours:');
      await expect(reportSummary).toContainText('Billable Hours:');
    });

    test('chart analytics interaction', async ({ page }) => {
      await page.goto('http://localhost:3000');
      await page.click('a[href="#/reports"]');
      
      // Switch to analytics tab
      await page.click('[data-testid="analytics-tab"]');
      
      // Verify charts are rendered
      const weeklyChart = page.locator('[data-testid="weekly-hours-chart"]');
      await expect(weeklyChart).toBeVisible();
      
      const projectChart = page.locator('[data-testid="project-distribution-chart"]');
      await expect(projectChart).toBeVisible();
    });

    test('export report functionality', async ({ page }) => {
      await page.goto('http://localhost:3000');
      await page.click('a[href="#/reports"]');
      
      // Switch to export tab
      await page.click('[data-testid="export-tab"]');
      
      // Configure export
      await page.selectOption('[data-testid="export-format"]', 'csv');
      await page.selectOption('[data-testid="export-grouping"]', 'by-project');
      
      // Start download (mock the download process)
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-csv-btn"]');
      
      // Verify download starts
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('.csv');
    });
  });

  test.describe('Invoice Management Workflows', () => {
    test('generate invoice from approved time entries', async ({ page }) => {
      await page.goto('http://localhost:3000');
      await page.click('a[href="#/invoices"]');
      
      // Switch to generation tab
      await page.click('[data-testid="invoice-generation-tab"]');
      
      // Select client and time entries
      await page.selectOption('[data-testid="invoice-client-select"]', 'test-client-1');
      await page.check('[data-testid="select-time-entry"]:first-of-type');
      
      // Generate invoice
      await page.click('[data-testid="generate-invoice-btn"]');
      
      // Fill invoice details
      await page.fill('[data-testid="invoice-notes"]', 'Thank you for your business!');
      await page.click('[data-testid="create-invoice-btn"]');
      
      // Verify invoice appears in list
      const invoiceCards = page.locator('[data-testid="invoice-card"]');
      await expect(invoiceCards.first()).toContainText('Draft');
    });

    test('invoice status management', async ({ page }) => {
      await page.goto('http://localhost:3000');
      await page.click('a[href="#/invoices"]');
      
      // Mark invoice as sent
      await page.click('[data-testid="send-invoice-btn"]:first-of-type');
      
      // Verify status updated
      const invoiceStatus = page.locator('[data-testid="invoice-status"]:first-of-type');
      await expect(invoiceStatus).toContainText('Sent');
      
      // Mark as paid
      await page.click('[data-testid="mark-paid-btn"]:first-of-type');
      await expect(invoiceStatus).toContainText('Paid');
    });
  });

  test.describe('Data Persistence & Error Handling', () => {
    test('data persists across page reloads', async ({ page }) => {
      await page.goto('http://localhost:3000');
      
      // Create some data
      await page.click('a[href="#/time-tracking"]');
      await page.click('[data-testid="manual-entry-btn"]');
      await page.fill('[data-testid="manual-description"]', 'Persistence test entry');
      await page.fill('[data-testid="manual-duration"]', '1.5');
      await page.click('[data-testid="submit-manual-entry"]');
      
      // Reload page
      await page.reload();
      
      // Verify data persisted
      await page.click('a[href="#/time-tracking"]');
      const timeEntries = page.locator('[data-testid="time-entry"]');
      await expect(timeEntries).toContainText('Persistence test entry');
    });

    test('handles network errors gracefully', async ({ page }) => {
      await page.goto('http://localhost:3000');
      
      // Simulate network failure
      await page.route('**/api/**', route => route.abort());
      
      // Try to perform an action that would make an API call
      await page.click('a[href="#/time-tracking"]');
      await page.click('[data-testid="manual-entry-btn"]');
      await page.fill('[data-testid="manual-description"]', 'Network error test');
      await page.click('[data-testid="submit-manual-entry"]');
      
      // Verify error is handled gracefully
      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toBeVisible();
    });

    test('form validation works correctly', async ({ page }) => {
      await page.goto('http://localhost:3000');
      await page.click('a[href="#/time-tracking"]');
      
      // Try to submit empty form
      await page.click('[data-testid="manual-entry-btn"]');
      await page.click('[data-testid="submit-manual-entry"]');
      
      // Verify validation errors
      const validationErrors = page.locator('[data-testid="validation-error"]');
      await expect(validationErrors.first()).toBeVisible();
    });
  });

  test.describe('Performance & Accessibility', () => {
    test('pages load within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('http://localhost:3000');
      
      // Wait for main content to load
      await expect(page.locator('main')).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // 3 seconds max
    });

    test('keyboard navigation works', async ({ page }) => {
      await page.goto('http://localhost:3000');
      
      // Test tab navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      
      // Verify navigation occurred
      await expect(page.locator('[data-testid="time-tracking-page"]')).toBeVisible();
    });

    test('has proper ARIA labels and semantic HTML', async ({ page }) => {
      await page.goto('http://localhost:3000');
      
      // Check navigation has proper labels
      const nav = page.locator('nav[role="navigation"]');
      await expect(nav).toHaveAttribute('aria-label', 'Main navigation');
      
      // Check main content area
      const main = page.locator('main[role="main"]');
      await expect(main).toBeVisible();
      
      // Check button accessibility
      const buttons = page.locator('button');
      const firstButton = buttons.first();
      if (await firstButton.isVisible()) {
        const ariaLabel = await firstButton.getAttribute('aria-label');
        const textContent = await firstButton.textContent();
        expect(ariaLabel || textContent).toBeTruthy();
      }
    });
  });
}); 