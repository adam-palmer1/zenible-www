import { useState, useCallback, useEffect } from 'react';
import { contactsAPI } from '../../services/api/crm';
import { removeItem, updateItem, prependItem } from '../../utils/stateHelpers';

/**
 * Custom hook for managing contacts
 * Handles loading, creating, updating, and deleting contacts
 *
 * @param {Object} filters - Initial filters for contacts
 * @param {number} refreshKey - Trigger for refetching data
 * @returns {Object} Contacts state and methods
 */
export function useContacts(filters = {}, refreshKey = 0) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    total_pages: 0,
  });

  // Fetch contacts
  const fetchContacts = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);

      const mergedParams = {
        page: pagination.page,
        per_page: pagination.per_page,
        ...filters,
        ...params,
      };

      const response = await contactsAPI.list(mergedParams);

      setContacts(response.items || []);
      setPagination({
        page: response.page,
        per_page: response.per_page,
        total: response.total,
        total_pages: response.total_pages,
      });

      return response;
    } catch (err) {
      console.error('[useContacts] Failed to fetch contacts:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.per_page]);

  // Get single contact
  const getContact = useCallback(async (contactId) => {
    try {
      setLoading(true);
      setError(null);
      const contact = await contactsAPI.get(contactId);
      return contact;
    } catch (err) {
      console.error('[useContacts] Failed to get contact:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create contact
  const createContact = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      const newContact = await contactsAPI.create(data);

      // Add to local state
      setContacts(prev => prependItem(prev, newContact));
      setPagination((prev) => ({ ...prev, total: prev.total + 1 }));

      return newContact;
    } catch (err) {
      console.error('[useContacts] Failed to create contact:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update contact
  const updateContact = useCallback(async (contactId, data, options = {}) => {
    try {
      // Skip loading state for optimistic updates (e.g., drag-and-drop)
      // Only show loading for explicit user actions
      if (!options.skipLoading) {
        setLoading(true);
      }
      setError(null);
      const updatedContact = await contactsAPI.update(contactId, data);

      // Update in local state
      setContacts(prev => updateItem(prev, contactId, updatedContact));

      return updatedContact;
    } catch (err) {
      console.error('[useContacts] Failed to update contact:', err);
      setError(err.message);
      throw err;
    } finally {
      if (!options.skipLoading) {
        setLoading(false);
      }
    }
  }, []);

  // Delete contact
  const deleteContact = useCallback(async (contactId) => {
    try {
      setLoading(true);
      setError(null);
      await contactsAPI.delete(contactId);

      // Remove from local state
      setContacts(prev => removeItem(prev, contactId));
      setPagination((prev) => ({ ...prev, total: prev.total - 1 }));

      return true;
    } catch (err) {
      console.error('[useContacts] Failed to delete contact:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Change contact status
  const changeStatus = useCallback(async (contactId, statusData) => {
    try {
      setLoading(true);
      setError(null);
      const updatedContact = await contactsAPI.changeStatus(contactId, statusData);

      // Update in local state
      setContacts(prev => updateItem(prev, contactId, updatedContact));

      return updatedContact;
    } catch (err) {
      console.error('[useContacts] Failed to change status:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create contact-specific service
  const createContactService = useCallback(async (contactId, serviceData) => {
    try {
      setLoading(true);
      setError(null);
      const updatedContact = await contactsAPI.createContactService(contactId, serviceData);

      // Update in local state
      setContacts(prev => updateItem(prev, contactId, updatedContact));

      return updatedContact;
    } catch (err) {
      console.error('[useContacts] Failed to create contact service:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Assign service
  const assignService = useCallback(async (contactId, serviceId) => {
    try {
      setLoading(true);
      setError(null);
      const updatedContact = await contactsAPI.assignService(contactId, serviceId);

      // Update in local state
      setContacts(prev => updateItem(prev, contactId, updatedContact));

      return updatedContact;
    } catch (err) {
      console.error('[useContacts] Failed to assign service:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update contact service
  const updateContactService = useCallback(async (contactId, serviceId, serviceData) => {
    try {
      setLoading(true);
      setError(null);
      const updatedService = await contactsAPI.updateContactService(contactId, serviceId, serviceData);

      // Refresh contact to get updated services
      const updatedContact = await contactsAPI.get(contactId);
      setContacts(prev => updateItem(prev, contactId, updatedContact));

      return updatedService;
    } catch (err) {
      console.error('[useContacts] Failed to update contact service:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Unassign service
  const unassignService = useCallback(async (contactId, serviceId) => {
    try {
      setLoading(true);
      setError(null);
      await contactsAPI.unassignService(contactId, serviceId);

      // Refresh contact to get updated services
      const updatedContact = await contactsAPI.get(contactId);
      setContacts(prev => updateItem(prev, contactId, updatedContact));

      return true;
    } catch (err) {
      console.error('[useContacts] Failed to unassign service:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a stable filter key to avoid infinite loops
  const filterKey = JSON.stringify(filters);

  // Load contacts on mount, when refreshKey changes, or when filters change
  useEffect(() => {
    fetchContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, filterKey]);

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
  };
}
