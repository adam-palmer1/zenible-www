import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { contactServicesAPI } from '../../services/api/crm';
import { queryKeys } from '../../lib/query-keys';
import type { ContactServiceResponse } from '../../types';

interface UseContactServicesOptions {
  searchQuery?: string;
  statusFilters?: string[];
  frequencyTypeFilters?: string[];
  showHiddenContacts?: boolean;
  showLostContacts?: boolean;
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
 * Uses React Query for caching, deduplication, and background refetching
 */
export function useContactServices(options: UseContactServicesOptions = {}, _refreshKey: number = 0) {
  const {
    searchQuery = '',
    statusFilters = [],
    frequencyTypeFilters = [],
    showHiddenContacts = false,
    showLostContacts = false,
  } = options;

  // Debounce search to avoid excessive API calls
  const [debouncedSearch, setDebouncedSearch] = useState<string>(searchQuery);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Build query params
  const queryParams = useMemo(() => {
    const params: Record<string, string> = { per_page: '200' };
    if (debouncedSearch) params.search = debouncedSearch;
    if (showHiddenContacts) params.include_hidden_contacts = 'true';
    if (showLostContacts) params.include_lost_contacts = 'true';
    return params;
  }, [debouncedSearch, showHiddenContacts, showLostContacts]);

  // Contact services query
  const contactServicesQuery = useQuery({
    queryKey: queryKeys.contactServices.list(queryParams),
    queryFn: async () => {
      const response = await contactServicesAPI.list(queryParams) as ContactServicesListResponse;
      return response?.items || [];
    },
  });

  const contactServices = contactServicesQuery.data || [];

  // Client-side filtering for multi-select status and frequency
  const filteredServices = useMemo(() => {
    let result = contactServices;

    if (statusFilters.length > 0) {
      result = result.filter((s) => {
        const status = (s as unknown as Record<string, string>).status;
        return status && statusFilters.includes(status);
      });
    }

    if (frequencyTypeFilters.length > 0) {
      result = result.filter((s) => {
        const freqType = (s as unknown as Record<string, string>).frequency_type;
        return freqType && frequencyTypeFilters.includes(freqType);
      });
    }

    return result;
  }, [contactServices, statusFilters, frequencyTypeFilters]);

  // Get unique statuses for filter dropdown
  const availableStatuses = ['pending', 'inactive', 'confirmed', 'active', 'completed'];

  // Get unique frequency types for filter dropdown
  const availableFrequencyTypes = ['one_off', 'recurring'];

  return {
    // All services (server-filtered)
    contactServices,
    // Filtered services (with client-side multi-select filtering applied)
    filteredServices,
    // State
    loading: contactServicesQuery.isLoading,
    error: contactServicesQuery.error?.message || null,
    // Filter options
    availableStatuses,
    availableFrequencyTypes,
    // Actions
    refresh: () => { contactServicesQuery.refetch(); },
  };
}
