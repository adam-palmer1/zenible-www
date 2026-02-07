import { useState, useCallback, useEffect } from 'react';
import { contactsAPI } from '../../services/api/crm';
import { removeItem, updateItem, prependItem } from '../../utils/stateHelpers';
import type {
  ContactResponse,
  ContactCreate,
  ContactServiceCreate,
  ContactServiceAttributionCreate,
  ContactServiceInvoiceCreate,
  PaginatedResponse,
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
 * Handles loading, creating, updating, and deleting contacts
 */
export function useContacts(
  filters: Record<string, unknown> = {},
  refreshKey: number = 0,
  options: UseContactsOptions = {}
) {
  const { skipInitialFetch = false } = options;
  const [contacts, setContacts] = useState<ContactResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    per_page: 20,
    total: 0,
    total_pages: 0,
  });

  // Fetch contacts
  const fetchContacts = useCallback(async (params: Record<string, unknown> = {}): Promise<unknown> => {
    try {
      setLoading(true);
      setError(null);

      const mergedParams = {
        page: pagination.page,
        per_page: pagination.per_page,
        sort_by: 'last_used',
        sort_order: 'desc',
        ...filters,
        ...params,
      } as unknown as Record<string, string>;

      const response = await contactsAPI.list(mergedParams);

      setContacts(response.items || []);
      setPagination({
        page: response.page,
        per_page: response.per_page,
        total: response.total,
        total_pages: response.total_pages,
      });

      return response;
    } catch (err: unknown) {
      console.error('[useContacts] Failed to fetch contacts:', err);
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.per_page]);

  // Get single contact
  const getContact = useCallback(async (contactId: string): Promise<unknown> => {
    try {
      setLoading(true);
      setError(null);
      const contact = await contactsAPI.get(contactId);
      return contact;
    } catch (err: unknown) {
      console.error('[useContacts] Failed to get contact:', err);
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create contact
  const createContact = useCallback(async (data: ContactCreate): Promise<unknown> => {
    try {
      setLoading(true);
      setError(null);
      const newContact = await contactsAPI.create(data);

      // Add to local state
      setContacts(prev => prependItem(prev, newContact));
      setPagination((prev) => ({ ...prev, total: prev.total + 1 }));

      return newContact;
    } catch (err: unknown) {
      console.error('[useContacts] Failed to create contact:', err);
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update contact
  const updateContact = useCallback(async (
    contactId: string,
    data: Record<string, unknown>,
    options: { skipLoading?: boolean } = {}
  ): Promise<unknown> => {
    try {
      // Skip loading state for optimistic updates (e.g., drag-and-drop)
      // Only show loading for explicit user actions
      if (!options.skipLoading) {
        setLoading(true);
      }
      setError(null);
      const updatedContact = await contactsAPI.update(contactId, data);

      // Update in local state - merge with existing contact to preserve fields
      // that may not be returned by the PATCH API (like service counts, totals, etc.)
      setContacts(prev => updateItem(prev, contactId, (existingContact: ContactResponse) => ({
        ...existingContact,
        ...(updatedContact as ContactResponse),
      })));

      return { success: true, ...(updatedContact as ContactResponse) };
    } catch (err: unknown) {
      console.error('[useContacts] Failed to update contact:', err);
      setError((err as Error).message);
      throw err;
    } finally {
      if (!options.skipLoading) {
        setLoading(false);
      }
    }
  }, []);

  // Delete contact
  const deleteContact = useCallback(async (contactId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await contactsAPI.delete(contactId);

      // Remove from local state
      setContacts(prev => removeItem(prev, contactId));
      setPagination((prev) => ({ ...prev, total: prev.total - 1 }));

      return true;
    } catch (err: unknown) {
      console.error('[useContacts] Failed to delete contact:', err);
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Change contact status
  const changeStatus = useCallback(async (contactId: string, statusData: Record<string, unknown>): Promise<unknown> => {
    try {
      setLoading(true);
      setError(null);
      const updatedContact = await contactsAPI.changeStatus(contactId, statusData);

      // Update in local state
      setContacts(prev => updateItem(prev, contactId, updatedContact));

      return updatedContact;
    } catch (err: unknown) {
      console.error('[useContacts] Failed to change status:', err);
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create contact-specific service
  const createContactService = useCallback(async (contactId: string, serviceData: ContactServiceCreate): Promise<unknown> => {
    try {
      setLoading(true);
      setError(null);
      const updatedContact = await contactsAPI.createContactService(contactId, serviceData);

      // Update in local state - service response used to update contact entry
      setContacts(prev => updateItem(prev, contactId, updatedContact as unknown as ContactResponse));

      return updatedContact;
    } catch (err: unknown) {
      console.error('[useContacts] Failed to create contact service:', err);
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Assign service
  const assignService = useCallback(async (contactId: string, serviceId: string): Promise<unknown> => {
    try {
      setLoading(true);
      setError(null);
      const updatedContact = await contactsAPI.assignService(contactId, serviceId);

      // Update in local state - service response used to update contact entry
      setContacts(prev => updateItem(prev, contactId, updatedContact as unknown as ContactResponse));

      return updatedContact;
    } catch (err: unknown) {
      console.error('[useContacts] Failed to assign service:', err);
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update contact service
  const updateContactService = useCallback(async (
    contactId: string,
    serviceId: string,
    serviceData: Record<string, unknown>
  ): Promise<unknown> => {
    try {
      setLoading(true);
      setError(null);
      const updatedService = await contactsAPI.updateContactService(contactId, serviceId, serviceData);

      // Refresh contact to get updated services
      const updatedContact = await contactsAPI.get(contactId);
      setContacts(prev => updateItem(prev, contactId, updatedContact));

      return updatedService;
    } catch (err: unknown) {
      console.error('[useContacts] Failed to update contact service:', err);
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Unassign service
  const unassignService = useCallback(async (contactId: string, serviceId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await contactsAPI.unassignService(contactId, serviceId);

      // Refresh contact to get updated services
      const updatedContact = await contactsAPI.get(contactId);
      setContacts(prev => updateItem(prev, contactId, updatedContact));

      return true;
    } catch (err: unknown) {
      console.error('[useContacts] Failed to unassign service:', err);
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // =====================
  // Service Attributions
  // =====================

  // List attributions for a service
  const listAttributions = useCallback(async (contactId: string, serviceId: string): Promise<unknown> => {
    try {
      setError(null);
      return await contactsAPI.listAttributions(contactId, serviceId);
    } catch (err: unknown) {
      console.error('[useContacts] Failed to list attributions:', err);
      setError((err as Error).message);
      throw err;
    }
  }, []);

  // Create attribution for a service
  const createAttribution = useCallback(async (
    contactId: string,
    serviceId: string,
    data: ContactServiceAttributionCreate
  ): Promise<unknown> => {
    try {
      setError(null);
      const attribution = await contactsAPI.createAttribution(contactId, serviceId, data);

      // Refresh contact to get updated service amounts
      const updatedContact = await contactsAPI.get(contactId);
      setContacts(prev => updateItem(prev, contactId, updatedContact));

      return attribution;
    } catch (err: unknown) {
      console.error('[useContacts] Failed to create attribution:', err);
      setError((err as Error).message);
      throw err;
    }
  }, []);

  // Delete attribution
  const deleteAttribution = useCallback(async (
    contactId: string,
    serviceId: string,
    attributionId: string
  ): Promise<boolean> => {
    try {
      setError(null);
      await contactsAPI.deleteAttribution(contactId, serviceId, attributionId);

      // Refresh contact to get updated service amounts
      const updatedContact = await contactsAPI.get(contactId);
      setContacts(prev => updateItem(prev, contactId, updatedContact));

      return true;
    } catch (err: unknown) {
      console.error('[useContacts] Failed to delete attribution:', err);
      setError((err as Error).message);
      throw err;
    }
  }, []);

  // =====================
  // Service Invoice Links
  // =====================

  // List invoice links for a service
  const listInvoiceLinks = useCallback(async (contactId: string, serviceId: string): Promise<unknown> => {
    try {
      setError(null);
      return await contactsAPI.listInvoiceLinks(contactId, serviceId);
    } catch (err: unknown) {
      console.error('[useContacts] Failed to list invoice links:', err);
      setError((err as Error).message);
      throw err;
    }
  }, []);

  // Create invoice link for a service
  const createInvoiceLink = useCallback(async (
    contactId: string,
    serviceId: string,
    data: ContactServiceInvoiceCreate
  ): Promise<unknown> => {
    try {
      setError(null);
      const invoiceLink = await contactsAPI.createInvoiceLink(contactId, serviceId, data);

      // Refresh contact to get updated service amounts
      const updatedContact = await contactsAPI.get(contactId);
      setContacts(prev => updateItem(prev, contactId, updatedContact));

      return invoiceLink;
    } catch (err: unknown) {
      console.error('[useContacts] Failed to create invoice link:', err);
      setError((err as Error).message);
      throw err;
    }
  }, []);

  // Delete invoice link
  const deleteInvoiceLink = useCallback(async (
    contactId: string,
    serviceId: string,
    invoiceLinkId: string
  ): Promise<boolean> => {
    try {
      setError(null);
      await contactsAPI.deleteInvoiceLink(contactId, serviceId, invoiceLinkId);

      // Refresh contact to get updated service amounts
      const updatedContact = await contactsAPI.get(contactId);
      setContacts(prev => updateItem(prev, contactId, updatedContact));

      return true;
    } catch (err: unknown) {
      console.error('[useContacts] Failed to delete invoice link:', err);
      setError((err as Error).message);
      throw err;
    }
  }, []);

  // =====================
  // Service Invoice Actions
  // =====================

  // Create one-off invoice from service
  const createInvoiceFromService = useCallback(async (
    contactId: string,
    serviceId: string,
    data: Record<string, unknown>
  ): Promise<unknown> => {
    try {
      setLoading(true);
      setError(null);
      const result = await contactsAPI.createInvoiceFromService(contactId, serviceId, data);

      // Refresh contact to get updated service amounts
      const updatedContact = await contactsAPI.get(contactId);
      setContacts(prev => updateItem(prev, contactId, updatedContact));

      return result; // Returns created invoice
    } catch (err: unknown) {
      console.error('[useContacts] Failed to create invoice from service:', err);
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Link recurring service to invoice template
  const linkServiceToTemplate = useCallback(async (
    contactId: string,
    serviceId: string,
    templateId: string
  ): Promise<unknown> => {
    try {
      setLoading(true);
      setError(null);
      const result = await contactsAPI.linkServiceToTemplate(contactId, serviceId, templateId);

      // Refresh contact to get updated service state (is_locked, linked_invoice_template)
      const updatedContact = await contactsAPI.get(contactId);
      setContacts(prev => updateItem(prev, contactId, updatedContact));

      return result;
    } catch (err: unknown) {
      console.error('[useContacts] Failed to link service to template:', err);
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Unlink service from invoice template
  const unlinkServiceFromTemplate = useCallback(async (contactId: string, serviceId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await contactsAPI.unlinkServiceFromTemplate(contactId, serviceId);

      // Refresh contact to get updated service state
      const updatedContact = await contactsAPI.get(contactId);
      setContacts(prev => updateItem(prev, contactId, updatedContact));

      return true;
    } catch (err: unknown) {
      console.error('[useContacts] Failed to unlink service from template:', err);
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create recurring invoice template from service
  const createRecurringTemplateFromService = useCallback(async (
    contactId: string,
    serviceId: string,
    data: Record<string, unknown> = {}
  ): Promise<unknown> => {
    try {
      setLoading(true);
      setError(null);
      const result = await contactsAPI.createRecurringTemplateFromService(contactId, serviceId, data);

      // Refresh contact to get updated service state (now linked to the new template)
      const updatedContact = await contactsAPI.get(contactId);
      setContacts(prev => updateItem(prev, contactId, updatedContact));

      return result; // Returns created template
    } catch (err: unknown) {
      console.error('[useContacts] Failed to create recurring template from service:', err);
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a stable filter key to avoid infinite loops
  const filterKey = JSON.stringify(filters);

  // Load contacts on mount, when refreshKey changes, or when filters change
  // Skip if skipInitialFetch is true (for components that only need mutation methods)
  useEffect(() => {
    if (!skipInitialFetch) {
      fetchContacts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, filterKey, skipInitialFetch]);

  return {
    contacts,
    loading,
    error,
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
