import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

console.log('🚀 Aerotage Time Reporting App starting...');

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

console.log('Container found:', container);

// Clear any existing content (like loading spinner) before mounting React
container.innerHTML = '';

console.log('Container cleared, creating React root...');

const root = createRoot(container);

console.log('React root created, rendering app...');

root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

console.log('✅ Aerotage Time Reporting App rendered successfully!'); 