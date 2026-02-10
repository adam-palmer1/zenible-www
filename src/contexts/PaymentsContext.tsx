import { createContext, useState, useCallback, useMemo, useContext, useEffect, type Dispatch, type SetStateAction, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { usePreferences } from './PreferencesContext';
import paymentsAPI from '../services/api/finance/payments';

interface PaymentFilters {
  status: string | null;
  contact_id: string | null;
  project_id: string | null;
  unallocated_only: boolean;
  start_date: string | null;
  end_date: string | null;
  sort_by: string;
  sort_direction: string;
}

interface PaymentPagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

interface PaymentsContextValue {
  payments: unknown[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
  filters: PaymentFilters;
  pagination: PaymentPagination;
  stats: Record<string, unknown> | null;
  showDetailModal: boolean;
  showRefundModal: boolean;
  showCreateModal: boolean;
  showEditModal: boolean;
  selectedPayment: unknown;
  fetchPayments: () => Promise<void>;
  createPayment: (paymentData: unknown) => Promise<unknown>;
  updatePayment: (paymentId: string, paymentData: unknown) => Promise<unknown>;
  deletePayment: (paymentId: string) => Promise<void>;
  refundPayment: (paymentId: string, refundData: unknown) => Promise<unknown>;
  allocatePayment: (paymentId: string, allocations: unknown) => Promise<unknown>;
  autoAllocatePayment: (paymentId: string) => Promise<unknown>;
  getUnallocatedAmount: (paymentId: string) => Promise<unknown>;
  getPaymentHistory: (paymentId: string) => Promise<unknown>;
  updateFilters: (newFilters: Partial<PaymentFilters>) => void;
  setPagination: Dispatch<SetStateAction<PaymentPagination>>;
  refresh: () => void;
  openDetailModal: (payment: unknown) => void;
  closeDetailModal: () => void;
  openRefundModal: (payment: unknown) => void;
  closeRefundModal: () => void;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  openEditModal: (payment: unknown) => void;
  closeEditModal: () => void;
  // Payment methods (stored payment methods for recurring payments)
  paymentMethods: unknown[];
  methodsLoading: boolean;
  fetchPaymentMethods: () => Promise<void>;
  removePaymentMethod: (methodId: string) => Promise<void>;
}

interface PaymentListApiResponse {
  items?: unknown[];
  data?: unknown[];
  total?: number;
  total_pages?: number;
  stats?: Record<string, unknown>;
}

interface PaymentRecord {
  id: string;
  amount: string;
  refunded_amount?: string | number;
  status?: string;
  [key: string]: unknown;
}

interface RefundData {
  amount?: number;
  reason?: string;
  [key: string]: unknown;
}

interface UnallocatedResponse {
  unallocated_amount: string;
}

export const PaymentsContext = createContext<PaymentsContextValue | null>(null);

export const PaymentsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { getPreference, updatePreference } = usePreferences();

  // State
  const [payments, setPayments] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true); // Start true until initial fetch completes
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Stats from API (extracted from list response)
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);

  // Modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<unknown>(null);

  // Default to last 30 days
  const defaultRange = (() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 29);
    return {
      start_date: thirtyDaysAgo.toISOString().split('T')[0],
      end_date: today.toISOString().split('T')[0],
    };
  })();

  // Filters - these are sent to the server for server-side filtering
  const [filters, setFilters] = useState<PaymentFilters>({
    status: null,
    contact_id: null,
    project_id: null,
    unallocated_only: false,
    start_date: defaultRange.start_date,
    end_date: defaultRange.end_date,
    sort_by: 'payment_date',
    sort_direction: 'desc',
  });

  // Pagination
  const [pagination, setPagination] = useState<PaymentPagination>({
    page: 1,
    per_page: 20,
    total: 0,
    total_pages: 0,
  });

  // Load filters from preferences
  useEffect(() => {
    if (user) {
      const savedFilters = {
        status: getPreference('payment_filter_status', null) as string | null,
        sort_by: getPreference('payment_sort_by', 'payment_date') as string,
        sort_direction: getPreference('payment_sort_direction', 'desc') as string,
      };

      setFilters(prev => ({ ...prev, ...savedFilters }));
      setPreferencesLoaded(true);
    } else {
      // No user - not loading
      setLoading(false);
    }
  }, [user, getPreference]);

  // Fetch payments
  const fetchPayments = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Build params, filtering out null/undefined values
      const params: Record<string, unknown> = {
        page: pagination.page,
        per_page: pagination.per_page,
      };

      // Only add filter params if they have actual values
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '' && value !== false) {
          params[key] = value;
        }
      });

      const response = await paymentsAPI.list(params as Record<string, string>) as PaymentListApiResponse;

      // Handle different response formats
      const rawItems = response.items || response.data || [];
      const items = Array.isArray(rawItems) ? rawItems : [];
      setPayments(items);

      setPagination(prev => ({
        ...prev,
        total: response.total || items.length,
        total_pages: response.total_pages || Math.ceil((response.total || items.length) / prev.per_page),
      }));

      // Extract stats from list response - single source of truth
      if (response.stats) {
        setStats(response.stats as Record<string, unknown>);
      }

      setInitialized(true);
    } catch (err) {
      console.error('[PaymentsContext] Error fetching payments:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user, pagination.page, pagination.per_page, filters]);

  // Auto-fetch on dependencies change (only after preferences are loaded)
  useEffect(() => {
    if (preferencesLoaded) {
      fetchPayments();
    }
  }, [fetchPayments, refreshKey, preferencesLoaded]);

  // Create payment
  const createPayment = useCallback(async (paymentData: unknown) => {
    try {
      setLoading(true);
      const created = await paymentsAPI.create(paymentData);
      setPayments(prev => [created, ...prev]);
      return created;
    } catch (err) {
      console.error('[PaymentsContext] Error creating payment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update payment
  const updatePayment = useCallback(async (paymentId: string, paymentData: unknown) => {
    try {
      setLoading(true);
      const updated = await paymentsAPI.update(paymentId, paymentData);
      setPayments(prev => prev.map((p: any) => p.id === paymentId ? updated : p));
      return updated;
    } catch (err) {
      console.error('[PaymentsContext] Error updating payment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete payment
  const deletePayment = useCallback(async (paymentId: string) => {
    try {
      setLoading(true);
      await paymentsAPI.delete(paymentId);
      setPayments(prev => prev.filter((p: any) => p.id !== paymentId));
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('[PaymentsContext] Error deleting payment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Refund payment
  const refundPayment = useCallback(async (paymentId: string, refundData: unknown) => {
    try {
      setLoading(true);
      const result = await paymentsAPI.refund(paymentId, refundData);

      // Update local state with refund info
      setPayments(prev => prev.map((p: any) => {
        if (p.id === paymentId) {
          const refundAmount = (refundData as RefundData).amount || parseFloat(p.amount);
          const currentRefunded = parseFloat(p.refunded_amount || 0);
          const newRefunded = currentRefunded + refundAmount;
          const originalAmount = parseFloat(p.amount);

          return {
            ...p,
            refunded_amount: newRefunded,
            status: newRefunded >= originalAmount ? 'refunded' : 'partially_refunded',
          };
        }
        return p;
      }));
      setRefreshKey(prev => prev + 1);

      return result;
    } catch (err) {
      console.error('[PaymentsContext] Error refunding payment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Allocate payment to invoices
  const allocatePayment = useCallback(async (paymentId: string, allocations: unknown) => {
    try {
      setLoading(true);
      const result = await paymentsAPI.allocate(paymentId, { allocations });

      // Refresh to get updated payment data
      await fetchPayments();

      return result;
    } catch (err) {
      console.error('[PaymentsContext] Error allocating payment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPayments]);

  // Auto-allocate payment
  const autoAllocatePayment = useCallback(async (paymentId: string) => {
    try {
      setLoading(true);
      const result = await paymentsAPI.autoAllocate(paymentId);

      // Refresh to get updated payment data
      await fetchPayments();

      return result;
    } catch (err) {
      console.error('[PaymentsContext] Error auto-allocating payment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPayments]);

  // Get unallocated amount
  const getUnallocatedAmount = useCallback(async (paymentId: string) => {
    try {
      const result = await paymentsAPI.getUnallocated(paymentId) as UnallocatedResponse;
      return result.unallocated_amount;
    } catch (err) {
      console.error('[PaymentsContext] Error getting unallocated amount:', err);
      throw err;
    }
  }, []);

  // Get payment history
  const getPaymentHistory = useCallback(async (paymentId: string) => {
    try {
      return await paymentsAPI.getHistory(paymentId);
    } catch (err) {
      console.error('[PaymentsContext] Error getting payment history:', err);
      throw err;
    }
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<PaymentFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // Reset to page 1 when filters change (except for sort which doesn't need reset)
    if (!('sort_by' in newFilters && Object.keys(newFilters).length === 1) &&
        !('sort_direction' in newFilters && Object.keys(newFilters).length === 1)) {
      setPagination(prev => ({ ...prev, page: 1 }));
    }

    // Save to preferences
    if (newFilters.status !== undefined) {
      updatePreference('payment_filter_status', newFilters.status, 'finance');
    }
    if (newFilters.sort_by !== undefined) {
      updatePreference('payment_sort_by', newFilters.sort_by, 'finance');
    }
    if (newFilters.sort_direction !== undefined) {
      updatePreference('payment_sort_direction', newFilters.sort_direction, 'finance');
    }
  }, [updatePreference]);

  // Refresh
  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Modal helpers
  const openDetailModal = useCallback((payment: unknown) => {
    setSelectedPayment(payment);
    setShowDetailModal(true);
  }, []);

  const closeDetailModal = useCallback(() => {
    setShowDetailModal(false);
    setSelectedPayment(null);
  }, []);

  const openRefundModal = useCallback((payment: unknown) => {
    setSelectedPayment(payment);
    setShowRefundModal(true);
  }, []);

  const closeRefundModal = useCallback(() => {
    setShowRefundModal(false);
    // Don't clear selectedPayment here as it might be used by detail modal
  }, []);

  const openCreateModal = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    setShowCreateModal(false);
  }, []);

  const openEditModal = useCallback((payment: unknown) => {
    setSelectedPayment(payment);
    setShowEditModal(true);
  }, []);

  const closeEditModal = useCallback(() => {
    setShowEditModal(false);
    setSelectedPayment(null);
  }, []);

  const value = useMemo(() => ({
    // State
    payments,
    loading,
    error,
    initialized,
    filters,
    pagination,
    stats,
    showDetailModal,
    showRefundModal,
    showCreateModal,
    showEditModal,
    selectedPayment,

    // Methods
    fetchPayments,
    createPayment,
    updatePayment,
    deletePayment,
    refundPayment,
    allocatePayment,
    autoAllocatePayment,
    getUnallocatedAmount,
    getPaymentHistory,
    updateFilters,
    setPagination,
    refresh,

    // Modal helpers
    openDetailModal,
    closeDetailModal,
    openRefundModal,
    closeRefundModal,
    openCreateModal,
    closeCreateModal,
    openEditModal,
    closeEditModal,

    // Payment methods (stub implementation - payment methods not yet implemented)
    paymentMethods: [] as unknown[],
    methodsLoading: false,
    fetchPaymentMethods: async () => {},
    removePaymentMethod: async (_methodId: string) => {},
  }), [
    payments,
    loading,
    error,
    initialized,
    filters,
    pagination,
    stats,
    showDetailModal,
    showRefundModal,
    showCreateModal,
    showEditModal,
    selectedPayment,
    fetchPayments,
    createPayment,
    updatePayment,
    deletePayment,
    refundPayment,
    allocatePayment,
    autoAllocatePayment,
    getUnallocatedAmount,
    getPaymentHistory,
    updateFilters,
    refresh,
    openDetailModal,
    closeDetailModal,
    openRefundModal,
    closeRefundModal,
    openCreateModal,
    closeCreateModal,
    openEditModal,
    closeEditModal,
  ]);

  return <PaymentsContext.Provider value={value}>{children}</PaymentsContext.Provider>;
};

export const usePayments = () => {
  const context = useContext(PaymentsContext);
  if (!context) {
    throw new Error('usePayments must be used within a PaymentsProvider');
  }
  return context;
};
