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
 *
 * @param {Array} contacts - All contacts
 * @param {Object} baseFilters - Base filters from CRMContext
 * @returns {Object} Filter state and actions
 */
export function useCRMFilters(contacts = [], baseFilters = {}) {
  const { getPreference, initialized: preferencesInitialized } = usePreferences();
  const { updatePreference: updateDebouncedPreference } = useDebouncedPreference(500);

  // Filter state
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [showHidden, setShowHidden] = useState(false);
  const [sortOrder, setSortOrder] = useState(null); // null | 'high_to_low' | 'low_to_high' | 'follow_up_date'
  const [columnOrder, setColumnOrder] = useState([]); // Array of status IDs for column ordering
  const [filtersLoaded, setFiltersLoaded] = useState(false);

  // Load filter preferences on mount
  useEffect(() => {
    if (preferencesInitialized && !filtersLoaded) {
      // Load selected statuses
      const savedStatuses = getPreference('crm_status', []);
      if (Array.isArray(savedStatuses) && savedStatuses.length > 0) {
        setSelectedStatuses(savedStatuses);
      }

      // Load showHidden preference
      const savedShowHidden = getPreference('crm_show_hidden', false);
      setShowHidden(savedShowHidden);

      // Load sortOrder preference
      const savedSortOrder = getPreference('crm_sort_order', null);
      setSortOrder(savedSortOrder);

      // Load columnOrder preference
      const savedColumnOrder = getPreference('crm_column_order', []);
      if (Array.isArray(savedColumnOrder)) {
        setColumnOrder(savedColumnOrder);
      }

      setFiltersLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferencesInitialized, filtersLoaded]);

  // Build contact filters for CRM tab
  // - has_crm_status=true: Only fetch contacts that have been assigned to the CRM pipeline
  //   (have a global or custom status). This excludes vendor-only contacts.
  // - Note: We don't send is_hidden to the API because the backend does strict matching.
  //   Hidden contact filtering is done client-side in CRMDashboard.jsx
  const contactFilters = useMemo(() => ({
    ...baseFilters,
    has_crm_status: true,  // Only get contacts in the CRM pipeline
    per_page: 500,         // Get all CRM contacts (pipeline needs all to display columns)
  }), [baseFilters]);

  // Filter contacts by selected statuses
  const filteredContacts = useMemo(() => {
    if (selectedStatuses.length === 0) {
      return contacts;
    }

    return contacts.filter(contact => {
      const contactStatusId = contact.current_global_status_id || contact.current_custom_status_id;
      return selectedStatuses.includes(contactStatusId);
    });
  }, [contacts, selectedStatuses]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedStatuses.length > 0) count++;
    if (showHidden) count++;
    if (sortOrder) count++;
    return count;
  }, [selectedStatuses, showHidden, sortOrder]);

  // Actions
  const handleStatusToggle = useCallback(async (statusId) => {
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

  const handleClearStatuses = useCallback(async () => {
    setSelectedStatuses([]);
    try {
      await updateDebouncedPreference('crm_status', [], 'crm');
    } catch (error) {
      console.error('[useCRMFilters] Failed to clear status filter:', error);
    }
  }, [updateDebouncedPreference]);

  const handleShowHiddenToggle = useCallback(async (checked) => {
    setShowHidden(checked);
    try {
      await updateDebouncedPreference('crm_show_hidden', checked, 'crm');
    } catch (error) {
      console.error('[useCRMFilters] Failed to save show hidden preference:', error);
    }
  }, [updateDebouncedPreference]);

  const handleSortOrderChange = useCallback(async (order) => {
    setSortOrder(order);
    try {
      await updateDebouncedPreference('crm_sort_order', order, 'crm');
    } catch (error) {
      console.error('[useCRMFilters] Failed to save sort order preference:', error);
    }
  }, [updateDebouncedPreference]);

  const clearAllFilters = useCallback(async () => {
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

  const handleColumnReorder = useCallback(async (newOrder) => {
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
