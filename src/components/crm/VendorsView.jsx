import React, { useState, useEffect } from 'react';
import { UserMinusIcon, EyeSlashIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useContacts } from '../../hooks/crm';
import { useNotification } from '../../contexts/NotificationContext';
import { formatCurrency } from '../../utils/currency';
import Dropdown from '../ui/dropdown/Dropdown';
import ConfirmationModal from '../common/ConfirmationModal';
import { getContactDisplayName } from '../../utils/crm/contactUtils';
import { calculateClientStatus } from '../../utils/crm/clientStatusUtils';

/**
 * VendorsView Component
 *
 * Displays a filtered view of contacts marked as vendors (is_vendor: true)
 * with financial summary data, vendor status, and management actions.
 */
const VendorsView = ({ onVendorClick, openContactModal, refreshKey = 0 }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState('newest');
  const [selectedStatuses, setSelectedStatuses] = useState(['New', 'Active', 'Inactive', 'Cold']);
  const [showHiddenVendors, setShowHiddenVendors] = useState(false);
  const [financialSummary, setFinancialSummary] = useState({});
  const [loadingFinancials, setLoadingFinancials] = useState(false);
  const [showRemoveVendorModal, setShowRemoveVendorModal] = useState(false);
  const [vendorToRemove, setVendorToRemove] = useState(null);
  const [showDeleteVendorModal, setShowDeleteVendorModal] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState(null);

  const { showError, showSuccess } = useNotification();

  // Fetch vendors (contacts with is_vendor: true)
  const { contacts: vendors, loading: vendorsLoading, updateContact, deleteContact } = useContacts({ is_vendor: true }, refreshKey);

  // TODO: Implement financial summary endpoint on backend
  // For now, financial data will be empty and UI will show defaults
  // Backend needs: GET /api/v1/crm/vendors/financial-summary
  // Expected response: { [vendor_id]: { last_payment_date, payment_count, has_recurring_invoice, amount_outstanding } }
  useEffect(() => {
    // Placeholder - financial data not available yet
    setLoadingFinancials(false);
  }, []);

  // Filter and sort vendors
  const getFilteredVendors = () => {
    let filtered = [...vendors];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(vendor =>
        vendor.first_name?.toLowerCase().includes(query) ||
        vendor.last_name?.toLowerCase().includes(query) ||
        vendor.email?.toLowerCase().includes(query) ||
        vendor.business_name?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (selectedStatuses.length > 0 && selectedStatuses.length < 4) {
      filtered = filtered.filter(vendor => {
        const { status } = calculateClientStatus(vendor, financialSummary[vendor.id]);
        return selectedStatuses.includes(status);
      });
    }

    // Apply hidden filter
    if (!showHiddenVendors) {
      filtered = filtered.filter(vendor => vendor.is_visible_in_vendors !== false);
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
        default:
          return 0;
      }
    });

    return filtered;
  };

  const handleEditVendor = (vendor) => {
    if (openContactModal) {
      openContactModal(vendor);
    }
  };

  const handleHideVendor = async (vendor) => {
    try {
      // Determine current visibility state (undefined/null/true = visible, false = hidden)
      const isCurrentlyVisible = vendor.is_visible_in_vendors !== false;
      const newVisibility = !isCurrentlyVisible;

      // updateContact handles both API call and local state update
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
      // updateContact handles both API call and local state update
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
      // deleteContact handles both API call and local state update
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

  const formatDate = (dateString) => {
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

  const formatAmountOutstanding = (vendor) => {
    const clientId = vendor.id;
    const financialData = financialSummary[clientId];

    if (!financialData || !financialData.amount_outstanding) {
      return formatCurrency(0, 'USD');
    }

    return formatCurrency(financialData.amount_outstanding, 'USD');
  };

  const filteredVendors = getFilteredVendors();

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
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Client</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Client Since</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Last Payment</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Status</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Amount Outstanding</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400"></th>
            </tr>
          </thead>
          <tbody>
            {filteredVendors.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-12 text-center text-gray-600 dark:text-gray-400">
                  No vendors found
                </td>
              </tr>
            ) : (
              filteredVendors.map((vendor, index) => {
                const financialData = financialSummary[vendor.id] || {};
                const { status, color } = calculateClientStatus(vendor, financialData);

                return (
                  <tr
                    key={vendor.id}
                    className={`border-b border-[#e5e5e5] dark:border-gray-700 hover:cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${index === filteredVendors.length - 1 ? 'border-b-0' : ''}`}
                    onClick={() => onVendorClick && onVendorClick(vendor)}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                          {vendor.profile_picture ? (
                            <img src={vendor.profile_picture} alt={`${vendor.first_name} ${vendor.last_name}`} className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-medium text-sm text-gray-600 dark:text-gray-400">
                              {vendor.first_name?.[0]}{vendor.last_name?.[0]}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className={`font-medium text-gray-900 dark:text-white ${vendor.is_visible_in_vendors === false ? 'line-through italic opacity-60' : ''}`}>
                            {vendor.first_name} {vendor.last_name}
                          </p>
                          <p className={`text-sm text-gray-600 dark:text-gray-400 ${vendor.is_visible_in_vendors === false ? 'line-through italic' : ''}`}>
                            {vendor.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                      {formatDate(vendor.created_at)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                      {formatDate(financialData.last_payment_date)}
                    </td>
                    <td className="px-4 py-4">
                      {(() => {
                        const colorClasses = {
                          green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                          orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
                          yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                          red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        };
                        const dotClasses = {
                          green: 'bg-green-600',
                          orange: 'bg-orange-600',
                          yellow: 'bg-yellow-600',
                          red: 'bg-red-600'
                        };

                        return (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[color]}`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotClasses[color]}`}></span>
                            {status}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                      {loadingFinancials ? '...' : formatAmountOutstanding(vendor)}
                    </td>
                    <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <Dropdown
                        trigger={
                          <button
                            onClick={(e) => e.stopPropagation()}
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
                          onSelect={(e) => {
                            e.stopPropagation();
                            handleEditVendor(vendor);
                          }}
                        >
                          <PencilIcon className="h-4 w-4" />
                          Edit
                        </Dropdown.Item>

                        <Dropdown.Item
                          onSelect={(e) => {
                            e.stopPropagation();
                            setVendorToRemove(vendor);
                            setShowRemoveVendorModal(true);
                          }}
                        >
                          <UserMinusIcon className="h-4 w-4" />
                          Remove from Vendor List
                        </Dropdown.Item>

                        <Dropdown.Item
                          onSelect={(e) => {
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
                          onSelect={(e) => {
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
