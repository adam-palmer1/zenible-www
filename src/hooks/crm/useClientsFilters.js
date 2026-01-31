import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { usePreferences } from '../../contexts/PreferencesContext';
import { useContactFields } from './useContactFields';

// UI-only columns that don't come from the API
const UI_ONLY_COLUMNS = [
  { key: 'actions', label: 'Actions', description: 'Row actions menu', category: 'ui', locked: true },
];

// Fields that should be locked (always visible, cannot be unchecked)
const LOCKED_FIELDS = ['display_name'];

// Field label overrides for better display names
const LABEL_OVERRIDES = {
  display_name: 'Name',
  business_name: 'Company',
  confirmed_recurring_total: 'Confirmed Recurring',
  active_recurring_total: 'Active Recurring',
  confirmed_one_off_total: 'Confirmed One-off',
  total_outstanding: 'Outstanding',
  created_at: 'Client Since',
};

// Category display names
const CATEGORY_LABELS = {
  identification: 'Contact Info',
  status: 'Status',
  services: 'Services',
  financial: 'Financial',
  invoices: 'Invoices',
  expenses: 'Expenses',
  crm: 'CRM',
  flags: 'Flags',
  timestamps: 'Dates',
  ui: 'Display',
};

/**
 * Custom hook to manage Clients tab filter state
 * Fetches available fields from the API and manages column visibility
 */
