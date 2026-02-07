import { useState, useRef, useEffect, useCallback } from 'react';
import { usePreferences } from '../../contexts/PreferencesContext';

/**
 * Configuration for the generic entity filters factory hook.
 * Each entity (clients, vendors, etc.) provides its own config.
 */
export interface EntityFiltersConfig {
  /** Entity name used as a prefix for preference keys, e.g. 'clients', 'vendors' */
  entityName: string;
  /** Preference category for saving, e.g. 'crm' */
  preferenceCategory?: string;
  /** Default visible columns map when no preferences exist */
  defaultVisibleColumns: Record<string, boolean>;
  /** Default sort field */
  defaultSortField?: string;
  /** Default sort direction */
  defaultSortDirection?: string;
  /** Default showHidden value */
  defaultShowHidden?: boolean;
  /** Default showPreferredCurrency value */
  defaultShowPreferredCurrency?: boolean;
  /**
   * Optional: dynamic defaults from API (e.g. useContactFields defaultVisibility).
   * When provided and non-empty, these override defaultVisibleColumns for initialization.
   * The 'actions' column is always added as true.
   */
  apiDefaultVisibility?: Record<string, boolean>;
}

/**
 * Return type for the generic entity filters hook.
 */
export interface EntityFiltersReturn {
  // State
  searchQuery: string;
  sortField: string;
  sortDirection: string;
  showHidden: boolean;
  showPreferredCurrency: boolean;
  visibleColumns: Record<string, boolean>;
  showColumnSelector: boolean;
  columnSelectorRef: React.MutableRefObject<HTMLDivElement | null>;

  // Setters
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  setVisibleColumns: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setShowColumnSelector: React.Dispatch<React.SetStateAction<boolean>>;

  // Handlers
  handleSortChange: (field: string) => Promise<void>;
  handleShowHiddenToggle: (value: boolean) => Promise<void>;
  handlePreferredCurrencyToggle: (value: boolean) => Promise<void>;
  toggleColumnVisibility: (columnKey: string) => void;
}

/**
 * Generic entity filters factory hook.
 *
 * Consolidates the common filter logic shared between CRM entity list hooks
 * (useClientsFilters, useVendorsFilters, etc.):
 *  - Column visibility state + preference persistence
 *  - Sort state (sortField, sortDirection) + preference persistence
 *  - Search query state
 *  - Show hidden / preferred currency toggles + persistence
 *  - useEffect for one-time preference initialization
 *  - Column save/restore logic with change detection
 *  - Click-outside handler for column selector dropdown
 *
 * Individual entity hooks call this internally and layer on domain-specific state.
 */
