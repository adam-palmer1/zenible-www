import { useEntityFilters } from './useEntityFilters';

interface VendorColumn {
  key: string;
  label: string;
  locked?: boolean;
}

// Define available columns for vendors
const AVAILABLE_COLUMNS: VendorColumn[] = [
  { key: 'name', label: 'Vendor', locked: true },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'business_name', label: 'Company' },
  { key: 'expenses_paid', label: 'Expenses Paid' },
  { key: 'expenses_outstanding', label: 'Outstanding' },
  { key: 'vendor_since', label: 'Vendor Since' },
  { key: 'actions', label: 'Actions', locked: true },
];

// Default visible columns for vendors
const DEFAULT_VISIBLE_COLUMNS: Record<string, boolean> = {
  name: true,
  email: true,
  phone: false,
  business_name: false,
  expenses_paid: true,
  expenses_outstanding: true,
  vendor_since: true,
  actions: true,
};

/**
 * Custom hook to manage Vendors tab filter state
 * Shared between CRMDashboard (for rendering filters) and VendorsView (for filtering data)
 *
 * Uses the generic useEntityFilters factory for common filter logic
 * (column visibility, sort, search, preference persistence).
 */
export const useVendorsFilters = () => {
  const entityFilters = useEntityFilters({
    entityName: 'vendors',
    defaultVisibleColumns: DEFAULT_VISIBLE_COLUMNS,
    defaultSortField: 'created_at',
    defaultSortDirection: 'desc',
  });

  return {
    // State
    searchQuery: entityFilters.searchQuery,
    sortField: entityFilters.sortField,
    sortDirection: entityFilters.sortDirection,
    showHiddenVendors: entityFilters.showHidden,
    showPreferredCurrency: entityFilters.showPreferredCurrency,
    visibleColumns: entityFilters.visibleColumns,
    showColumnSelector: entityFilters.showColumnSelector,
    availableColumns: AVAILABLE_COLUMNS,
    columnSelectorRef: entityFilters.columnSelectorRef,

    // Handlers
    setSearchQuery: entityFilters.setSearchQuery,
    handleSortChange: entityFilters.handleSortChange,
    handleShowHiddenToggle: entityFilters.handleShowHiddenToggle,
    handlePreferredCurrencyToggle: entityFilters.handlePreferredCurrencyToggle,
    toggleColumnVisibility: entityFilters.toggleColumnVisibility,
    setShowColumnSelector: entityFilters.setShowColumnSelector,
  };
};
