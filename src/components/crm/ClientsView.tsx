import React, { useMemo } from 'react';
import {
  UserMinusIcon,
  EyeSlashIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useContacts, useCompanyCurrencies } from '../../hooks/crm';
import { useNotification } from '../../contexts/NotificationContext';
import { formatCurrency } from '../../utils/currency';
import Dropdown from '../ui/dropdown/Dropdown';
import ConfirmationModal from '../common/ConfirmationModal';
import { getContactDisplayName } from '../../utils/crm/contactUtils';
import { SortableHeader, EmptyState, LoadingSpinner } from '../shared';
import { useDeleteConfirmation } from '../../hooks/useDeleteConfirmation';

interface ClientsViewProps {
  onClientClick?: (client: any) => void;
  openContactModal?: (client: any) => void;
  refreshKey?: number;
  searchQuery: string;
  sortField: string;
  sortDirection: string;
  handleSortChange: (field: string) => void;
  showHiddenClients: boolean;
  showPreferredCurrency?: boolean;
  visibleColumns: Record<string, boolean>;
  availableColumns: any;
  visibleFieldNames?: string[];
  fieldsLoading?: boolean;
}

/**
 * ClientsView Component
 *
 * Displays a filtered view of contacts marked as clients (is_client: true)
 * with financial data, customizable columns, search, filters, and sorting.
 */
