import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { contactsAPI } from '../../services/api/crm';
import { queryKeys, invalidateContactQueries } from '../../lib/query-keys';
import type { ContactServiceCreate, ContactCreate } from '../../types';

// ---- Shared types ----

interface MutationCallbacks<TData = unknown, TVariables = unknown> {
  onSuccess?: (data: TData, variables?: TVariables) => void;
  onError?: (error: Error, variables?: TVariables, context?: unknown) => void;
  onSettled?: (data?: TData, error?: Error | null) => void;
}

interface ContactListPage {
  items?: Array<Record<string, unknown>>;
  total?: number;
  [key: string]: unknown;
}

// Context objects for optimistic-update rollback
interface UpdateContactContext {
  previousLists: Array<[QueryKey, unknown]>;
  previousDetail: unknown;
  contactId: string;
}

interface DeleteContactContext {
  previousLists: Array<[QueryKey, unknown]>;
  contactId: string;
}

interface ChangeStatusContext {
  previousLists: Array<[QueryKey, unknown]>;
  contactId: string;
  statusData: Record<string, unknown>;
}

// Mutation variable types
interface UpdateContactVariables {
  contactId: string;
  data: Record<string, unknown>;
}

interface ChangeStatusVariables {
  contactId: string;
  statusData: Record<string, unknown>;
}

interface CreateContactServiceVariables {
  contactId: string;
  serviceData: ContactServiceCreate;
}

interface AssignServiceVariables {
  contactId: string;
  serviceId: string;
}

interface UnassignServiceVariables {
  contactId: string;
  serviceId: string;
}

interface UpdateContactServiceVariables {
  contactId: string;
  serviceId: string;
  serviceData: Record<string, unknown>;
}

/**
 * Mutation hook for creating a contact
 *
 * Features:
 * - Automatic cache invalidation (refetches contact list)
 * - Optimistic updates (optional)
 * - Error handling with rollback
 */
export function useCreateContactMutation(options: MutationCallbacks = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contactData: ContactCreate) => {
      return await contactsAPI.create(contactData);
    },
    onSuccess: (newContact: unknown) => {
      // Invalidate and refetch contact lists
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.lists() });

      // Call custom onSuccess if provided
      if (options.onSuccess) {
        options.onSuccess(newContact);
      }
    },
    onError: (error: Error) => {
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
 */
export function useUpdateContactMutation(options: MutationCallbacks<unknown, UpdateContactVariables> = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contactId, data }: UpdateContactVariables) => {
      return await contactsAPI.update(contactId, data);
    },
    // Optimistic update
    onMutate: async ({ contactId, data }: UpdateContactVariables): Promise<UpdateContactContext> => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.contacts.lists() });
      await queryClient.cancelQueries({ queryKey: queryKeys.contacts.detail(contactId) });

      // Snapshot previous values
      const previousLists = queryClient.getQueriesData({ queryKey: queryKeys.contacts.lists() }) as Array<[QueryKey, unknown]>;
      const previousDetail = queryClient.getQueryData(queryKeys.contacts.detail(contactId));

      // Optimistically update lists
      queryClient.setQueriesData({ queryKey: queryKeys.contacts.lists() }, (old: unknown) => {
        const page = old as ContactListPage | undefined;
        if (!page?.items) return old;

        return {
          ...page,
          items: page.items.map((contact) =>
            contact.id === contactId ? { ...contact, ...data } : contact
          ),
        };
      });

      // Optimistically update detail
      if (previousDetail) {
        queryClient.setQueryData(queryKeys.contacts.detail(contactId), {
          ...(previousDetail as Record<string, unknown>),
          ...data,
        });
      }

      return { previousLists, previousDetail, contactId };
    },
    onError: (error: Error, { contactId }: UpdateContactVariables, context: UpdateContactContext | undefined) => {
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
    onSettled: (data: unknown, error: Error | null, { contactId }: UpdateContactVariables) => {
      // Always refetch to ensure consistency
      invalidateContactQueries(queryClient, contactId);

      if (options.onSettled) {
        options.onSettled(data, error);
      }
    },
    onSuccess: (updatedContact: unknown, variables: UpdateContactVariables) => {
      if (options.onSuccess) {
        options.onSuccess(updatedContact, variables);
      }
    },
  });
}

/**
 * Mutation hook for deleting a contact
 */