export function useEntityFilters(config: EntityFiltersConfig): EntityFiltersReturn {
  const {
    entityName,
    preferenceCategory = 'crm',
    defaultVisibleColumns,
    defaultSortField = 'created_at',
    defaultSortDirection = 'desc',
    defaultShowHidden = false,
    defaultShowPreferredCurrency = true,
    apiDefaultVisibility,
  } = config;

  // Preference keys derived from entity name
  const prefKeys = {
    visibleColumns: `${entityName}_visible_columns`,
    sortField: `${entityName}_sort_field`,
    sortDirection: `${entityName}_sort_direction`,
    showHidden: `${entityName}_show_hidden`,
    showPreferredCurrency: `${entityName}_show_preferred_currency`,
  };

  const { preferences, updatePreference, initialized: preferencesInitialized } = usePreferences() as any;
  const columnSelectorRef = useRef<HTMLDivElement | null>(null);
  const [isReadyToSave, setIsReadyToSave] = useState<boolean>(false);
  const hasInitializedFromPrefs = useRef<boolean>(false);
  const lastSavedColumns = useRef<string | null>(null);

  // Resolve effective default columns: prefer API defaults if available, else static defaults
  const resolveDefaultColumns = (): Record<string, boolean> => {
    if (preferences?.[prefKeys.visibleColumns]) {
      return preferences[prefKeys.visibleColumns] as Record<string, boolean>;
    }
    if (apiDefaultVisibility && Object.keys(apiDefaultVisibility).length > 0) {
      return { ...apiDefaultVisibility, actions: true };
    }
    return defaultVisibleColumns;
  };

  // State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<string>(
    () => (preferences?.[prefKeys.sortField] as string) || defaultSortField
  );
  const [sortDirection, setSortDirection] = useState<string>(
    () => (preferences?.[prefKeys.sortDirection] as string) || defaultSortDirection
  );
  const [showHidden, setShowHidden] = useState<boolean>(
    () => (preferences?.[prefKeys.showHidden] as boolean) || defaultShowHidden
  );
  const [showPreferredCurrency, setShowPreferredCurrency] = useState<boolean>(defaultShowPreferredCurrency);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(resolveDefaultColumns);
  const [showColumnSelector, setShowColumnSelector] = useState<boolean>(false);

  // Initialize state from preferences ONCE when they first load
  useEffect(() => {
    if (preferencesInitialized && !hasInitializedFromPrefs.current) {
      hasInitializedFromPrefs.current = true;

      // Load visible columns from preferences or use defaults
      let columnsToSet: Record<string, boolean> | null = null;
      if (preferences?.[prefKeys.visibleColumns]) {
        columnsToSet = preferences[prefKeys.visibleColumns] as Record<string, boolean>;
      } else if (apiDefaultVisibility && Object.keys(apiDefaultVisibility).length > 0) {
        columnsToSet = { ...apiDefaultVisibility, actions: true };
      }

      if (columnsToSet) {
        setVisibleColumns(columnsToSet);
        lastSavedColumns.current = JSON.stringify(columnsToSet);
      }

      // Load sort preferences
      if (preferences?.[prefKeys.sortField]) {
        setSortField(preferences[prefKeys.sortField] as string);
      }
      if (preferences?.[prefKeys.sortDirection]) {
        setSortDirection(preferences[prefKeys.sortDirection] as string);
      }

      // Load filter preferences
      if (preferences?.[prefKeys.showHidden] !== undefined) {
        setShowHidden(preferences[prefKeys.showHidden] as boolean);
      }

      // Default to true (ON) if preference is not set
      const preferredCurrencyPref = preferences?.[prefKeys.showPreferredCurrency];
      setShowPreferredCurrency(
        preferredCurrencyPref !== undefined ? (preferredCurrencyPref as boolean) : defaultShowPreferredCurrency
      );

      // Allow saving after a short delay
      setTimeout(() => {
        setIsReadyToSave(true);
      }, 100);
    }
  }, [preferencesInitialized, preferences, apiDefaultVisibility, prefKeys.visibleColumns, prefKeys.sortField, prefKeys.sortDirection, prefKeys.showHidden, prefKeys.showPreferredCurrency, defaultShowPreferredCurrency]);

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
        await updatePreference(prefKeys.visibleColumns, visibleColumns, preferenceCategory);
      } catch (error) {
        console.error('Failed to save column preferences:', error);
      }
    };

    saveColumnPreferences();
  }, [visibleColumns, isReadyToSave, updatePreference, prefKeys.visibleColumns, preferenceCategory]);

  // Close column selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (columnSelectorRef.current && !columnSelectorRef.current.contains(event.target as Node)) {
        setShowColumnSelector(false);
      }
    };

    if (showColumnSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showColumnSelector]);

  // Handle column header click for sorting
  const handleSortChange = useCallback(async (field: string): Promise<void> => {
    let newDirection = 'desc';

    if (field === sortField) {
      newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    }

    setSortField(field);
    setSortDirection(newDirection);

    try {
      await Promise.all([
        updatePreference(prefKeys.sortField, field, preferenceCategory),
        updatePreference(prefKeys.sortDirection, newDirection, preferenceCategory),
      ]);
    } catch (error) {
      console.error('Failed to save sort preferences:', error);
    }
  }, [sortField, sortDirection, updatePreference, prefKeys.sortField, prefKeys.sortDirection, preferenceCategory]);

  const handleShowHiddenToggle = useCallback(async (value: boolean): Promise<void> => {
    setShowHidden(value);
    try {
      await updatePreference(prefKeys.showHidden, value, preferenceCategory);
    } catch (error) {
      console.error('Failed to save show hidden preference:', error);
    }
  }, [updatePreference, prefKeys.showHidden, preferenceCategory]);

  const handlePreferredCurrencyToggle = useCallback(async (value: boolean): Promise<void> => {
    setShowPreferredCurrency(value);
    try {
      await updatePreference(prefKeys.showPreferredCurrency, value, preferenceCategory);
    } catch (error) {
      console.error('Failed to save preferred currency preference:', error);
    }
  }, [updatePreference, prefKeys.showPreferredCurrency, preferenceCategory]);

  const toggleColumnVisibility = useCallback((columnKey: string): void => {
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
    showHidden,
    showPreferredCurrency,
    visibleColumns,
    showColumnSelector,
    columnSelectorRef,

    // Setters
    setSearchQuery,
    setVisibleColumns,
    setShowColumnSelector,

    // Handlers
    handleSortChange,
    handleShowHiddenToggle,
    handlePreferredCurrencyToggle,
    toggleColumnVisibility,
  };
}
