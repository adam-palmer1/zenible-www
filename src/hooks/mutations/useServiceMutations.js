import { useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesAPI } from '../../services/api/crm';
import { queryKeys } from '../../lib/query-keys';

/**
 * Mutation hook for creating a service
 *
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object
 */
export function useCreateServiceMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (serviceData) => {
      return await servicesAPI.create(serviceData);
    },
    onSuccess: (newService) => {
      // Invalidate all service lists
      queryClient.invalidateQueries(queryKeys.services.lists());

      if (options.onSuccess) {
        options.onSuccess(newService);
      }
    },
    onError: (error) => {
      console.error('[useCreateServiceMutation] Failed:', error);

      if (options.onError) {
        options.onError(error);
      }
    },
  });
}

/**
 * Mutation hook for updating a service
 *
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object
 */
export function useUpdateServiceMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ serviceId, data }) => {
      return await servicesAPI.update(serviceId, data);
    },
    onMutate: async ({ serviceId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(queryKeys.services.lists());

      // Snapshot previous values
      const previousLists = queryClient.getQueriesData(queryKeys.services.lists());

      // Optimistically update all service lists
      queryClient.setQueriesData(queryKeys.services.lists(), (old) => {
        if (!Array.isArray(old)) return old;

        return old.map((service) =>
          service.id === serviceId ? { ...service, ...data } : service
        );
      });

      return { previousLists, serviceId };
    },
    onError: (error, variables, context) => {
      console.error('[useUpdateServiceMutation] Failed:', error);

      // Rollback
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      if (options.onError) {
        options.onError(error);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries(queryKeys.services.lists());

      if (options.onSettled) {
        options.onSettled();
      }
    },
    onSuccess: (updatedService) => {
      if (options.onSuccess) {
        options.onSuccess(updatedService);
      }
    },
  });
}

/**
 * Mutation hook for deleting a service
 *
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object
 */
export function useDeleteServiceMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (serviceId) => {
      await servicesAPI.delete(serviceId);
      return serviceId;
    },
    onMutate: async (serviceId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(queryKeys.services.lists());

      // Snapshot previous values
      const previousLists = queryClient.getQueriesData(queryKeys.services.lists());

      // Optimistically remove service
      queryClient.setQueriesData(queryKeys.services.lists(), (old) => {
        if (!Array.isArray(old)) return old;

        return old.filter((service) => service.id !== serviceId);
      });

      return { previousLists, serviceId };
    },
    onError: (error, serviceId, context) => {
      console.error('[useDeleteServiceMutation] Failed:', error);

      // Rollback
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      if (options.onError) {
        options.onError(error);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries(queryKeys.services.lists());

      if (options.onSettled) {
        options.onSettled();
      }
    },
    onSuccess: (serviceId) => {
      if (options.onSuccess) {
        options.onSuccess(serviceId);
      }
    },
  });
}
