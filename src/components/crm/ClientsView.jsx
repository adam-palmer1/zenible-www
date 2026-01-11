import React, { useState, useMemo } from 'react';
import {
  UserMinusIcon,
  EyeSlashIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useContacts } from '../../hooks/crm';
import { useNotification } from '../../contexts/NotificationContext';
import { formatCurrency } from '../../utils/currency';
import Dropdown from '../ui/dropdown/Dropdown';
import ConfirmationModal from '../common/ConfirmationModal';
import { getContactDisplayName } from '../../utils/crm/contactUtils';

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
  selectedSort,
  showHiddenClients,
  visibleColumns,
  availableColumns,
}) => {
  const { showError, showSuccess } = useNotification();

  const [showRemoveClientModal, setShowRemoveClientModal] = useState(false);
  const [clientToRemove, setClientToRemove] = useState(null);
  const [showDeleteClientModal, setShowDeleteClientModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);

  // Fetch clients (contacts with is_client: true) with financial details
  const { contacts: clients, loading: clientsLoading, updateContact, deleteContact } = useContacts(
    { is_client: true, include_financial_details: true },
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
      filtered = filtered.filter((client) => client.is_visible_in_clients !== false);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (selectedSort) {
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'name':
          const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim();
          const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim();
          return nameA.localeCompare(nameB);
        case 'services_high':
          return (b.services_count || 0) - (a.services_count || 0);
        case 'services_low':
          return (a.services_count || 0) - (b.services_count || 0);
        case 'value_high':
          const totalA = parseFloat(a.one_off_total || 0) + parseFloat(a.recurring_total || 0);
          const totalB = parseFloat(b.one_off_total || 0) + parseFloat(b.recurring_total || 0);
          return totalB - totalA;
        case 'value_low':
          const totalA2 = parseFloat(a.one_off_total || 0) + parseFloat(a.recurring_total || 0);
          const totalB2 = parseFloat(b.one_off_total || 0) + parseFloat(b.recurring_total || 0);
          return totalA2 - totalB2;
        default:
          return 0;
      }
    });

    return filtered;
  }, [clients, searchQuery, showHiddenClients, selectedSort]);

  const handleEditClient = (client) => {
    if (openContactModal) {
      openContactModal(client);
    }
  };

  const handleHideClient = async (client) => {
    try {
      // Determine current visibility state (undefined/null/true = visible, false = hidden)
      const isCurrentlyVisible = client.is_visible_in_clients !== false;
      const newVisibility = !isCurrentlyVisible;

      // updateContact handles both API call and local state update
      await updateContact(client.id, { is_visible_in_clients: newVisibility });

      showSuccess(newVisibility ? 'Client is now visible' : 'Client has been hidden');
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

  const formatFinancialValue = (value, currency) => {
    if (!value || value === null || value === '0' || parseFloat(value) === 0) {
      return '-';
    }
    return formatCurrency(parseFloat(value), currency || 'USD');
  };

  // Extract total outstanding from financial_details
  const getTotalOutstanding = (client) => {
    if (!client.financial_details?.invoices_by_currency || client.financial_details.invoices_by_currency.length === 0) {
      return { value: null, currency: null };
    }

    // If single currency, return that
    if (client.financial_details.invoices_by_currency.length === 1) {
      const invoice = client.financial_details.invoices_by_currency[0];
      return {
        value: invoice.total_outstanding,
        currency: invoice.currency_code,
      };
    }

    // If multiple currencies, sum them all and show as multi-currency
    // For now, just return the first one (can be enhanced later)
    const invoice = client.financial_details.invoices_by_currency[0];
    return {
      value: invoice.total_outstanding,
      currency: invoice.currency_code,
    };
  };

  // Extract total billed from financial_details
  const getTotalBilled = (client) => {
    if (!client.financial_details?.invoices_by_currency || client.financial_details.invoices_by_currency.length === 0) {
      return { value: null, currency: null };
    }

    // If single currency, return that
    if (client.financial_details.invoices_by_currency.length === 1) {
      const invoice = client.financial_details.invoices_by_currency[0];
      return {
        value: invoice.total_billed,
        currency: invoice.currency_code,
      };
    }

    // If multiple currencies, return the first one (can be enhanced later)
    const invoice = client.financial_details.invoices_by_currency[0];
    return {
      value: invoice.total_billed,
      currency: invoice.currency_code,
    };
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
              {visibleColumns.name && (
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Name
                </th>
              )}
              {visibleColumns.email && (
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Email
                </th>
              )}
              {visibleColumns.phone && (
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Phone
                </th>
              )}
              {visibleColumns.business_name && (
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Company
                </th>
              )}
              {visibleColumns.services_count && (
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Services
                </th>
              )}
              {visibleColumns.one_off_total && (
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  One-off Total
                </th>
              )}
              {visibleColumns.recurring_total && (
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Recurring Total
                </th>
              )}
              {visibleColumns.amount_outstanding && (
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Amount Outstanding
                </th>
              )}
              {visibleColumns.total_billed && (
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Billed
                </th>
              )}
              {visibleColumns.client_since && (
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Client Since
                </th>
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
                    {visibleColumns.name && (
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                            {client.profile_picture ? (
                              <img
                                src={client.profile_picture}
                                alt={`${client.first_name} ${client.last_name}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="font-medium text-sm text-gray-600 dark:text-gray-400">
                                {client.first_name?.[0]}
                                {client.last_name?.[0]}
                              </span>
                            )}
                          </div>
                          <div>
                            <p
                              className={`font-medium text-gray-900 dark:text-white ${
                                client.is_visible_in_clients === false ? 'line-through italic opacity-60' : ''
                              }`}
                            >
                              {client.first_name} {client.last_name}
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
                    {visibleColumns.services_count && (
                      <td className="px-4 py-4 text-sm text-center text-gray-900 dark:text-white">
                        {client.services_count || 0}
                      </td>
                    )}
                    {visibleColumns.one_off_total && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                        {formatFinancialValue(client.one_off_total, client.total_value_currency)}
                      </td>
                    )}
                    {visibleColumns.recurring_total && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                        {formatFinancialValue(client.recurring_total, client.total_value_currency)}
                      </td>
                    )}
                    {visibleColumns.amount_outstanding && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                        {(() => {
                          const { value, currency } = getTotalOutstanding(client);
                          return formatFinancialValue(value, currency);
                        })()}
                      </td>
                    )}
                    {visibleColumns.total_billed && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                        {(() => {
                          const { value, currency } = getTotalBilled(client);
                          return formatFinancialValue(value, currency);
                        })()}
                      </td>
                    )}
                    {visibleColumns.client_since && (
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
                            {client.is_visible_in_clients !== false ? (
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
