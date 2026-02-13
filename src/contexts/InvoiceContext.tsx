import { createContext, useState, useCallback, useMemo, useContext, type Dispatch, type SetStateAction, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import invoicesAPI from '../services/api/finance/invoices';
import { useDocumentState, type Pagination, type DocumentStateConfig } from './useDocumentState';
import { formatLocalDate } from '../utils/dateUtils';

interface InvoiceFilters {
  search: string;
  status: string | null;
  outstanding_only: boolean | null;
  overdue_only: boolean | null;
  contact_ids: string | null;
  issue_date_from: string | null;
  issue_date_to: string | null;
  due_date_from: string | null;
  due_date_to: string | null;
  parent_invoice_id: string | null;
  pricing_type: string | null;
  is_parent_only: boolean | null;
}

export interface Invoice {
  id: string;
  invoice_number?: string;
  status?: string;
  total_amount?: number | string;
  amount_paid?: number | string;
  balance_due?: number | string;
  contact_name?: string;
  issue_date?: string;
  due_date?: string;
  [key: string]: unknown;
}

export interface InvoiceStats {
  total_count?: number;
  total_value?: number | string;
  outstanding_value?: number | string;
  overdue_value?: number | string;
  paid_value?: number | string;
  [key: string]: unknown;
}

interface InvoiceContextValue {
  invoices: Invoice[];
  stats: InvoiceStats | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  filters: InvoiceFilters;
  pagination: Pagination;
  sortBy: string;
  sortOrder: string;
  showInvoiceModal: boolean;
  editingInvoice: Invoice | null;
  selectedInvoice: Invoice | null;
  fetchInvoices: () => Promise<void>;
  getInvoice: (invoiceId: string) => Promise<unknown>;
  createInvoice: (invoiceData: unknown) => Promise<unknown>;
  updateInvoice: (invoiceId: string, invoiceData: unknown, changeReason?: string) => Promise<unknown>;
  deleteInvoice: (invoiceId: string) => Promise<void>;
  sendInvoice: (invoiceId: string, emailData: unknown) => Promise<unknown>;
  sendReminder: (invoiceId: string, emailData: unknown) => Promise<unknown>;
  markAsPaid: (invoiceId: string, paymentData: unknown) => Promise<unknown>;
  cloneInvoice: (invoiceId: string) => Promise<unknown>;
  updateFilters: (newFilters: Partial<InvoiceFilters>) => void;
  updateSort: (field: string, order: string) => void;
  setPagination: Dispatch<SetStateAction<Pagination>>;
  refresh: () => void;
  openInvoiceModal: (invoice?: unknown) => void;
  closeInvoiceModal: () => void;
  selectInvoice: (invoice: unknown) => void;
}

export const InvoiceContext = createContext<InvoiceContextValue | null>(null);

// Default to last 30 days
const getDefaultDateRange = () => {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 29);
  return {
    start_date: formatLocalDate(thirtyDaysAgo),
    end_date: formatLocalDate(today),
  };
};

