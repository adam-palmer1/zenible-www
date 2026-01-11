import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { usePreferences } from '../../contexts/PreferencesContext';

// Define available columns outside hook to prevent recreation
const AVAILABLE_COLUMNS = [
  { key: 'name', label: 'Name', locked: true },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'business_name', label: 'Company' },
  { key: 'services_count', label: 'Services' },
  { key: 'one_off_total', label: 'One-off Total' },
  { key: 'recurring_total', label: 'Recurring Total' },
  { key: 'amount_outstanding', label: 'Amount Outstanding' },
  { key: 'total_billed', label: 'Total Billed' },
  { key: 'client_since', label: 'Client Since' },
  { key: 'actions', label: 'Actions', locked: true },
];

/**
 * Custom hook to manage Clients tab filter state
 * Shared between CRMDashboard (for rendering filters) and ClientsView (for filtering data)
 */
export const useClientsFilters = () => {
  const { preferences, updatePreference } = usePreferences();
  const initialMount = useRef(true);
  const columnSelectorRef = useRef(null);

  // Memoize default visible columns to prevent recreation
  const defaultVisibleColumns = useMemo(() => {
    if (preferences?.clients_visible_columns) {
      return preferences.clients_visible_columns;
    }
    return {
      name: true,
      email: true,
      phone: false,
      business_name: true,
      services_count: true,
      amount_outstanding: true,
      one_off_total: true,
      recurring_total: true,
      total_billed: false,
      client_since: true,
      actions: true,
    };
  }, []); // Empty deps - only calculate once on mount

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState(() => preferences?.clients_sort_order || 'newest');
  const [showHiddenClients, setShowHiddenClients] = useState(() => preferences?.clients_show_hidden || false);
  const [visibleColumns, setVisibleColumns] = useState(defaultVisibleColumns);
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  // Save column visibility to preferences (skip on initial mount)
  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }

    const saveColumnPreferences = async () => {
      try {
        await updatePreference('clients_visible_columns', visibleColumns, 'crm');
      } catch (error) {
        console.error('Failed to save column preferences:', error);
      }
    };

    saveColumnPreferences();
  }, [visibleColumns]); // Remove updatePreference from deps

  // Close column selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (columnSelectorRef.current && !columnSelectorRef.current.contains(event.target)) {
        setShowColumnSelector(false);
      }
    };

    if (showColumnSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showColumnSelector]);

  const handleSortChange = useCallback(async (sortOrder) => {
    setSelectedSort(sortOrder);
    try {
      await updatePreference('clients_sort_order', sortOrder, 'crm');
    } catch (error) {
      console.error('Failed to save sort preference:', error);
    }
  }, [updatePreference]);

  const handleShowHiddenToggle = useCallback(async (value) => {
    setShowHiddenClients(value);
    try {
      await updatePreference('clients_show_hidden', value, 'crm');
    } catch (error) {
      console.error('Failed to save show hidden preference:', error);
    }
  }, [updatePreference]);

  const toggleColumnVisibility = useCallback((columnKey) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  }, []);

  return {
    // State
    searchQuery,
    selectedSort,
    showHiddenClients,
    visibleColumns,
    showColumnSelector,
    availableColumns: AVAILABLE_COLUMNS,
    columnSelectorRef,

    // Handlers
    setSearchQuery,
    handleSortChange,
    handleShowHiddenToggle,
    toggleColumnVisibility,
    setShowColumnSelector,
  };
};
