import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search, ChevronDown, Check, SortAsc, Filter, CreditCard, Loader2, MoreVertical } from 'lucide-react';
import { adminSubscriptionsAPI, adminPlansAPI } from '../../services/adminAPI';
import { useModalState } from '../../hooks/useModalState';
import SubscriptionActionsDropdown from './subscription-management/SubscriptionActionsDropdown';
import SubscriptionHistoryModal from './subscription-management/SubscriptionHistoryModal';
import ChangePlanModal from './subscription-management/ChangePlanModal';
import ConfirmModal from './user-management/ConfirmModal';
import type { ConfirmModalState } from './user-management/types';
import type { SubscriptionResponse, SubscriptionList } from '../../types/auth';
import type { PlanResponse, PlanList } from '../../types/auth';

interface FilterOption {
  id: string;
  label: string;
}

interface FilterDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  options: FilterOption[];
  selectedValue: string;
  onSelect: (id: string) => void;
  title?: string;
}

const STATUS_FILTER_OPTIONS: FilterOption[] = [
  { id: '', label: 'All Statuses' },
  { id: 'ACTIVE', label: 'Active' },
  { id: 'CANCELED', label: 'Cancelled' },
  { id: 'PAST_DUE', label: 'Past Due' },
  { id: 'TRIALING', label: 'Trialing' },
  { id: 'PENDING_CANCELLATION', label: 'Pending Cancel' },
];

const SORT_BY_OPTIONS: FilterOption[] = [
  { id: 'created_at', label: 'Created Date' },
  { id: 'current_period_start', label: 'Period Start' },
  { id: 'current_period_end', label: 'Period End' },
  { id: 'status', label: 'Status' },
  { id: 'updated_at', label: 'Updated Date' },
];

const SORT_DIR_OPTIONS: FilterOption[] = [
  { id: 'desc', label: 'Descending' },
  { id: 'asc', label: 'Ascending' },
];

/**
 * Generic Filter Dropdown - Positioned relative to trigger button
 */
