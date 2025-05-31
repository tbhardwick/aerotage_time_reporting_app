import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div 
          className="flex flex-col items-center justify-center h-screen p-8"
          style={{ backgroundColor: 'var(--background-color)' }}
        >
          <div 
            className="p-8 rounded-lg shadow-xl max-w-2xl w-full"
            style={{ 
              backgroundColor: 'var(--surface-color)',
              borderColor: 'var(--border-color)'
            }}
          >
            <h1 
              className="mb-4 text-2xl font-bold"
              style={{ color: 'var(--color-error-600)' }}
            >
              Something went wrong
            </h1>
            
            <p 
              className="mb-4 leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              We're sorry, but something unexpected happened. You can try reloading the page or resetting the application state.
            </p>
            
            <details 
              className="mb-4 p-4 rounded text-sm"
              style={{ 
                backgroundColor: 'var(--surface-secondary)',
                color: 'var(--text-primary)'
              }}
            >
              <summary 
                className="cursor-pointer font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                Error Details
              </summary>
              <pre 
                className="whitespace-pre-wrap m-0 mt-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                {this.state.error?.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
            
            <div className="flex space-x-4">
              <button
                onClick={this.handleReload}
                className="px-4 py-2 border-0 rounded cursor-pointer font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--color-primary-600)',
                  color: 'var(--color-text-on-primary)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
                }}
              >
                Reload Page
              </button>
              
              <button
                onClick={this.handleReset}
                className="px-4 py-2 border-0 rounded cursor-pointer font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--surface-secondary)',
                  color: 'var(--text-primary)',
                  border: `1px solid var(--border-color)`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--surface-color)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--surface-secondary)';
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 