export function useDeleteContactMutation(options: MutationCallbacks<string> = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contactId: string) => {
      await contactsAPI.delete(contactId);
      return contactId;
    },
    onMutate: async (contactId: string): Promise<DeleteContactContext> => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.contacts.lists() });

      // Snapshot previous value
      const previousLists = queryClient.getQueriesData({ queryKey: queryKeys.contacts.lists() }) as Array<[QueryKey, unknown]>;

      // Optimistically remove contact
      queryClient.setQueriesData({ queryKey: queryKeys.contacts.lists() }, (old: unknown) => {
        const page = old as ContactListPage | undefined;
        if (!page?.items) return old;

        return {
          ...page,
          items: page.items.filter((contact) => contact.id !== contactId),
          total: (page.total || 0) - 1,
        };
      });

      return { previousLists, contactId };
    },
    onError: (error: Error, contactId: string, context: DeleteContactContext | undefined) => {
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
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.lists() });

      if (options.onSettled) {
        options.onSettled();
      }
    },
    onSuccess: (contactId: string) => {
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
 */
export function useChangeContactStatusMutation(options: MutationCallbacks<unknown, ChangeStatusVariables> & {
  onError?: (error: Error, variables?: ChangeStatusVariables, context?: ChangeStatusContext) => void;
} = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contactId, statusData }: ChangeStatusVariables) => {
      // statusData: { current_global_status_id, current_custom_status_id }
      return await contactsAPI.update(contactId, statusData);
    },
    onMutate: async ({ contactId, statusData }: ChangeStatusVariables): Promise<ChangeStatusContext> => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.contacts.lists() });

      // Snapshot previous value
      const previousLists = queryClient.getQueriesData({ queryKey: queryKeys.contacts.lists() }) as Array<[QueryKey, unknown]>;

      // Optimistically update status
      queryClient.setQueriesData({ queryKey: queryKeys.contacts.lists() }, (old: unknown) => {
        const page = old as ContactListPage | undefined;
        if (!page?.items) return old;

        return {
          ...page,
          items: page.items.map((contact) =>
            contact.id === contactId ? { ...contact, ...statusData } : contact
          ),
        };
      });

      return { previousLists, contactId, statusData };
    },
    onError: (error: Error, variables: ChangeStatusVariables, context: ChangeStatusContext | undefined) => {
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
    onSuccess: (updatedContact: unknown, variables: ChangeStatusVariables) => {
      // Update cache with server response (in case server added/modified fields)
      queryClient.setQueriesData({ queryKey: queryKeys.contacts.lists() }, (old: unknown) => {
        const page = old as ContactListPage | undefined;
        if (!page?.items) return old;

        return {
          ...page,
          items: page.items.map((contact) =>
            contact.id === (updatedContact as Record<string, unknown>).id ? updatedContact as Record<string, unknown> : contact
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
 */
export function useCreateContactServiceMutation(options: MutationCallbacks = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contactId, serviceData }: CreateContactServiceVariables) => {
      return await contactsAPI.createContactService(contactId, serviceData);
    },
    onSuccess: (updatedContact: unknown, { contactId }: CreateContactServiceVariables) => {
      // Invalidate contact queries to refetch with new service
      invalidateContactQueries(queryClient, contactId);

      if (options.onSuccess) {
        options.onSuccess(updatedContact);
      }
    },
    onError: (error: Error) => {
      console.error('[useCreateContactServiceMutation] Failed:', error);

      if (options.onError) {
        options.onError(error);
      }
    },
  });
}

/**
 * Mutation hook for assigning an existing service to a contact
 */
export function useAssignServiceMutation(options: MutationCallbacks = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contactId, serviceId }: AssignServiceVariables) => {
      return await contactsAPI.assignService(contactId, serviceId);
    },
    onSuccess: (updatedContact: unknown, { contactId }: AssignServiceVariables) => {
      invalidateContactQueries(queryClient, contactId);

      if (options.onSuccess) {
        options.onSuccess(updatedContact);
      }
    },
    onError: (error: Error) => {
      console.error('[useAssignServiceMutation] Failed:', error);

      if (options.onError) {
        options.onError(error);
      }
    },
  });
}

/**
 * Mutation hook for unassigning a service from a contact
 */
export function useUnassignServiceMutation(options: MutationCallbacks = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contactId, serviceId }: UnassignServiceVariables) => {
      await contactsAPI.unassignService(contactId, serviceId);
      return { contactId, serviceId };
    },
    onSuccess: (data: { contactId: string; serviceId: string }, { contactId }: UnassignServiceVariables) => {
      invalidateContactQueries(queryClient, contactId);

      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error: Error) => {
      console.error('[useUnassignServiceMutation] Failed:', error);

      if (options.onError) {
        options.onError(error);
      }
    },
  });
}

/**
 * Mutation hook for updating a contact's service
 */
export function useUpdateContactServiceMutation(options: MutationCallbacks = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contactId, serviceId, serviceData }: UpdateContactServiceVariables) => {
      return await contactsAPI.updateContactService(contactId, serviceId, serviceData);
    },
    onSuccess: (updatedService: unknown, { contactId }: UpdateContactServiceVariables) => {
      invalidateContactQueries(queryClient, contactId);

      if (options.onSuccess) {
        options.onSuccess(updatedService);
      }
    },
    onError: (error: Error) => {
      console.error('[useUpdateContactServiceMutation] Failed:', error);

      if (options.onError) {
        options.onError(error);
      }
    },
  });
}
