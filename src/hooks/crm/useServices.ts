import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesAPI } from '../../services/api/crm';
import { queryKeys } from '../../lib/query-keys';
import type { PaginatedResponse } from '../../types';

/** Default page size for the services catalog query. High enough that every
 * current consumer (autocomplete, CRM dashboard) sees the full catalog in one
 * page; callers that need real pagination should pass page/per_page in options.
 */
const DEFAULT_PER_PAGE = 200;

/**
 * Custom hook for managing services.
 * Uses React Query for caching, deduplication, and background refetching.
 * Exposes `services` as an array for backward-compatibility; pagination
 * metadata is available via the `pagination` field.
 */
export function useServices(options: Record<string, unknown> = {}, refreshKey: number = 0) {
  const queryClient = useQueryClient();
  const mergedOptions = { per_page: DEFAULT_PER_PAGE, ...options };
  const hasOptions = Object.keys(options).length > 0;

  // Query for services list (paginated; unwrap items for the main return)
  const servicesQuery = useQuery({
    queryKey: hasOptions
      ? queryKeys.services.list(mergedOptions)
      : queryKeys.services.lists(),
    queryFn: async () => {
      const response = await servicesAPI.list(mergedOptions);
      return response as PaginatedResponse<unknown>;
    },
  });

  // Force refetch when refreshKey changes (> 0 means explicit refresh)
  // This is handled by queryKey stability + invalidation instead

  // Get single service (imperative, not cached)
  const getService = useCallback(async (serviceId: string): Promise<unknown> => {
    return servicesAPI.get(serviceId);
  }, []);

  // Create service mutation
  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => servicesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.usageDashboard.all });
    },
  });

  // Update service mutation
  const updateMutation = useMutation({
    mutationFn: ({ serviceId, data }: { serviceId: string; data: Record<string, unknown> }) =>
      servicesAPI.update(serviceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services.all });
    },
  });

  // Delete service mutation
  const deleteMutation = useMutation({
    mutationFn: (serviceId: string) => servicesAPI.delete(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.usageDashboard.all });
    },
  });

  // Wrapper functions to maintain the same API interface
  const createService = useCallback(async (data: Record<string, unknown>): Promise<unknown> => {
    return createMutation.mutateAsync(data);
  }, [createMutation]);

  const updateService = useCallback(async (serviceId: string, data: Record<string, unknown>): Promise<unknown> => {
    return updateMutation.mutateAsync({ serviceId, data });
  }, [updateMutation]);

  const deleteService = useCallback(async (serviceId: string): Promise<boolean> => {
    await deleteMutation.mutateAsync(serviceId);
    return true;
  }, [deleteMutation]);

  const fetchServices = useCallback(async (params: Record<string, unknown> = {}, forceRefresh: boolean = false): Promise<unknown> => {
    if (forceRefresh || refreshKey > 0) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.services.all });
    }
    return servicesQuery.data?.items ?? [];
  }, [queryClient, servicesQuery.data, refreshKey]);

  const paginated = servicesQuery.data;
  return {
    services: (paginated?.items || []) as unknown[],
    pagination: paginated
      ? {
          total: paginated.total,
          page: paginated.page,
          per_page: paginated.per_page,
          total_pages: paginated.total_pages,
          has_next: paginated.has_next,
          has_prev: paginated.has_prev,
        }
      : null,
    loading: servicesQuery.isLoading,
    error: servicesQuery.error?.message || null,
    fetchServices,
    getService,
    createService,
    updateService,
    deleteService,
  };
}
