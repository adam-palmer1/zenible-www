import { useQuery } from '@tanstack/react-query';
import { contactsAPI } from '../../services/api/crm';
import { queryKeys } from '../../lib/query-keys';

/**
 * React Query hook for fetching contacts list
 *
 * Benefits over old useContacts:
 * - Automatic caching (5-min stale time)
 * - Request deduplication (multiple calls = 1 API request)
 * - Background refetching on window focus
 * - No manual refreshKey needed
 *
 * @param {Object} filters - Query filters
 * @param {Object} options - React Query options
 * @returns {Object} Query result with data, isLoading, error, refetch
 */
export function useContactsQuery(filters = {}, options = {}) {
  return useQuery({
    queryKey: queryKeys.contacts.list(filters),
    queryFn: async () => {
      const response = await contactsAPI.list(filters);

      // API returns { items, page, per_page, total, total_pages }
      // Return entire response for pagination info
      return response;
    },
    // Override default options if needed
    staleTime: 5 * 60 * 1000, // 5 minutes (matches old module cache)
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    ...options,
  });
}

/**
 * React Query hook for fetching single contact
 *
 * @param {string} contactId - Contact UUID
 * @param {Object} options - React Query options
 * @returns {Object} Query result
 */
export function useContactQuery(contactId, options = {}) {
  return useQuery({
    queryKey: queryKeys.contacts.detail(contactId),
    queryFn: async () => {
      if (!contactId) {
        throw new Error('Contact ID is required');
      }
      return await contactsAPI.get(contactId);
    },
    enabled: !!contactId, // Only run if contactId exists
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });
}

/**
 * Helper hook to get contacts data array directly
 * Simplifies migration from old useContacts hook
 *
 * @param {Object} filters - Query filters
 * @param {Object} options - React Query options
 * @returns {Object} Simplified result with contacts array
 */
export function useContactsList(filters = {}, options = {}) {
  const query = useContactsQuery(filters, options);

  return {
    ...query,
    contacts: query.data?.items || [],
    pagination: {
      page: query.data?.page || 1,
      per_page: query.data?.per_page || 20,
      total: query.data?.total || 0,
      total_pages: query.data?.total_pages || 0,
    },
  };
}
