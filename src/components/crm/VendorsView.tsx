import React from 'react';
import { UserMinusIcon, EyeSlashIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useContacts, useCompanyCurrencies } from '../../hooks/crm';
import { useNotification } from '../../contexts/NotificationContext';
import { formatCurrencyWithCommas } from '../../utils/currency';
import Dropdown from '../ui/dropdown/Dropdown';
import ConfirmationModal from '../common/ConfirmationModal';
import { getContactDisplayName } from '../../utils/crm/contactUtils';
import { SortableHeader, EmptyState, LoadingSpinner } from '../shared';
import { useDeleteConfirmation } from '../../hooks/useDeleteConfirmation';

interface VendorsViewProps {
  onVendorClick?: (vendor: any) => void;
  openContactModal?: (vendor: any) => void;
  refreshKey?: number;
  // Filter props from useVendorsFilters
  searchQuery?: string;
  sortField?: string;
  sortDirection?: string;
  handleSortChange?: (field: string) => void;
  showHiddenVendors?: boolean;
  showPreferredCurrency?: boolean;
  visibleColumns?: Record<string, boolean>;
}

/**
 * VendorsView Component
 *
 * Displays a filtered view of contacts marked as vendors (is_vendor: true)
 * with financial summary data, vendor status, and management actions.
 */
