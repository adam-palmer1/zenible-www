import { useState, useCallback } from 'react';
import { contactsAPI } from '../../services/api/crm';
import type { ContactTimelineResponse, ContactActivityResponse } from '../../types';

interface Pagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

/**
 * Custom hook for managing contact activities/timeline
 * Handles loading contact activity history
 */
export function useContactActivities(contactId: string | undefined) {
  const [activities, setActivities] = useState<ContactActivityResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    per_page: 20,
    total: 0,
    total_pages: 0,
  });

  // Fetch activities for contact
  const fetchActivities = useCallback(async (params: Record<string, string> = {}): Promise<ContactTimelineResponse | void> => {
    if (!contactId) return;

    try {
      setLoading(true);
      setError(null);

      const mergedParams: Record<string, string> = {
        page: String(pagination.page),
        per_page: String(pagination.per_page),
        ...params,
      };

      const response = await contactsAPI.getTimeline(contactId, mergedParams);

      setActivities(response.items || []);
      setPagination({
        page: response.page,
        per_page: response.per_page,
        total: response.total,
        total_pages: response.total_pages,
      });

      return response;
    } catch (err: unknown) {
      console.error('[useContactActivities] Failed to fetch activities:', err);
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contactId, pagination.page, pagination.per_page]);

  // Load more activities
  const loadMore = useCallback((): void => {
    if (pagination.page < pagination.total_pages) {
      fetchActivities({ page: String(pagination.page + 1) });
    }
  }, [fetchActivities, pagination.page, pagination.total_pages]);

  return {
    activities,
    loading,
    error,
    pagination,
    fetchActivities,
    loadMore,
  };
}
