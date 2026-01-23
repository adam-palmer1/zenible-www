import React, { createContext, useState, useCallback, useMemo, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { usePreferences } from './PreferencesContext';
import paymentsAPI from '../services/api/finance/payments';

export const PaymentsContext = createContext(null);

export const PaymentsProvider = ({ children }) => {
  const { user } = useAuth();
  const { getPreference, updatePreference } = usePreferences();

  // State
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Stats from API
  const [stats, setStats] = useState(null);

  // Modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: null,
    contact_id: null,
    unallocated_only: false,
    start_date: null,
    end_date: null,
  });

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    total_pages: 0,
  });

  // Load filters from preferences
  useEffect(() => {
    if (user) {
      const savedFilters = {
        search: getPreference('payment_search', ''),
        status: getPreference('payment_filter_status', null),
      };

      setFilters(prev => ({ ...prev, ...savedFilters }));
      setPreferencesLoaded(true);
    }
  }, [user, getPreference]);

  // Fetch payments
  const fetchPayments = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Build params, filtering out null/undefined values
      const params = {
        page: pagination.page,
        per_page: pagination.per_page,
      };

      // Only add filter params if they have actual values
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '' && value !== false) {
          params[key] = value;
        }
      });

      const response = await paymentsAPI.list(params);

      // Handle different response formats
      const items = response.items || response.data || response;
      setPayments(Array.isArray(items) ? items : []);

      setPagination(prev => ({
        ...prev,
        total: response.total || items.length,
        total_pages: response.total_pages || Math.ceil((response.total || items.length) / prev.per_page),
      }));

      // Extract stats from list response if available
      if (response.stats) {
        setStats(response.stats);
      }

      setInitialized(true);
    } catch (err) {
      console.error('[PaymentsContext] Error fetching payments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, pagination.page, pagination.per_page, filters]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!user) return;

    try {
      const statsData = await paymentsAPI.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('[PaymentsContext] Error fetching stats:', err);
      // Don't set error for stats failure, it's not critical
    }
  }, [user]);

  // Auto-fetch on dependencies change (only after preferences are loaded)
  useEffect(() => {
    if (preferencesLoaded) {
      fetchPayments();
      fetchStats();
    }
  }, [fetchPayments, fetchStats, refreshKey, preferencesLoaded]);

  // Create payment
  const createPayment = useCallback(async (paymentData) => {
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
  const updatePayment = useCallback(async (paymentId, paymentData) => {
    try {
      setLoading(true);
      const updated = await paymentsAPI.update(paymentId, paymentData);
      setPayments(prev => prev.map(p => p.id === paymentId ? updated : p));
      return updated;
    } catch (err) {
      console.error('[PaymentsContext] Error updating payment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete payment
  const deletePayment = useCallback(async (paymentId) => {
    try {
      setLoading(true);
      await paymentsAPI.delete(paymentId);
      setPayments(prev => prev.filter(p => p.id !== paymentId));
    } catch (err) {
      console.error('[PaymentsContext] Error deleting payment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Refund payment
  const refundPayment = useCallback(async (paymentId, refundData) => {
    try {
      setLoading(true);
      const result = await paymentsAPI.refund(paymentId, refundData);

      // Update local state with refund info
      setPayments(prev => prev.map(p => {
        if (p.id === paymentId) {
          const refundAmount = refundData.amount || parseFloat(p.amount);
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

      return result;
    } catch (err) {
      console.error('[PaymentsContext] Error refunding payment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Allocate payment to invoices
  const allocatePayment = useCallback(async (paymentId, allocations) => {
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
  const autoAllocatePayment = useCallback(async (paymentId) => {
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
  const getUnallocatedAmount = useCallback(async (paymentId) => {
    try {
      const result = await paymentsAPI.getUnallocated(paymentId);
      return result.unallocated_amount;
    } catch (err) {
      console.error('[PaymentsContext] Error getting unallocated amount:', err);
      throw err;
    }
  }, []);

  // Get payment history
  const getPaymentHistory = useCallback(async (paymentId) => {
    try {
      return await paymentsAPI.getHistory(paymentId);
    } catch (err) {
      console.error('[PaymentsContext] Error getting payment history:', err);
      throw err;
    }
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 }));

    // Save to preferences
    if (newFilters.status !== undefined) {
      updatePreference('payment_filter_status', newFilters.status, 'finance');
    }
    if (newFilters.search !== undefined) {
      updatePreference('payment_search', newFilters.search, 'finance');
    }
  }, [updatePreference]);

  // Refresh
  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Modal helpers
  const openDetailModal = useCallback((payment) => {
    setSelectedPayment(payment);
    setShowDetailModal(true);
  }, []);

  const closeDetailModal = useCallback(() => {
    setShowDetailModal(false);
    setSelectedPayment(null);
  }, []);

  const openRefundModal = useCallback((payment) => {
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

  const openEditModal = useCallback((payment) => {
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
    fetchStats,
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
    fetchStats,
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
