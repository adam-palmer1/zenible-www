import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsAPI } from '../../services/api/crm';
import { queryKeys } from '../../lib/query-keys';
import type {
  ContactResponse,
  ContactCreate,
  ContactServiceCreate,
  ContactServiceAttributionCreate,
  ContactServiceInvoiceCreate,
} from '../../types';

interface Pagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

interface UseContactsOptions {
  skipInitialFetch?: boolean;
}

/**
 * Custom hook for managing contacts
 * Uses React Query for caching, deduplication, and background refetching
 */
export function useContacts(
  filters: Record<string, unknown> = {},
  _refreshKey: number = 0,
  options: UseContactsOptions = {}
) {
  const { skipInitialFetch = false } = options;
  const queryClient = useQueryClient();

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    per_page: 20,
    total: 0,
    total_pages: 0,
  });

  // Build query params
  const queryParams = useMemo(() => ({
    page: pagination.page,
    per_page: pagination.per_page,
    sort_by: 'last_used',
    sort_order: 'desc',
    ...filters,
  }), [pagination.page, pagination.per_page, filters]);

  // Contacts list query
  const contactsQuery = useQuery({
    queryKey: queryKeys.contacts.list(queryParams),
    queryFn: async () => {
      const response = await contactsAPI.list(queryParams as unknown as Record<string, string>);
      return response;
    },
    enabled: !skipInitialFetch,
  });

  // Update pagination when data changes
  const contacts = contactsQuery.data?.items || [];
  if (contactsQuery.data && (
    pagination.total !== contactsQuery.data.total ||
    pagination.total_pages !== contactsQuery.data.total_pages
  )) {
    // Use state setter directly to avoid effect loops
    setPagination(prev => ({
      ...prev,
      page: contactsQuery.data.page,
      per_page: contactsQuery.data.per_page,
      total: contactsQuery.data.total,
      total_pages: contactsQuery.data.total_pages,
    }));
  }

  // Fetch contacts - if params are provided, makes a direct API call (e.g. for search);
  // otherwise invalidates the cached query to trigger a refetch.
  const fetchContacts = useCallback(async (params: Record<string, unknown> = {}): Promise<unknown> => {
    if (Object.keys(params).length > 0) {
      const stringParams = Object.entries(params).reduce<Record<string, string>>((acc, [key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          acc[key] = String(value);
        }
        return acc;
      }, {});
      return contactsAPI.list(stringParams);
    }
    await queryClient.invalidateQueries({ queryKey: queryKeys.contacts.lists() });
    return contactsQuery.data;
  }, [queryClient, contactsQuery.data]);

  // Get single contact (imperative)
  const getContact = useCallback(async (contactId: string): Promise<unknown> => {
    return contactsAPI.get(contactId);
  }, []);

  // Create contact mutation
  const createMutation = useMutation({
    mutationFn: (data: ContactCreate) => contactsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    },
  });

  const createContact = useCallback(async (data: ContactCreate): Promise<unknown> => {
    return createMutation.mutateAsync(data);
  }, [createMutation]);

  // Update contact mutation
  const updateMutation = useMutation({
    mutationFn: ({ contactId, data }: { contactId: string; data: Record<string, unknown> }) =>
      contactsAPI.update(contactId, data),
    onSuccess: (_result, { contactId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.detail(contactId) });
    },
  });

  const updateContact = useCallback(async (
    contactId: string,
    data: Record<string, unknown>,
    _options: { skipLoading?: boolean } = {}
  ): Promise<unknown> => {
    const result = await updateMutation.mutateAsync({ contactId, data });
    return { success: true, ...(result as ContactResponse) };
  }, [updateMutation]);

  // Delete contact mutation
  const deleteMutation = useMutation({
    mutationFn: (contactId: string) => contactsAPI.delete(contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    },
  });

  const deleteContact = useCallback(async (contactId: string): Promise<boolean> => {
    await deleteMutation.mutateAsync(contactId);
    return true;
  }, [deleteMutation]);

  // Change status mutation
  const changeStatusMutation = useMutation({
    mutationFn: ({ contactId, statusData }: { contactId: string; statusData: Record<string, unknown> }) =>
      contactsAPI.changeStatus(contactId, statusData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    },
  });

  const changeStatus = useCallback(async (contactId: string, statusData: Record<string, unknown>): Promise<unknown> => {
    return changeStatusMutation.mutateAsync({ contactId, statusData });
  }, [changeStatusMutation]);

  // Service operations - all invalidate contacts after success
  const contactServiceMutation = useMutation({
    mutationFn: ({ contactId, serviceData }: { contactId: string; serviceData: ContactServiceCreate }) =>
      contactsAPI.createContactService(contactId, serviceData),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all }); },
  });

  const createContactService = useCallback(async (contactId: string, serviceData: ContactServiceCreate): Promise<unknown> => {
    return contactServiceMutation.mutateAsync({ contactId, serviceData });
  }, [contactServiceMutation]);

  const assignServiceMutation = useMutation({
    mutationFn: ({ contactId, serviceId }: { contactId: string; serviceId: string }) =>
      contactsAPI.assignService(contactId, serviceId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all }); },
  });

  const assignService = useCallback(async (contactId: string, serviceId: string): Promise<unknown> => {
    return assignServiceMutation.mutateAsync({ contactId, serviceId });
  }, [assignServiceMutation]);

  const updateContactServiceMutation = useMutation({
    mutationFn: async ({ contactId, serviceId, serviceData }: { contactId: string; serviceId: string; serviceData: Record<string, unknown> }) => {
      const result = await contactsAPI.updateContactService(contactId, serviceId, serviceData);
      return result;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all }); },
  });

  const updateContactService = useCallback(async (contactId: string, serviceId: string, serviceData: Record<string, unknown>): Promise<unknown> => {
    return updateContactServiceMutation.mutateAsync({ contactId, serviceId, serviceData });
  }, [updateContactServiceMutation]);

  const unassignServiceMutation = useMutation({
    mutationFn: ({ contactId, serviceId }: { contactId: string; serviceId: string }) =>
      contactsAPI.unassignService(contactId, serviceId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all }); },
  });

  const unassignService = useCallback(async (contactId: string, serviceId: string): Promise<boolean> => {
    await unassignServiceMutation.mutateAsync({ contactId, serviceId });
    return true;
  }, [unassignServiceMutation]);

  // Attribution operations (imperative + invalidation)
  const listAttributions = useCallback(async (contactId: string, serviceId: string): Promise<unknown> => {
    return contactsAPI.listAttributions(contactId, serviceId);
  }, []);

  const createAttribution = useCallback(async (contactId: string, serviceId: string, data: ContactServiceAttributionCreate): Promise<unknown> => {
    const result = await contactsAPI.createAttribution(contactId, serviceId, data);
    queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    return result;
  }, [queryClient]);

  const deleteAttribution = useCallback(async (contactId: string, serviceId: string, attributionId: string): Promise<boolean> => {
    await contactsAPI.deleteAttribution(contactId, serviceId, attributionId);
    queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    return true;
  }, [queryClient]);

  // Invoice link operations (imperative + invalidation)
  const listInvoiceLinks = useCallback(async (contactId: string, serviceId: string): Promise<unknown> => {
    return contactsAPI.listInvoiceLinks(contactId, serviceId);
  }, []);

  const createInvoiceLink = useCallback(async (contactId: string, serviceId: string, data: ContactServiceInvoiceCreate): Promise<unknown> => {
    const result = await contactsAPI.createInvoiceLink(contactId, serviceId, data);
    queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    return result;
  }, [queryClient]);

  const deleteInvoiceLink = useCallback(async (contactId: string, serviceId: string, invoiceLinkId: string): Promise<boolean> => {
    await contactsAPI.deleteInvoiceLink(contactId, serviceId, invoiceLinkId);
    queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    return true;
  }, [queryClient]);

  // Service invoice actions (imperative + invalidation)
  const createInvoiceFromService = useCallback(async (contactId: string, serviceId: string, data: Record<string, unknown>): Promise<unknown> => {
    const result = await contactsAPI.createInvoiceFromService(contactId, serviceId, data);
    queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    return result;
  }, [queryClient]);

  const linkServiceToTemplate = useCallback(async (contactId: string, serviceId: string, templateId: string): Promise<unknown> => {
    const result = await contactsAPI.linkServiceToTemplate(contactId, serviceId, templateId);
    queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    return result;
  }, [queryClient]);

  const unlinkServiceFromTemplate = useCallback(async (contactId: string, serviceId: string): Promise<boolean> => {
    await contactsAPI.unlinkServiceFromTemplate(contactId, serviceId);
    queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    return true;
  }, [queryClient]);

  const createRecurringTemplateFromService = useCallback(async (contactId: string, serviceId: string, data: Record<string, unknown> = {}): Promise<unknown> => {
    const result = await contactsAPI.createRecurringTemplateFromService(contactId, serviceId, data);
    queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    return result;
  }, [queryClient]);

  return {
    contacts,
    loading: contactsQuery.isLoading,
    error: contactsQuery.error?.message || null,
    pagination,
    fetchContacts,
    getContact,
    createContact,
    updateContact,
    deleteContact,
    changeStatus,
    createContactService,
    assignService,
    updateContactService,
    unassignService,
    // Attributions
    listAttributions,
    createAttribution,
    deleteAttribution,
    // Invoice Links
    listInvoiceLinks,
    createInvoiceLink,
    deleteInvoiceLink,
    // Service Invoice Actions
    createInvoiceFromService,
    linkServiceToTemplate,
    unlinkServiceFromTemplate,
    createRecurringTemplateFromService,
  };
}
