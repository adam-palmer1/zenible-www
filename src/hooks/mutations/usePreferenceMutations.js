import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useCallback, useEffect } from 'react';
import adminAPI from '../../services/adminAPI';
import { queryKeys } from '../../lib/query-keys';

/**
 * Mutation hook for updating a single preference
 *
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object
 */
export function useUpdatePreferenceMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value, category = null }) => {
      return await adminAPI.setPreference(key, {
        preference_value: value,
        category,
      });
    },
    onMutate: async ({ key, value }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(queryKeys.preferences.user());

      // Snapshot previous value
      const previous = queryClient.getQueryData(queryKeys.preferences.user());

      // Optimistically update
      queryClient.setQueryData(queryKeys.preferences.user(), (old) => ({
        ...old,
        [key]: value,
      }));

      return { previous, key };
    },
    onError: (error, variables, context) => {
      console.error('[useUpdatePreferenceMutation] Failed:', error);

      // Rollback
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.preferences.user(), context.previous);
      }

      if (options.onError) {
        options.onError(error);
      }
    },
    onSuccess: (data, variables) => {
      if (options.onSuccess) {
        options.onSuccess(data, variables);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries(queryKeys.preferences.user());

      if (options.onSettled) {
        options.onSettled();
      }
    },
  });
}

/**
 * Mutation hook for bulk updating preferences
 *
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object
 */
export function useBulkUpdatePreferencesMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ preferences, replaceAll = false }) => {
      return await adminAPI.bulkSetPreferences({
        preferences: preferences.map(({ key, value, category }) => ({
          key,
          value,
          category: category || null,
        })),
        replace_all: replaceAll,
      });
    },
    onMutate: async ({ preferences }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(queryKeys.preferences.user());

      // Snapshot previous value
      const previous = queryClient.getQueryData(queryKeys.preferences.user());

      // Optimistically update all preferences
      queryClient.setQueryData(queryKeys.preferences.user(), (old) => {
        const updated = { ...old };
        preferences.forEach(({ key, value }) => {
          updated[key] = value;
        });
        return updated;
      });

      return { previous };
    },
    onError: (error, variables, context) => {
      console.error('[useBulkUpdatePreferencesMutation] Failed:', error);

      // Rollback
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.preferences.user(), context.previous);
      }

      if (options.onError) {
        options.onError(error);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries(queryKeys.preferences.user());

      if (options.onSettled) {
        options.onSettled();
      }
    },
  });
}

/**
 * Mutation hook for deleting a preference
 *
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object
 */
export function useDeletePreferenceMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (key) => {
      await adminAPI.deletePreference(key);
      return key;
    },
    onMutate: async (key) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(queryKeys.preferences.user());

      // Snapshot previous value
      const previous = queryClient.getQueryData(queryKeys.preferences.user());

      // Optimistically remove preference
      queryClient.setQueryData(queryKeys.preferences.user(), (old) => {
        const updated = { ...old };
        delete updated[key];
        return updated;
      });

      return { previous, key };
    },
    onError: (error, key, context) => {
      console.error('[useDeletePreferenceMutation] Failed:', error);

      // Rollback
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.preferences.user(), context.previous);
      }

      if (options.onError) {
        options.onError(error);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries(queryKeys.preferences.user());

      if (options.onSettled) {
        options.onSettled();
      }
    },
  });
}

/**
 * Hook for debounced preference updates
 * Replaces useDebouncedPreference hook
 *
 * Features:
 * - Built-in debouncing (500ms default)
 * - Optimistic updates
 * - Automatic batching
 * - Flush function for immediate persistence
 *
 * @param {number} delay - Debounce delay in milliseconds (default: 500ms)
 * @returns {Object} Update functions and state
 */
export function useDebouncedPreferenceMutation(delay = 500) {
  const updateMutation = useUpdatePreferenceMutation();
  const timeoutRef = useRef(null);
  const pendingUpdatesRef = useRef(new Map());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const updatePreference = useCallback((key, value, category = null) => {
    // Store the update
    pendingUpdatesRef.current.set(key, { value, category });

    // Immediately update cache (optimistic)
    updateMutation.mutate({ key, value, category }, {
      // Don't persist to server yet (will be debounced)
      onSuccess: () => {},
      onError: () => {},
    });

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout to persist updates
    timeoutRef.current = setTimeout(async () => {
      const updates = Array.from(pendingUpdatesRef.current.entries());
      pendingUpdatesRef.current.clear();

      // Persist all pending updates
      for (const [updateKey, { value: updateValue, category: updateCategory }] of updates) {
        try {
          await updateMutation.mutateAsync({
            key: updateKey,
            value: updateValue,
            category: updateCategory,
          });
        } catch (error) {
          console.error(`Failed to persist preference ${updateKey}:`, error);
        }
      }
    }, delay);
  }, [delay, updateMutation]);

  const hasPendingUpdates = useCallback(() => {
    return pendingUpdatesRef.current.size > 0;
  }, []);

  const flushUpdates = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const updates = Array.from(pendingUpdatesRef.current.entries());
    pendingUpdatesRef.current.clear();

    for (const [updateKey, { value, category }] of updates) {
      try {
        await updateMutation.mutateAsync({
          key: updateKey,
          value,
          category,
        });
      } catch (error) {
        console.error(`Failed to persist preference ${updateKey}:`, error);
      }
    }
  }, [updateMutation]);

  return {
    updatePreference,
    hasPendingUpdates,
    flushUpdates,
    isLoading: updateMutation.isLoading,
    isError: updateMutation.isError,
    error: updateMutation.error,
  };
}

/**
 * Hook for updating CRM filters in preferences
 * Convenience wrapper for bulk updates
 *
 * @returns {Object} Mutation for updating CRM filters
 */
export function useUpdateCRMFiltersMutation(options = {}) {
  const bulkMutation = useBulkUpdatePreferencesMutation(options);

  const updateCRMFilters = useCallback((filters) => {
    const updates = [
      { key: 'crm_search', value: filters.search || '', category: 'crm' },
      { key: 'crm_filter_is_client', value: filters.is_client, category: 'crm' },
      { key: 'crm_filter_is_vendor', value: filters.is_vendor, category: 'crm' },
      { key: 'crm_filter_status', value: filters.global_status_id, category: 'crm' },
      { key: 'crm_filter_is_active', value: filters.is_active, category: 'crm' },
      { key: 'crm_sort_by', value: filters.sort_by || 'created_at_desc', category: 'crm' },
    ];

    return bulkMutation.mutate({ preferences: updates });
  }, [bulkMutation]);

  return {
    ...bulkMutation,
    updateCRMFilters,
  };
}

/**
 * Hook for toggling dark mode
 * Convenience wrapper for theme preference
 *
 * @returns {Function} Toggle function
 */
export function useToggleDarkModeMutation(options = {}) {
  const queryClient = useQueryClient();
  const updateMutation = useUpdatePreferenceMutation(options);

  const toggleDarkMode = useCallback(() => {
    const currentPrefs = queryClient.getQueryData(queryKeys.preferences.user());
    const currentTheme = currentPrefs?.theme || {};
    const currentDarkMode = currentTheme.mode === 'dark' || currentTheme.darkMode === true;
    const newDarkMode = !currentDarkMode;

    updateMutation.mutate({
      key: 'theme',
      value: {
        ...currentTheme,
        mode: newDarkMode ? 'dark' : 'light',
        darkMode: newDarkMode,
      },
      category: 'ui',
    });
  }, [queryClient, updateMutation]);

  return {
    ...updateMutation,
    toggleDarkMode,
  };
}
