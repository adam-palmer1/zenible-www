import { useState, useCallback, useEffect, useMemo } from 'react';
import { contactsAPI } from '../../services/api/crm';

/**
 * Custom hook for fetching and managing contact services (services assigned to contacts)
 * Aggregates services from all clients into a single list with contact information
 *
 * @param {Object} options - Filter options
 * @param {string} options.searchQuery - Search by service name or client name
 * @param {string} options.status - Filter by service status
 * @param {string} options.frequencyType - Filter by frequency type (one_off, recurring)
 * @param {number} refreshKey - Key to trigger refresh
 * @returns {Object} Contact services state and methods
 */
export function useContactServices(options = {}, refreshKey = 0) {
  const [contactServices, setContactServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { searchQuery = '', status = '', frequencyType = '' } = options;

  // Fetch all clients with their services
  const fetchContactServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all clients (is_client=true) with services included
      // The contacts API returns services array for each contact
      const response = await contactsAPI.list({
        is_client: true,
        per_page: 1000, // Fetch all clients
      });

      // Extract and flatten services from all contacts
      const allServices = [];
      const contacts = response?.items || response || [];

      contacts.forEach((contact) => {
        if (contact.services && contact.services.length > 0) {
          contact.services.forEach((service) => {
            allServices.push({
              ...service,
              // Add contact information to each service
              contact_id: contact.id,
              contact_name: contact.display_name ||
                contact.business_name ||
                `${contact.first_name || ''} ${contact.last_name || ''}`.trim() ||
                'Unknown',
              contact_email: contact.email,
              contact_business_name: contact.business_name,
            });
          });
        }
      });

      setContactServices(allServices);
      return allServices;
    } catch (err) {
      console.error('[useContactServices] Failed to fetch contact services:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount and when refreshKey changes
  useEffect(() => {
    fetchContactServices();
  }, [fetchContactServices, refreshKey]);

  // Filter services based on search query and filters
  const filteredServices = useMemo(() => {
    let filtered = [...contactServices];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (service) =>
          service.name?.toLowerCase().includes(query) ||
          service.contact_name?.toLowerCase().includes(query) ||
          service.contact_business_name?.toLowerCase().includes(query) ||
          service.description?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (status) {
      filtered = filtered.filter((service) => service.status === status);
    }

    // Apply frequency type filter
    if (frequencyType) {
      filtered = filtered.filter((service) => service.frequency_type === frequencyType);
    }

    return filtered;
  }, [contactServices, searchQuery, status, frequencyType]);

  // Get unique statuses for filter dropdown
  const availableStatuses = useMemo(() => {
    const statuses = new Set(contactServices.map((s) => s.status).filter(Boolean));
    return Array.from(statuses);
  }, [contactServices]);

  // Get unique frequency types for filter dropdown
  const availableFrequencyTypes = useMemo(() => {
    const types = new Set(contactServices.map((s) => s.frequency_type).filter(Boolean));
    return Array.from(types);
  }, [contactServices]);

  return {
    // All services (unfiltered)
    contactServices,
    // Filtered services
    filteredServices,
    // State
    loading,
    error,
    // Filter options
    availableStatuses,
    availableFrequencyTypes,
    // Actions
    refresh: fetchContactServices,
  };
}
