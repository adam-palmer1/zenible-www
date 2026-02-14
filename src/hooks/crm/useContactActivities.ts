import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { contactsAPI } from '../../services/api/crm';
import { queryKeys } from '../../lib/query-keys';
import type { ContactTimelineResponse, ContactActivityResponse } from '../../types';

interface Pagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

/**
 * Custom hook for managing contact activities/timeline
 * Uses React Query for caching and automatic refetching
 */
export function useContactActivities(contactId: string | undefined) {
  const queryClient = useQueryClient();

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    per_page: 20,
    total: 0,
    total_pages: 0,
  });

  const queryParams = { page: String(pagination.page), per_page: String(pagination.per_page) };

  // Activities query
  const activitiesQuery = useQuery({
    queryKey: [...queryKeys.contactActivities.byContact(contactId!), { queryParams }],
    queryFn: () => contactsAPI.getTimeline(contactId!, queryParams),
    enabled: !!contactId,
  });

  // Update pagination from response
  const response = activitiesQuery.data;
  if (response && (pagination.total !== response.total || pagination.total_pages !== response.total_pages)) {
    setPagination(prev => ({
      ...prev,
      page: response.page,
      per_page: response.per_page,
      total: response.total,
      total_pages: response.total_pages,
    }));
  }

  const activities = response?.items || [];

  // Fetch activities (backwards-compatible imperative call)
  const fetchActivities = useCallback(async (params: Record<string, string> = {}): Promise<ContactTimelineResponse | void> => {
    if (!contactId) return;
    if (params.page) {
      setPagination(prev => ({ ...prev, page: parseInt(params.page, 10) }));
    } else {
      await queryClient.invalidateQueries({ queryKey: queryKeys.contactActivities.byContact(contactId) });
    }
    return activitiesQuery.data;
  }, [queryClient, contactId, activitiesQuery.data]);

  // Load more activities
  const loadMore = useCallback((): void => {
    if (pagination.page < pagination.total_pages) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
    }
  }, [pagination.page, pagination.total_pages]);

  return {
    activities,
    loading: activitiesQuery.isLoading,
    error: activitiesQuery.error?.message || null,
    pagination,
    fetchActivities,
    loadMore,
  };
}
