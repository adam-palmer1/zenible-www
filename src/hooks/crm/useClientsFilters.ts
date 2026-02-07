import { useMemo } from 'react';
import { useContactFields } from './useContactFields';
import { useEntityFilters } from './useEntityFilters';

interface ColumnDefinition {
  key: string;
  label: string;
  description: string;
  category: string;
  locked: boolean;
  sortable?: boolean;
  filterable?: boolean;
  type?: string;
}

interface CategoryGroup {
  label: string;
  columns: ColumnDefinition[];
}

// UI-only columns that don't come from the API
const UI_ONLY_COLUMNS: ColumnDefinition[] = [
  { key: 'actions', label: 'Actions', description: 'Row actions menu', category: 'ui', locked: true },
];

// Fields that should be locked (always visible, cannot be unchecked)
const LOCKED_FIELDS: string[] = ['display_name'];

// Field label overrides for better display names
const LABEL_OVERRIDES: Record<string, string> = {
  display_name: 'Name',
  business_name: 'Company',
  confirmed_recurring_total: 'Confirmed Recurring',
  active_recurring_total: 'Active Recurring',
  confirmed_one_off_total: 'Confirmed One-off',
  total_outstanding: 'Outstanding',
  created_at: 'Client Since',
};

// Category display names
const CATEGORY_LABELS: Record<string, string> = {
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

// Fallback defaults if API hasn't loaded yet
const FALLBACK_VISIBLE_COLUMNS: Record<string, boolean> = {
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

/**
 * Custom hook to manage Clients tab filter state
 * Fetches available fields from the API and manages column visibility
 *
 * Uses the generic useEntityFilters factory for common filter logic
 * (column visibility, sort, search, preference persistence).
 * Adds clients-specific logic: dynamic API fields, column categories, visibleFieldNames.
 */
export const useClientsFilters = () => {
  const { fields, defaultVisibility, loading: fieldsLoading, error: fieldsError } = useContactFields() as any;

  // Use the generic entity filters hook for common state + persistence
  const entityFilters = useEntityFilters({
    entityName: 'clients',
    defaultVisibleColumns: FALLBACK_VISIBLE_COLUMNS,
    defaultSortField: 'created_at',
    defaultSortDirection: 'desc',
    apiDefaultVisibility: defaultVisibility,
  });

  // --- Clients-specific logic below ---

  // Transform API fields into column format for UI
  const availableColumns = useMemo((): ColumnDefinition[] => {
    if (!fields || fields.length === 0) {
      return UI_ONLY_COLUMNS;
    }

    // Filter to only include fields that make sense for the clients list
    // Exclude some internal/technical fields and fields that are redundant with display_name
    const excludedFields = ['id', 'first_name', 'last_name', 'current_global_status_id', 'current_custom_status_id', 'current_global_status', 'current_custom_status', 'appointments', 'is_hidden', 'is_client', 'is_vendor'];

    const apiColumns: ColumnDefinition[] = fields
      .filter((field: any) => !excludedFields.includes(field.name))
      .map((field: any) => ({
        key: field.name,
        label: LABEL_OVERRIDES[field.name as string] || formatFieldLabel(field.name),
        description: field.description || '',
        category: field.category || 'other',
        locked: LOCKED_FIELDS.includes(field.name),
        sortable: field.sortable,
        filterable: field.filterable,
        type: field.type,
      }))
      // Sort to put locked fields (like display_name) first
      .sort((a: ColumnDefinition, b: ColumnDefinition) => {
        if (a.locked && !b.locked) return -1;
        if (!a.locked && b.locked) return 1;
        return 0;
      });

    return [...apiColumns, ...UI_ONLY_COLUMNS];
  }, [fields]);

  // Group columns by category, with locked fields first in each category
  const columnsByCategory = useMemo((): Record<string, CategoryGroup> => {
    const grouped: Record<string, CategoryGroup> = {};
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

  // Get list of visible field names for API request (excludes UI-only columns)
  // Only include fields that are actually valid according to the API to prevent 400 errors
  const visibleFieldNames = useMemo((): string[] => {
    // Get valid field names from API metadata
    const validFieldNames = new Set(fields.map((f: any) => f.name));

    return Object.entries(entityFilters.visibleColumns)
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
  }, [entityFilters.visibleColumns, fields]);

  return {
    // State
    searchQuery: entityFilters.searchQuery,
    sortField: entityFilters.sortField,
    sortDirection: entityFilters.sortDirection,
    showHiddenClients: entityFilters.showHidden,
    showPreferredCurrency: entityFilters.showPreferredCurrency,
    visibleColumns: entityFilters.visibleColumns,
    showColumnSelector: entityFilters.showColumnSelector,
    availableColumns,
    columnsByCategory,
    columnSelectorRef: entityFilters.columnSelectorRef,
    visibleFieldNames,

    // Loading/error state for fields
    fieldsLoading,
    fieldsError,

    // Handlers
    setSearchQuery: entityFilters.setSearchQuery,
    handleSortChange: entityFilters.handleSortChange,
    handleShowHiddenToggle: entityFilters.handleShowHiddenToggle,
    handlePreferredCurrencyToggle: entityFilters.handlePreferredCurrencyToggle,
    toggleColumnVisibility: entityFilters.toggleColumnVisibility,
    setShowColumnSelector: entityFilters.setShowColumnSelector,
  };
};

// Helper to convert snake_case to Title Case
function formatFieldLabel(fieldName: string): string {
  return fieldName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
