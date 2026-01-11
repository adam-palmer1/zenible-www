import { useQuery } from '@tanstack/react-query';
import { statusesAPI } from '../../services/api/crm';
import { queryKeys } from '../../lib/query-keys';

/**
 * React Query hook for fetching available statuses (global + custom)
 *
 * Benefits over old useContactStatuses:
 * - Automatic caching (5-min stale time) - replaces module-level cache
 * - Request deduplication (prevents race conditions)
 * - No manual cache invalidation needed
 * - Shared across all components automatically
 *
 * @param {Object} options - React Query options
 * @returns {Object} Query result with data, isLoading, error
 */
export function useStatusesQuery(options = {}) {
  return useQuery({
    queryKey: queryKeys.statuses.combined(),
    queryFn: async () => {
      const response = await statusesAPI.getAvailable();
      // Response: { global_statuses: [...], custom_statuses: [...] }
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes (matches old cache TTL)
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

/**
 * Helper hook to get statuses in the same format as old useContactStatuses
 * Simplifies migration
 *
 * @param {Object} options - React Query options
 * @returns {Object} Statuses data in familiar format
 */
export function useStatuses(options = {}) {
  const query = useStatusesQuery(options);

  const globalStatuses = query.data?.global_statuses || [];
  const customStatuses = query.data?.custom_statuses || [];
  const allStatuses = [...globalStatuses, ...customStatuses];

  return {
    ...query,
    globalStatuses,
    customStatuses,
    allStatuses,
  };
}

/**
 * Helper hook to get only global statuses
 *
 * @param {Object} options - React Query options
 * @returns {Object} Query result with global statuses only
 */
export function useGlobalStatusesQuery(options = {}) {
  return useQuery({
    queryKey: queryKeys.statuses.global(),
    queryFn: async () => {
      const response = await statusesAPI.getAvailable();
      return response.global_statuses || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });
}

/**
 * Helper hook to get only custom statuses
 *
 * @param {Object} options - React Query options
 * @returns {Object} Query result with custom statuses only
 */
export function useCustomStatusesQuery(options = {}) {
  return useQuery({
    queryKey: queryKeys.statuses.custom(),
    queryFn: async () => {
      const response = await statusesAPI.getAvailable();
      return response.custom_statuses || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });
}
