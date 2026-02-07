import { useState, useCallback, useEffect, useRef } from 'react';
import { contactServicesAPI } from '../../services/api/crm';
import type { ContactServiceResponse } from '../../types';

interface UseContactServicesOptions {
  searchQuery?: string;
  status?: string;
  frequencyType?: string;
}

/** A contact service enriched with the owning contact's details. */
interface ContactServiceWithContact extends ContactServiceResponse {
  contact_id: string;
  contact_name: string;
  contact_email: string | null | undefined;
  contact_business_name: string | null | undefined;
}

interface ContactServicesListResponse {
  items: ContactServiceWithContact[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

/**
 * Custom hook for fetching and managing contact services (services assigned to contacts)
 * Uses dedicated server-side endpoint with search, filtering, sorting, and pagination
 */
export function useContactServices(options: UseContactServicesOptions = {}, refreshKey: number = 0) {
  const [contactServices, setContactServices] = useState<ContactServiceWithContact[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { searchQuery = '', status = '', frequencyType = '' } = options;

  // Debounce search to avoid excessive API calls
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState<string>(searchQuery);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Fetch contact services from the dedicated endpoint
  const fetchContactServices = useCallback(async (): Promise<ContactServiceWithContact[]> => {
    try {
      setLoading(true);
      setError(null);

      // Build query params — only include non-empty filters
      const params: Record<string, string> = {
        per_page: '100',
      };

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }
      if (status) {
        params.status = status;
      }
      if (frequencyType) {
        params.frequency_type = frequencyType;
      }

      const response = await contactServicesAPI.list(params) as ContactServicesListResponse;
      const items = response?.items || [];

      setContactServices(items);
      return items;
    } catch (err: unknown) {
      console.error('[useContactServices] Failed to fetch contact services:', err);
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status, frequencyType]);

  // Fetch when filters change or refreshKey changes
  useEffect(() => {
    fetchContactServices();
  }, [fetchContactServices, refreshKey]);

  // Get unique statuses for filter dropdown
  const availableStatuses = ['pending', 'inactive', 'confirmed', 'active', 'completed'];

  // Get unique frequency types for filter dropdown
  const availableFrequencyTypes = ['one_off', 'recurring'];

  return {
    // All services (server-filtered)
    contactServices,
    // Filtered services (same as contactServices since filtering is server-side now)
    filteredServices: contactServices,
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