const ClientsView: React.FC<ClientsViewProps> = ({
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
  availableColumns: _availableColumns,
  visibleFieldNames = [],
  fieldsLoading = false,
}) => {
  const { showError, showSuccess } = useNotification();
  const { defaultCurrency, numberFormat } = useCompanyCurrencies();

  // Get the default currency code for formatting
  const defaultCurrencyCode = defaultCurrency?.currency?.code || 'GBP';

  const removeConfirmation = useDeleteConfirmation<any>();
  const deleteConfirmation = useDeleteConfirmation<any>();

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
      'country_code',
      'is_hidden_client',
      'created_at',
    ];

    const baseFilters: any = {
      is_client: true,
      ...(searchQuery ? { search: searchQuery } : {}),
      ...(sortField ? { sort_by: sortField, sort_order: sortDirection || 'desc' } : {}),
      ...(showHiddenClients ? {} : { is_hidden_client: false }),
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
  }, [visibleFieldNames, showPreferredCurrency, fieldsLoading, searchQuery, sortField, sortDirection, showHiddenClients]);

  // Fetch clients (contacts with is_client: true) with only the requested fields
  const { contacts: clients, loading: clientsLoading, updateContact, deleteContact, fetchContacts } = useContacts(
    contactFilters,
    refreshKey
  );

  // Search, sort, and hidden filtering are now server-side via contactFilters
  const filteredClients = clients;

  const handleEditClient = (client: any) => {
    if (openContactModal) {
      openContactModal(client);
    }
  };

  const handleHideClient = async (client: any) => {
    try {
      // Determine current hidden state
      const isCurrentlyHidden = client.is_hidden_client === true;
      const newHiddenState = !isCurrentlyHidden;

      // updateContact handles both API call and local state update
      await updateContact(client.id, { is_hidden_client: newHiddenState });

      showSuccess(newHiddenState ? 'Client has been hidden' : 'Client is now visible');

      // Refetch so the server-side filter removes/adds the contact appropriately
      fetchContacts();
    } catch (error) {
      console.error('Error updating client visibility:', error);
      showError('Failed to update client visibility');
    }
  };

  const handleRemoveFromClientList = async () => {
    await removeConfirmation.confirmDelete(async (client) => {
      try {
        await updateContact(client.id, { is_client: false });
        const displayName = getContactDisplayName(client);
        showSuccess(`${displayName} removed from client list`);
      } catch (error) {
        console.error('Error removing client from list:', error);
        showError('Failed to remove client from list');
        throw error;
      }
    });
  };

  const handleDeleteClient = async () => {
    await deleteConfirmation.confirmDelete(async (client) => {
      try {
        await deleteContact(client.id);
        const displayName = getContactDisplayName(client);
        showSuccess(`${displayName} deleted permanently`);
      } catch (error) {
        console.error('Error deleting client:', error);
        showError('Failed to delete client');
        throw error;
      }
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      });
    } catch (_error) {
      return '-';
    }
  };

  // Format financial value - handles both single value and array format (when preserve_currencies=true)
  // Returns a React element when multiple currencies, or a string for single value
  const formatFinancialValue = (value: any, currency?: string): any => {
    // Handle array format (when preserve_currencies=true)
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return '-';
      }

      // Filter out zero values
      const nonZeroValues = value.filter((v: any) => v.amount && parseFloat(v.amount) !== 0);

      if (nonZeroValues.length === 0) {
        return '-';
      }

      // If multiple currencies, show each on separate line
      if (nonZeroValues.length > 1) {
        return (
          <div className="flex flex-col">
            {nonZeroValues.map((v: any, index: number) => (
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
    return <LoadingSpinner />;
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-[#e5e5e5] dark:border-gray-700 h-full flex flex-col">
      {/* Table */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e5e5e5] dark:border-gray-700">
              {visibleColumns.display_name && (
                <SortableHeader
                  field="display_name"
                  label="Name"
                  currentSort={sortField}
                  currentDirection={sortDirection as 'asc' | 'desc'}
                  onSort={handleSortChange}
                  align="left"
                />
              )}
              {visibleColumns.email && (
                <SortableHeader
                  field="email"
                  label="Email"
                  currentSort={sortField}
                  currentDirection={sortDirection as 'asc' | 'desc'}
                  onSort={handleSortChange}
                  align="left"
                />
              )}
              {visibleColumns.phone && (
                <SortableHeader
                  field="phone"
                  label="Phone"
                  currentSort={sortField}
                  currentDirection={sortDirection as 'asc' | 'desc'}
                  onSort={handleSortChange}
                  align="left"
                />
              )}
              {visibleColumns.business_name && (
                <SortableHeader
                  field="business_name"
                  label="Company"
                  currentSort={sortField}
                  currentDirection={sortDirection as 'asc' | 'desc'}
                  onSort={handleSortChange}
                  align="left"
                />
              )}
              {visibleColumns.confirmed_services_count && (
                <SortableHeader field="confirmed_services_count" label="Confirmed Services" currentSort={sortField} currentDirection={sortDirection as 'asc' | 'desc'} onSort={handleSortChange} align="center" />
              )}
              {visibleColumns.active_services_count && (
                <SortableHeader field="active_services_count" label="Active Services" currentSort={sortField} currentDirection={sortDirection as 'asc' | 'desc'} onSort={handleSortChange} align="center" />
              )}
              {visibleColumns.pending_services_count && (
                <SortableHeader field="pending_services_count" label="Pending Services" currentSort={sortField} currentDirection={sortDirection as 'asc' | 'desc'} onSort={handleSortChange} align="center" />
              )}
              {visibleColumns.confirmed_one_off_total && (
                <SortableHeader field="confirmed_one_off_total" label="Confirmed One-off" currentSort={sortField} currentDirection={sortDirection as 'asc' | 'desc'} onSort={handleSortChange} align="right" />
              )}
              {visibleColumns.active_one_off_total && (
                <SortableHeader field="active_one_off_total" label="Active One-off" currentSort={sortField} currentDirection={sortDirection as 'asc' | 'desc'} onSort={handleSortChange} align="right" />
              )}
              {visibleColumns.pending_one_off_total && (
                <SortableHeader field="pending_one_off_total" label="Pending One-off" currentSort={sortField} currentDirection={sortDirection as 'asc' | 'desc'} onSort={handleSortChange} align="right" />
              )}
              {visibleColumns.lifetime_one_off_total && (
                <SortableHeader field="lifetime_one_off_total" label="Lifetime One-off" currentSort={sortField} currentDirection={sortDirection as 'asc' | 'desc'} onSort={handleSortChange} align="right" />
              )}
              {visibleColumns.confirmed_recurring_total && (
                <SortableHeader field="confirmed_recurring_total" label="Confirmed Recurring" currentSort={sortField} currentDirection={sortDirection as 'asc' | 'desc'} onSort={handleSortChange} align="right" />
              )}
              {visibleColumns.active_recurring_total && (
                <SortableHeader field="active_recurring_total" label="Active Recurring" currentSort={sortField} currentDirection={sortDirection as 'asc' | 'desc'} onSort={handleSortChange} align="right" />
              )}
              {visibleColumns.pending_recurring_total && (
                <SortableHeader field="pending_recurring_total" label="Pending Recurring" currentSort={sortField} currentDirection={sortDirection as 'asc' | 'desc'} onSort={handleSortChange} align="right" />
              )}
              {visibleColumns.value_net_total && (
                <SortableHeader field="value_net_total" label="Value (Net)" currentSort={sortField} currentDirection={sortDirection as 'asc' | 'desc'} onSort={handleSortChange} align="right" />
              )}
              {visibleColumns.expenses_total && (
                <SortableHeader field="expenses_total" label="Expenses Total" currentSort={sortField} currentDirection={sortDirection as 'asc' | 'desc'} onSort={handleSortChange} align="right" />
              )}
              {visibleColumns.value_gross_total && (
                <SortableHeader field="value_gross_total" label="Value (Gross)" currentSort={sortField} currentDirection={sortDirection as 'asc' | 'desc'} onSort={handleSortChange} align="right" />
              )}
              {visibleColumns.attribution_total && (
                <SortableHeader field="attribution_total" label="Attribution Total" currentSort={sortField} currentDirection={sortDirection as 'asc' | 'desc'} onSort={handleSortChange} align="right" />
              )}
              {visibleColumns.invoiced_total && (
                <SortableHeader field="invoiced_total" label="Total Invoiced" currentSort={sortField} currentDirection={sortDirection as 'asc' | 'desc'} onSort={handleSortChange} align="right" />
              )}
              {visibleColumns.payments_total && (
                <SortableHeader field="payments_total" label="Payments Total" currentSort={sortField} currentDirection={sortDirection as 'asc' | 'desc'} onSort={handleSortChange} align="right" />
              )}
              {visibleColumns.paid_total && (
                <SortableHeader field="paid_total" label="Paid Total" currentSort={sortField} currentDirection={sortDirection as 'asc' | 'desc'} onSort={handleSortChange} align="right" />
              )}
              {visibleColumns.total_outstanding && (
                <SortableHeader field="total_outstanding" label="Outstanding" currentSort={sortField} currentDirection={sortDirection as 'asc' | 'desc'} onSort={handleSortChange} align="right" />
              )}
              {visibleColumns.total_expenses_paid && (
                <SortableHeader field="total_expenses_paid" label="Expenses Paid" currentSort={sortField} currentDirection={sortDirection as 'asc' | 'desc'} onSort={handleSortChange} align="right" />
              )}
              {visibleColumns.total_expenses_outstanding && (
                <SortableHeader field="total_expenses_outstanding" label="Expenses Outstanding" currentSort={sortField} currentDirection={sortDirection as 'asc' | 'desc'} onSort={handleSortChange} align="right" />
              )}
              {visibleColumns.created_at && (
                <SortableHeader field="created_at" label="Client Since" currentSort={sortField} currentDirection={sortDirection as 'asc' | 'desc'} onSort={handleSortChange} align="left" />
              )}
              {visibleColumns.actions && (
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400"></th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredClients.length === 0 ? (
              <EmptyState
                title="No clients found"
                colSpan={Object.values(visibleColumns).filter(Boolean).length}
              />
            ) : (
              filteredClients.map((client: any, index: number) => {
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
                                client.is_hidden_client ? 'line-through italic opacity-60' : ''
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
                        {client.phone ? `${client.country_code || ''} ${client.phone}`.trim() : '-'}
                      </td>
                    )}
                    {visibleColumns.business_name && (
                      <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                        {client.business_name || '-'}
                      </td>
                    )}
                    {visibleColumns.confirmed_services_count && (
                      <td className="px-4 py-4 text-sm text-center text-zenible-primary">{client.confirmed_services_count || 0}</td>
                    )}
                    {visibleColumns.active_services_count && (
                      <td className="px-4 py-4 text-sm text-center text-gray-900 dark:text-white">{client.active_services_count || 0}</td>
                    )}
                    {visibleColumns.pending_services_count && (
                      <td className="px-4 py-4 text-sm text-center text-amber-600 dark:text-amber-400">{client.pending_services_count || 0}</td>
                    )}
                    {visibleColumns.confirmed_one_off_total && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-zenible-primary">{formatFinancialValue(client.confirmed_one_off_total, client.total_value_currency)}</td>
                    )}
                    {visibleColumns.active_one_off_total && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">{formatFinancialValue(client.active_one_off_total, client.total_value_currency)}</td>
                    )}
                    {visibleColumns.pending_one_off_total && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-amber-600 dark:text-amber-400">{formatFinancialValue(client.pending_one_off_total, client.total_value_currency)}</td>
                    )}
                    {visibleColumns.lifetime_one_off_total && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">{formatFinancialValue(client.lifetime_one_off_total, client.total_value_currency)}</td>
                    )}
                    {visibleColumns.confirmed_recurring_total && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-zenible-primary">{formatFinancialValue(client.confirmed_recurring_total, client.total_value_currency)}</td>
                    )}
                    {visibleColumns.active_recurring_total && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">{formatFinancialValue(client.active_recurring_total, client.total_value_currency)}</td>
                    )}
                    {visibleColumns.pending_recurring_total && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-amber-600 dark:text-amber-400">{formatFinancialValue(client.pending_recurring_total, client.total_value_currency)}</td>
                    )}
                    {visibleColumns.value_net_total && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">{formatFinancialValue(client.value_net_total, client.total_value_currency)}</td>
                    )}
                    {visibleColumns.expenses_total && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-red-600 dark:text-red-400">{formatFinancialValue(client.expenses_total, client.expenses_currency)}</td>
                    )}
                    {visibleColumns.value_gross_total && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">{formatFinancialValue(client.value_gross_total, client.total_value_currency)}</td>
                    )}
                    {visibleColumns.attribution_total && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">{formatFinancialValue(client.attribution_total, client.total_value_currency)}</td>
                    )}
                    {visibleColumns.invoiced_total && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">{formatFinancialValue(client.invoiced_total)}</td>
                    )}
                    {visibleColumns.payments_total && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-green-600 dark:text-green-400">{formatFinancialValue(client.payments_total)}</td>
                    )}
                    {visibleColumns.paid_total && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-green-600 dark:text-green-400">{formatFinancialValue(client.paid_total, client.total_value_currency)}</td>
                    )}
                    {visibleColumns.total_outstanding && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">{formatFinancialValue(client.total_outstanding, client.outstanding_currency)}</td>
                    )}
                    {visibleColumns.total_expenses_paid && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">{formatFinancialValue(client.total_expenses_paid, client.expenses_currency)}</td>
                    )}
                    {visibleColumns.total_expenses_outstanding && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-red-600 dark:text-red-400">{formatFinancialValue(client.total_expenses_outstanding, client.expenses_currency)}</td>
                    )}
                    {visibleColumns.created_at && (
                      <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">{formatDate(client.created_at)}</td>
                    )}
                    {visibleColumns.actions && (
                      <td className="px-4 py-4 text-right" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <Dropdown
                          trigger={
                            <button
                              onClick={(e: React.MouseEvent) => e.stopPropagation()}
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
                            onSelect={(e: any) => {
                              e.stopPropagation();
                              handleEditClient(client);
                            }}
                          >
                            <PencilIcon className="h-4 w-4" />
                            Edit
                          </Dropdown.Item>

                          <Dropdown.Item
                            onSelect={(e: any) => {
                              e.stopPropagation();
                              removeConfirmation.requestDelete(client);
                            }}
                          >
                            <UserMinusIcon className="h-4 w-4" />
                            Remove from Client List
                          </Dropdown.Item>

                          <Dropdown.Item
                            onSelect={(e: any) => {
                              e.stopPropagation();
                              handleHideClient(client);
                            }}
                          >
                            {!client.is_hidden_client ? (
                              <>
                                <EyeSlashIcon className="h-4 w-4" />
                                Hide Client
                              </>
                            ) : (
                              <>
                                <EyeIcon className="h-4 w-4" />
                                Unhide
                              </>
                            )}
                          </Dropdown.Item>

                          <Dropdown.Item
                            onSelect={(e: any) => {
                              e.stopPropagation();
                              deleteConfirmation.requestDelete(client);
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
        isOpen={removeConfirmation.isOpen}
        onClose={removeConfirmation.cancelDelete}
        onConfirm={handleRemoveFromClientList}
        title="Remove from Client List?"
        message={
          <div>
            <p className="mb-2">
              Are you sure you want to remove {removeConfirmation.item ? getContactDisplayName(removeConfirmation.item) : 'this client'}{' '}
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
        isOpen={deleteConfirmation.isOpen}
        onClose={deleteConfirmation.cancelDelete}
        onConfirm={handleDeleteClient}
        title="Delete Client?"
        message={
          <div>
            <p className="mb-2">
              Are you sure you want to permanently delete{' '}
              {deleteConfirmation.item ? getContactDisplayName(deleteConfirmation.item) : 'this client'}?
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
