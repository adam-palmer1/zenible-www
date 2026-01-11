import { QueryClient } from '@tanstack/react-query';

/**
 * React Query configuration for Zenible CRM
 *
 * Key features:
 * - 5-minute stale time for most queries (matches current cache behavior)
 * - 10-minute cache time to keep data available
 * - Automatic refetch on window focus for fresh data
 * - Request deduplication to prevent redundant API calls
 * - Optimistic updates with automatic rollback on error
 */

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Time until data is considered stale (5 minutes - matches current module cache)
      staleTime: 5 * 60 * 1000,

      // Time to keep data in cache (10 minutes)
      cacheTime: 10 * 60 * 1000,

      // Refetch when window regains focus
      refetchOnWindowFocus: true,

      // Refetch when reconnecting to network
      refetchOnReconnect: true,

      // Don't refetch on mount if data is fresh
      refetchOnMount: false,

      // Retry failed requests (exponential backoff)
      retry: 1,

      // Show errors in console during development
      useErrorBoundary: false,
    },
    mutations: {
      // Don't retry mutations by default (user actions)
      retry: false,

      // Show errors in console
      useErrorBoundary: false,
    },
  },
});

/**
 * Provider wrapper for React Query
 * Import this in App.jsx and wrap the app with QueryClientProvider
 */
export { QueryClientProvider } from '@tanstack/react-query';

/**
 * DevTools for debugging React Query cache
 * Import this in App.jsx and add <ReactQueryDevtools /> component
 */
export { ReactQueryDevtools } from '@tanstack/react-query-devtools';
