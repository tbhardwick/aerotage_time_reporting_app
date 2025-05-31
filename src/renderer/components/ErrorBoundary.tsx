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
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen p-8 bg-gray-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full">
            <h1 className="text-red-600 mb-4 text-2xl font-bold">
              Something went wrong
            </h1>
            
            <p className="text-gray-600 mb-4 leading-relaxed">
              The application encountered an unexpected error. Please try reloading the app.
            </p>

            {this.state.error && (
              <details className="mb-4 p-4 bg-gray-100 rounded text-sm">
                <summary className="cursor-pointer font-medium mb-2">
                  Error Details
                </summary>
                <pre className="whitespace-pre-wrap text-gray-700 m-0">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-2">
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-blue-600 text-white border-0 rounded cursor-pointer font-medium hover:bg-blue-700 transition-colors"
              >
                Reload App
              </button>
              
              <button 
                onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })} 
                className="px-4 py-2 bg-gray-600 text-white border-0 rounded cursor-pointer font-medium hover:bg-gray-700 transition-colors"
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