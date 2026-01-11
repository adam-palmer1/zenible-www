import { useQuery } from '@tanstack/react-query';
import { servicesAPI } from '../../services/api/crm';
import { queryKeys } from '../../lib/query-keys';

/**
 * React Query hook for fetching services list
 *
 * Benefits over old useServices:
 * - Automatic caching (5-min stale time) - replaces module-level cache
 * - Request deduplication (prevents race conditions)
 * - Filtered requests are automatically cached separately
 * - No manual cache management needed
 *
 * @param {Object} filters - Query filters (service_type, etc.)
 * @param {Object} options - React Query options
 * @returns {Object} Query result with data, isLoading, error
 */
export function useServicesQuery(filters = {}, options = {}) {
  return useQuery({
    queryKey: queryKeys.services.list(filters),
    queryFn: async () => {
      const response = await servicesAPI.list(filters);
      // API returns array of service objects
      return response || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes (matches old cache TTL)
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

/**
 * React Query hook for fetching single service
 *
 * @param {string} serviceId - Service UUID
 * @param {Object} options - React Query options
 * @returns {Object} Query result
 */
export function useServiceQuery(serviceId, options = {}) {
  return useQuery({
    queryKey: [...queryKeys.services.all, serviceId],
    queryFn: async () => {
      if (!serviceId) {
        throw new Error('Service ID is required');
      }
      return await servicesAPI.get(serviceId);
    },
    enabled: !!serviceId, // Only run if serviceId exists
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });
}

/**
 * Helper hook to get services array directly
 * Simplifies migration from old useServices hook
 *
 * @param {Object} filters - Query filters
 * @param {Object} options - React Query options
 * @returns {Object} Simplified result with services array
 */
export function useServicesList(filters = {}, options = {}) {
  const query = useServicesQuery(filters, options);

  return {
    ...query,
    services: query.data || [],
  };
}
