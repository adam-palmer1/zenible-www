import { useState, useCallback, useEffect, useMemo } from 'react';
import { contactsAPI } from '../../services/api/crm';

interface UseContactServicesOptions {
  searchQuery?: string;
  status?: string;
  frequencyType?: string;
}

/**
 * Custom hook for fetching and managing contact services (services assigned to contacts)
 * Aggregates services from all clients into a single list with contact information
 */
export function useContactServices(options: UseContactServicesOptions = {}, refreshKey: number = 0) {
  const [contactServices, setContactServices] = useState<unknown[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { searchQuery = '', status = '', frequencyType = '' } = options;

  // Fetch all clients with their services
  const fetchContactServices = useCallback(async (): Promise<unknown[]> => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all clients (is_client=true) with services included
      // The contacts API returns services array for each contact
      const response = await contactsAPI.list({
        is_client: true,
        per_page: 1000, // Fetch all clients
      } as any);

      // Extract and flatten services from all contacts
      const allServices: unknown[] = [];
      const contacts = (response as any)?.items || (response as unknown[]) || [];

      (contacts as unknown[]).forEach((contact: unknown) => {
        if ((contact as any).services && (contact as any).services.length > 0) {
          (contact as any).services.forEach((service: unknown) => {
            allServices.push({
              ...(service as any),
              // Add contact information to each service
              contact_id: (contact as any).id,
              contact_name: (contact as any).display_name ||
                (contact as any).business_name ||
                `${(contact as any).first_name || ''} ${(contact as any).last_name || ''}`.trim() ||
                'Unknown',
              contact_email: (contact as any).email,
              contact_business_name: (contact as any).business_name,
            });
          });
        }
      });

      setContactServices(allServices);
      return allServices;
    } catch (err: unknown) {
      console.error('[useContactServices] Failed to fetch contact services:', err);
      setError((err as Error).message);
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
  const filteredServices = useMemo((): unknown[] => {
    let filtered = [...contactServices];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (service: unknown) =>
          (service as any).name?.toLowerCase().includes(query) ||
          (service as any).contact_name?.toLowerCase().includes(query) ||
          (service as any).contact_business_name?.toLowerCase().includes(query) ||
          (service as any).description?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (status) {
      filtered = filtered.filter((service: unknown) => (service as any).status === status);
    }

    // Apply frequency type filter
    if (frequencyType) {
      filtered = filtered.filter((service: unknown) => (service as any).frequency_type === frequencyType);
    }

    return filtered;
  }, [contactServices, searchQuery, status, frequencyType]);

  // Get unique statuses for filter dropdown
  const availableStatuses = useMemo((): string[] => {
    const statuses = new Set(contactServices.map((s: unknown) => (s as any).status as string).filter(Boolean));
    return Array.from(statuses);
  }, [contactServices]);

  // Get unique frequency types for filter dropdown
  const availableFrequencyTypes = useMemo((): string[] => {
    const types = new Set(contactServices.map((s: unknown) => (s as any).frequency_type as string).filter(Boolean));
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
