import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { statusesAPI } from '../../services/api/crm';
import { queryKeys } from '../../lib/query-keys';
import type { AvailableStatuses, SimpleStatusResponse } from '../../types';

/**
 * Custom hook for managing contact statuses
 * Uses React Query for caching, deduplication, and background refetching
 */
interface StatusRoles {
  lead_status_id?: string | null;
  call_booked_status_id?: string | null;
  lost_status_id?: string | null;
  won_status_id?: string | null;
}

export function useContactStatuses() {
  const queryClient = useQueryClient();

  // Query for all available statuses
  const statusesQuery = useQuery({
    queryKey: queryKeys.statuses.all,
    queryFn: async () => {
      const response = await statusesAPI.getAvailable();
      return response as AvailableStatuses;
    },
  });

  // Derived state from query data
  const globalStatuses = useMemo(
    () => statusesQuery.data?.global_statuses || [],
    [statusesQuery.data]
  );
  const customStatuses = useMemo(
    () => statusesQuery.data?.custom_statuses || [],
    [statusesQuery.data]
  );
  const allStatuses = useMemo(
    () => [...globalStatuses, ...customStatuses],
    [globalStatuses, customStatuses]
  );
  const statusRoles = useMemo(
    () => (statusesQuery.data as (AvailableStatuses & { roles?: StatusRoles }) | undefined)?.roles || {},
    [statusesQuery.data]
  );

  // Create custom status mutation
  const createCustomMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => statusesAPI.createCustom(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.statuses.all });
    },
  });

  // Update global status mutation
  const updateGlobalMutation = useMutation({
    mutationFn: ({ statusId, data }: { statusId: string; data: Record<string, unknown> }) =>
      statusesAPI.updateGlobal(statusId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.statuses.all });
    },
  });

  // Update custom status mutation
  const updateCustomMutation = useMutation({
    mutationFn: ({ statusId, data }: { statusId: string; data: Record<string, unknown> }) =>
      statusesAPI.updateCustom(statusId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.statuses.all });
    },
  });

  // Delete custom status mutation
  const deleteCustomMutation = useMutation({
    mutationFn: (statusId: string) => statusesAPI.deleteCustom(statusId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.statuses.all });
    },
  });

  // Wrapper functions to maintain the same API interface
  const fetchStatuses = useCallback(async (forceRefresh: boolean = false): Promise<AvailableStatuses | unknown> => {
    if (forceRefresh) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.statuses.all });
    }
    return statusesQuery.data;
  }, [queryClient, statusesQuery.data]);

  const createCustomStatus = useCallback(async (data: Record<string, unknown>): Promise<unknown> => {
    return createCustomMutation.mutateAsync(data);
  }, [createCustomMutation]);

  const updateGlobalStatus = useCallback(async (statusId: string, data: Record<string, unknown>): Promise<unknown> => {
    return updateGlobalMutation.mutateAsync({ statusId, data });
  }, [updateGlobalMutation]);

  const updateCustomStatus = useCallback(async (statusId: string, data: Record<string, unknown>): Promise<unknown> => {
    return updateCustomMutation.mutateAsync({ statusId, data });
  }, [updateCustomMutation]);

  const deleteCustomStatus = useCallback(async (statusId: string): Promise<boolean> => {
    await deleteCustomMutation.mutateAsync(statusId);
    return true;
  }, [deleteCustomMutation]);

  return {
    globalStatuses,
    customStatuses,
    allStatuses,
    statusRoles,
    loading: statusesQuery.isLoading,
    error: statusesQuery.error?.message || null,
    fetchStatuses,
    updateGlobalStatus,
    createCustomStatus,
    updateCustomStatus,
    deleteCustomStatus,
  };
}
