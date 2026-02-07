import React from 'react';

interface LoadingSpinnerProps {
  /** Height of the container. Defaults to 'h-64'. */
  height?: string;
  /** Size of the spinner. Defaults to 'h-12 w-12'. */
  size?: string;
  /** Optional message to display below the spinner */
  message?: string;
}

/**
 * LoadingSpinner Component
 *
 * A centered loading spinner indicator, extracted from the loading state
 * pattern duplicated across many list view components (ClientsView,
 * VendorsView, ProjectsTable, etc.).
 *
 * Usage:
 * ```tsx
 * if (loading) {
 *   return <LoadingSpinner />;
 * }
 * ```
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  height = 'h-64',
  size = 'h-12 w-12',
  message,
}) => {
  return (
    <div className={`flex flex-col items-center justify-center ${height}`}>
      <div
        className={`animate-spin rounded-full ${size} border-b-2 border-zenible-primary`}
      ></div>
      {message && (
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
