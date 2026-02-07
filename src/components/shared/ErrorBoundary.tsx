import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'section' | 'widget';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const level = this.props.level || 'section';

      if (level === 'page') {
        return (
          <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="text-center p-8 max-w-md">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
              <p className="text-gray-600 mb-6">
                An unexpected error occurred. Please try refreshing the page.
              </p>
              <div className="space-x-3">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Refresh Page
                </button>
                <button
                  onClick={this.handleReset}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="p-4 rounded-lg border border-red-200 bg-red-50">
          <p className="text-sm text-red-800 mb-2">Something went wrong in this section.</p>
          <button
            onClick={this.handleReset}
            className="text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
