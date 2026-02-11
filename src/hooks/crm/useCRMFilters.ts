import { useState, useEffect, useMemo, useCallback } from 'react';
import { usePreferences } from '../../contexts/PreferencesContext';
import { useDebouncedPreference } from '../useDebouncedPreference';

/**
 * Hook for managing CRM filter state and persistence
 *
 * Consolidates all filter-related logic from CRMDashboard:
 * - Selected statuses filter
 * - Show hidden contacts toggle
 * - Sort order selection
 * - Preference loading/saving
 * - Filtered contacts computation
 *
 * Replaces ~200 lines of filter management code in CRMDashboard
 */
export function useCRMFilters(contacts: any[] = [], baseFilters: Record<string, unknown> = {}, availableStatusIds: string[] = []) {
  const { getPreference, initialized: preferencesInitialized } = usePreferences();
  const { updatePreference: updateDebouncedPreference } = useDebouncedPreference(500);

  // Filter state
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<string | null>(null); // null | 'high_to_low' | 'low_to_high' | 'follow_up_date'
  const [columnOrder, setColumnOrder] = useState<string[]>([]); // Array of status IDs for column ordering
  const [filtersLoaded, setFiltersLoaded] = useState<boolean>(false);

  // Load filter preferences on mount
  useEffect(() => {
    if (preferencesInitialized && !filtersLoaded) {
      // Load selected statuses
      const savedStatuses = getPreference('crm_status', []) as string[];
      if (Array.isArray(savedStatuses) && savedStatuses.length > 0) {
        setSelectedStatuses(savedStatuses);
      }

      // Load showHidden preference
      const savedShowHidden = getPreference('crm_show_hidden', false) as boolean;
      setShowHidden(savedShowHidden);

      // Load sortOrder preference
      const savedSortOrder = getPreference('crm_sort_order', null) as string | null;
      setSortOrder(savedSortOrder);

      // Load columnOrder preference
      const savedColumnOrder = getPreference('crm_column_order', []) as string[];
      if (Array.isArray(savedColumnOrder)) {
        setColumnOrder(savedColumnOrder);
      }

      setFiltersLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferencesInitialized, filtersLoaded]);

  // Clean up stale status IDs that no longer exist
  useEffect(() => {
    if (filtersLoaded && availableStatusIds.length > 0 && selectedStatuses.length > 0) {
      const validStatuses = selectedStatuses.filter(id => availableStatusIds.includes(id));
      if (validStatuses.length !== selectedStatuses.length) {
        setSelectedStatuses(validStatuses);
        updateDebouncedPreference('crm_status', validStatuses, 'crm').catch(err =>
          console.error('[useCRMFilters] Failed to clean up stale status IDs:', err)
        );
      }
    }
  }, [filtersLoaded, availableStatusIds]); // eslint-disable-line react-hooks/exhaustive-deps

  // Build contact filters for CRM tab
  // - has_crm_status=true: Only fetch contacts that have been assigned to the CRM pipeline
  // - is_hidden: Server-side filtering for hidden contacts
  const contactFilters = useMemo(() => ({
    ...baseFilters,
    has_crm_status: true,  // Only get contacts in the CRM pipeline
    per_page: 100,         // Use server-side pagination
    ...(showHidden ? {} : { is_hidden_crm: false }),  // Exclude hidden unless toggled
  }), [baseFilters, showHidden]);

  // Filter contacts by selected statuses
  const filteredContacts = useMemo(() => {
    if (selectedStatuses.length === 0) {
      return contacts;
    }

    return contacts.filter((contact: any) => {
      const contactStatusId = contact.current_global_status_id || contact.current_custom_status_id;
      return selectedStatuses.includes(contactStatusId);
    });
  }, [contacts, selectedStatuses]);

  // Count active filters
  const activeFilterCount = useMemo((): number => {
    let count = 0;
    if (selectedStatuses.length > 0) count++;
    if (showHidden) count++;
    if (sortOrder) count++;
    return count;
  }, [selectedStatuses, showHidden, sortOrder]);

  // Actions
  const handleStatusToggle = useCallback(async (statusId: string): Promise<void> => {
    const newStatuses = selectedStatuses.includes(statusId)
      ? selectedStatuses.filter(id => id !== statusId)
      : [...selectedStatuses, statusId];

    setSelectedStatuses(newStatuses);

    // Save to backend preferences (debounced)
    try {
      await updateDebouncedPreference('crm_status', newStatuses, 'crm');
    } catch (error) {
      console.error('[useCRMFilters] Failed to save status filter:', error);
    }
  }, [selectedStatuses, updateDebouncedPreference]);

  const handleClearStatuses = useCallback(async (): Promise<void> => {
    setSelectedStatuses([]);
    try {
      await updateDebouncedPreference('crm_status', [], 'crm');
    } catch (error) {
      console.error('[useCRMFilters] Failed to clear status filter:', error);
    }
  }, [updateDebouncedPreference]);

  const handleShowHiddenToggle = useCallback(async (checked: boolean): Promise<void> => {
    setShowHidden(checked);
    try {
      await updateDebouncedPreference('crm_show_hidden', checked, 'crm');
    } catch (error) {
      console.error('[useCRMFilters] Failed to save show hidden preference:', error);
    }
  }, [updateDebouncedPreference]);

  const handleSortOrderChange = useCallback(async (order: string | null): Promise<void> => {
    setSortOrder(order);
    try {
      await updateDebouncedPreference('crm_sort_order', order, 'crm');
    } catch (error) {
      console.error('[useCRMFilters] Failed to save sort order preference:', error);
    }
  }, [updateDebouncedPreference]);

  const clearAllFilters = useCallback(async (): Promise<void> => {
    setSelectedStatuses([]);
    setShowHidden(false);
    setSortOrder(null);

    try {
      await Promise.all([
        updateDebouncedPreference('crm_status', [], 'crm'),
        updateDebouncedPreference('crm_show_hidden', false, 'crm'),
        updateDebouncedPreference('crm_sort_order', null, 'crm'),
      ]);
    } catch (error) {
      console.error('[useCRMFilters] Failed to clear all filters:', error);
    }
  }, [updateDebouncedPreference]);

  const handleColumnReorder = useCallback(async (newOrder: string[]): Promise<void> => {
    setColumnOrder(newOrder);
    try {
      await updateDebouncedPreference('crm_column_order', newOrder, 'crm');
    } catch (error) {
      console.error('[useCRMFilters] Failed to save column order:', error);
    }
  }, [updateDebouncedPreference]);

  return {
    // State
    selectedStatuses,
    showHidden,
    sortOrder,
    columnOrder,
    filtersLoaded,

    // Computed
    contactFilters,
    filteredContacts,
    activeFilterCount,

    // Actions
    handleStatusToggle,
    handleClearStatuses,
    handleShowHiddenToggle,
    handleSortOrderChange,
    handleColumnReorder,
    clearAllFilters,
    setSelectedStatuses,
    setShowHidden,
    setSortOrder,
    setColumnOrder,
  };
}
