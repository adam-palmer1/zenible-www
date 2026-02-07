import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  RefreshCw,
  RotateCcw,
  CreditCard,
  Plus,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { usePayments } from '../../../contexts/PaymentsContext';
import { useNotification } from '../../../contexts/NotificationContext';
import ActionMenu from '../../shared/ActionMenu';
import { useDeleteConfirmation } from '../../../hooks/useDeleteConfirmation';
import {
  PAYMENT_STATUS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_TYPE_LABELS,
  PAYMENT_TYPE_COLORS,
  PAYMENT_METHOD_LABELS
} from '../../../constants/finance';
import { formatCurrency } from '../../../utils/currency';
import { formatDate } from '../../../utils/dateUtils';
import KPICard from '../shared/KPICard';
import DateRangeFilter from '../expenses/DateRangeFilter';

interface StatusBadgeProps {
  status: string;
}

interface TypeBadgeProps {
  type: string;
}

const PaymentList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    payments,
    loading,
    filters,
    pagination,
    stats,
    updateFilters,
    setPagination,
    openDetailModal,
    openRefundModal,
    openCreateModal,
    openEditModal,
    deletePayment,
    refresh
  } = usePayments() as any;
  const { showSuccess, showError } = useNotification() as any;

  // Local state - search is client-side only (backend doesn't support search param)
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState(filters.status || 'all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
  const deleteConfirmation = useDeleteConfirmation<any>();

  // Handle payment query parameter - open payment detail modal
  const urlPaymentId = searchParams.get('payment');
  useEffect(() => {
    if (urlPaymentId && payments.length > 0 && !loading) {
      const payment = payments.find((p: any) => p.id === urlPaymentId);
      if (payment) {
        openDetailModal(payment);
      }
      // Clear the URL param after opening
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('payment');
      setSearchParams(newParams, { replace: true });
    }
  }, [urlPaymentId, payments, loading, openDetailModal, searchParams, setSearchParams]);

  // Sync filterStatus with context filters when they change (e.g., from preferences)
  useEffect(() => {
    setFilterStatus(filters.status || 'all');
  }, [filters.status]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showFilterDropdown && !(e.target as Element).closest('.relative')) {
        setShowFilterDropdown(false);
      }
      if (showSortDropdown && !(e.target as Element).closest('.relative')) {
        setShowSortDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showFilterDropdown, showSortDropdown]);

  // Sort options that backend supports
  const SORT_OPTIONS = [
    { value: 'payment_date', label: 'Payment Date' },
    { value: 'created_at', label: 'Created Date' },
    { value: 'amount', label: 'Amount' },
    { value: 'payment_number', label: 'Payment Number' },
  ];

  // Format converted total for main display
  const getConvertedDisplay = (convertedObj: any) => {
    if (!convertedObj || !convertedObj.total) return '0.00';
    return formatCurrency(convertedObj.total, convertedObj.currency_code);
  };

  // Get subtitle for multi-currency breakdown (shows original amounts)
  const getCurrencySubtitle = (currencyArray: any[]) => {
    if (!currencyArray || currencyArray.length === 0) return null;
    return currencyArray
      .map((item: any) => `${item.currency_symbol}${parseFloat(item.total).toLocaleString()}`)
      .join(' + ');
  };

  // Helper to get customer display name from contact object
  const getCustomerName = (payment: any) => {
    if (payment.contact) {
      const { first_name, last_name, business_name } = payment.contact;
      if (first_name || last_name) {
        return `${first_name || ''} ${last_name || ''}`.trim();
      }
      return business_name || '-';
    }
    return payment.customer_name || '-';
  };

  // Helper to get customer email from contact object
  const getCustomerEmail = (payment: any) => {
    return payment.contact?.email || payment.customer_email || null;
  };

  // Helper to get currency code
  const getCurrencyCode = (payment: any) => {
    return payment.currency?.code || payment.currency_code || 'USD';
  };

  // Filter payments locally for search
  const filteredPayments = useMemo(() => {
    let result = [...payments];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((p: any) => {
        const customerName = getCustomerName(p).toLowerCase();
        const customerEmail = getCustomerEmail(p)?.toLowerCase() || '';
        return (
          p.id?.toString().toLowerCase().includes(query) ||
          p.payment_number?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          customerEmail.includes(query) ||
          customerName.includes(query) ||
          p.contact?.business_name?.toLowerCase().includes(query)
        );
      });
    }

    return result;
  }, [payments, searchQuery]);

  // Handle search - client-side only (backend doesn't support search param)
  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  // Handle status filter - server-side
  const handleStatusFilter = (status: string) => {
    setFilterStatus(status);
    setShowFilterDropdown(false);
    updateFilters({ status: status === 'all' ? null : status });
  };

  // Handle sort - server-side
  const handleSort = (sortBy: string) => {
    const currentSortBy = filters.sort_by;
    const currentDirection = filters.sort_direction;

    // If clicking the same column, toggle direction
    if (sortBy === currentSortBy) {
      updateFilters({ sort_direction: currentDirection === 'asc' ? 'desc' : 'asc' });
    } else {
      // New column, default to desc
      updateFilters({ sort_by: sortBy, sort_direction: 'desc' });
    }
    setShowSortDropdown(false);
  };

  // Get current sort label
  const getSortLabel = () => {
    const option = SORT_OPTIONS.find(o => o.value === filters.sort_by);
    return option ? option.label : 'Sort';
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setPagination((prev: any) => ({ ...prev, page }));
  };

  // Handle view payment
  const handleViewPayment = (payment: any) => {
    openDetailModal(payment);
    setOpenActionMenuId(null);
  };

  // Handle edit payment
  const handleEditPayment = (payment: any) => {
    openEditModal(payment);
    setOpenActionMenuId(null);
  };

  // Handle refund
  const handleRefund = (payment: any) => {
    if (payment.status !== (PAYMENT_STATUS as any).COMPLETED && payment.status !== (PAYMENT_STATUS as any).SUCCEEDED) {
      showError('Only completed payments can be refunded');
      return;
    }
    openRefundModal(payment);
    setOpenActionMenuId(null);
  };

  // Handle delete - show confirmation
  const handleDeleteClick = (payment: any) => {
    deleteConfirmation.requestDelete(payment);
    setOpenActionMenuId(null);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    await deleteConfirmation.confirmDelete(async (payment: any) => {
      setDeletingPaymentId(payment.id);
      try {
        await deletePayment(payment.id);
        showSuccess('Payment deleted successfully');
      } catch (err: any) {
        showError(err.message || 'Failed to delete payment');
        throw err;
      } finally {
        setDeletingPaymentId(null);
      }
    });
  };

  // Cancel delete
  const handleCancelDelete = () => {
    deleteConfirmation.cancelDelete();
  };


  // Status badge component
  const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${(PAYMENT_STATUS_COLORS as any)[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
      {(PAYMENT_STATUS_LABELS as any)[status] || status}
    </span>
  );

  // Type badge component
  const TypeBadge: React.FC<TypeBadgeProps> = ({ type }) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${(PAYMENT_TYPE_COLORS as any)[type] || 'bg-gray-100 text-gray-700'}`}>
      {(PAYMENT_TYPE_LABELS as any)[type] || type}
    </span>
  );

  const totalPages = pagination.total_pages || Math.ceil(filteredPayments.length / pagination.per_page);
  const currentPage = pagination.page;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <KPICard
          title="Total Payments"
          value={loading ? '...' : (stats?.total_count || payments.length).toString()}
          icon={CreditCard}
          iconColor="blue"
        />
        <KPICard
          title="Total Received"
          value={loading ? '...' : getConvertedDisplay(stats?.converted_total)}
          subtitle={!loading && stats?.total_by_currency?.length > 0 ? getCurrencySubtitle(stats.total_by_currency) : undefined}
          icon={CheckCircle}
          iconColor="green"
        />
        <KPICard
          title="Refunded"
          value={loading ? '...' : getConvertedDisplay(stats?.converted_refunded)}
          subtitle={!loading && stats?.refunded_by_currency?.length > 0 ? getCurrencySubtitle(stats.refunded_by_currency) : undefined}
          icon={RotateCcw}
          iconColor="orange"
        />
      </div>

      {/* Payments Section */}
      <div>
        {/* Header with Search and Filter */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#09090b] dark:text-white">Payment History</h2>
          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            <button
              onClick={refresh}
              className="p-2 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search payments..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-64 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            </div>

            {/* Date Range Filter */}
            <DateRangeFilter
              startDate={filters.start_date}
              endDate={filters.end_date}
              onChange={({ start_date, end_date }: { start_date: string; end_date: string }) => {
                updateFilters({ start_date, end_date });
              }}
            />

            {/* Status Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Filter className="h-4 w-4" />
                {filterStatus === 'all' ? 'All Status' : (PAYMENT_STATUS_LABELS as any)[filterStatus]}
              </button>
              {showFilterDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 dark:bg-gray-800 dark:border-gray-600">
                  <div className="py-1">
                    <button
                      onClick={() => handleStatusFilter('all')}
                      className={`block w-full text-left px-4 py-2 text-sm ${filterStatus === 'all' ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white' : 'text-gray-700 dark:text-gray-300'} hover:bg-gray-50 dark:hover:bg-gray-700`}
                    >
                      All Status
                    </button>
                    {Object.entries(PAYMENT_STATUS_LABELS as Record<string, string>).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => handleStatusFilter(key)}
                        className={`block w-full text-left px-4 py-2 text-sm ${filterStatus === key ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white' : 'text-gray-700 dark:text-gray-300'} hover:bg-gray-50 dark:hover:bg-gray-700`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {filters.sort_direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                {getSortLabel()}
              </button>
              {showSortDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 dark:bg-gray-800 dark:border-gray-600">
                  <div className="py-1">
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleSort(option.value)}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${filters.sort_by === option.value ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white' : 'text-gray-700 dark:text-gray-300'} hover:bg-gray-50 dark:hover:bg-gray-700`}
                      >
                        <span>{option.label}</span>
                        {filters.sort_by === option.value && (
                          filters.sort_direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Record Payment Button */}
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Record Payment
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden dark:bg-gray-800 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Payment ID
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Customer
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Date
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Amount
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Method
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Status
                  </th>
                  <th scope="col" className="w-12 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Loading payments...
                      </div>
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <CreditCard className="h-8 w-8 text-gray-400" />
                        <p>No payments found</p>
                        {(searchQuery || filterStatus !== 'all' || filters.start_date || filters.end_date) && (
                          <button
                            onClick={() => {
                              setSearchQuery('');
                              setFilterStatus('all');
                              updateFilters({
                                status: null,
                                start_date: null,
                                end_date: null
                              });
                            }}
                            className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                          >
                            Clear filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment: any) => {
                    const customerName = getCustomerName(payment);
                    const customerEmail = getCustomerEmail(payment);
                    const currencyCode = getCurrencyCode(payment);

                    return (
                    <tr
                      key={payment.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      onClick={() => handleViewPayment(payment)}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        #{payment.payment_number || payment.id?.toString().slice(-8)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">
                        <div>
                          <div className="font-medium">{customerName}</div>
                          {customerEmail && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">{customerEmail}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(payment.payment_date || payment.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(payment.amount, currencyCode)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {(PAYMENT_METHOD_LABELS as any)[payment.payment_method] || payment.payment_method || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-wrap gap-1">
                          <StatusBadge status={payment.status} />
                          {payment.type && <TypeBadge type={payment.type} />}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <button
                          id={`payment-action-btn-${payment.id}`}
                          onClick={() => setOpenActionMenuId(openActionMenuId === payment.id ? null : payment.id)}
                          className="p-1 hover:bg-gray-100 rounded-md transition-colors dark:hover:bg-gray-600"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-400" />
                        </button>
                        {openActionMenuId === payment.id && (
                          <ActionMenu
                            itemId={payment.id}
                            onClose={() => setOpenActionMenuId(null)}
                            buttonIdPrefix="payment-action-btn"
                            actions={[
                              { label: 'View Details', onClick: () => handleViewPayment(payment) },
                              { label: 'Edit', onClick: () => handleEditPayment(payment) },
                              {
                                label: 'Refund',
                                onClick: () => handleRefund(payment),
                                condition: payment.status === (PAYMENT_STATUS as any).COMPLETED || payment.status === (PAYMENT_STATUS as any).SUCCEEDED,
                                variant: 'warning'
                              },
                              { label: 'Delete', onClick: () => handleDeleteClick(payment), variant: 'danger' },
                            ]}
                          />
                        )}
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && filteredPayments.length > 0 && totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between dark:border-gray-700">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing{' '}
                <span className="font-medium">{(currentPage - 1) * pagination.per_page + 1}</span>
                {' '}to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * pagination.per_page, pagination.total || filteredPayments.length)}
                </span>
                {' '}of{' '}
                <span className="font-medium">{pagination.total || filteredPayments.length}</span>
                {' '}results
              </div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1))
                  .map((page, idx, arr) => {
                    const prevPage = arr[idx - 1];
                    const showEllipsis = prevPage && page - prevPage > 1;

                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && (
                          <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400">
                            ...
                          </span>
                        )}
                        <button
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === page
                              ? 'z-10 bg-purple-50 border-purple-500 text-purple-600 dark:bg-purple-900/30 dark:border-purple-500 dark:text-purple-400'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && deleteConfirmation.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={handleCancelDelete} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 dark:bg-gray-800">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-100 rounded-full dark:bg-red-900/30">
                  <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Delete Payment
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    #{deleteConfirmation.item.payment_number || deleteConfirmation.item.id?.toString().slice(-8)}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                Are you sure you want to delete this payment?
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                This will also remove any invoice allocations associated with this payment. This action cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={handleCancelDelete}
                  disabled={!!deletingPaymentId}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={!!deletingPaymentId}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deletingPaymentId ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Delete Payment
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentList;
