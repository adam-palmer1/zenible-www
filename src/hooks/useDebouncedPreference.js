import { useCallback, useRef, useEffect } from 'react';
import { usePreferences } from '../contexts/PreferencesContext';

/**
 * Hook for debounced preference updates
 * Reduces API calls by batching rapid preference changes
 *
 * @param {number} delay - Debounce delay in milliseconds (default: 500ms)
 * @returns {Object} - updatePreference function and pending state
 */
export function useDebouncedPreference(delay = 500) {
  const { updatePreference: originalUpdatePreference, setPreferences } = usePreferences();
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

  const updatePreference = useCallback(async (key, value, category = null) => {
    // Store the update
    pendingUpdatesRef.current.set(key, { value, category });

    // Update local state immediately (optimistic update)
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout to batch updates
    timeoutRef.current = setTimeout(async () => {
      const updates = Array.from(pendingUpdatesRef.current.entries());
      pendingUpdatesRef.current.clear();

      // Send all pending updates to server
      for (const [updateKey, { value: updateValue, category: updateCategory }] of updates) {
        try {
          await originalUpdatePreference(updateKey, updateValue, updateCategory);
        } catch (error) {
          console.error(`Failed to update preference ${updateKey}:`, error);
        }
      }
    }, delay);
  }, [delay, originalUpdatePreference, setPreferences]);

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
        await originalUpdatePreference(updateKey, value, category);
      } catch (error) {
        console.error(`Failed to update preference ${updateKey}:`, error);
      }
    }
  }, [originalUpdatePreference]);

  return {
    updatePreference,
    hasPendingUpdates,
    flushUpdates
  };
}
