import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

// Import session validation test utilities for development
import './utils/sessionValidationTest';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

// Clear any existing content (like loading spinner) before mounting React
container.innerHTML = '';

const root = createRoot(container);

root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
); 