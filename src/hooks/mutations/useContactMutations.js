import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsAPI } from '../../services/api/crm';
import { queryKeys, invalidateContactQueries } from '../../lib/query-keys';

/**
 * Mutation hook for creating a contact
 *
 * Features:
 * - Automatic cache invalidation (refetches contact list)
 * - Optimistic updates (optional)
 * - Error handling with rollback
 *
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object with mutate, mutateAsync, isLoading, error
 */
export function useCreateContactMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contactData) => {
      return await contactsAPI.create(contactData);
    },
    onSuccess: (newContact) => {
      // Invalidate and refetch contact lists
      queryClient.invalidateQueries(queryKeys.contacts.lists());

      // Call custom onSuccess if provided
      if (options.onSuccess) {
        options.onSuccess(newContact);
      }
    },
    onError: (error) => {
      console.error('[useCreateContactMutation] Failed:', error);

      if (options.onError) {
        options.onError(error);
      }
    },
  });
}

/**
 * Mutation hook for updating a contact
 *
 * Supports optimistic updates with automatic rollback on error
 *
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object
 */
export function useUpdateContactMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contactId, data }) => {
      return await contactsAPI.update(contactId, data);
    },
    // Optimistic update
    onMutate: async ({ contactId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(queryKeys.contacts.lists());
      await queryClient.cancelQueries(queryKeys.contacts.detail(contactId));

      // Snapshot previous values
      const previousLists = queryClient.getQueriesData(queryKeys.contacts.lists());
      const previousDetail = queryClient.getQueryData(queryKeys.contacts.detail(contactId));

      // Optimistically update lists
      queryClient.setQueriesData(queryKeys.contacts.lists(), (old) => {
        if (!old?.items) return old;

        return {
          ...old,
          items: old.items.map((contact) =>
            contact.id === contactId ? { ...contact, ...data } : contact
          ),
        };
      });

      // Optimistically update detail
      if (previousDetail) {
        queryClient.setQueryData(queryKeys.contacts.detail(contactId), {
          ...previousDetail,
          ...data,
        });
      }

      return { previousLists, previousDetail, contactId };
    },
    onError: (error, { contactId }, context) => {
      console.error('[useUpdateContactMutation] Failed:', error);

      // Rollback optimistic updates
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      if (context?.previousDetail) {
        queryClient.setQueryData(
          queryKeys.contacts.detail(contactId),
          context.previousDetail
        );
      }

      if (options.onError) {
        options.onError(error);
      }
    },
    onSettled: (data, error, { contactId }) => {
      // Always refetch to ensure consistency
      invalidateContactQueries(queryClient, contactId);

      if (options.onSettled) {
        options.onSettled(data, error);
      }
    },
    onSuccess: (updatedContact, variables) => {
      if (options.onSuccess) {
        options.onSuccess(updatedContact, variables);
      }
    },
  });
}

/**
 * Mutation hook for deleting a contact
 *
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object
 */
export function useDeleteContactMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contactId) => {
      await contactsAPI.delete(contactId);
      return contactId;
    },
    onMutate: async (contactId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(queryKeys.contacts.lists());

      // Snapshot previous value
      const previousLists = queryClient.getQueriesData(queryKeys.contacts.lists());

      // Optimistically remove contact
      queryClient.setQueriesData(queryKeys.contacts.lists(), (old) => {
        if (!old?.items) return old;

        return {
          ...old,
          items: old.items.filter((contact) => contact.id !== contactId),
          total: old.total - 1,
        };
      });

      return { previousLists, contactId };
    },
    onError: (error, contactId, context) => {
      console.error('[useDeleteContactMutation] Failed:', error);

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
      // Refetch all contact lists
      queryClient.invalidateQueries(queryKeys.contacts.lists());

      if (options.onSettled) {
        options.onSettled();
      }
    },
    onSuccess: (contactId) => {
      if (options.onSuccess) {
        options.onSuccess(contactId);
      }
    },
  });
}

