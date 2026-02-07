import { createContext, useState, useCallback, useMemo, useContext, useEffect, type Dispatch, type SetStateAction, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import quotesAPI from '../services/api/finance/quotes';
import { useDocumentState, type Pagination } from './useDocumentState';

interface QuoteFilters {
  search: string;
  status: string | null;
  contact_id: string | null;
  contact_ids: string | null;
  project_id: string | null;
  pricing_type: string | null;
  expired_only: boolean | null;
  issue_date_from: string | null;
  issue_date_to: string | null;
  valid_until_from: string | null;
  valid_until_to: string | null;
}

interface QuotePagination {
  page: number;
  limit: number;
  total: number;
}

interface QuoteContextValue {
  quotes: unknown[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
  filters: QuoteFilters;
  pagination: QuotePagination;
  sortBy: string;
  sortOrder: string;
  showQuoteModal: boolean;
  editingQuote: unknown;
  selectedQuote: unknown;
  stats: unknown;
  statsLoading: boolean;
  templates: unknown[];
  templatesLoading: boolean;
  fetchQuotes: () => Promise<void>;
  createQuote: (quoteData: unknown) => Promise<unknown>;
  updateQuote: (quoteId: string, quoteData: unknown) => Promise<unknown>;
  deleteQuote: (quoteId: string) => Promise<void>;
  sendQuote: (quoteId: string, emailData: unknown) => Promise<unknown>;
  acceptQuote: (quoteId: string, acceptanceData: unknown) => Promise<unknown>;
  rejectQuote: (quoteId: string, rejectionData: unknown) => Promise<unknown>;
  convertToInvoice: (quoteId: string, conversionData: unknown) => Promise<unknown>;
  cloneQuote: (quoteId: string) => Promise<unknown>;
  createRevision: (quoteId: string, revisionData?: unknown) => Promise<unknown>;
  fetchStats: () => Promise<void>;
  fetchTemplates: () => Promise<void>;
  createTemplate: (templateData: unknown) => Promise<unknown>;
  updateTemplate: (templateId: string, templateData: unknown) => Promise<unknown>;
  deleteTemplate: (templateId: string) => Promise<void>;
  createFromTemplate: (templateId: string, quoteData?: unknown) => Promise<unknown>;
  updateFilters: (newFilters: Partial<QuoteFilters>) => void;
  updateSort: (field: string, order: string) => void;
  setPagination: Dispatch<SetStateAction<QuotePagination>>;
  refresh: () => void;
  openQuoteModal: (quote?: unknown) => void;
  closeQuoteModal: () => void;
  selectQuote: (quote: unknown) => void;
}

export const QuoteContext = createContext<QuoteContextValue | null>(null);

// QuoteContext-specific: skip 'search' key in fetch params (handled client-side)
const transformFilterParam = (key: string, value: unknown, _filters: QuoteFilters) => {
  if (key === 'search') return null;
  return { key, value };
};

export const QuoteProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();

  // -------------------------------------------------------------------------
  // Shared document state (filters, pagination, sort, CRUD, modal, fetch)
  // -------------------------------------------------------------------------
  const doc = useDocumentState<QuoteFilters>({
    name: 'Quote',
    apiService: quotesAPI,
    paginationStyle: 'page-perpage',
    defaultSort: 'created_at',
    preferencePrefix: 'quote',
    defaultFilters: {
      search: '',
      status: null,
      contact_id: null,
      contact_ids: null,
      project_id: null,
      pricing_type: null,
      expired_only: null,
      issue_date_from: null,
      issue_date_to: null,
      valid_until_from: null,
      valid_until_to: null,
    },
    transformFilterParam,
  });

  // -------------------------------------------------------------------------
  // Quote-specific state: stats & templates
  // -------------------------------------------------------------------------
  const [stats, setStats] = useState<unknown>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [templates, setTemplates] = useState<unknown[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  // Fetch quote statistics
  const fetchStats = useCallback(async () => {
    if (!user) return;

    try {
      setStatsLoading(true);
      const data = await quotesAPI.getStats();
      setStats(data);
    } catch (err) {
      console.error('[QuoteContext] Error fetching stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [user]);

  // Fetch stats when user is loaded (and on refresh)
  useEffect(() => {
    if (user) {
      fetchStats();
    }
  // We re-fetch stats whenever doc.initialized changes (triggered by refreshKey internally)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, fetchStats]);

  // Fetch quote templates
  const fetchTemplates = useCallback(async () => {
    if (!user) return;

    try {
      setTemplatesLoading(true);
      const data = await quotesAPI.listTemplates();
      setTemplates((data as unknown[]) || []);
    } catch (err) {
      console.error('[QuoteContext] Error fetching templates:', err);
    } finally {
      setTemplatesLoading(false);
    }
  }, [user]);

  // -------------------------------------------------------------------------
  // Quote-specific actions (using doc.setItems and doc.setLoading)
  // -------------------------------------------------------------------------
  const sendQuote = useCallback(async (quoteId: string, emailData: unknown) => {
    try {
      doc.setLoading(true);
      const result = await quotesAPI.send(quoteId, emailData);
      doc.setItems(prev => prev.map((q: any) =>
        q.id === quoteId ? { ...q, status: 'sent', sent_at: new Date().toISOString() } : q
      ));
      return result;
    } catch (err) {
      console.error('[QuoteContext] Error sending quote:', err);
      throw err;
    } finally {
      doc.setLoading(false);
    }
  }, [doc.setLoading, doc.setItems]);

  const acceptQuote = useCallback(async (quoteId: string, acceptanceData: unknown) => {
    try {
      doc.setLoading(true);
      const result = await quotesAPI.accept(quoteId, acceptanceData);
      doc.setItems(prev => prev.map((q: any) =>
        q.id === quoteId ? { ...q, status: 'accepted', accepted_at: new Date().toISOString() } : q
      ));
      return result;
    } catch (err) {
      console.error('[QuoteContext] Error accepting quote:', err);
      throw err;
    } finally {
      doc.setLoading(false);
    }
  }, [doc.setLoading, doc.setItems]);

  const rejectQuote = useCallback(async (quoteId: string, rejectionData: unknown) => {
    try {
      doc.setLoading(true);
      const result = await quotesAPI.reject(quoteId, rejectionData);
      doc.setItems(prev => prev.map((q: any) =>
        q.id === quoteId ? { ...q, status: 'rejected', rejected_at: new Date().toISOString() } : q
      ));
      return result;
    } catch (err) {
      console.error('[QuoteContext] Error rejecting quote:', err);
      throw err;
    } finally {
      doc.setLoading(false);
    }
  }, [doc.setLoading, doc.setItems]);

  const convertToInvoice = useCallback(async (quoteId: string, conversionData: unknown) => {
    try {
      doc.setLoading(true);
      const invoice = await quotesAPI.convertToInvoice(quoteId, conversionData) as any;
      doc.setItems(prev => prev.map((q: any) =>
        q.id === quoteId ? { ...q, status: 'invoiced', converted_to_invoice_id: invoice.id } : q
      ));
      return invoice;
    } catch (err) {
      console.error('[QuoteContext] Error converting quote:', err);
      throw err;
    } finally {
      doc.setLoading(false);
    }
  }, [doc.setLoading, doc.setItems]);

  const cloneQuote = useCallback(async (quoteId: string) => {
    try {
      doc.setLoading(true);
      const cloned = await quotesAPI.clone(quoteId);
      doc.setItems(prev => [cloned, ...prev]);
      return cloned;
    } catch (err) {
      console.error('[QuoteContext] Error cloning quote:', err);
      throw err;
    } finally {
      doc.setLoading(false);
    }
  }, [doc.setLoading, doc.setItems]);

  const createRevision = useCallback(async (quoteId: string, revisionData: unknown = {}) => {
    try {
      doc.setLoading(true);
      const revision = await quotesAPI.createRevision(quoteId, revisionData);
      // Refresh the quotes list to get the new revision
      await doc.fetchItems();
      return revision;
    } catch (err) {
      console.error('[QuoteContext] Error creating revision:', err);
      throw err;
    } finally {
      doc.setLoading(false);
    }
  }, [doc.setLoading, doc.fetchItems]);

  // Template management functions
  const createTemplate = useCallback(async (templateData: unknown) => {
    try {
      setTemplatesLoading(true);
      const template = await quotesAPI.createTemplate(templateData);
      setTemplates(prev => [template, ...prev]);
      return template;
    } catch (err) {
      console.error('[QuoteContext] Error creating template:', err);
      throw err;
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  const updateTemplate = useCallback(async (templateId: string, templateData: unknown) => {
    try {
      setTemplatesLoading(true);
      const updated = await quotesAPI.updateTemplate(templateId, templateData);
      setTemplates(prev => prev.map((t: any) => t.id === templateId ? updated : t));
      return updated;
    } catch (err) {
      console.error('[QuoteContext] Error updating template:', err);
      throw err;
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  const deleteTemplate = useCallback(async (templateId: string) => {
    try {
      setTemplatesLoading(true);
      await quotesAPI.deleteTemplate(templateId);
      setTemplates(prev => prev.filter((t: any) => t.id !== templateId));
    } catch (err) {
      console.error('[QuoteContext] Error deleting template:', err);
      throw err;
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  const createFromTemplate = useCallback(async (templateId: string, quoteData: unknown = {}) => {
    try {
      doc.setLoading(true);
      const quote = await quotesAPI.createFromTemplate(templateId, quoteData);
      doc.setItems(prev => [quote, ...prev]);
      return quote;
    } catch (err) {
      console.error('[QuoteContext] Error creating quote from template:', err);
      throw err;
    } finally {
      doc.setLoading(false);
    }
  }, [doc.setLoading, doc.setItems]);

  // -------------------------------------------------------------------------
  // Context value - map shared doc state to QuoteContext's existing API
  // -------------------------------------------------------------------------
  const value = useMemo(() => ({
    // State (aliased to match existing QuoteContextValue interface)
    quotes: doc.items,
    loading: doc.loading,
    error: doc.error,
    initialized: doc.initialized,
    filters: doc.filters,
    pagination: doc.pagination,
    sortBy: doc.sortBy,
    sortOrder: doc.sortOrder,
    showQuoteModal: doc.showModal,
    editingQuote: doc.editingEntity,
    selectedQuote: doc.selectedEntity,
    // Quote-specific state
    stats,
    statsLoading,
    templates,
    templatesLoading,
    // Shared CRUD (aliased)
    fetchQuotes: doc.fetchItems,
    createQuote: doc.createItem,
    updateQuote: doc.updateItem,
    deleteQuote: doc.deleteItem,
    // Quote-specific actions
    sendQuote,
    acceptQuote,
    rejectQuote,
    convertToInvoice,
    cloneQuote,
    createRevision,
    // Stats actions
    fetchStats,
    // Template actions
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    createFromTemplate,
    // Shared UI actions (aliased)
    updateFilters: doc.updateFilters,
    updateSort: doc.updateSort,
    setPagination: doc.setPagination,
    refresh: doc.refresh,
    openQuoteModal: doc.openModal,
    closeQuoteModal: doc.closeModal,
    selectQuote: doc.selectEntity,
  }), [
    doc.items,
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
    stats,
    statsLoading,
    templates,
    templatesLoading,
    doc.fetchItems,
    doc.createItem,
    doc.updateItem,
    doc.deleteItem,
    sendQuote,
    acceptQuote,
    rejectQuote,
    convertToInvoice,
    cloneQuote,
    createRevision,
    fetchStats,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    createFromTemplate,
    doc.updateFilters,
    doc.updateSort,
    doc.refresh,
    doc.openModal,
    doc.closeModal,
    doc.selectEntity,
  ]);

  return <QuoteContext.Provider value={value}>{children}</QuoteContext.Provider>;
};

export const useQuotes = () => {
  const context = useContext(QuoteContext);
  if (!context) {
    throw new Error('useQuotes must be used within a QuoteProvider');
  }
  return context;
};
