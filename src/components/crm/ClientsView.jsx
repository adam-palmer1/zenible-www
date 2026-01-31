import React, { useState, useMemo } from 'react';
import {
  UserMinusIcon,
  EyeSlashIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { useContacts, useCompanyCurrencies } from '../../hooks/crm';
import { useNotification } from '../../contexts/NotificationContext';
import { formatCurrency } from '../../utils/currency';
import Dropdown from '../ui/dropdown/Dropdown';
import ConfirmationModal from '../common/ConfirmationModal';
import { getContactDisplayName } from '../../utils/crm/contactUtils';

/**
 * Sortable Column Header Component
 * Displays a clickable header with sort indicator
 */
const SortableColumnHeader = ({ field, label, sortField, sortDirection, onSort, align = 'left' }) => {
  const isActive = sortField === field;
  const alignClass = align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start';

  return (
    <th
      className={`px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors select-none text-${align}`}
      onClick={() => onSort(field)}
    >
      <div className={`flex items-center gap-1 ${alignClass}`}>
        <span>{label}</span>
        <span className={`flex flex-col ${isActive ? 'text-zenible-primary' : 'text-gray-300'}`}>
          {isActive ? (
            sortDirection === 'asc' ? (
              <ChevronUpIcon className="h-3.5 w-3.5" />
            ) : (
              <ChevronDownIcon className="h-3.5 w-3.5" />
            )
          ) : (
            <svg className="h-3.5 w-3.5 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          )}
        </span>
      </div>
    </th>
  );
};

/**
 * ClientsView Component
 *
 * Displays a filtered view of contacts marked as clients (is_client: true)
 * with financial data, customizable columns, search, filters, and sorting.
 */
const ClientsView = ({
  onClientClick,
  openContactModal,
  refreshKey = 0,
  // Filter state from useClientsFilters hook
  searchQuery,
  sortField,
  sortDirection,
  handleSortChange,
  showHiddenClients,
  showPreferredCurrency = true,
  visibleColumns,
  availableColumns,
  visibleFieldNames = [],
  fieldsLoading = false,
}) => {
  const { showError, showSuccess } = useNotification();
  const { defaultCurrency, numberFormat } = useCompanyCurrencies();

  // Get the default currency code for formatting
  const defaultCurrencyCode = defaultCurrency?.currency?.code || 'GBP';

  const [showRemoveClientModal, setShowRemoveClientModal] = useState(false);
  const [clientToRemove, setClientToRemove] = useState(null);
  const [showDeleteClientModal, setShowDeleteClientModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);

  // Build the filters object for the API request
  // Memoize to prevent unnecessary re-renders and API calls
  const contactFilters = useMemo(() => {
    // Essential fields always needed for basic UI functionality
    // These must match valid field names from GET /contacts/fields
    const essentialFields = [
      'id',
      'first_name',
      'last_name',
      'business_name',
      'display_name',
      'email',
      'phone',
      'is_hidden',
      'created_at',
    ];

    const baseFilters = {
      is_client: true,
    };

    // When not showing preferred currency, preserve original currencies
    if (!showPreferredCurrency) {
      baseFilters.preserve_currencies = true;
    }

    // Only add fields parameter if:
    // 1. We have visible field names from user preferences
    // 2. Fields metadata has loaded (so we know which fields are valid)
    // This prevents sending invalid field names before the API tells us what's valid
    if (visibleFieldNames.length > 0 && !fieldsLoading) {
      const allFields = new Set([...essentialFields, ...visibleFieldNames]);
      return {
        ...baseFilters,
        fields: Array.from(allFields).join(','),
      };
    }

    // Without fields parameter, API returns all fields (default behavior)
    return baseFilters;
  }, [visibleFieldNames, showPreferredCurrency, fieldsLoading]);

  // Fetch clients (contacts with is_client: true) with only the requested fields
  const { contacts: clients, loading: clientsLoading, updateContact, deleteContact } = useContacts(
    contactFilters,
    refreshKey
  );

  // Filter and sort clients - memoized to ensure proper updates
  const filteredClients = useMemo(() => {
    let filtered = [...clients];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (client) =>
          client.first_name?.toLowerCase().includes(query) ||
          client.last_name?.toLowerCase().includes(query) ||
          client.email?.toLowerCase().includes(query) ||
          client.business_name?.toLowerCase().includes(query) ||
          client.phone?.toLowerCase().includes(query)
      );
    }

    // Apply hidden filter
    if (!showHiddenClients) {
      filtered = filtered.filter((client) => !client.is_hidden);
    }

    // Apply sorting by field and direction
    if (sortField) {
      filtered.sort((a, b) => {
        let valueA, valueB;

        // Handle special sorting cases
        if (sortField === 'display_name') {
          valueA = (a.display_name || `${a.first_name || ''} ${a.last_name || ''}`.trim()).toLowerCase();
          valueB = (b.display_name || `${b.first_name || ''} ${b.last_name || ''}`.trim()).toLowerCase();
        } else if (sortField === 'created_at') {
          valueA = new Date(a.created_at || 0);
          valueB = new Date(b.created_at || 0);
        } else if (['confirmed_services_count', 'active_services_count', 'pending_services_count'].includes(sortField)) {
          valueA = parseInt(a[sortField] || 0, 10);
          valueB = parseInt(b[sortField] || 0, 10);
        } else if ([
          'confirmed_one_off_total', 'active_one_off_total', 'pending_one_off_total', 'lifetime_one_off_total',
          'confirmed_recurring_total', 'active_recurring_total', 'pending_recurring_total', 'value_net_total',
          'expenses_total', 'value_gross_total', 'attribution_total',
          'invoiced_total', 'payments_total', 'paid_total',
          'total_outstanding', 'total_expenses_paid', 'total_expenses_outstanding'
        ].includes(sortField)) {
          // Handle array format (when preserve_currencies=true) - sum all amounts
          const getFinancialValue = (val) => {
            if (Array.isArray(val)) {
              return val.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
            }
            return parseFloat(val || 0);
          };
          valueA = getFinancialValue(a[sortField]);
          valueB = getFinancialValue(b[sortField]);
        } else {
          // Default string comparison
          valueA = (a[sortField] || '').toString().toLowerCase();
          valueB = (b[sortField] || '').toString().toLowerCase();
        }

        // Compare values
        let comparison = 0;
        if (valueA instanceof Date && valueB instanceof Date) {
          comparison = valueA - valueB;
        } else if (typeof valueA === 'number' && typeof valueB === 'number') {
          comparison = valueA - valueB;
        } else {
          comparison = valueA.localeCompare ? valueA.localeCompare(valueB) : (valueA > valueB ? 1 : -1);
        }

        // Apply direction
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [clients, searchQuery, showHiddenClients, sortField, sortDirection]);

  const handleEditClient = (client) => {
    if (openContactModal) {
      openContactModal(client);
    }
  };

  const handleHideClient = async (client) => {
    try {
      // Determine current hidden state
      const isCurrentlyHidden = client.is_hidden === true;
      const newHiddenState = !isCurrentlyHidden;

      // updateContact handles both API call and local state update
      await updateContact(client.id, { is_hidden: newHiddenState });

      showSuccess(newHiddenState ? 'Client has been hidden' : 'Client is now visible');
    } catch (error) {
      console.error('Error updating client visibility:', error);
      showError('Failed to update client visibility');
    }
  };

  const handleRemoveFromClientList = async () => {
    if (!clientToRemove) return;

    try {
      // updateContact handles both API call and local state update
      await updateContact(clientToRemove.id, { is_client: false });

      const displayName = getContactDisplayName(clientToRemove);
      showSuccess(`${displayName} removed from client list`);

      setShowRemoveClientModal(false);
      setClientToRemove(null);
    } catch (error) {
      console.error('Error removing client from list:', error);
      showError('Failed to remove client from list');
    }
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;

    try {
      // deleteContact handles both API call and local state update
      await deleteContact(clientToDelete.id);

      const displayName = getContactDisplayName(clientToDelete);
      showSuccess(`${displayName} deleted permanently`);

      setShowDeleteClientModal(false);
      setClientToDelete(null);
    } catch (error) {
      console.error('Error deleting client:', error);
      showError('Failed to delete client');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      });
    } catch (error) {
      return '-';
    }
  };

  // Format financial value - handles both single value and array format (when preserve_currencies=true)
  // Returns a React element when multiple currencies, or a string for single value
  const formatFinancialValue = (value, currency) => {
    // Handle array format (when preserve_currencies=true)
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return '-';
      }

      // Filter out zero values
      const nonZeroValues = value.filter(v => v.amount && parseFloat(v.amount) !== 0);

      if (nonZeroValues.length === 0) {
        return '-';
      }

      // If multiple currencies, show each on separate line
      if (nonZeroValues.length > 1) {
        return (
          <div className="flex flex-col">
            {nonZeroValues.map((v, index) => (
              <span key={index}>
                {formatCurrency(parseFloat(v.amount), v.currency_code || defaultCurrencyCode, numberFormat)}
              </span>
            ))}
          </div>
        );
      }

      // Single currency in array format
      return formatCurrency(parseFloat(nonZeroValues[0].amount), nonZeroValues[0].currency_code || defaultCurrencyCode, numberFormat);
    }

    // Handle single value format (when showing preferred currency)
    if (!value || value === null || value === '0' || parseFloat(value) === 0) {
      return '-';
    }
    return formatCurrency(parseFloat(value), currency || defaultCurrencyCode, numberFormat);
  };

  if (clientsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-[#e5e5e5] dark:border-gray-700 h-full flex flex-col">
      {/* Table */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e5e5e5] dark:border-gray-700">
              {visibleColumns.display_name && (
                <SortableColumnHeader
                  field="display_name"
                  label="Name"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSortChange}
                  align="left"
                />
              )}
              {visibleColumns.email && (
                <SortableColumnHeader
                  field="email"
                  label="Email"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSortChange}
                  align="left"
                />
              )}
              {visibleColumns.phone && (
                <SortableColumnHeader
                  field="phone"
                  label="Phone"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSortChange}
                  align="left"
                />
              )}
              {visibleColumns.business_name && (
                <SortableColumnHeader
                  field="business_name"
                  label="Company"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSortChange}
                  align="left"
                />
              )}
              {visibleColumns.confirmed_services_count && (
                <SortableColumnHeader
                  field="confirmed_services_count"
                  label="Confirmed Services"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSortChange}
                  align="center"
                />
              )}
              {visibleColumns.active_services_count && (
                <SortableColumnHeader
                  field="active_services_count"
                  label="Active Services"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSortChange}
                  align="center"
                />
              )}
              {visibleColumns.pending_services_count && (
                <SortableColumnHeader
                  field="pending_services_count"
                  label="Pending Services"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSortChange}
                  align="center"
                />
              )}
              {visibleColumns.confirmed_one_off_total && (
                <SortableColumnHeader
                  field="confirmed_one_off_total"
                  label="Confirmed One-off"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSortChange}
                  align="right"
                />
              )}
              {visibleColumns.active_one_off_total && (
                <SortableColumnHeader
                  field="active_one_off_total"
                  label="Active One-off"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSortChange}
                  align="right"
                />
              )}
              {visibleColumns.pending_one_off_total && (
                <SortableColumnHeader
                  field="pending_one_off_total"
                  label="Pending One-off"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSortChange}
                  align="right"
                />
              )}
              {visibleColumns.lifetime_one_off_total && (
                <SortableColumnHeader
                  field="lifetime_one_off_total"
                  label="Lifetime One-off"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSortChange}
                  align="right"
                />
              )}
              {visibleColumns.confirmed_recurring_total && (
                <SortableColumnHeader
                  field="confirmed_recurring_total"
                  label="Confirmed Recurring"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSortChange}
                  align="right"
                />
              )}
              {visibleColumns.active_recurring_total && (
                <SortableColumnHeader
                  field="active_recurring_total"
                  label="Active Recurring"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSortChange}
                  align="right"
                />
              )}
              {visibleColumns.pending_recurring_total && (
                <SortableColumnHeader
                  field="pending_recurring_total"
                  label="Pending Recurring"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSortChange}
                  align="right"
                />
              )}
              {visibleColumns.value_net_total && (
                <SortableColumnHeader
                  field="value_net_total"
                  label="Value (Net)"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSortChange}
                  align="right"
                />
              )}
              {visibleColumns.expenses_total && (
                <SortableColumnHeader
                  field="expenses_total"
                  label="Expenses Total"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSortChange}
                  align="right"
                />
              )}
              {visibleColumns.value_gross_total && (
                <SortableColumnHeader
                  field="value_gross_total"
                  label="Value (Gross)"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSortChange}
                  align="right"
                />
              )}
              {visibleColumns.attribution_total && (
                <SortableColumnHeader
                  field="attribution_total"
                  label="Attribution Total"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSortChange}
                  align="right"
                />
              )}
              {visibleColumns.invoiced_total && (
                <SortableColumnHeader
                  field="invoiced_total"
                  label="Total Invoiced"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSortChange}
                  align="right"
                />
              )}
              {visibleColumns.payments_total && (
                <SortableColumnHeader
                  field="payments_total"
                  label="Payments Total"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSortChange}
                  align="right"
                />
              )}
              {visibleColumns.paid_total && (
                <SortableColumnHeader
                  field="paid_total"
                  label="Paid Total"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSortChange}
                  align="right"
                />
              )}
              {visibleColumns.total_outstanding && (
                <SortableColumnHeader
                  field="total_outstanding"
                  label="Outstanding"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSortChange}
                  align="right"
                />
              )}
              {visibleColumns.total_expenses_paid && (
                <SortableColumnHeader
                  field="total_expenses_paid"
                  label="Expenses Paid"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSortChange}
                  align="right"
                />
              )}
              {visibleColumns.total_expenses_outstanding && (
                <SortableColumnHeader
                  field="total_expenses_outstanding"
                  label="Expenses Outstanding"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSortChange}
                  align="right"
                />
              )}
              {visibleColumns.created_at && (
                <SortableColumnHeader
                  field="created_at"
                  label="Client Since"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSortChange}
                  align="left"
                />
              )}
              {visibleColumns.actions && (
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400"></th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredClients.length === 0 ? (
              <tr>
                <td
                  colSpan={Object.values(visibleColumns).filter(Boolean).length}
                  className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                >
                  No clients found
                </td>
              </tr>
            ) : (
              filteredClients.map((client, index) => {
                return (
                  <tr
                    key={client.id}
                    className={`border-b border-[#e5e5e5] dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                      index === filteredClients.length - 1 ? 'border-b-0' : ''
                    }`}
                    onClick={() => onClientClick && onClientClick(client)}
                  >
                    {visibleColumns.display_name && (
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                            {client.profile_picture ? (
                              <img
                                src={client.profile_picture}
                                alt={client.display_name || client.business_name || 'Client'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="font-medium text-sm text-gray-600 dark:text-gray-400">
                                {(client.first_name || client.business_name || '')?.[0]?.toUpperCase()}
                                {(client.last_name || '')?.[0]?.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p
                              className={`font-medium text-gray-900 dark:text-white ${
                                client.is_hidden ? 'line-through italic opacity-60' : ''
                              }`}
                            >
                              {client.display_name || client.business_name || 'Unnamed Client'}
                            </p>
                          </div>
                        </div>
                      </td>
                    )}
                    {visibleColumns.email && (
                      <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">{client.email || '-'}</td>
                    )}
                    {visibleColumns.phone && (
                      <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                        {client.phone || '-'}
                      </td>
                    )}
                    {visibleColumns.business_name && (
                      <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                        {client.business_name || '-'}
                      </td>
                    )}
                    {visibleColumns.confirmed_services_count && (
                      <td className="px-4 py-4 text-sm text-center text-zenible-primary">
                        {client.confirmed_services_count || 0}
                      </td>
                    )}
                    {visibleColumns.active_services_count && (
                      <td className="px-4 py-4 text-sm text-center text-gray-900 dark:text-white">
                        {client.active_services_count || 0}
                      </td>
                    )}
                    {visibleColumns.pending_services_count && (
                      <td className="px-4 py-4 text-sm text-center text-amber-600 dark:text-amber-400">
                        {client.pending_services_count || 0}
                      </td>
                    )}
                    {visibleColumns.confirmed_one_off_total && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-zenible-primary">
                        {formatFinancialValue(client.confirmed_one_off_total, client.total_value_currency)}
                      </td>
                    )}
                    {visibleColumns.active_one_off_total && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                        {formatFinancialValue(client.active_one_off_total, client.total_value_currency)}
                      </td>
                    )}
                    {visibleColumns.pending_one_off_total && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-amber-600 dark:text-amber-400">
                        {formatFinancialValue(client.pending_one_off_total, client.total_value_currency)}
                      </td>
                    )}
                    {visibleColumns.lifetime_one_off_total && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                        {formatFinancialValue(client.lifetime_one_off_total, client.total_value_currency)}
                      </td>
                    )}
                    {visibleColumns.confirmed_recurring_total && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-zenible-primary">
                        {formatFinancialValue(client.confirmed_recurring_total, client.total_value_currency)}
                      </td>
                    )}
                    {visibleColumns.active_recurring_total && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                        {formatFinancialValue(client.active_recurring_total, client.total_value_currency)}
                      </td>
                    )}
                    {visibleColumns.pending_recurring_total && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-amber-600 dark:text-amber-400">
                        {formatFinancialValue(client.pending_recurring_total, client.total_value_currency)}
                      </td>
                    )}
                    {visibleColumns.value_net_total && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                        {formatFinancialValue(client.value_net_total, client.total_value_currency)}
                      </td>
                    )}
                    {visibleColumns.expenses_total && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-red-600 dark:text-red-400">
                        {formatFinancialValue(client.expenses_total, client.expenses_currency)}
                      </td>
                    )}
                    {visibleColumns.value_gross_total && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                        {formatFinancialValue(client.value_gross_total, client.total_value_currency)}
                      </td>
                    )}
                    {visibleColumns.attribution_total && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                        {formatFinancialValue(client.attribution_total, client.total_value_currency)}
                      </td>
                    )}
                    {visibleColumns.invoiced_total && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                        {formatFinancialValue(client.invoiced_total)}
                      </td>
                    )}
                    {visibleColumns.payments_total && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-green-600 dark:text-green-400">
                        {formatFinancialValue(client.payments_total)}
                      </td>
                    )}
                    {visibleColumns.paid_total && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-green-600 dark:text-green-400">
                        {formatFinancialValue(client.paid_total, client.total_value_currency)}
                      </td>
                    )}
                    {visibleColumns.total_outstanding && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                        {formatFinancialValue(client.total_outstanding, client.outstanding_currency)}
                      </td>
                    )}
                    {visibleColumns.total_expenses_paid && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                        {formatFinancialValue(client.total_expenses_paid, client.expenses_currency)}
                      </td>
                    )}
                    {visibleColumns.total_expenses_outstanding && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-red-600 dark:text-red-400">
                        {formatFinancialValue(client.total_expenses_outstanding, client.expenses_currency)}
                      </td>
                    )}
                    {visibleColumns.created_at && (
                      <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                        {formatDate(client.created_at)}
                      </td>
                    )}
                    {visibleColumns.actions && (
                      <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <Dropdown
                          trigger={
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 rounded-full transition-colors text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M10 10.8334C10.4603 10.8334 10.8334 10.4603 10.8334 10C10.8334 9.53978 10.4603 9.16669 10 9.16669C9.53978 9.16669 9.16669 9.53978 9.16669 10C9.16669 10.4603 9.53978 10.8334 10 10.8334Z"
                                  fill="currentColor"
                                />
                                <path
                                  d="M10 5.00002C10.4603 5.00002 10.8334 4.62692 10.8334 4.16669C10.8334 3.70645 10.4603 3.33335 10 3.33335C9.53978 3.33335 9.16669 3.70645 9.16669 4.16669C9.16669 4.62692 9.53978 5.00002 10 5.00002Z"
                                  fill="currentColor"
                                />
                                <path
                                  d="M10 16.6667C10.4603 16.6667 10.8334 16.2936 10.8334 15.8334C10.8334 15.3731 10.4603 15 10 15C9.53978 15 9.16669 15.3731 9.16669 15.8334C9.16669 16.2936 9.53978 16.6667 10 16.6667Z"
                                  fill="currentColor"
                                />
                              </svg>
                            </button>
                          }
                          align="end"
                          side="bottom"
                        >
                          <Dropdown.Item
                            onSelect={(e) => {
                              e.stopPropagation();
                              handleEditClient(client);
                            }}
                          >
                            <PencilIcon className="h-4 w-4" />
                            Edit
                          </Dropdown.Item>

                          <Dropdown.Item
                            onSelect={(e) => {
                              e.stopPropagation();
                              setClientToRemove(client);
                              setShowRemoveClientModal(true);
                            }}
                          >
                            <UserMinusIcon className="h-4 w-4" />
                            Remove from Client List
                          </Dropdown.Item>

                          <Dropdown.Item
                            onSelect={(e) => {
                              e.stopPropagation();
                              handleHideClient(client);
                            }}
                          >
                            {!client.is_hidden ? (
                              <>
                                <EyeSlashIcon className="h-4 w-4" />
                                Hide Client
                              </>
                            ) : (
                              <>
                                <EyeIcon className="h-4 w-4" />
                                Show Client
                              </>
                            )}
                          </Dropdown.Item>

                          <Dropdown.Item
                            onSelect={(e) => {
                              e.stopPropagation();
                              setClientToDelete(client);
                              setShowDeleteClientModal(true);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                            Delete Client
                          </Dropdown.Item>
                        </Dropdown>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Remove from Client List Confirmation Modal */}
      <ConfirmationModal
        isOpen={showRemoveClientModal}
        onClose={() => {
          setShowRemoveClientModal(false);
          setClientToRemove(null);
        }}
        onConfirm={handleRemoveFromClientList}
        title="Remove from Client List?"
        message={
          <div>
            <p className="mb-2">
              Are you sure you want to remove {clientToRemove ? getContactDisplayName(clientToRemove) : 'this client'}{' '}
              from your client list?
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Note: This will not remove them from the CRM or delete any history.
            </p>
          </div>
        }
        confirmText="Remove"
        cancelText="Cancel"
        confirmColor="orange"
        icon={UserMinusIcon}
        iconColor="text-orange-600"
      />

      {/* Delete Client Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteClientModal}
        onClose={() => {
          setShowDeleteClientModal(false);
          setClientToDelete(null);
        }}
        onConfirm={handleDeleteClient}
        title="Delete Client?"
        message={
          <div>
            <p className="mb-2">
              Are you sure you want to permanently delete{' '}
              {clientToDelete ? getContactDisplayName(clientToDelete) : 'this client'}?
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
              Warning: This action cannot be undone. All data associated with this client will be permanently deleted.
            </p>
          </div>
        }
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="red"
        icon={TrashIcon}
        iconColor="text-red-600"
      />
    </div>
  );
};

export default ClientsView;
