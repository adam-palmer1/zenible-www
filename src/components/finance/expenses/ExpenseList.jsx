import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, MoreVertical, Repeat, ArrowUpDown, ArrowUp, ArrowDown, PieChart, Users, X, Check } from 'lucide-react';
import { useExpenses } from '../../../contexts/ExpenseContext';
import { useContacts } from '../../../hooks/crm/useContacts';
import { useNotification } from '../../../contexts/NotificationContext';
import { useCRMReferenceData } from '../../../contexts/CRMReferenceDataContext';
import { useCompanyAttributes } from '../../../hooks/crm/useCompanyAttributes';
import { formatCurrency } from '../../../utils/currency';
import expensesAPI from '../../../services/api/finance/expenses';
import ExpenseHistoryModal from './ExpenseHistoryModal';
import ExpenseFormModal from './ExpenseFormModal';
import DateRangeFilter from './DateRangeFilter';
import BulkActionBar from './BulkActionBar';
import BulkUpdateModal from './BulkUpdateModal';
import ExpenseAllocationBar, { ExpenseAllocationBadge } from './ExpenseAllocationBar';
import ExpenseAllocationModal from './ExpenseAllocationModal';
import ActionMenu from '../../shared/ActionMenu';

// Expense status configuration (matches backend ExpenseStatusEnum)
const EXPENSE_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const EXPENSE_STATUS_LABELS = {
  pending: 'Pending',
  paid: 'Paid',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const EXPENSE_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  paid: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

/**
 * Sortable table header component
 */
const SortableHeader = ({ label, sortKey, currentSortBy, currentSortOrder, onSort }) => {
  const isActive = currentSortBy === sortKey;

  const handleClick = () => {
    if (isActive) {
      // Toggle direction
      onSort(sortKey, currentSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to desc for new sort
      onSort(sortKey, 'desc');
    }
  };

  return (
    <th
      scope="col"
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors select-none"
      onClick={handleClick}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive ? (
          currentSortOrder === 'asc' ? (
            <ArrowUp className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 text-gray-400 opacity-50" />
        )}
      </div>
    </th>
  );
};

const ExpenseList = () => {
  const navigate = useNavigate();
  const {
    expenses,
    loading,
    categories,
    filters,
    pagination,
    selectedExpenseIds,
    bulkActionLoading,
    sortBy,
    sortOrder,
    updateFilters,
    updateSort,
    setPagination,
    deleteExpense,
    bulkDeleteExpenses,
    bulkUpdateExpenses,
    toggleExpenseSelection,
    selectAllExpenses,
    clearSelection,
    refresh,
  } = useExpenses();
  const { contacts: vendors } = useContacts({ is_vendor: true, per_page: 500, sort_by: 'last_used', sort_order: 'desc' });
  const { showSuccess, showError, showConfirm } = useNotification();
  const { numberFormats } = useCRMReferenceData();
  const { getNumberFormat } = useCompanyAttributes();

  // Get number format from company settings
  const numberFormat = useMemo(() => {
    const formatId = getNumberFormat();
    if (formatId && numberFormats.length > 0) {
      return numberFormats.find(f => f.id === formatId);
    }
    return null; // Will use default format
  }, [getNumberFormat, numberFormats]);

  // State
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState(null);
  const [selectedExpenseName, setSelectedExpenseName] = useState('');
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editExpenseId, setEditExpenseId] = useState(null);
  const [dateField, setDateField] = useState(filters.date_field || 'entry'); // 'entry' (expense_date) or 'paid' (paid_at)
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [allocationExpense, setAllocationExpense] = useState(null);
  const [selectedVendorIds, setSelectedVendorIds] = useState(
    filters.vendor_ids ? filters.vendor_ids.split(',') : []
  );
  const [pendingVendorIds, setPendingVendorIds] = useState([]); // Temporary state for dropdown
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [vendorSearch, setVendorSearch] = useState('');
  const [showRecurringOnly, setShowRecurringOnly] = useState(false);

  // Sync selectedVendorIds when filters.vendor_ids changes from context (e.g., preferences loaded)
  useEffect(() => {
    const vendorIds = filters.vendor_ids ? filters.vendor_ids.split(',') : [];
    setSelectedVendorIds(vendorIds);
  }, [filters.vendor_ids]);

  // Initialize pending state when dropdown opens
  useEffect(() => {
    if (showVendorDropdown) {
      setPendingVendorIds([...selectedVendorIds]);
    }
  }, [showVendorDropdown]);

  // Helper to get vendor display name for sorting/filtering
  const getExpenseVendorName = (expense) => {
    if (!expense.vendor) return '';
    return (
      expense.vendor.business_name?.trim() ||
      `${expense.vendor.first_name || ''} ${expense.vendor.last_name || ''}`.trim() ||
      expense.vendor.email ||
      ''
    ).toLowerCase();
  };

  // Filter and sort expenses locally
  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    // Filter by status
    if (filterStatus !== 'all') {
      result = result.filter(exp => exp.status === filterStatus);
    }

    // Filter by recurring only
    if (showRecurringOnly) {
      result = result.filter(exp => exp.pricing_type === 'recurring' && exp.recurring_type);
    }

    // Client-side search filtering for vendor name (backend search might not include vendor)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(exp => {
        // Check vendor name
        const vendorName = getExpenseVendorName(exp);
        if (vendorName.includes(query)) return true;

        // Also check description and expense number for completeness
        if (exp.description?.toLowerCase().includes(query)) return true;
        if (exp.expense_number?.toLowerCase().includes(query)) return true;
        if (exp.expense_category?.name?.toLowerCase().includes(query)) return true;

        return false;
      });
    }

    // Client-side sorting for vendor (backend might not support it)
    if (sortBy === 'vendor') {
      result.sort((a, b) => {
        const vendorA = getExpenseVendorName(a);
        const vendorB = getExpenseVendorName(b);
        const comparison = vendorA.localeCompare(vendorB);
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [expenses, filterStatus, searchQuery, sortBy, sortOrder, showRecurringOnly]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Handlers
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    // Don't call updateFilters here - it's handled by the debounced effect above
  };

  // Handle date field change (entry date vs paid date)
  const handleDateFieldChange = (field) => {
    setDateField(field);
    // Re-apply the current date filter with the new field
    if (filters.start_date || filters.end_date) {
      updateFilters({
        date_field: field,
        start_date: filters.start_date,
        end_date: filters.end_date,
      });
    } else {
      updateFilters({ date_field: field });
    }
  };

  // Handle date range change
  const handleDateRangeChange = ({ start_date, end_date }) => {
    updateFilters({
      start_date,
      end_date,
      date_field: dateField,
    });
  };

  // Handle vendor filter toggle (updates pending state only)
  const handleVendorToggle = (vendorId) => {
    setPendingVendorIds(prev =>
      prev.includes(vendorId)
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  // Clear all vendor selections (pending state only)
  const handleClearVendorFilters = () => {
    setPendingVendorIds([]);
    setVendorSearch('');
  };

  // Select all vendors (pending state only)
  const handleSelectAllVendors = () => {
    const allVendorIds = vendors.map(v => v.id);
    setPendingVendorIds(allVendorIds);
  };

  // Apply vendor filter when Done is clicked
  const handleVendorDone = () => {
    setSelectedVendorIds(pendingVendorIds);
    updateFilters({
      vendor_ids: pendingVendorIds.length > 0 ? pendingVendorIds.join(',') : null,
    });
    setShowVendorDropdown(false);
    setVendorSearch('');
  };

  // Filter vendors by search
  const filteredVendors = useMemo(() => {
    if (!vendorSearch.trim()) return vendors;
    const search = vendorSearch.toLowerCase().trim();
    return vendors.filter(vendor => {
      const displayName = vendor.business_name ||
        `${vendor.first_name || ''} ${vendor.last_name || ''}`.trim() ||
        vendor.email || '';
      return displayName.toLowerCase().includes(search);
    });
  }, [vendors, vendorSearch]);

  // Handle show recurring only toggle
  const handleShowRecurringOnlyToggle = () => {
    setShowRecurringOnly(prev => !prev);
  };

  // Get vendor display name
  const getVendorDisplayName = (vendor) => {
    if (!vendor) return 'Unknown';
    if (vendor.business_name) return vendor.business_name;
    const name = `${vendor.first_name || ''} ${vendor.last_name || ''}`.trim();
    return name || vendor.email || 'Unknown';
  };

  const handleViewHistory = (expense) => {
    setSelectedExpenseId(expense.id);
    setSelectedExpenseName(expense.description || `Expense #${expense.expense_number}`);
    setShowHistory(true);
    setOpenActionMenuId(null);
  };

  const handleView = (expense) => {
    setEditExpenseId(expense.id);
    setShowEditModal(true);
    setOpenActionMenuId(null);
  };

  const handleEdit = (expense) => {
    setEditExpenseId(expense.id);
    setShowEditModal(true);
    setOpenActionMenuId(null);
  };

  const handleEditModalClose = () => {
    setShowEditModal(false);
    setEditExpenseId(null);
  };

  const handleEditSuccess = () => {
    // Expenses will be refreshed by the context after update
    handleEditModalClose();
  };

  const handleOpenAllocation = (expense, e) => {
    e?.stopPropagation();
    setAllocationExpense(expense);
    setShowAllocationModal(true);
    setOpenActionMenuId(null);
  };

  const handleAllocationUpdate = () => {
    // Refresh expenses to get updated allocation data
    refresh();
  };

  const handleDelete = async (expense) => {
    const confirmed = await showConfirm('Delete Expense', 'Are you sure you want to delete this expense?');
    if (confirmed) {
      try {
        await deleteExpense(expense.id);
        showSuccess('Expense deleted successfully');
      } catch (error) {
        showError(error.message || 'Failed to delete expense');
      }
    }
    setOpenActionMenuId(null);
  };

  const handleSelectAll = () => {
    if (selectedExpenseIds.length === filteredExpenses.length) {
      clearSelection();
    } else {
      selectAllExpenses();
    }
  };

  const handleBulkDelete = async () => {
    const confirmed = await showConfirm(
      'Delete Expenses',
      `Are you sure you want to delete ${selectedExpenseIds.length} expense${selectedExpenseIds.length > 1 ? 's' : ''}?`
    );
    if (confirmed) {
      try {
        await bulkDeleteExpenses(selectedExpenseIds);
        clearSelection();
        showSuccess(`${selectedExpenseIds.length} expense${selectedExpenseIds.length > 1 ? 's' : ''} deleted successfully`);
      } catch (error) {
        showError(error.message || 'Failed to delete expenses');
      }
    }
  };

  const handleBulkUpdateCategory = () => {
    setShowBulkUpdateModal(true);
  };

  const handleToggleStatus = async (expense) => {
    const newStatus = expense.status === EXPENSE_STATUS.PAID ? EXPENSE_STATUS.PENDING : EXPENSE_STATUS.PAID;
    try {
      await expensesAPI.update(expense.id, { status: newStatus });
      showSuccess(`Expense marked as ${EXPENSE_STATUS_LABELS[newStatus]}`);
      refresh();
    } catch (error) {
      showError(error.message || 'Failed to update expense status');
    }
    setOpenActionMenuId(null);
  };

  const handleBulkUpdateConfirm = async (updates) => {
    try {
      await bulkUpdateExpenses(selectedExpenseIds, updates);
      showSuccess(`${selectedExpenseIds.length} expense${selectedExpenseIds.length > 1 ? 's' : ''} updated successfully`);
      setShowBulkUpdateModal(false);
    } catch (error) {
      showError(error.message || 'Failed to update expenses');
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const exportParams = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          exportParams[key] = value;
        }
      });

      const blob = await expensesAPI.exportCSV(exportParams);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().split('T')[0];
      link.download = `expenses_${date}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showSuccess('Expenses exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      showError(error.message || 'Failed to export expenses');
    } finally {
      setExporting(false);
    }
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    if (!status) return null;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${EXPENSE_STATUS_COLORS[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
        {EXPENSE_STATUS_LABELS[status] || status}
      </span>
    );
  };

  return (
    <div>
      {/* Section Header with Search and Filter */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#09090b] dark:text-white opacity-0">Expenses</h2>
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={handleSearch}
              className="pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border-[1.5px] border-[#e5e5e5] dark:border-gray-600 rounded-[10px] text-sm text-[#09090b] dark:text-white placeholder-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-[250px]"
            />
          </div>

          {/* Date Range Filter */}
          <DateRangeFilter
            startDate={filters.start_date}
            endDate={filters.end_date}
            onChange={handleDateRangeChange}
            dateField={dateField}
            onDateFieldChange={handleDateFieldChange}
          />

          {/* Vendor Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowVendorDropdown(!showVendorDropdown)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border-[1.5px] ${selectedVendorIds.length > 0 ? 'border-purple-500' : 'border-[#e5e5e5] dark:border-gray-600'} rounded-xl text-sm font-normal text-[#09090b] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500`}
            >
              <Users className="h-4 w-4 text-[#71717a]" />
              Vendor
              {selectedVendorIds.length > 0 && (
                <span className="px-1.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full">
                  {selectedVendorIds.length}
                </span>
              )}
            </button>
            {showVendorDropdown && (
              <>
                <div
                  className="fixed inset-0 z-[5]"
                  onClick={() => setShowVendorDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-[#e5e5e5] dark:border-gray-600 z-10">
                  {/* Search Input */}
                  <div className="p-3 border-b border-[#e5e5e5] dark:border-gray-700">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search vendors..."
                        value={vendorSearch}
                        onChange={(e) => setVendorSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-[#e5e5e5] dark:border-gray-600 rounded-lg text-sm text-[#09090b] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Select All / Clear All */}
                  <div className="px-3 py-2 border-b border-[#e5e5e5] dark:border-gray-700 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelectAllVendors();
                      }}
                      className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1"
                    >
                      <Check className="h-3 w-3" />
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleClearVendorFilters();
                      }}
                      className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
                    >
                      <X className="h-3 w-3" />
                      Clear All
                    </button>
                  </div>

                  {/* Vendor List */}
                  <div className="max-h-64 overflow-y-auto p-2">
                    {filteredVendors.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
                        {vendors.length === 0 ? 'No vendors found' : 'No matching vendors'}
                      </p>
                    ) : (
                      filteredVendors.map((vendor) => (
                        <label
                          key={vendor.id}
                          className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={pendingVendorIds.includes(vendor.id)}
                            onChange={() => handleVendorToggle(vendor.id)}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <span className="truncate flex-1">{getVendorDisplayName(vendor)}</span>
                          {pendingVendorIds.includes(vendor.id) && (
                            <Check className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                          )}
                        </label>
                      ))
                    )}
                  </div>

                  {/* Done button */}
                  <div className="p-3 border-t border-[#e5e5e5] dark:border-gray-700">
                    <button
                      onClick={handleVendorDone}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`inline-flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-gray-800 border-[1.5px] ${filterStatus !== 'all' || showRecurringOnly ? 'border-purple-500' : 'border-[#e5e5e5] dark:border-gray-600'} rounded-xl text-sm font-normal text-[#09090b] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500`}
            >
              <Filter className="h-4 w-4 text-[#71717a]" />
              Filter
              {(filterStatus !== 'all' || showRecurringOnly) && (
                <span className="ml-1 px-1.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full">
                  {(filterStatus !== 'all' ? 1 : 0) + (showRecurringOnly ? 1 : 0)}
                </span>
              )}
            </button>
            {showFilterDropdown && (
              <>
                <div
                  className="fixed inset-0 z-[5]"
                  onClick={() => setShowFilterDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-[#e5e5e5] dark:border-gray-600 z-10">
                  {/* Status Section */}
                  <div className="p-3 border-b border-[#e5e5e5] dark:border-gray-700">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Status</h4>
                    <div className="space-y-1">
                      <button
                        onClick={() => setFilterStatus('all')}
                        className={`block w-full text-left px-3 py-1.5 text-sm rounded ${filterStatus === 'all' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                      >
                        All Statuses
                      </button>
                      <button
                        onClick={() => setFilterStatus(EXPENSE_STATUS.PENDING)}
                        className={`block w-full text-left px-3 py-1.5 text-sm rounded ${filterStatus === EXPENSE_STATUS.PENDING ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                      >
                        Pending
                      </button>
                      <button
                        onClick={() => setFilterStatus(EXPENSE_STATUS.PAID)}
                        className={`block w-full text-left px-3 py-1.5 text-sm rounded ${filterStatus === EXPENSE_STATUS.PAID ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                      >
                        Paid
                      </button>
                      <button
                        onClick={() => setFilterStatus(EXPENSE_STATUS.COMPLETED)}
                        className={`block w-full text-left px-3 py-1.5 text-sm rounded ${filterStatus === EXPENSE_STATUS.COMPLETED ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                      >
                        Completed
                      </button>
                      <button
                        onClick={() => setFilterStatus(EXPENSE_STATUS.CANCELLED)}
                        className={`block w-full text-left px-3 py-1.5 text-sm rounded ${filterStatus === EXPENSE_STATUS.CANCELLED ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                      >
                        Cancelled
                      </button>
                    </div>
                  </div>

                  {/* Options Section */}
                  <div className="p-3">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Options</h4>
                    <label className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showRecurringOnly}
                        onChange={handleShowRecurringOnlyToggle}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <div className="flex items-center gap-2">
                        <Repeat className="h-4 w-4 text-gray-400" />
                        <span>Show Recurring Only</span>
                      </div>
                    </label>
                  </div>

                  {/* Close button */}
                  <div className="p-3 border-t border-[#e5e5e5] dark:border-gray-700">
                    <button
                      onClick={() => setShowFilterDropdown(false)}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 border border-[#e5e5e5] dark:border-gray-700 rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#e5e5e5] dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th scope="col" className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={filteredExpenses.length > 0 && selectedExpenseIds.length === filteredExpenses.length}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                </th>
                <SortableHeader
                  label="Expense #"
                  sortKey="expense_number"
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  onSort={updateSort}
                />
                <SortableHeader
                  label="Vendor"
                  sortKey="vendor"
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  onSort={updateSort}
                />
                <SortableHeader
                  label="Date"
                  sortKey="expense_date"
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  onSort={updateSort}
                />
                <SortableHeader
                  label="Category"
                  sortKey="category"
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  onSort={updateSort}
                />
                <SortableHeader
                  label="Total"
                  sortKey="amount"
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  onSort={updateSort}
                />
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Allocation
                </th>
                <th scope="col" className="w-12 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-[#e5e5e5] dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                    Loading expenses...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                    No expenses found
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                    onClick={() => handleView(expense)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedExpenseIds.includes(expense.id)}
                        onChange={() => toggleExpenseSelection(expense.id)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      #{expense.expense_number || expense.id?.slice(0, 8) || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {expense.vendor?.business_name?.trim() ||
                       `${expense.vendor?.first_name || ''} ${expense.vendor?.last_name || ''}`.trim() ||
                       expense.vendor?.email ||
                       '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(expense.expense_date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {expense.expense_category?.name || expense.category?.name || 'Uncategorized'}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(expense.amount, expense.currency?.code || 'USD', numberFormat)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-wrap gap-1">
                        <StatusBadge status={expense.status} />
                        {(expense.pricing_type === 'recurring' && expense.recurring_type) && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                            <Repeat className="h-3 w-3 mr-1" />
                            Recurring
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm" onClick={(e) => e.stopPropagation()}>
                      <div className="w-28">
                        <ExpenseAllocationBar
                          totalPercentage={(expense.allocations || []).reduce((sum, a) => sum + parseFloat(a.percentage || 0), 0)}
                          allocations={expense.allocations || []}
                          compact={true}
                          showLabel={true}
                          showTooltip={true}
                          onClick={(e) => handleOpenAllocation(expense, e)}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm" onClick={(e) => e.stopPropagation()}>
                      <button
                        id={`expense-action-btn-${expense.id}`}
                        onClick={() => setOpenActionMenuId(openActionMenuId === expense.id ? null : expense.id)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                      >
                        <MoreVertical className="h-4 w-4 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!loading && pagination.total > 0 && (
          <div className="px-4 py-3 border-t border-[#e5e5e5] dark:border-gray-700 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page * pagination.limit >= pagination.total}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing{' '}
                  <span className="font-medium">{Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}</span>
                  {' '}to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{pagination.total}</span>
                  {' '}results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page * pagination.limit >= pagination.total}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Action Menu Dropdown */}
      {openActionMenuId && (() => {
        const expense = filteredExpenses.find(e => e.id === openActionMenuId);
        if (!expense) return null;
        return (
          <ActionMenu
            itemId={expense.id}
            onClose={() => setOpenActionMenuId(null)}
            buttonIdPrefix="expense-action-btn"
            actions={[
              { label: 'View', onClick: () => handleView(expense) },
              { label: 'Edit', onClick: () => handleEdit(expense) },
              { label: 'View History', onClick: () => handleViewHistory(expense) },
              { label: 'Allocate', onClick: () => handleOpenAllocation(expense) },
              {
                label: expense.status === EXPENSE_STATUS.PAID ? 'Mark as Pending' : 'Mark as Paid',
                onClick: () => handleToggleStatus(expense)
              },
              { label: 'Delete', onClick: () => handleDelete(expense), variant: 'danger' },
            ]}
          />
        );
      })()}

      {/* Expense History Modal */}
      <ExpenseHistoryModal
        open={showHistory}
        onOpenChange={setShowHistory}
        expenseId={selectedExpenseId}
        expenseName={selectedExpenseName}
      />

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedExpenseIds.length}
        onBulkDelete={handleBulkDelete}
        onBulkUpdateCategory={handleBulkUpdateCategory}
        onClearSelection={clearSelection}
        loading={bulkActionLoading}
      />

      {/* Bulk Update Modal */}
      <BulkUpdateModal
        open={showBulkUpdateModal}
        onOpenChange={setShowBulkUpdateModal}
        selectedCount={selectedExpenseIds.length}
        categories={categories}
        onConfirm={handleBulkUpdateConfirm}
        loading={bulkActionLoading}
      />

      {/* Edit Expense Modal */}
      <ExpenseFormModal
        isOpen={showEditModal}
        onClose={handleEditModalClose}
        expenseId={editExpenseId}
        onSuccess={handleEditSuccess}
      />

      {/* Expense Allocation Modal */}
      <ExpenseAllocationModal
        open={showAllocationModal}
        onOpenChange={setShowAllocationModal}
        expense={allocationExpense}
        onUpdate={handleAllocationUpdate}
      />
    </div>
  );
};

export default ExpenseList;
