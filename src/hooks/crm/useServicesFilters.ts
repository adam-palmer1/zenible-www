import { useState, useEffect, useCallback } from 'react';
import { usePreferences } from '../../contexts/PreferencesContext';
import { useDebouncedPreference } from '../useDebouncedPreference';

/**
 * Custom hook for managing Services tab filter state
 * Handles subtab selection and filter options for both Default Services and Client Services
 * All filter state is persisted to user preferences
 */
export function useServicesFilters() {
  const { getPreference, initialized: preferencesInitialized } = usePreferences();
  const { updatePreference: updateDebouncedPreference } = useDebouncedPreference();
  const [preferencesLoaded, setPreferencesLoaded] = useState<boolean>(false);

  // Subtab state: 'default' | 'client'
  const [activeSubtab, setActiveSubtabState] = useState<string>('default');

  // Search query (applies to both subtabs) — not persisted (transient)
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Client Services filters (multi-select)
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [frequencyTypeFilters, setFrequencyTypeFilters] = useState<string[]>([]);

  // Hidden/Lost contact toggles
  const [showHiddenClients, setShowHiddenClientsState] = useState<boolean>(false);
  const [showHiddenContacts, setShowHiddenContactsState] = useState<boolean>(false);
  const [showLostContacts, setShowLostContactsState] = useState<boolean>(false);

  // Load preferences on mount
  useEffect(() => {
    if (preferencesInitialized && !preferencesLoaded) {
      const savedSubtab = getPreference('services_active_subtab', 'default') as string;
      setActiveSubtabState(savedSubtab);

      const savedStatuses = getPreference('services_status_filter', []) as string[];
      if (Array.isArray(savedStatuses)) {
        setStatusFilters(savedStatuses);
      }

      const savedFrequency = getPreference('services_frequency_filter', []) as string[];
      if (Array.isArray(savedFrequency)) {
        setFrequencyTypeFilters(savedFrequency);
      }

      setShowHiddenClientsState(getPreference('services_show_hidden_clients', false) as boolean);
      setShowHiddenContactsState(getPreference('services_show_hidden_contacts', false) as boolean);
      setShowLostContactsState(getPreference('services_show_lost_contacts', false) as boolean);

      setPreferencesLoaded(true);
    }
  }, [preferencesInitialized, preferencesLoaded, getPreference]);

  // Handle subtab change
  const setActiveSubtab = useCallback((subtab: string): void => {
    setActiveSubtabState(subtab);
    updateDebouncedPreference('services_active_subtab', subtab, 'services').catch(err =>
      console.error('Failed to save subtab preference:', err)
    );
  }, [updateDebouncedPreference]);

  // Toggle a status in the multi-select
  const toggleStatusFilter = useCallback((status: string): void => {
    setStatusFilters(prev => {
      const newStatuses = prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status];
      updateDebouncedPreference('services_status_filter', newStatuses, 'services').catch(err =>
        console.error('Failed to save status filter preference:', err)
      );
      return newStatuses;
    });
  }, [updateDebouncedPreference]);

  const clearStatusFilters = useCallback((): void => {
    setStatusFilters([]);
    updateDebouncedPreference('services_status_filter', [], 'services').catch(err =>
      console.error('Failed to clear status filter preference:', err)
    );
  }, [updateDebouncedPreference]);

  // Toggle a frequency type in the multi-select
  const toggleFrequencyTypeFilter = useCallback((freq: string): void => {
    setFrequencyTypeFilters(prev => {
      const newFreqs = prev.includes(freq) ? prev.filter(f => f !== freq) : [...prev, freq];
      updateDebouncedPreference('services_frequency_filter', newFreqs, 'services').catch(err =>
        console.error('Failed to save frequency filter preference:', err)
      );
      return newFreqs;
    });
  }, [updateDebouncedPreference]);

  const clearFrequencyTypeFilters = useCallback((): void => {
    setFrequencyTypeFilters([]);
    updateDebouncedPreference('services_frequency_filter', [], 'services').catch(err =>
      console.error('Failed to clear frequency filter preference:', err)
    );
  }, [updateDebouncedPreference]);

  // Hidden/Lost toggles with persistence
  const setShowHiddenClients = useCallback((value: boolean): void => {
    setShowHiddenClientsState(value);
    updateDebouncedPreference('services_show_hidden_clients', value, 'services').catch(err =>
      console.error('Failed to save hidden clients preference:', err)
    );
  }, [updateDebouncedPreference]);

  const setShowHiddenContacts = useCallback((value: boolean): void => {
    setShowHiddenContactsState(value);
    updateDebouncedPreference('services_show_hidden_contacts', value, 'services').catch(err =>
      console.error('Failed to save hidden contacts preference:', err)
    );
  }, [updateDebouncedPreference]);

  const setShowLostContacts = useCallback((value: boolean): void => {
    setShowLostContactsState(value);
    updateDebouncedPreference('services_show_lost_contacts', value, 'services').catch(err =>
      console.error('Failed to save lost contacts preference:', err)
    );
  }, [updateDebouncedPreference]);

  // Clear all filters
  const clearAllFilters = useCallback((): void => {
    setSearchQuery('');
    setStatusFilters([]);
    setFrequencyTypeFilters([]);
    setShowHiddenClientsState(false);
    setShowHiddenContactsState(false);
    setShowLostContactsState(false);

    Promise.all([
      updateDebouncedPreference('services_status_filter', [], 'services'),
      updateDebouncedPreference('services_frequency_filter', [], 'services'),
      updateDebouncedPreference('services_show_hidden_clients', false, 'services'),
      updateDebouncedPreference('services_show_hidden_contacts', false, 'services'),
      updateDebouncedPreference('services_show_lost_contacts', false, 'services'),
    ]).catch(err => console.error('Failed to clear all filter preferences:', err));
  }, [updateDebouncedPreference]);

  // Count active filters (for badge display)
  const activeFilterCount: number =
    statusFilters.length +
    frequencyTypeFilters.length +
    (showHiddenClients ? 1 : 0) +
    (showHiddenContacts ? 1 : 0) +
    (showLostContacts ? 1 : 0);

  return {
    // Subtab
    activeSubtab,
    setActiveSubtab,

    // Search
    searchQuery,
    setSearchQuery,

    // Client Services filters (multi-select)
    statusFilters,
    toggleStatusFilter,
    clearStatusFilters,
    frequencyTypeFilters,
    toggleFrequencyTypeFilter,
    clearFrequencyTypeFilters,

    // Hidden/Lost toggles
    showHiddenClients,
    setShowHiddenClients,
    showHiddenContacts,
    setShowHiddenContacts,
    showLostContacts,
    setShowLostContacts,

    // Utils
    activeFilterCount,
    clearAllFilters,
  };
}