export const useClientsFilters = () => {
  const { preferences, updatePreference, initialized: preferencesInitialized } = usePreferences();
  const { fields, defaultVisibility, loading: fieldsLoading, error: fieldsError } = useContactFields();
  const columnSelectorRef = useRef(null);
  const [isReadyToSave, setIsReadyToSave] = useState(false);
  const hasInitializedFromPrefs = useRef(false);
  const lastSavedColumns = useRef(null);

  // Transform API fields into column format for UI
  const availableColumns = useMemo(() => {
    if (!fields || fields.length === 0) {
      return UI_ONLY_COLUMNS;
    }

    // Filter to only include fields that make sense for the clients list
    // Exclude some internal/technical fields and fields that are redundant with display_name
    const excludedFields = ['id', 'first_name', 'last_name', 'current_global_status_id', 'current_custom_status_id', 'current_global_status', 'current_custom_status', 'appointments', 'is_hidden', 'is_client', 'is_vendor'];

    const apiColumns = fields
      .filter(field => !excludedFields.includes(field.name))
      .map(field => ({
        key: field.name,
        label: LABEL_OVERRIDES[field.name] || formatFieldLabel(field.name),
        description: field.description || '',
        category: field.category || 'other',
        locked: LOCKED_FIELDS.includes(field.name),
        sortable: field.sortable,
        filterable: field.filterable,
        type: field.type,
      }))
      // Sort to put locked fields (like display_name) first
      .sort((a, b) => {
        if (a.locked && !b.locked) return -1;
        if (!a.locked && b.locked) return 1;
        return 0;
      });

    return [...apiColumns, ...UI_ONLY_COLUMNS];
  }, [fields]);

  // Group columns by category, with locked fields first in each category
  const columnsByCategory = useMemo(() => {
    const grouped = {};
    availableColumns.forEach(col => {
      const category = col.category || 'other';
      if (!grouped[category]) {
        grouped[category] = {
          label: CATEGORY_LABELS[category] || formatFieldLabel(category),
          columns: [],
        };
      }
      grouped[category].columns.push(col);
    });
    // Sort each category to put locked fields first
    Object.values(grouped).forEach(group => {
      group.columns.sort((a, b) => {
        if (a.locked && !b.locked) return -1;
        if (!a.locked && b.locked) return 1;
        return 0;
      });
    });
    return grouped;
  }, [availableColumns]);

  // Build default visible columns from API defaults or fallback
  const defaultVisibleColumns = useMemo(() => {
    // If user has saved preferences, use those
    if (preferences?.clients_visible_columns) {
      return preferences.clients_visible_columns;
    }

    // If we have API defaults, use those
    if (defaultVisibility && Object.keys(defaultVisibility).length > 0) {
      // Add UI-only columns as visible by default
      return {
        ...defaultVisibility,
        actions: true,
      };
    }

    // Fallback defaults if API hasn't loaded yet
    // Default columns: Name, Confirmed/Active values, Value (Gross), Total Invoiced, Outstanding
    return {
      display_name: true,
      email: false,
      phone: false,
      business_name: false,
      confirmed_services_count: false,
      active_services_count: false,
      pending_services_count: false,
      confirmed_one_off_total: true,
      active_one_off_total: true,
      pending_one_off_total: false,
      lifetime_one_off_total: false,
      confirmed_recurring_total: true,
      active_recurring_total: true,
      pending_recurring_total: false,
      value_net_total: false,
      expenses_total: false,
      value_gross_total: true,
      attribution_total: false,
      invoiced_total: true,
      payments_total: false,
      paid_total: false,
      total_outstanding: true,
      total_expenses_paid: false,
      total_expenses_outstanding: false,
      created_at: false,
      actions: true,
    };
  }, [preferences?.clients_visible_columns, defaultVisibility]);

  const [searchQuery, setSearchQuery] = useState('');
  // Sort state: field name and direction (asc/desc)
  const [sortField, setSortField] = useState(() => preferences?.clients_sort_field || 'created_at');
  const [sortDirection, setSortDirection] = useState(() => preferences?.clients_sort_direction || 'desc');
  const [showHiddenClients, setShowHiddenClients] = useState(() => preferences?.clients_show_hidden || false);
  // Show in preferred currency (default true - when false, preserve_currencies=true is sent to API)
  const [showPreferredCurrency, setShowPreferredCurrency] = useState(true);
  const [visibleColumns, setVisibleColumns] = useState(defaultVisibleColumns);
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  // Initialize state from preferences ONCE when they first load
  useEffect(() => {
    if (preferencesInitialized && !hasInitializedFromPrefs.current) {
      hasInitializedFromPrefs.current = true;

      // Load visible columns from preferences or use defaults
      let columnsToSet = null;
      if (preferences?.clients_visible_columns) {
        columnsToSet = preferences.clients_visible_columns;
      } else if (defaultVisibility && Object.keys(defaultVisibility).length > 0) {
        columnsToSet = {
          ...defaultVisibility,
          actions: true,
        };
      }

      if (columnsToSet) {
        setVisibleColumns(columnsToSet);
        lastSavedColumns.current = JSON.stringify(columnsToSet);
      }

      // Load sort preferences
      if (preferences?.clients_sort_field) {
        setSortField(preferences.clients_sort_field);
      }
      if (preferences?.clients_sort_direction) {
        setSortDirection(preferences.clients_sort_direction);
      }

      // Load filter preferences
      if (preferences?.clients_show_hidden !== undefined) {
        setShowHiddenClients(preferences.clients_show_hidden);
      }
      // Default to true (ON) if preference is not set
      const preferredCurrencyPref = preferences?.clients_show_preferred_currency;
      setShowPreferredCurrency(preferredCurrencyPref !== undefined ? preferredCurrencyPref : true);

      // Allow saving after a short delay
      setTimeout(() => {
        setIsReadyToSave(true);
      }, 100);
    }
  }, [preferencesInitialized, preferences, defaultVisibility]);

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
        await updatePreference('clients_visible_columns', visibleColumns, 'crm');
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
        updatePreference('clients_sort_field', field, 'crm'),
        updatePreference('clients_sort_direction', newDirection, 'crm'),
      ]);
    } catch (error) {
      console.error('Failed to save sort preferences:', error);
    }
  }, [sortField, sortDirection, updatePreference]);

  const handleShowHiddenToggle = useCallback(async (value) => {
    setShowHiddenClients(value);
    try {
      await updatePreference('clients_show_hidden', value, 'crm');
    } catch (error) {
      console.error('Failed to save show hidden preference:', error);
    }
  }, [updatePreference]);

  const handlePreferredCurrencyToggle = useCallback(async (value) => {
    setShowPreferredCurrency(value);
    try {
      await updatePreference('clients_show_preferred_currency', value, 'crm');
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

  // Get list of visible field names for API request (excludes UI-only columns)
  // Only include fields that are actually valid according to the API to prevent 400 errors
  const visibleFieldNames = useMemo(() => {
    // Get valid field names from API metadata
    const validFieldNames = new Set(fields.map(f => f.name));

    return Object.entries(visibleColumns)
      .filter(([key, visible]) => {
        // Exclude UI-only columns
        if (key === 'actions') return false;
        // Only include if visible
        if (!visible) return false;
        // Only include if the field is valid according to API, or if fields haven't loaded yet
        // (when fields haven't loaded, we won't send the fields parameter anyway)
        return validFieldNames.size === 0 || validFieldNames.has(key);
      })
      .map(([key]) => key);
  }, [visibleColumns, fields]);

  return {
    // State
    searchQuery,
    sortField,
    sortDirection,
    showHiddenClients,
    showPreferredCurrency,
    visibleColumns,
    showColumnSelector,
    availableColumns,
    columnsByCategory,
    columnSelectorRef,
    visibleFieldNames,

    // Loading/error state for fields
    fieldsLoading,
    fieldsError,

    // Handlers
    setSearchQuery,
    handleSortChange,
    handleShowHiddenToggle,
    handlePreferredCurrencyToggle,
    toggleColumnVisibility,
    setShowColumnSelector,
  };
};

// Helper to convert snake_case to Title Case
function formatFieldLabel(fieldName) {
  return fieldName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
