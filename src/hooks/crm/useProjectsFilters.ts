import { useState, useEffect, useCallback } from 'react';
import { usePreferences } from '../../contexts/PreferencesContext';
import { useDebouncedPreference } from '../useDebouncedPreference';

/**
 * Hook to manage projects filter state
 * Handles status filtering and hidden/lost toggles with preference persistence
 */
export function useProjectsFilters() {
  const { getPreference, initialized: preferencesInitialized } = usePreferences();
  const { updatePreference: updateDebouncedPreference } = useDebouncedPreference();
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [preferencesLoaded, setPreferencesLoaded] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Hidden/Lost contact toggles
  const [showHiddenContacts, setShowHiddenContactsState] = useState<boolean>(false);
  const [showLostContacts, setShowLostContactsState] = useState<boolean>(false);

  // Load all filter preferences on mount
  useEffect(() => {
    if (preferencesInitialized && !preferencesLoaded) {
      const savedStatuses = getPreference('projects_status_filter', []) as string[];
      setSelectedStatuses(savedStatuses);

      setShowHiddenContactsState(getPreference('projects_show_hidden_contacts', false) as boolean);
      setShowLostContactsState(getPreference('projects_show_lost_contacts', false) as boolean);

      setPreferencesLoaded(true);
    }
  }, [getPreference, preferencesInitialized, preferencesLoaded]);

  // Handle status toggle
  const handleStatusToggle = useCallback(async (status: string): Promise<void> => {
    const newStatuses = selectedStatuses.includes(status)
      ? selectedStatuses.filter(s => s !== status)
      : [...selectedStatuses, status];

    setSelectedStatuses(newStatuses);

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

  // Hidden/Lost toggles with persistence
  const setShowHiddenContacts = useCallback((value: boolean): void => {
    setShowHiddenContactsState(value);
    updateDebouncedPreference('projects_show_hidden_contacts', value, 'projects').catch(err =>
      console.error('Failed to save hidden contacts preference:', err)
    );
  }, [updateDebouncedPreference]);

  const setShowLostContacts = useCallback((value: boolean): void => {
    setShowLostContactsState(value);
    updateDebouncedPreference('projects_show_lost_contacts', value, 'projects').catch(err =>
      console.error('Failed to save lost contacts preference:', err)
    );
  }, [updateDebouncedPreference]);

  // Count active filters (for badge display)
  const activeFilterCount: number =
    (showHiddenContacts ? 1 : 0) +
    (showLostContacts ? 1 : 0);

  return {
    selectedStatuses,
    handleStatusToggle,
    handleClearStatuses,
    preferencesLoaded,
    searchQuery,
    setSearchQuery,
    // Hidden/Lost toggles
    showHiddenContacts,
    setShowHiddenContacts,
    showLostContacts,
    setShowLostContacts,
    // Utils
    activeFilterCount,
  };
}
