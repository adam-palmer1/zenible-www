import { useState, useEffect, useCallback } from 'react';
import { usePreferences } from '../../contexts/PreferencesContext';
import { useDebouncedPreference } from '../useDebouncedPreference';

/**
 * Hook to manage projects filter state
 * Handles status filtering with preference persistence
 */
export function useProjectsFilters() {
  const { getPreference } = usePreferences();
  const { updatePreference: updateDebouncedPreference } = useDebouncedPreference();
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [preferencesLoaded, setPreferencesLoaded] = useState<boolean>(false);

  // Load status filter from preferences
  useEffect(() => {
    if (!preferencesLoaded) {
      const savedStatuses = getPreference('projects_status_filter', []) as string[];
      setSelectedStatuses(savedStatuses);
      setPreferencesLoaded(true);
    }
  }, [getPreference, preferencesLoaded]);

  // Handle status toggle
  const handleStatusToggle = useCallback(async (status: string): Promise<void> => {
    const newStatuses = selectedStatuses.includes(status)
      ? selectedStatuses.filter(s => s !== status)
      : [...selectedStatuses, status];

    setSelectedStatuses(newStatuses);

    // Save to backend preferences
    try {
      await updateDebouncedPreference('projects_status_filter', newStatuses, 'projects');
    } catch (error) {
      console.error('Failed to save status filter preference:', error);
    }
  }, [selectedStatuses, updateDebouncedPreference]);

  // Clear all statuses
  const handleClearStatuses = useCallback(async (): Promise<void> => {
    setSelectedStatuses([]);
    try {
      await updateDebouncedPreference('projects_status_filter', [], 'projects');
    } catch (error) {
      console.error('Failed to clear status filter preference:', error);
    }
  }, [updateDebouncedPreference]);

  return {
    selectedStatuses,
    handleStatusToggle,
    handleClearStatuses,
    preferencesLoaded,
  };
}
