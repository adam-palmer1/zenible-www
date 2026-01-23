import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { usePreferences } from '../../contexts/PreferencesContext';

// Define available columns for vendors
const AVAILABLE_COLUMNS = [
  { key: 'name', label: 'Vendor', locked: true },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'business_name', label: 'Company' },
  { key: 'expenses_paid', label: 'Expenses Paid' },
  { key: 'expenses_outstanding', label: 'Outstanding' },
  { key: 'vendor_since', label: 'Vendor Since' },
  { key: 'actions', label: 'Actions', locked: true },
];

/**
 * Custom hook to manage Vendors tab filter state
 * Shared between CRMDashboard (for rendering filters) and VendorsView (for filtering data)
 */
export const useVendorsFilters = () => {
  const { preferences, updatePreference, initialized: preferencesInitialized } = usePreferences();
  const columnSelectorRef = useRef(null);
  const [isReadyToSave, setIsReadyToSave] = useState(false);
  const hasInitializedFromPrefs = useRef(false);
  const lastSavedColumns = useRef(null);

  // Memoize default visible columns
  const defaultVisibleColumns = useMemo(() => ({
    name: true,
    email: true,
    phone: false,
    business_name: false,
    expenses_paid: true,
    expenses_outstanding: true,
    vendor_since: true,
    actions: true,
  }), []);

  const [searchQuery, setSearchQuery] = useState('');
  // Sort state: field name and direction (asc/desc)
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showHiddenVendors, setShowHiddenVendors] = useState(false);
  // Show in preferred currency (default true - when false, preserve_currencies=true is sent to API)
  const [showPreferredCurrency, setShowPreferredCurrency] = useState(true);
  const [visibleColumns, setVisibleColumns] = useState(defaultVisibleColumns);
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  // Initialize state from preferences ONCE when they first load
  useEffect(() => {
    if (preferencesInitialized && !hasInitializedFromPrefs.current) {
      hasInitializedFromPrefs.current = true;

      // Load visible columns from preferences or use defaults
      let columnsToSet = preferences?.vendors_visible_columns || defaultVisibleColumns;
      setVisibleColumns(columnsToSet);
      lastSavedColumns.current = JSON.stringify(columnsToSet);

      // Load sort preferences
      if (preferences?.vendors_sort_field) {
        setSortField(preferences.vendors_sort_field);
      }
      if (preferences?.vendors_sort_direction) {
        setSortDirection(preferences.vendors_sort_direction);
      }

      // Load filter preferences
      if (preferences?.vendors_show_hidden !== undefined) {
        setShowHiddenVendors(preferences.vendors_show_hidden);
      }
      // Default to true (ON) if preference is not set
      const preferredCurrencyPref = preferences?.vendors_show_preferred_currency;
      setShowPreferredCurrency(preferredCurrencyPref !== undefined ? preferredCurrencyPref : true);

      // Allow saving after a short delay
      setTimeout(() => {
        setIsReadyToSave(true);
      }, 100);
    }
  }, [preferencesInitialized, preferences, defaultVisibleColumns]);

  // Save column visibility to preferences (only when columns actually change)
  useEffect(() => {
    if (!isReadyToSave) {
      return;
    }

    const currentColumnsJson = JSON.stringify(visibleColumns);

    // Only save if columns have actually changed from last saved value
    if (lastSavedColumns.current === currentColumnsJson) {
      return;
    }

    lastSavedColumns.current = currentColumnsJson;

    const saveColumnPreferences = async () => {
      try {
        await updatePreference('vendors_visible_columns', visibleColumns, 'crm');
      } catch (error) {
        console.error('Failed to save column preferences:', error);
      }
    };

    saveColumnPreferences();
  }, [visibleColumns, isReadyToSave, updatePreference]);

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

  // Handle column header click for sorting
  // If clicking the same field, toggle direction; otherwise, set new field with default desc
  const handleSortChange = useCallback(async (field) => {
    let newDirection = 'desc';

    if (field === sortField) {
      // Toggle direction if clicking same field
      newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    }

    setSortField(field);
    setSortDirection(newDirection);

    try {
      await Promise.all([
        updatePreference('vendors_sort_field', field, 'crm'),
        updatePreference('vendors_sort_direction', newDirection, 'crm'),
      ]);
    } catch (error) {
      console.error('Failed to save sort preferences:', error);
    }
  }, [sortField, sortDirection, updatePreference]);

  const handleShowHiddenToggle = useCallback(async (value) => {
    setShowHiddenVendors(value);
    try {
      await updatePreference('vendors_show_hidden', value, 'crm');
    } catch (error) {
      console.error('Failed to save show hidden preference:', error);
    }
  }, [updatePreference]);

  const handlePreferredCurrencyToggle = useCallback(async (value) => {
    setShowPreferredCurrency(value);
    try {
      await updatePreference('vendors_show_preferred_currency', value, 'crm');
    } catch (error) {
      console.error('Failed to save preferred currency preference:', error);
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
    sortField,
    sortDirection,
    showHiddenVendors,
    showPreferredCurrency,
    visibleColumns,
    showColumnSelector,
    availableColumns: AVAILABLE_COLUMNS,
    columnSelectorRef,

    // Handlers
    setSearchQuery,
    handleSortChange,
    handleShowHiddenToggle,
    handlePreferredCurrencyToggle,
    toggleColumnVisibility,
    setShowColumnSelector,
  };
};
