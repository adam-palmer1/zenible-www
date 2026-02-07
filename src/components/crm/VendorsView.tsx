import React, { useState } from 'react';
import { UserMinusIcon, EyeSlashIcon, EyeIcon, PencilIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useContacts, useCompanyCurrencies } from '../../hooks/crm';
import { useNotification } from '../../contexts/NotificationContext';
import { formatCurrencyWithCommas } from '../../utils/currency';
import Dropdown from '../ui/dropdown/Dropdown';
import ConfirmationModal from '../common/ConfirmationModal';
import { getContactDisplayName } from '../../utils/crm/contactUtils';

interface SortableColumnHeaderProps {
  field: string;
  label: string;
  sortField: string;
  sortDirection: string;
  onSort: (field: string) => void;
  align?: 'left' | 'right';
}

// Sortable Column Header Component
const SortableColumnHeader: React.FC<SortableColumnHeaderProps> = ({ field, label, sortField, sortDirection, onSort, align = 'left' }) => {
  const isActive = sortField === field;
  const alignClass = align === 'right' ? 'justify-end' : 'justify-start';

  // Sort icon when not active
  const SortIcon = () => (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 3L12 7H4L8 3Z" />
      <path d="M8 13L4 9H12L8 13Z" />
    </svg>
  );

  return (
    <th
      className="px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 select-none"
      onClick={() => onSort(field)}
    >
      <div className={`flex items-center gap-1 ${alignClass}`}>
        <span>{label}</span>
        <span className={`transition-colors ${isActive ? 'text-zenible-primary' : 'text-gray-300'}`}>
          {isActive ? (
            sortDirection === 'asc' ? (
              <ChevronUpIcon className="h-4 w-4" />
            ) : (
              <ChevronDownIcon className="h-4 w-4" />
            )
          ) : (
            <SortIcon />
          )}
        </span>
      </div>
    </th>
  );
};

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
  const [showRemoveVendorModal, setShowRemoveVendorModal] = useState(false);
  const [vendorToRemove, setVendorToRemove] = useState<any>(null);
  const [showDeleteVendorModal, setShowDeleteVendorModal] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<any>(null);

  const { showError, showSuccess } = useNotification() as any;
  const { defaultCurrency, numberFormat } = useCompanyCurrencies() as any;
  const defaultCurrencyCode = defaultCurrency?.currency?.code || 'GBP';

  // Fetch vendors (contacts with is_vendor: true) with financial details
  // When preserve_currencies is true, financial fields return as arrays with original currencies
  const { contacts: vendors, loading: vendorsLoading, updateContact, deleteContact } = useContacts(
    {
      is_vendor: true,
      include_financial_details: true,
      ...(showPreferredCurrency === false && { preserve_currencies: true }),
    },
    refreshKey
  ) as any;

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

  // Filter and sort vendors
  const getFilteredVendors = () => {
    let filtered = [...(vendors || [])];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((vendor: any) =>
        vendor.first_name?.toLowerCase().includes(query) ||
        vendor.last_name?.toLowerCase().includes(query) ||
        vendor.email?.toLowerCase().includes(query) ||
        vendor.business_name?.toLowerCase().includes(query) ||
        vendor.display_name?.toLowerCase().includes(query)
      );
    }

    // Apply hidden filter
    if (!showHiddenVendors) {
      filtered = filtered.filter((vendor: any) => vendor.is_visible_in_vendors !== false);
    }

    // Apply field-based sorting
    filtered.sort((a: any, b: any) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
        case 'display_name': {
          const nameA = (a.display_name || a.business_name || '').toLowerCase();
          const nameB = (b.display_name || b.business_name || '').toLowerCase();
          comparison = nameA.localeCompare(nameB);
          break;
        }
        case 'email': {
          const emailA = (a.email || '').toLowerCase();
          const emailB = (b.email || '').toLowerCase();
          comparison = emailA.localeCompare(emailB);
          break;
        }
        case 'phone': {
          const phoneA = (a.phone || '').toLowerCase();
          const phoneB = (b.phone || '').toLowerCase();
          comparison = phoneA.localeCompare(phoneB);
          break;
        }
        case 'business_name': {
          const bizA = (a.business_name || '').toLowerCase();
          const bizB = (b.business_name || '').toLowerCase();
          comparison = bizA.localeCompare(bizB);
          break;
        }
        case 'expenses_paid':
        case 'total_expenses_paid': {
          comparison = (parseFloat(a.total_expenses_paid) || 0) - (parseFloat(b.total_expenses_paid) || 0);
          break;
        }
        case 'expenses_outstanding':
        case 'total_expenses_outstanding': {
          comparison = (parseFloat(a.total_expenses_outstanding) || 0) - (parseFloat(b.total_expenses_outstanding) || 0);
          break;
        }
        case 'vendor_since':
        case 'created_at':
        default: {
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        }
      }

      // Apply sort direction
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  };

  const handleEditVendor = (vendor: any) => {
    if (openContactModal) {
      openContactModal(vendor);
    }
  };

  const handleHideVendor = async (vendor: any) => {
    try {
      const isCurrentlyVisible = vendor.is_visible_in_vendors !== false;
      const newVisibility = !isCurrentlyVisible;
      await updateContact(vendor.id, { is_visible_in_vendors: newVisibility });
      showSuccess(newVisibility ? 'Vendor is now visible' : 'Vendor has been hidden');
    } catch (error) {
      console.error('Error updating vendor visibility:', error);
      showError('Failed to update vendor visibility');
    }
  };

  const handleRemoveFromVendorList = async () => {
    if (!vendorToRemove) return;
    try {
      await updateContact(vendorToRemove.id, { is_vendor: false });
      const displayName = getContactDisplayName(vendorToRemove);
      showSuccess(`${displayName} removed from vendor list`);
      setShowRemoveVendorModal(false);
      setVendorToRemove(null);
    } catch (error) {
      console.error('Error removing vendor from list:', error);
      showError('Failed to remove vendor from list');
    }
  };

  const handleDeleteVendor = async () => {
    if (!vendorToDelete) return;
    try {
      await deleteContact(vendorToDelete.id);
      const displayName = getContactDisplayName(vendorToDelete);
      showSuccess(`${displayName} deleted permanently`);
      setShowDeleteVendorModal(false);
      setVendorToDelete(null);
    } catch (error) {
      console.error('Error deleting vendor:', error);
      showError('Failed to delete vendor');
    }
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
    } catch (error) {
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-[#e5e5e5] dark:border-gray-700 h-full">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e5e5e5] dark:border-gray-700">
              {columns.name && (
                <SortableColumnHeader
                  field="name"
                  label="Vendor"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSortChange!}
                />
              )}
              {columns.email && (
                <SortableColumnHeader
                  field="email"
                  label="Email"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSortChange!}
                />
              )}
              {columns.phone && (
                <SortableColumnHeader
                  field="phone"
                  label="Phone"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSortChange!}
                />
              )}
              {columns.business_name && (
                <SortableColumnHeader
                  field="business_name"
                  label="Company"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSortChange!}
                />
              )}
              {columns.expenses_paid && (
                <SortableColumnHeader
                  field="expenses_paid"
                  label="Expenses Paid"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSortChange!}
                  align="right"
                />
              )}
              {columns.expenses_outstanding && (
                <SortableColumnHeader
                  field="expenses_outstanding"
                  label="Outstanding"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSortChange!}
                  align="right"
                />
              )}
              {columns.vendor_since && (
                <SortableColumnHeader
                  field="vendor_since"
                  label="Vendor Since"
                  sortField={sortField}
                  sortDirection={sortDirection}
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
              <tr>
                <td colSpan={visibleColumnCount} className="px-4 py-12 text-center text-gray-600 dark:text-gray-400">
                  {searchQuery ? 'No vendors match your search' : 'No vendors found'}
                </td>
              </tr>
            ) : (
              filteredVendors.map((vendor: any, index: number) => {
                const isHidden = vendor.is_visible_in_vendors === false;
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
                              setVendorToRemove(vendor);
                              setShowRemoveVendorModal(true);
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
                            {vendor.is_visible_in_vendors !== false ? (
                              <>
                                <EyeSlashIcon className="h-4 w-4" />
                                Hide Vendor
                              </>
                            ) : (
                              <>
                                <EyeIcon className="h-4 w-4" />
                                Show Vendor
                              </>
                            )}
                          </Dropdown.Item>

                          <Dropdown.Item
                            onSelect={(e: any) => {
                              e.stopPropagation();
                              setVendorToDelete(vendor);
                              setShowDeleteVendorModal(true);
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
        isOpen={showRemoveVendorModal}
        onClose={() => {
          setShowRemoveVendorModal(false);
          setVendorToRemove(null);
        }}
        onConfirm={handleRemoveFromVendorList}
        title="Remove from Vendor List?"
        message={
          <div>
            <p className="mb-2">
              Are you sure you want to remove {vendorToRemove ? getContactDisplayName(vendorToRemove) : 'this vendor'} from your vendor list?
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
        isOpen={showDeleteVendorModal}
        onClose={() => {
          setShowDeleteVendorModal(false);
          setVendorToDelete(null);
        }}
        onConfirm={handleDeleteVendor}
        title="Delete Vendor?"
        message={
          <div>
            <p className="mb-2">
              Are you sure you want to permanently delete {vendorToDelete ? getContactDisplayName(vendorToDelete) : 'this vendor'}?
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
