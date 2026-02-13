import React, { Component, ErrorInfo, ReactNode } from 'react';
import brandIcon from '../../pages/signin/assets/brand-icon.svg';
import brandIconDark from '../../pages/signin/assets/brand-icon-dark.svg';

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

  private get isDarkMode(): boolean {
    return document.documentElement.classList.contains('dark');
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const level = this.props.level || 'section';
      const dark = this.isDarkMode;

      if (level === 'page') {
        return (
          <div className={`flex flex-col items-center justify-center min-h-screen px-6 ${
            dark ? 'bg-[#0c111d]' : 'bg-[#fafafa]'
          }`}>
            {/* Logo */}
            <div className="mb-8">
              <div className={`${dark ? 'bg-[#a684ff]' : 'bg-[#8e51ff]'} rounded-[16px] p-[4px] size-[64px] flex items-center justify-center`}>
                <img
                  alt="Zenible"
                  className="size-[38.4px]"
                  src={dark ? brandIconDark : brandIcon}
                />
              </div>
            </div>

            {/* Error icon */}
            <div className="mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className={`size-16 ${dark ? 'text-[#94969c]' : 'text-zinc-400'}`}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>

            {/* Heading */}
            <h1 className={`font-inter font-bold text-2xl mb-3 ${
              dark ? 'text-[#ededf0]' : 'text-zinc-950'
            }`}>
              Something went wrong
            </h1>

            {/* Body text */}
            <p className={`font-inter text-base text-center max-w-sm mb-8 ${
              dark ? 'text-[#94969c]' : 'text-zinc-500'
            }`}>
              An unexpected error occurred. Please try again or refresh the page.
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="font-inter font-medium text-base px-8 py-3 rounded-lg text-white bg-[#8e51ff] hover:bg-[#7a3ef0] active:bg-[#6b31d9] transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className={`font-inter font-medium text-base px-8 py-3 rounded-lg border transition-colors ${
                  dark
                    ? 'border-[#333741] text-[#ededf0] hover:bg-[#1f242f]'
                    : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                Refresh Page
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className={`p-4 rounded-lg border ${
          dark
            ? 'border-[#333741] bg-[#1f242f]'
            : 'border-purple-100 bg-purple-50'
        }`}>
          <div className="flex items-start gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className={`size-5 mt-0.5 shrink-0 ${dark ? 'text-[#a684ff]' : 'text-[#8e51ff]'}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <div>
              <p className={`text-sm mb-2 ${dark ? 'text-[#ededf0]' : 'text-zinc-800'}`}>
                Something went wrong in this section.
              </p>
              <button
                onClick={this.handleReset}
                className={`text-sm font-medium hover:underline ${
                  dark ? 'text-[#a684ff] hover:text-[#c3a6ff]' : 'text-[#8e51ff] hover:text-[#7a3ef0]'
                }`}
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
