import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesAPI } from '../../services/api/crm';
import { queryKeys } from '../../lib/query-keys';

/**
 * Custom hook for managing services
 * Uses React Query for caching, deduplication, and background refetching
 */
export function useServices(options: Record<string, unknown> = {}, refreshKey: number = 0) {
  const queryClient = useQueryClient();
  const hasOptions = Object.keys(options).length > 0;

  // Query for services list
  const servicesQuery = useQuery({
    queryKey: hasOptions
      ? queryKeys.services.list(options)
      : queryKeys.services.lists(),
    queryFn: async () => {
      const response = await servicesAPI.list(options as Record<string, string>);
      return (response as unknown[]) || [];
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
    return servicesQuery.data;
  }, [queryClient, servicesQuery.data, refreshKey]);

  return {
    services: (servicesQuery.data || []) as unknown[],
    loading: servicesQuery.isLoading,
    error: servicesQuery.error?.message || null,
    fetchServices,
    getService,
    createService,
    updateService,
    deleteService,
  };
}