export const InvoiceProvider = ({ children }: { children: ReactNode }) => {
  useAuth();

  const defaultRange = getDefaultDateRange();

  // -------------------------------------------------------------------------
  // Invoice-specific state: stats (returned inline from list endpoint)
  // -------------------------------------------------------------------------
  const [stats, setStats] = useState<InvoiceStats | null>(null);

  // -------------------------------------------------------------------------
  // Shared document state (filters, pagination, sort, CRUD, modal, fetch)
  // -------------------------------------------------------------------------
  const doc = useDocumentState<InvoiceFilters>({
    name: 'Invoice',
    apiService: invoicesAPI as unknown as DocumentStateConfig<InvoiceFilters>['apiService'],
    paginationStyle: 'page-perpage',
    sortParamName: 'sort_order',
    defaultSort: 'created_at',
    preferencePrefix: 'invoice',
    defaultFilters: {
      search: '',
      status: null,
      outstanding_only: null,
      overdue_only: null,
      contact_ids: null,
      issue_date_from: defaultRange.start_date,
      issue_date_to: defaultRange.end_date,
      due_date_from: null,
      due_date_to: null,
      parent_invoice_id: null,
      pricing_type: null,
      is_parent_only: null,
    },
    onFetchSuccess: (response) => {
      if (response.stats) {
        setStats(response.stats as InvoiceStats);
      }
    },
  });

  // -------------------------------------------------------------------------
  // Invoice-specific: createInvoice triggers refresh to update stats
  // -------------------------------------------------------------------------
  const createInvoice = useCallback(async (invoiceData: unknown) => {
    try {
      doc.setLoading(true);
      const created = await invoicesAPI.create(invoiceData as import('@/types').InvoiceCreate);
      doc.setItems(prev => [created, ...prev]);
      doc.refresh();
      return created;
    } catch (err) {
      console.error('[InvoiceContext] Error creating invoice:', err);
      throw err;
    } finally {
      doc.setLoading(false);
    }
  }, [doc.setLoading, doc.setItems, doc.refresh]);

  // -------------------------------------------------------------------------
  // Invoice-specific: deleteInvoice triggers refresh to update stats
  // -------------------------------------------------------------------------
  const deleteInvoice = useCallback(async (invoiceId: string) => {
    try {
      doc.setLoading(true);
      await invoicesAPI.delete(invoiceId);
      doc.setItems(prev => prev.filter((inv) => (inv as Invoice).id !== invoiceId));
      // Trigger refresh to update stats from backend
      doc.refresh();
    } catch (err) {
      console.error('[InvoiceContext] Error deleting invoice:', err);
      throw err;
    } finally {
      doc.setLoading(false);
    }
  }, [doc.setLoading, doc.setItems, doc.refresh]);

  // -------------------------------------------------------------------------
  // Get a single invoice by ID
  // -------------------------------------------------------------------------
  const getInvoice = useCallback(async (invoiceId: string) => {
    return invoicesAPI.get(invoiceId);
  }, []);

  // -------------------------------------------------------------------------
  // Invoice update with optional change reason
  // -------------------------------------------------------------------------
  const updateInvoice = useCallback(async (invoiceId: string, invoiceData: unknown, changeReason?: string) => {
    try {
      doc.setLoading(true);
      const updated = await invoicesAPI.update(invoiceId, invoiceData as import('@/types').InvoiceUpdate, changeReason);
      doc.setItems(prev => prev.map((inv) => (inv as Invoice).id === invoiceId ? updated : inv));
      doc.refresh();
      return updated;
    } catch (err) {
      console.error('[InvoiceContext] Error updating invoice:', err);
      throw err;
    } finally {
      doc.setLoading(false);
    }
  }, [doc.setLoading, doc.setItems, doc.refresh]);

  // -------------------------------------------------------------------------
  // Invoice-specific actions (using doc.setItems and doc.setLoading)
  // -------------------------------------------------------------------------
  const sendInvoice = useCallback(async (invoiceId: string, emailData: unknown) => {
    try {
      doc.setLoading(true);
      const result = await invoicesAPI.send(invoiceId, emailData);
      doc.setItems(prev => prev.map((inv) => {
        const item = inv as Invoice;
        return item.id === invoiceId ? { ...item, status: 'sent', sent_at: new Date().toISOString() } : inv;
      }));
      doc.refresh();
      return result;
    } catch (err) {
      console.error('[InvoiceContext] Error sending invoice:', err);
      throw err;
    } finally {
      doc.setLoading(false);
    }
  }, [doc.setLoading, doc.setItems, doc.refresh]);

  const sendReminder = useCallback(async (invoiceId: string, emailData: unknown) => {
    try {
      doc.setLoading(true);
      const result = await invoicesAPI.sendReminder(invoiceId, emailData);
      doc.setItems(prev => prev.map((inv) => {
        const item = inv as Invoice;
        return item.id === invoiceId ? {
          ...item,
          reminder_count: ((item.reminder_count as number) || 0) + 1,
          last_reminder_sent_at: new Date().toISOString()
        } : inv;
      }));
      return result;
    } catch (err) {
      console.error('[InvoiceContext] Error sending invoice reminder:', err);
      throw err;
    } finally {
      doc.setLoading(false);
    }
  }, [doc.setLoading, doc.setItems]);

  const markAsPaid = useCallback(async (invoiceId: string, paymentData: unknown) => {
    try {
      doc.setLoading(true);
      const result = await invoicesAPI.markPaid(invoiceId, paymentData);
      doc.setItems(prev => prev.map((inv) => {
        const item = inv as Invoice;
        return item.id === invoiceId ? { ...item, status: 'paid', paid_at: new Date().toISOString() } : inv;
      }));
      doc.refresh();
      return result;
    } catch (err) {
      console.error('[InvoiceContext] Error marking invoice as paid:', err);
      throw err;
    } finally {
      doc.setLoading(false);
    }
  }, [doc.setLoading, doc.setItems, doc.refresh]);

  const cloneInvoice = useCallback(async (invoiceId: string) => {
    try {
      doc.setLoading(true);
      const cloned = await invoicesAPI.clone(invoiceId);
      doc.setItems(prev => [cloned, ...prev]);
      doc.refresh();
      return cloned;
    } catch (err) {
      console.error('[InvoiceContext] Error cloning invoice:', err);
      throw err;
    } finally {
      doc.setLoading(false);
    }
  }, [doc.setLoading, doc.setItems, doc.refresh]);

  // -------------------------------------------------------------------------
  // Context value - map shared doc state to InvoiceContext's existing API
  // -------------------------------------------------------------------------
  const value = useMemo(() => ({
    // State (aliased to match existing InvoiceContextValue interface)
    invoices: doc.items as Invoice[],
    stats,
    loading: doc.loading,
    error: doc.error,
    initialized: doc.initialized,
    filters: doc.filters,
    pagination: doc.pagination,
    sortBy: doc.sortBy,
    sortOrder: doc.sortOrder,
    showInvoiceModal: doc.showModal,
    editingInvoice: doc.editingEntity as Invoice | null,
    selectedInvoice: doc.selectedEntity as Invoice | null,
    // Shared CRUD (aliased)
    fetchInvoices: doc.fetchItems,
    getInvoice,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    // Invoice-specific actions
    sendInvoice,
    sendReminder,
    markAsPaid,
    cloneInvoice,
    // Shared UI actions (aliased)
    updateFilters: doc.updateFilters,
    updateSort: doc.updateSort,
    setPagination: doc.setPagination,
    refresh: doc.refresh,
    openInvoiceModal: doc.openModal,
    closeInvoiceModal: doc.closeModal,
    selectInvoice: doc.selectEntity,
  }), [
    doc.items,
    stats,
    doc.loading,
    doc.error,
    doc.initialized,
    doc.filters,
    doc.pagination,
    doc.sortBy,
    doc.sortOrder,
    doc.showModal,
    doc.editingEntity,
    doc.selectedEntity,
    doc.fetchItems,
    getInvoice,
    doc.createItem,
    updateInvoice,
    deleteInvoice,
    sendInvoice,
    sendReminder,
    markAsPaid,
    cloneInvoice,
    doc.updateFilters,
    doc.updateSort,
    doc.refresh,
    doc.openModal,
    doc.closeModal,
    doc.selectEntity,
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
