import { useMutation, useQueryClient } from '@tanstack/react-query';
import { statusesAPI } from '../../services/api/crm';
import { queryKeys } from '../../lib/query-keys';

/**
 * Mutation hook for creating a custom status
 *
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object
 */
export function useCreateCustomStatusMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (statusData) => {
      return await statusesAPI.createCustom(statusData);
    },
    onSuccess: (newStatus) => {
      // Invalidate all status queries
      queryClient.invalidateQueries(queryKeys.statuses.all);

      if (options.onSuccess) {
        options.onSuccess(newStatus);
      }
    },
    onError: (error) => {
      console.error('[useCreateCustomStatusMutation] Failed:', error);

      if (options.onError) {
        options.onError(error);
      }
    },
  });
}

/**
 * Mutation hook for updating a global status
 * (Can only update friendly_name, color, tooltip)
 *
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object
 */
export function useUpdateGlobalStatusMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ statusId, data }) => {
      return await statusesAPI.updateGlobal(statusId, data);
    },
    onMutate: async ({ statusId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(queryKeys.statuses.all);

      // Snapshot previous value
      const previous = queryClient.getQueryData(queryKeys.statuses.combined());

      // Optimistically update
      if (previous) {
        queryClient.setQueryData(queryKeys.statuses.combined(), {
          ...previous,
          global_statuses: previous.global_statuses.map((status) =>
            status.id === statusId ? { ...status, ...data } : status
          ),
        });
      }

      return { previous, statusId };
    },
    onError: (error, variables, context) => {
      console.error('[useUpdateGlobalStatusMutation] Failed:', error);

      // Rollback
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.statuses.combined(), context.previous);
      }

      if (options.onError) {
        options.onError(error);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries(queryKeys.statuses.all);

      // Also invalidate contacts since they include status data
      queryClient.invalidateQueries(queryKeys.contacts.all);

      if (options.onSettled) {
        options.onSettled();
      }
    },
    onSuccess: (updatedStatus) => {
      if (options.onSuccess) {
        options.onSuccess(updatedStatus);
      }
    },
  });
}

/**
 * Mutation hook for updating a custom status
 *
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object
 */
export function useUpdateCustomStatusMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ statusId, data }) => {
      return await statusesAPI.updateCustom(statusId, data);
    },
    onMutate: async ({ statusId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(queryKeys.statuses.all);

      // Snapshot previous value
      const previous = queryClient.getQueryData(queryKeys.statuses.combined());

      // Optimistically update
      if (previous) {
        queryClient.setQueryData(queryKeys.statuses.combined(), {
          ...previous,
          custom_statuses: previous.custom_statuses.map((status) =>
            status.id === statusId ? { ...status, ...data } : status
          ),
        });
      }

      return { previous, statusId };
    },
    onError: (error, variables, context) => {
      console.error('[useUpdateCustomStatusMutation] Failed:', error);

      // Rollback
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.statuses.combined(), context.previous);
      }

      if (options.onError) {
        options.onError(error);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries(queryKeys.statuses.all);

      // Also invalidate contacts since they include status data
      queryClient.invalidateQueries(queryKeys.contacts.all);

      if (options.onSettled) {
        options.onSettled();
      }
    },
    onSuccess: (updatedStatus) => {
      if (options.onSuccess) {
        options.onSuccess(updatedStatus);
      }
    },
  });
}

/**
 * Mutation hook for deleting a custom status
 *
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object
 */
export function useDeleteCustomStatusMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (statusId) => {
      await statusesAPI.deleteCustom(statusId);
      return statusId;
    },
    onMutate: async (statusId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(queryKeys.statuses.all);

      // Snapshot previous value
      const previous = queryClient.getQueryData(queryKeys.statuses.combined());

      // Optimistically remove status
      if (previous) {
        queryClient.setQueryData(queryKeys.statuses.combined(), {
          ...previous,
          custom_statuses: previous.custom_statuses.filter(
            (status) => status.id !== statusId
          ),
        });
      }

      return { previous, statusId };
    },
    onError: (error, statusId, context) => {
      console.error('[useDeleteCustomStatusMutation] Failed:', error);

      // Rollback
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.statuses.combined(), context.previous);
      }

      if (options.onError) {
        options.onError(error);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries(queryKeys.statuses.all);

      // Also invalidate contacts (in case any were using this status)
      queryClient.invalidateQueries(queryKeys.contacts.all);

      if (options.onSettled) {
        options.onSettled();
      }
    },
    onSuccess: (statusId) => {
      if (options.onSuccess) {
        options.onSuccess(statusId);
      }
    },
  });
}