/**
 * Mutation hook for changing contact status
 *
 * Used by drag-and-drop in SalesPipeline
 * Optimistic updates only - no immediate refetch to prevent flicker
 *
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object
 */
export function useChangeContactStatusMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contactId, statusData }) => {
      // statusData: { current_global_status_id, current_custom_status_id }
      return await contactsAPI.update(contactId, statusData);
    },
    onMutate: async ({ contactId, statusData }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(queryKeys.contacts.lists());

      // Snapshot previous value
      const previousLists = queryClient.getQueriesData(queryKeys.contacts.lists());

      // Optimistically update status
      queryClient.setQueriesData(queryKeys.contacts.lists(), (old) => {
        if (!old?.items) return old;

        return {
          ...old,
          items: old.items.map((contact) =>
            contact.id === contactId ? { ...contact, ...statusData } : contact
          ),
        };
      });

      return { previousLists, contactId, statusData };
    },
    onError: (error, variables, context) => {
      console.error('[useChangeContactStatusMutation] Failed:', error);

      // Rollback optimistic update
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      if (options.onError) {
        options.onError(error, variables, context);
      }
    },
    onSuccess: (updatedContact, variables, context) => {
      // Update cache with server response (in case server added/modified fields)
      queryClient.setQueriesData(queryKeys.contacts.lists(), (old) => {
        if (!old?.items) return old;

        return {
          ...old,
          items: old.items.map((contact) =>
            contact.id === updatedContact.id ? updatedContact : contact
          ),
        };
      });

      if (options.onSuccess) {
        options.onSuccess(updatedContact, variables);
      }
    },
  });
}

/**
 * Mutation hook for creating a contact-specific service
 *
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object
 */
export function useCreateContactServiceMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contactId, serviceData }) => {
      return await contactsAPI.createContactService(contactId, serviceData);
    },
    onSuccess: (updatedContact, { contactId }) => {
      // Invalidate contact queries to refetch with new service
      invalidateContactQueries(queryClient, contactId);

      if (options.onSuccess) {
        options.onSuccess(updatedContact);
      }
    },
    onError: (error) => {
      console.error('[useCreateContactServiceMutation] Failed:', error);

      if (options.onError) {
        options.onError(error);
      }
    },
  });
}

/**
 * Mutation hook for assigning an existing service to a contact
 *
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object
 */
export function useAssignServiceMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contactId, serviceId }) => {
      return await contactsAPI.assignService(contactId, serviceId);
    },
    onSuccess: (updatedContact, { contactId }) => {
      invalidateContactQueries(queryClient, contactId);

      if (options.onSuccess) {
        options.onSuccess(updatedContact);
      }
    },
    onError: (error) => {
      console.error('[useAssignServiceMutation] Failed:', error);

      if (options.onError) {
        options.onError(error);
      }
    },
  });
}

/**
 * Mutation hook for unassigning a service from a contact
 *
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object
 */
export function useUnassignServiceMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contactId, serviceId }) => {
      await contactsAPI.unassignService(contactId, serviceId);
      return { contactId, serviceId };
    },
    onSuccess: (data, { contactId }) => {
      invalidateContactQueries(queryClient, contactId);

      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      console.error('[useUnassignServiceMutation] Failed:', error);

      if (options.onError) {
        options.onError(error);
      }
    },
  });
}

/**
 * Mutation hook for updating a contact's service
 *
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object
 */
export function useUpdateContactServiceMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contactId, serviceId, serviceData }) => {
      return await contactsAPI.updateContactService(contactId, serviceId, serviceData);
    },
    onSuccess: (updatedService, { contactId }) => {
      invalidateContactQueries(queryClient, contactId);

      if (options.onSuccess) {
        options.onSuccess(updatedService);
      }
    },
    onError: (error) => {
      console.error('[useUpdateContactServiceMutation] Failed:', error);

      if (options.onError) {
        options.onError(error);
      }
    },
  });
}