const VendorsView: React.FC<VendorsViewProps> = ({
  onVendorClick,
  openContactModal,
  refreshKey = 0,
  // Filter props from useVendorsFilters
  searchQuery = '',
  sortField = 'created_at',
  sortDirection = 'desc',
  handleSortChange,
  showHiddenVendors = false,
  showPreferredCurrency = true,
  visibleColumns = {},
}) => {
  const removeConfirmation = useDeleteConfirmation<any>();
  const deleteConfirmation = useDeleteConfirmation<any>();

  const { showError, showSuccess } = useNotification();
  const { defaultCurrency, numberFormat } = useCompanyCurrencies();
  const defaultCurrencyCode = defaultCurrency?.currency?.code || 'GBP';

  // Fetch vendors (contacts with is_vendor: true) with financial details
  // When preserve_currencies is true, financial fields return as arrays with original currencies
  const { contacts: vendors, loading: vendorsLoading, updateContact, deleteContact, fetchContacts } = useContacts(
    {
      is_vendor: true,
      include_financial_details: true,
      ...(showPreferredCurrency === false && { preserve_currencies: true }),
      ...(searchQuery ? { search: searchQuery } : {}),
      ...(sortField ? { sort_by: sortField, sort_order: sortDirection || 'desc' } : {}),
      ...(showHiddenVendors ? {} : { is_hidden_vendor: false }),
    },
    refreshKey
  );

  // Helper to format financial values from backend
  // Handles both single values and array format (when preserve_currencies=true)
  const formatFinancialValue = (value: any, currency?: string): React.ReactNode => {
    // Handle array format (multiple currencies)
    if (Array.isArray(value)) {
      const nonZeroValues = value.filter((v: any) => v.amount && parseFloat(v.amount) !== 0);
      if (nonZeroValues.length === 0) {
        return formatCurrencyWithCommas(0, defaultCurrencyCode, numberFormat);
      }
      if (nonZeroValues.length > 1) {
        // Multiple currencies - show on separate lines
        return (
          <div className="flex flex-col">
            {nonZeroValues.map((v: any, index: number) => (
              <span key={index}>
                {formatCurrencyWithCommas(parseFloat(v.amount), v.currency_code, numberFormat)}
              </span>
            ))}
          </div>
        );
      }
      // Single currency in array
      const singleValue = nonZeroValues[0];
      return formatCurrencyWithCommas(parseFloat(singleValue.amount), singleValue.currency_code, numberFormat);
    }

    // Handle single value format
    if (value === null || value === undefined) {
      return formatCurrencyWithCommas(0, currency || defaultCurrencyCode, numberFormat);
    }
    return formatCurrencyWithCommas(parseFloat(value), currency || defaultCurrencyCode, numberFormat);
  };

  // Search, sort, and hidden filtering are now server-side via useContacts filters
  const getFilteredVendors = () => vendors || [];

  const handleEditVendor = (vendor: any) => {
    if (openContactModal) {
      openContactModal(vendor);
    }
  };

  const handleHideVendor = async (vendor: any) => {
    try {
      const isCurrentlyHidden = vendor.is_hidden_vendor === true;
      const newHiddenState = !isCurrentlyHidden;
      await updateContact(vendor.id, { is_hidden_vendor: newHiddenState });
      showSuccess(newHiddenState ? 'Vendor has been hidden' : 'Vendor is now visible');

      // Refetch so the server-side filter removes/adds the vendor appropriately
      fetchContacts();
    } catch (error) {
      console.error('Error updating vendor visibility:', error);
      showError('Failed to update vendor visibility');
    }
  };

  const handleRemoveFromVendorList = async () => {
    await removeConfirmation.confirmDelete(async (vendor) => {
      try {
        await updateContact(vendor.id, { is_vendor: false });
        const displayName = getContactDisplayName(vendor);
        showSuccess(`${displayName} removed from vendor list`);
      } catch (error) {
        console.error('Error removing vendor from list:', error);
        showError('Failed to remove vendor from list');
        throw error;
      }
    });
  };

  const handleDeleteVendor = async () => {
    await deleteConfirmation.confirmDelete(async (vendor) => {
      try {
        await deleteContact(vendor.id);
        const displayName = getContactDisplayName(vendor);
        showSuccess(`${displayName} deleted permanently`);
      } catch (error) {
        console.error('Error deleting vendor:', error);
        showError('Failed to delete vendor');
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
        year: 'numeric'
      });
    } catch (_error) {
      return '-';
    }
  };

  const filteredVendors = getFilteredVendors();

  // Default visible columns if not provided
  const columns: Record<string, boolean> = {
    name: visibleColumns.name ?? true,
    email: visibleColumns.email ?? true,
    phone: visibleColumns.phone ?? false,
    business_name: visibleColumns.business_name ?? false,
    expenses_paid: visibleColumns.expenses_paid ?? true,
    expenses_outstanding: visibleColumns.expenses_outstanding ?? true,
    vendor_since: visibleColumns.vendor_since ?? true,
    actions: visibleColumns.actions ?? true,
  };

  // Count visible columns for colspan
  const visibleColumnCount = Object.values(columns).filter(Boolean).length;

  if (vendorsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-[#e5e5e5] dark:border-gray-700 h-full">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e5e5e5] dark:border-gray-700">
              {columns.name && (
                <SortableHeader
                  field="name"
                  label="Vendor"
                  currentSort={sortField}
                  currentDirection={sortDirection as 'asc' | 'desc'}
                  onSort={handleSortChange!}
                />
              )}
              {columns.email && (
                <SortableHeader
                  field="email"
                  label="Email"
                  currentSort={sortField}
                  currentDirection={sortDirection as 'asc' | 'desc'}
                  onSort={handleSortChange!}
                />
              )}
              {columns.phone && (
                <SortableHeader
                  field="phone"
                  label="Phone"
                  currentSort={sortField}
                  currentDirection={sortDirection as 'asc' | 'desc'}
                  onSort={handleSortChange!}
                />
              )}
              {columns.business_name && (
                <SortableHeader
                  field="business_name"
                  label="Company"
                  currentSort={sortField}
                  currentDirection={sortDirection as 'asc' | 'desc'}
                  onSort={handleSortChange!}
                />
              )}
              {columns.expenses_paid && (
                <SortableHeader
                  field="expenses_paid"
                  label="Expenses Paid"
                  currentSort={sortField}
                  currentDirection={sortDirection as 'asc' | 'desc'}
                  onSort={handleSortChange!}
                  align="right"
                />
              )}
              {columns.expenses_outstanding && (
                <SortableHeader
                  field="expenses_outstanding"
                  label="Outstanding"
                  currentSort={sortField}
                  currentDirection={sortDirection as 'asc' | 'desc'}
                  onSort={handleSortChange!}
                  align="right"
                />
              )}
              {columns.vendor_since && (
                <SortableHeader
                  field="vendor_since"
                  label="Vendor Since"
                  currentSort={sortField}
                  currentDirection={sortDirection as 'asc' | 'desc'}
                  onSort={handleSortChange!}
                />
              )}
              {columns.actions && (
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400"></th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredVendors.length === 0 ? (
              <EmptyState
                title={searchQuery ? 'No vendors match your search' : 'No vendors found'}
                colSpan={visibleColumnCount}
              />
            ) : (
              filteredVendors.map((vendor: any, index: number) => {
                const isHidden = vendor.is_hidden_vendor === true;
                const hiddenClass = isHidden ? 'line-through italic opacity-60' : '';

                return (
                  <tr
                    key={vendor.id}
                    className={`border-b border-[#e5e5e5] dark:border-gray-700 hover:cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${index === filteredVendors.length - 1 ? 'border-b-0' : ''}`}
                    onClick={() => onVendorClick && onVendorClick(vendor)}
                  >
                    {columns.name && (
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                            {vendor.profile_picture ? (
                              <img src={vendor.profile_picture} alt={getContactDisplayName(vendor)} className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-medium text-sm text-gray-600 dark:text-gray-400">
                                {(vendor.first_name || vendor.business_name || '')?.[0]?.toUpperCase()}
                                {(vendor.last_name || '')?.[0]?.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className={`font-medium text-gray-900 dark:text-white ${hiddenClass}`}>
                              {vendor.display_name || vendor.business_name || 'Unnamed Vendor'}
                            </p>
                          </div>
                        </div>
                      </td>
                    )}
                    {columns.email && (
                      <td className={`px-4 py-4 text-sm text-gray-600 dark:text-gray-400 ${hiddenClass}`}>
                        {vendor.email || '-'}
                      </td>
                    )}
                    {columns.phone && (
                      <td className={`px-4 py-4 text-sm text-gray-600 dark:text-gray-400 ${hiddenClass}`}>
                        {vendor.phone || '-'}
                      </td>
                    )}
                    {columns.business_name && (
                      <td className={`px-4 py-4 text-sm text-gray-900 dark:text-white ${hiddenClass}`}>
                        {vendor.business_name || '-'}
                      </td>
                    )}
                    {columns.expenses_paid && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                        {formatFinancialValue(vendor.total_expenses_paid, vendor.expenses_currency)}
                      </td>
                    )}
                    {columns.expenses_outstanding && (
                      <td className="px-4 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                        {formatFinancialValue(vendor.total_expenses_outstanding, vendor.expenses_currency)}
                      </td>
                    )}
                    {columns.vendor_since && (
                      <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                        {formatDate(vendor.created_at)}
                      </td>
                    )}
                    {columns.actions && (
                      <td className="px-4 py-4 text-right" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <Dropdown
                          trigger={
                            <button
                              onClick={(e: React.MouseEvent) => e.stopPropagation()}
                              className="p-1 rounded-full transition-colors text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10 10.8334C10.4603 10.8334 10.8334 10.4603 10.8334 10C10.8334 9.53978 10.4603 9.16669 10 9.16669C9.53978 9.16669 9.16669 9.53978 9.16669 10C9.16669 10.4603 9.53978 10.8334 10 10.8334Z" fill="currentColor"/>
                                <path d="M10 5.00002C10.4603 5.00002 10.8334 4.62692 10.8334 4.16669C10.8334 3.70645 10.4603 3.33335 10 3.33335C9.53978 3.33335 9.16669 3.70645 9.16669 4.16669C9.16669 4.62692 9.53978 5.00002 10 5.00002Z" fill="currentColor"/>
                                <path d="M10 16.6667C10.4603 16.6667 10.8334 16.2936 10.8334 15.8334C10.8334 15.3731 10.4603 15 10 15C9.53978 15 9.16669 15.3731 9.16669 15.8334C9.16669 16.2936 9.53978 16.6667 10 16.6667Z" fill="currentColor"/>
                              </svg>
                            </button>
                          }
                          align="end"
                          side="bottom"
                        >
                          <Dropdown.Item
                            onSelect={(e: any) => {
                              e.stopPropagation();
                              handleEditVendor(vendor);
                            }}
                          >
                            <PencilIcon className="h-4 w-4" />
                            Edit
                          </Dropdown.Item>

                          <Dropdown.Item
                            onSelect={(e: any) => {
                              e.stopPropagation();
                              removeConfirmation.requestDelete(vendor);
                            }}
                          >
                            <UserMinusIcon className="h-4 w-4" />
                            Remove from Vendor List
                          </Dropdown.Item>

                          <Dropdown.Item
                            onSelect={(e: any) => {
                              e.stopPropagation();
                              handleHideVendor(vendor);
                            }}
                          >
                            {!vendor.is_hidden_vendor ? (
                              <>
                                <EyeSlashIcon className="h-4 w-4" />
                                Hide Vendor
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
                              deleteConfirmation.requestDelete(vendor);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                            Delete Vendor
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

      {/* Remove from Vendor List Confirmation Modal */}
      <ConfirmationModal
        isOpen={removeConfirmation.isOpen}
        onClose={removeConfirmation.cancelDelete}
        onConfirm={handleRemoveFromVendorList}
        title="Remove from Vendor List?"
        message={
          <div>
            <p className="mb-2">
              Are you sure you want to remove {removeConfirmation.item ? getContactDisplayName(removeConfirmation.item) : 'this vendor'} from your vendor list?
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

      {/* Delete Vendor Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={deleteConfirmation.cancelDelete}
        onConfirm={handleDeleteVendor}
        title="Delete Vendor?"
        message={
          <div>
            <p className="mb-2">
              Are you sure you want to permanently delete {deleteConfirmation.item ? getContactDisplayName(deleteConfirmation.item) : 'this vendor'}?
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
              Warning: This action cannot be undone. All data associated with this vendor will be permanently deleted.
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

export default VendorsView;