const FilterDropdown: React.FC<FilterDropdownProps> = ({ isOpen, onClose, options, selectedValue, onSelect, title }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleClickOutside = () => onClose();
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
      onClick={(e) => e.stopPropagation()}
    >
      {title && (
        <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
          {title}
        </div>
      )}
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => { onSelect(option.id); onClose(); }}
          className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between transition-colors ${
            option.id === selectedValue ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'
          }`}
        >
          <span>{option.label}</span>
          {option.id === selectedValue && <Check className="h-4 w-4 text-purple-600" />}
        </button>
      ))}
    </div>
  );
};

export default function SubscriptionManagement() {
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [perPage] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalSubscriptions, setTotalSubscriptions] = useState<number>(0);

  // Search and filter state
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [planFilter, setPlanFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortDir, setSortDir] = useState<string>('desc');

  // Filter dropdown state
  const [showStatusFilterDropdown, setShowStatusFilterDropdown] = useState<boolean>(false);
  const [showPlanFilterDropdown, setShowPlanFilterDropdown] = useState<boolean>(false);
  const [showSortByDropdown, setShowSortByDropdown] = useState<boolean>(false);
  const [showSortDirDropdown, setShowSortDirDropdown] = useState<boolean>(false);

  // Plans for filter + change plan modal
  const [plans, setPlans] = useState<any[]>([]);

  // Actions dropdown state
  const [showDropdownForSub, setShowDropdownForSub] = useState<string | null>(null);
  const [dropdownSub, setDropdownSub] = useState<any | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number }>({ top: 0, right: 0 });

  // Modals
  const changePlanModal = useModalState<any>();
  const historyModal = useModalState<{ userId: string; userName: string }>();
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    open: false,
    title: '',
    message: '',
    action: null,
    variant: 'primary',
  });
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Ref for click-outside on actions dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSubscriptions();
  }, [page, statusFilter, planFilter, sortBy, sortDir]);

  // Debounced search - triggers fetch 400ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchSubscriptions();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchPlans();
  }, []);

  // Click-outside handler for actions dropdown
  useEffect(() => {
    if (!showDropdownForSub) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdownForSub(null);
        setDropdownSub(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdownForSub]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {
        page: String(page),
        per_page: String(perPage),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(planFilter && { plan_id: planFilter }),
        sort_by: sortBy,
        sort_dir: sortDir,
      };
      const response = await adminSubscriptionsAPI.getSubscriptions(params) as SubscriptionList & { items?: any[]; total_pages?: number };
      setSubscriptions(response.items || []);
      setTotalPages(response.total_pages || 1);
      setTotalSubscriptions(response.total || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await adminPlansAPI.getPlans({ is_active: 'true' }) as PlanList & { items?: PlanResponse[] };
      setPlans(response.items || []);
    } catch (err: any) {
      console.error('Error fetching plans:', err);
    }
  };

  // Wrap filter setters to reset page on filter change
  const handleStatusFilterChange = (val: string) => { setStatusFilter(val); setPage(1); };
  const handlePlanFilterChange = (val: string) => { setPlanFilter(val); setPage(1); };
  const handleSortByChange = (val: string) => { setSortBy(val); setPage(1); };
  const handleSortDirChange = (val: string) => { setSortDir(val); setPage(1); };

  const getPlanFilterOptions = (): FilterOption[] => {
    const options: FilterOption[] = [{ id: '', label: 'All Plans' }];
    plans.forEach((plan: any) => {
      options.push({ id: plan.id, label: plan.name });
    });
    return options;
  };

  // Actions dropdown handlers
  const handleOpenDropdown = useCallback((e: React.MouseEvent, sub: any) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const dropdownWidth = 208; // w-52 = 13rem = 208px
    const dropdownHeight = 200; // approximate max height
    let top = rect.bottom + 4;
    let right = window.innerWidth - rect.right;
    // Clamp so dropdown stays within viewport
    if (right + dropdownWidth > window.innerWidth) {
      right = Math.max(8, window.innerWidth - dropdownWidth - 8);
    }
    if (top + dropdownHeight > window.innerHeight) {
      top = Math.max(8, rect.top - dropdownHeight - 4);
    }
    setDropdownPosition({ top, right });
    setDropdownSub(sub);
    setShowDropdownForSub(sub.id);
  }, []);

  const closeDropdown = useCallback(() => {
    setShowDropdownForSub(null);
    setDropdownSub(null);
  }, []);

  const handleViewHistory = useCallback(() => {
    if (!dropdownSub) return;
    closeDropdown();
    historyModal.open({
      userId: dropdownSub.user_id,
      userName: dropdownSub.user_name || dropdownSub.user_email || 'Unknown User',
    });
  }, [dropdownSub, closeDropdown, historyModal]);

  const handleCancelSubscription = useCallback(() => {
    if (!dropdownSub) return;
    const sub = dropdownSub;
    closeDropdown();
    setConfirmModal({
      open: true,
      title: 'Cancel Subscription',
      message: `Are you sure you want to cancel the subscription for ${sub.user_name || sub.user_email || 'this user'}? The subscription will remain active until the end of the current billing period.`,
      action: async () => {
        await adminSubscriptionsAPI.cancelSubscription(sub.id, {
          cancelAtPeriodEnd: true,
          reason: 'Cancelled by admin',
          feedback: '',
        });
        await fetchSubscriptions();
      },
      variant: 'danger',
    });
  }, [dropdownSub, closeDropdown]);

  const handleReactivateSubscription = useCallback(() => {
    if (!dropdownSub) return;
    const sub = dropdownSub;
    closeDropdown();
    setConfirmModal({
      open: true,
      title: 'Reactivate Subscription',
      message: `Are you sure you want to reactivate the subscription for ${sub.user_name || sub.user_email || 'this user'}?`,
      action: async () => {
        await adminSubscriptionsAPI.reactivateSubscription(sub.id);
        await fetchSubscriptions();
      },
      variant: 'primary',
    });
  }, [dropdownSub, closeDropdown]);

  const handleChangePlan = useCallback(() => {
    if (!dropdownSub) return;
    const sub = dropdownSub;
    closeDropdown();
    changePlanModal.open(sub);
  }, [dropdownSub, closeDropdown, changePlanModal]);

  const formatDate = (date: string) => date ? new Date(date).toLocaleDateString() : '-';

  return (
    <div className={`flex-1 overflow-auto ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
      <div className={`border-b px-4 sm:px-6 py-4 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
        <h1 className={`text-xl sm:text-2xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
          Subscription Management
        </h1>
        <p className={`text-sm mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
          View and manage user subscriptions
        </p>
      </div>

      {/* Filters */}
      <div className="p-4 sm:p-6">
        <div className={`p-3 sm:p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Search Input */}
            <div className="w-full sm:flex-1 sm:min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by email or name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowStatusFilterDropdown(!showStatusFilterDropdown);
                  setShowPlanFilterDropdown(false);
                  setShowSortByDropdown(false);
                  setShowSortDirDropdown(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'} hover:border-purple-400 transition-colors ${statusFilter ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : ''}`}
              >
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{STATUS_FILTER_OPTIONS.find(o => o.id === statusFilter)?.label || 'All Statuses'}</span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
              <FilterDropdown
                isOpen={showStatusFilterDropdown}
                onClose={() => setShowStatusFilterDropdown(false)}
                options={STATUS_FILTER_OPTIONS}
                selectedValue={statusFilter}
                onSelect={handleStatusFilterChange}
                title="Status"
              />
            </div>

            {/* Plan Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPlanFilterDropdown(!showPlanFilterDropdown);
                  setShowStatusFilterDropdown(false);
                  setShowSortByDropdown(false);
                  setShowSortDirDropdown(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'} hover:border-purple-400 transition-colors ${planFilter ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : ''}`}
              >
                <CreditCard className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{getPlanFilterOptions().find(o => o.id === planFilter)?.label || 'All Plans'}</span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
              <FilterDropdown
                isOpen={showPlanFilterDropdown}
                onClose={() => setShowPlanFilterDropdown(false)}
                options={getPlanFilterOptions()}
                selectedValue={planFilter}
                onSelect={handlePlanFilterChange}
                title="Plan"
              />
            </div>

            {/* Sort By */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSortByDropdown(!showSortByDropdown);
                  setShowStatusFilterDropdown(false);
                  setShowPlanFilterDropdown(false);
                  setShowSortDirDropdown(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'} hover:border-purple-400 transition-colors`}
              >
                <SortAsc className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{SORT_BY_OPTIONS.find(o => o.id === sortBy)?.label || 'Sort'}</span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
              <FilterDropdown
                isOpen={showSortByDropdown}
                onClose={() => setShowSortByDropdown(false)}
                options={SORT_BY_OPTIONS}
                selectedValue={sortBy}
                onSelect={handleSortByChange}
                title="Sort By"
              />
            </div>

            {/* Sort Direction */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSortDirDropdown(!showSortDirDropdown);
                  setShowStatusFilterDropdown(false);
                  setShowPlanFilterDropdown(false);
                  setShowSortByDropdown(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'} hover:border-purple-400 transition-colors`}
              >
                <span className="text-sm">{SORT_DIR_OPTIONS.find(o => o.id === sortDir)?.label || 'Desc'}</span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
              <FilterDropdown
                isOpen={showSortDirDropdown}
                onClose={() => setShowSortDirDropdown(false)}
                options={SORT_DIR_OPTIONS}
                selectedValue={sortDir}
                onSelect={handleSortDirChange}
                title="Direction"
              />
            </div>

          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="px-4 sm:px-6 pb-6">
        <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-12">Error: {error}</div>
          ) : subscriptions.length === 0 ? (
            <div className={`text-center py-12 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
              <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="text-lg font-medium">No subscriptions found</p>
              <p className="text-sm mt-1">
                {statusFilter || planFilter || search
                  ? 'Try adjusting your filters or search terms.'
                  : 'No subscriptions have been created yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
                  <tr>
                    <th className={`px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase whitespace-nowrap ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>User</th>
                    <th className={`px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase whitespace-nowrap ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Email</th>
                    <th className={`px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase whitespace-nowrap ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Plan</th>
                    <th className={`px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase whitespace-nowrap ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Status</th>
                    <th className={`px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase whitespace-nowrap ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Billing</th>
                    <th className={`px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase whitespace-nowrap ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Price</th>
                    <th className={`px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase whitespace-nowrap ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Period End</th>
                    <th className={`px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase whitespace-nowrap ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-zenible-dark-border' : 'divide-neutral-200'}`}>
                  {subscriptions.map((sub: any) => (
                    <tr key={sub.id}>
                      <td className={`px-4 sm:px-6 py-4 text-sm whitespace-nowrap ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                        {sub.user_name || 'Unknown'}
                      </td>
                      <td className={`px-4 sm:px-6 py-4 text-sm whitespace-nowrap ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                        {sub.user_email || 'N/A'}
                      </td>
                      <td className={`px-4 sm:px-6 py-4 text-sm whitespace-nowrap ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                        {sub.plan?.name || 'N/A'}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const status = (sub.status || '').toLowerCase();
                          return (
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              sub.cancel_at_period_end ? 'bg-yellow-100 text-yellow-800' :
                              status === 'active' ? 'bg-green-100 text-green-800' :
                              status === 'canceled' || status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              status === 'past_due' ? 'bg-orange-100 text-orange-800' :
                              status === 'trialing' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {sub.cancel_at_period_end ? 'Pending Cancel' : sub.status}
                            </span>
                          );
                        })()}
                      </td>
                      <td className={`px-4 sm:px-6 py-4 text-sm whitespace-nowrap ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                        {sub.billing_cycle}
                      </td>
                      <td className={`px-4 sm:px-6 py-4 text-sm whitespace-nowrap ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                        ${sub.plan?.monthly_price || 'N/A'}/mo
                      </td>
                      <td className={`px-4 sm:px-6 py-4 text-sm whitespace-nowrap ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                        {formatDate(sub.current_period_end)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={(e) => handleOpenDropdown(e, sub)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            darkMode
                              ? 'hover:bg-zenible-dark-bg text-zenible-dark-text-secondary hover:text-zenible-dark-text'
                              : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className={`px-4 sm:px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
            <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
              Showing {((page - 1) * perPage) + 1} to {Math.min(page * perPage, totalSubscriptions)} of {totalSubscriptions}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`px-3 py-1 rounded-lg border text-sm ${
                  page === 1
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-opacity-10 hover:bg-zenible-primary'
                } ${darkMode ? 'border-zenible-dark-border text-zenible-dark-text' : 'border-gray-300 text-gray-700'}`}
              >
                Previous
              </button>
              <span className={`px-2 py-1 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={`px-3 py-1 rounded-lg border text-sm ${
                  page === totalPages
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-opacity-10 hover:bg-zenible-primary'
                } ${darkMode ? 'border-zenible-dark-border text-zenible-dark-text' : 'border-gray-300 text-gray-700'}`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Actions Dropdown */}
      {showDropdownForSub && dropdownSub && (
        <div ref={dropdownRef}>
          <SubscriptionActionsDropdown
            subscription={dropdownSub}
            position={dropdownPosition}
            onViewHistory={handleViewHistory}
            onChangePlan={handleChangePlan}
            onReactivate={handleReactivateSubscription}
            onCancel={handleCancelSubscription}
          />
        </div>
      )}

      {/* Subscription History Modal */}
      {historyModal.isOpen && historyModal.data && (
        <SubscriptionHistoryModal
          userId={historyModal.data.userId}
          userName={historyModal.data.userName}
          onClose={historyModal.close}
        />
      )}

      {/* Change Plan Modal */}
      {changePlanModal.isOpen && changePlanModal.data && (
        <ChangePlanModal
          subscription={changePlanModal.data}
          plans={plans}
          onClose={changePlanModal.close}
          onSuccess={fetchSubscriptions}
        />
      )}

      {/* Confirm Modal (for cancel/reactivate) */}
      {confirmModal.open && (
        <ConfirmModal
          confirmModal={confirmModal}
          confirmLoading={confirmLoading}
          setConfirmModal={setConfirmModal}
          setConfirmLoading={setConfirmLoading}
        />
      )}
    </div>
  );
}
