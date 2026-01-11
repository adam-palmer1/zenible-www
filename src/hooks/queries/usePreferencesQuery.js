import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import adminAPI from '../../services/adminAPI';
import { queryKeys } from '../../lib/query-keys';

/**
 * React Query hook for fetching user preferences
 *
 * Benefits over old PreferencesContext:
 * - Automatic caching (no manual state management)
 * - Single source of truth (eliminates race conditions)
 * - Automatic refetch on window focus
 * - No complex loading/initialized state tracking
 *
 * @param {Object} options - React Query options
 * @returns {Object} Query result with preferences data
 */
export function usePreferencesQuery(options = {}) {
  return useQuery({
    queryKey: queryKeys.preferences.user(),
    queryFn: async () => {
      console.log('[usePreferencesQuery] Fetching preferences from API...');
      const data = await adminAPI.getPreferencesDict();
      console.log('[usePreferencesQuery] Preferences fetched:', data);
      return data || {};
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (preferences change infrequently)
    gcTime: 30 * 60 * 1000, // 30 minutes
    // Always run this query (preferences are needed app-wide)
    enabled: true,
    // Retry on error (preferences are critical)
    retry: 2,
    ...options,
  });
}

/**
 * Hook to get preferences with helper functions
 * Drop-in replacement for old usePreferences() context hook
 *
 * @returns {Object} Preferences data and helper functions
 */
export function usePreferences() {
  const query = usePreferencesQuery();

  // Get specific preference with default value
  const getPreference = useCallback((key, defaultValue = null) => {
    if (!query.data) return defaultValue;
    return query.data[key] !== undefined ? query.data[key] : defaultValue;
  }, [query.data]);

  // Get dark mode state
  const darkMode = (() => {
    const themePrefs = query.data?.theme || {};
    return themePrefs.mode === 'dark' || themePrefs.darkMode === true;
  })();

  // CRM-specific preference helpers
  const getCRMFilters = useCallback(() => {
    return {
      search: getPreference('crm_search', ''),
      is_client: getPreference('crm_filter_is_client', null),
      is_vendor: getPreference('crm_filter_is_vendor', null),
      global_status_id: getPreference('crm_filter_status', null),
      is_active: getPreference('crm_filter_is_active', true),
      sort_by: getPreference('crm_sort_by', 'created_at_desc'),
    };
  }, [getPreference]);

  return {
    preferences: query.data || {},
    loading: query.isLoading,
    initialized: query.isSuccess || query.isError, // Considered initialized after first fetch
    darkMode,
    getPreference,
    getCRMFilters,
    // Expose query methods
    refetch: query.refetch,
    isError: query.isError,
    error: query.error,
  };
}

/**
 * Hook to get CRM-specific preferences
 * More efficient than usePreferences when only CRM prefs are needed
 *
 * @returns {Object} CRM filters and helpers
 */
export function useCRMPreferences() {
  const { getCRMFilters, getPreference } = usePreferences();

  return {
    filters: getCRMFilters(),
    viewMode: getPreference('crm_view_mode', 'pipeline'),
    showHidden: getPreference('crm_show_hidden', false),
    sortOrder: getPreference('crm_sort_order', null),
  };
}
