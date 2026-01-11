import React, { createContext, useState, useCallback, useMemo, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { usePreferences } from './PreferencesContext';
import invoicesAPI from '../services/api/finance/invoices';

export const InvoiceContext = createContext(null);

export const InvoiceProvider = ({ children }) => {
  const { user } = useAuth();
  const { getPreference, updatePreference } = usePreferences();

  // State
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: null,
    contact_id: null,
    from_date: null,
    to_date: null,
  });

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });

  // Sort
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Load filters from preferences
  useEffect(() => {
    if (user) {
      const savedFilters = {
        search: getPreference('invoice_search', ''),
        status: getPreference('invoice_filter_status', null),
      };
      const savedSort = getPreference('invoice_sort_by', 'created_at');
      const savedOrder = getPreference('invoice_sort_order', 'desc');

      setFilters(savedFilters);
      setSortBy(savedSort);
      setSortOrder(savedOrder);
      setPreferencesLoaded(true);
    }
  }, [user, getPreference]);

  // Fetch invoices
  const fetchInvoices = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Build params, filtering out null/undefined values
      const params = {
        skip: (pagination.page - 1) * pagination.limit,
        limit: pagination.limit,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      // Only add filter params if they have actual values
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params[key] = value;
        }
      });

      const response = await invoicesAPI.list(params);
      setInvoices(response.items || response);
      setPagination(prev => ({
        ...prev,
        total: response.total || response.length,
      }));
      setInitialized(true);
    } catch (err) {
      console.error('[InvoiceContext] Error fetching invoices:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, pagination.page, pagination.limit, sortBy, sortOrder, filters]);

  // Auto-fetch on dependencies change (only after preferences are loaded)
  useEffect(() => {
    if (preferencesLoaded) {
      fetchInvoices();
    }
  }, [fetchInvoices, refreshKey, preferencesLoaded]);

  // Create invoice
  const createInvoice = useCallback(async (invoiceData) => {
    try {
      setLoading(true);
      const created = await invoicesAPI.create(invoiceData);
      setInvoices(prev => [created, ...prev]);
      return created;
    } catch (err) {
      console.error('[InvoiceContext] Error creating invoice:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update invoice
  const updateInvoice = useCallback(async (invoiceId, invoiceData) => {
    try {
      setLoading(true);
      const updated = await invoicesAPI.update(invoiceId, invoiceData);
      setInvoices(prev => prev.map(inv => inv.id === invoiceId ? updated : inv));
      return updated;
    } catch (err) {
      console.error('[InvoiceContext] Error updating invoice:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete invoice
  const deleteInvoice = useCallback(async (invoiceId) => {
    try {
      setLoading(true);
      await invoicesAPI.delete(invoiceId);
      setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
    } catch (err) {
      console.error('[InvoiceContext] Error deleting invoice:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Send invoice
  const sendInvoice = useCallback(async (invoiceId, emailData) => {
    try {
      setLoading(true);
      const result = await invoicesAPI.send(invoiceId, emailData);
      setInvoices(prev => prev.map(inv =>
        inv.id === invoiceId ? { ...inv, status: 'sent', sent_at: new Date().toISOString() } : inv
      ));
      return result;
    } catch (err) {
      console.error('[InvoiceContext] Error sending invoice:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark as paid
  const markAsPaid = useCallback(async (invoiceId, paymentData) => {
    try {
      setLoading(true);
      const result = await invoicesAPI.markPaid(invoiceId, paymentData);
      setInvoices(prev => prev.map(inv =>
        inv.id === invoiceId ? { ...inv, status: 'paid', paid_at: new Date().toISOString() } : inv
      ));
      return result;
    } catch (err) {
      console.error('[InvoiceContext] Error marking invoice as paid:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Clone invoice
  const cloneInvoice = useCallback(async (invoiceId) => {
    try {
      setLoading(true);
      const cloned = await invoicesAPI.clone(invoiceId);
      setInvoices(prev => [cloned, ...prev]);
      return cloned;
    } catch (err) {
      console.error('[InvoiceContext] Error cloning invoice:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 }));

    // Save to preferences
    if (newFilters.status !== undefined) {
      updatePreference('invoice_filter_status', newFilters.status, 'finance');
    }
    if (newFilters.search !== undefined) {
      updatePreference('invoice_search', newFilters.search, 'finance');
    }
  }, [updatePreference]);

  // Update sort
  const updateSort = useCallback((field, order) => {
    setSortBy(field);
    setSortOrder(order);
    updatePreference('invoice_sort_by', field, 'finance');
    updatePreference('invoice_sort_order', order, 'finance');
  }, [updatePreference]);

  // Refresh
  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Modal helpers
  const openInvoiceModal = useCallback((invoice = null) => {
    setEditingInvoice(invoice);
    setShowInvoiceModal(true);
  }, []);

  const closeInvoiceModal = useCallback(() => {
    setShowInvoiceModal(false);
    setEditingInvoice(null);
  }, []);

  const selectInvoice = useCallback((invoice) => {
    setSelectedInvoice(invoice);
  }, []);

  const value = useMemo(() => ({
    // State
    invoices,
    loading,
    error,
    initialized,
    filters,
    pagination,
    sortBy,
    sortOrder,
    showInvoiceModal,
    editingInvoice,
    selectedInvoice,

    // Methods
    fetchInvoices,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    sendInvoice,
    markAsPaid,
    cloneInvoice,
    updateFilters,
    updateSort,
    setPagination,
    refresh,
    openInvoiceModal,
    closeInvoiceModal,
    selectInvoice,
  }), [
    invoices,
    loading,
    error,
    initialized,
    filters,
    pagination,
    sortBy,
    sortOrder,
    showInvoiceModal,
    editingInvoice,
    selectedInvoice,
    fetchInvoices,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    sendInvoice,
    markAsPaid,
    cloneInvoice,
    updateFilters,
    updateSort,
    refresh,
    openInvoiceModal,
    closeInvoiceModal,
    selectInvoice,
  ]);

  return <InvoiceContext.Provider value={value}>{children}</InvoiceContext.Provider>;
};

export const useInvoices = () => {
  const context = useContext(InvoiceContext);
  if (!context) {
    throw new Error('useInvoices must be used within an InvoiceProvider');
  }
  return context;
};
