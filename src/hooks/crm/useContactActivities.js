import { useState, useCallback } from 'react';
import { contactsAPI } from '../../services/api/crm';

/**
 * Custom hook for managing contact activities/timeline
 * Handles loading contact activity history
 *
 * @param {string} contactId - The contact ID
 * @returns {Object} Activities state and methods
 */
export function useContactActivities(contactId) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    total_pages: 0,
  });

  // Fetch activities for contact
  const fetchActivities = useCallback(async (params = {}) => {
    if (!contactId) return;

    try {
      setLoading(true);
      setError(null);

      const mergedParams = {
        page: pagination.page,
        per_page: pagination.per_page,
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
    } catch (err) {
      console.error('[useContactActivities] Failed to fetch activities:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contactId, pagination.page, pagination.per_page]);

  // Load more activities
  const loadMore = useCallback(() => {
    if (pagination.page < pagination.total_pages) {
      fetchActivities({ page: pagination.page + 1 });
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
