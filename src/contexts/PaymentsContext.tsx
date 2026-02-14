import { createContext, useState, useCallback, useMemo, useContext, useEffect, type Dispatch, type SetStateAction, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { usePreferences } from './PreferencesContext';
import paymentsAPI from '../services/api/finance/payments';
import { formatLocalDate } from '../utils/dateUtils';
import { queryKeys } from '../lib/query-keys';

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
  const queryClient = useQueryClient();

  // Modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<unknown>(null);

  // Stats (extracted from list response)
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);

  // Default to last 30 days
  const defaultRange = (() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 29);
    return {
      start_date: formatLocalDate(thirtyDaysAgo),
      end_date: formatLocalDate(today),
    };
  })();

  // Filters
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

  // Preferences loading
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // Load filters from preferences
  useEffect(() => {
    if (user && !preferencesLoaded) {
      const savedFilters = {
        status: getPreference('payment_filter_status', null) as string | null,
        sort_by: getPreference('payment_sort_by', 'payment_date') as string,
        sort_direction: getPreference('payment_sort_direction', 'desc') as string,
      };
      setFilters(prev => ({ ...prev, ...savedFilters }));
      setPreferencesLoaded(true);
    }
  }, [user, getPreference, preferencesLoaded]);

  // Build API params
  const apiParams = useMemo(() => {
    const params: Record<string, unknown> = {
      page: pagination.page,
      per_page: pagination.per_page,
    };
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '' && value !== false) {
        params[key] = value;
      }
    });
    return params;
  }, [pagination.page, pagination.per_page, filters]);

  // React Query: fetch payments
  const paymentsQuery = useQuery({
    queryKey: [...queryKeys.payments.all, 'list', { apiParams }],
    queryFn: async () => {
      const response = await paymentsAPI.list(apiParams as Record<string, string>) as PaymentListApiResponse;
      const rawItems = response.items || response.data || [];
      const items = Array.isArray(rawItems) ? rawItems : [];
      return { items, total: response.total || items.length, total_pages: response.total_pages, stats: response.stats };
    },
    enabled: !!user && preferencesLoaded,
  });

  // Update pagination and stats when data changes
  useEffect(() => {
    if (paymentsQuery.data) {
      setPagination(prev => ({
        ...prev,
        total: paymentsQuery.data.total,
        total_pages: paymentsQuery.data.total_pages || Math.ceil(paymentsQuery.data.total / prev.per_page),
      }));
      if (paymentsQuery.data.stats) {
        setStats(paymentsQuery.data.stats);
      }
    }
  }, [paymentsQuery.data]);

  const payments = paymentsQuery.data?.items || [];

  // Create payment mutation
  const createMutation = useMutation({
    mutationFn: (paymentData: unknown) => paymentsAPI.create(paymentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
    },
  });

  // Update payment mutation
  const updateMutation = useMutation({
    mutationFn: ({ paymentId, paymentData }: { paymentId: string; paymentData: unknown }) =>
      paymentsAPI.update(paymentId, paymentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
    },
  });

  // Delete payment mutation
  const deleteMutation = useMutation({
    mutationFn: (paymentId: string) => paymentsAPI.delete(paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
    },
  });

  // Refund payment mutation
  const refundMutation = useMutation({
    mutationFn: ({ paymentId, refundData }: { paymentId: string; refundData: unknown }) =>
      paymentsAPI.refund(paymentId, refundData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
    },
  });

  // Allocate payment mutation
  const allocateMutation = useMutation({
    mutationFn: ({ paymentId, allocations }: { paymentId: string; allocations: unknown }) =>
      paymentsAPI.allocate(paymentId, { allocations }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
    },
  });

  // Auto-allocate payment mutation
  const autoAllocateMutation = useMutation({
    mutationFn: (paymentId: string) => paymentsAPI.autoAllocate(paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
    },
  });

  // Wrapper functions
  const fetchPayments = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
  }, [queryClient]);

  const createPayment = useCallback(async (paymentData: unknown) => {
    return createMutation.mutateAsync(paymentData);
  }, [createMutation]);

  const updatePayment = useCallback(async (paymentId: string, paymentData: unknown) => {
    return updateMutation.mutateAsync({ paymentId, paymentData });
  }, [updateMutation]);

  const deletePayment = useCallback(async (paymentId: string) => {
    await deleteMutation.mutateAsync(paymentId);
  }, [deleteMutation]);

  const refundPayment = useCallback(async (paymentId: string, refundData: unknown) => {
    return refundMutation.mutateAsync({ paymentId, refundData });
  }, [refundMutation]);

  const allocatePayment = useCallback(async (paymentId: string, allocations: unknown) => {
    return allocateMutation.mutateAsync({ paymentId, allocations });
  }, [allocateMutation]);

  const autoAllocatePayment = useCallback(async (paymentId: string) => {
    return autoAllocateMutation.mutateAsync(paymentId);
  }, [autoAllocateMutation]);

  // Imperative API calls (not cached)
  const getUnallocatedAmount = useCallback(async (paymentId: string) => {
    const result = await paymentsAPI.getUnallocated(paymentId) as UnallocatedResponse;
    return result.unallocated_amount;
  }, []);

  const getPaymentHistory = useCallback(async (paymentId: string) => {
    return paymentsAPI.getHistory(paymentId);
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<PaymentFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    if (!('sort_by' in newFilters && Object.keys(newFilters).length === 1) &&
        !('sort_direction' in newFilters && Object.keys(newFilters).length === 1)) {
      setPagination(prev => ({ ...prev, page: 1 }));
    }
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
    queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
  }, [queryClient]);

  // Modal helpers
  const openDetailModal = useCallback((payment: unknown) => { setSelectedPayment(payment); setShowDetailModal(true); }, []);
  const closeDetailModal = useCallback(() => { setShowDetailModal(false); setSelectedPayment(null); }, []);
  const openRefundModal = useCallback((payment: unknown) => { setSelectedPayment(payment); setShowRefundModal(true); }, []);
  const closeRefundModal = useCallback(() => { setShowRefundModal(false); }, []);
  const openCreateModal = useCallback(() => { setShowCreateModal(true); }, []);
  const closeCreateModal = useCallback(() => { setShowCreateModal(false); }, []);
  const openEditModal = useCallback((payment: unknown) => { setSelectedPayment(payment); setShowEditModal(true); }, []);
  const closeEditModal = useCallback(() => { setShowEditModal(false); setSelectedPayment(null); }, []);

  const value = useMemo(() => ({
    payments,
    loading: paymentsQuery.isLoading,
    error: paymentsQuery.error?.message || null,
    initialized: paymentsQuery.isFetched,
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
    setPagination,
    refresh,
    openDetailModal,
    closeDetailModal,
    openRefundModal,
    closeRefundModal,
    openCreateModal,
    closeCreateModal,
    openEditModal,
    closeEditModal,
    paymentMethods: [] as unknown[],
    methodsLoading: false,
    fetchPaymentMethods: async () => {},
    removePaymentMethod: async (_methodId: string) => {},
  }), [
    payments,
    paymentsQuery.isLoading,
    paymentsQuery.error,
    paymentsQuery.isFetched,
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
