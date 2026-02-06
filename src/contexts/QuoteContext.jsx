import React, { createContext, useState, useCallback, useMemo, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { usePreferences } from './PreferencesContext';
import quotesAPI from '../services/api/finance/quotes';

export const QuoteContext = createContext(null);

export const QuoteProvider = ({ children }) => {
  const { user } = useAuth();
  const { getPreference, updatePreference } = usePreferences();

  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Stats from API
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Templates
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  const [selectedQuote, setSelectedQuote] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    status: null,
    contact_id: null,
    contact_ids: null, // comma-separated UUIDs for multiple contacts
    project_id: null,
    pricing_type: null,
    expired_only: null,
    issue_date_from: null,
    issue_date_to: null,
    valid_until_from: null,
    valid_until_to: null,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });

  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    if (user) {
      const savedFilters = {
        search: getPreference('quote_search', ''),
        status: getPreference('quote_filter_status', null),
      };
      const savedSort = getPreference('quote_sort_by', 'created_at');
      const savedOrder = getPreference('quote_sort_order', 'desc');

      setFilters(savedFilters);
      setSortBy(savedSort);
      setSortOrder(savedOrder);
      setPreferencesLoaded(true);
    }
  }, [user, getPreference]);

  const fetchQuotes = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Build params, filtering out null/undefined values
      // Backend uses page/per_page pagination (not skip/limit)
      const params = {
        page: pagination.page,
        per_page: pagination.limit,
        sort_by: sortBy,
        sort_direction: sortOrder,
      };

      // Only add filter params if they have actual values
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          // Skip 'search' as it's handled client-side for now
          // The backend doesn't have a search parameter
          if (key !== 'search') {
            params[key] = value;
          }
        }
      });

      const response = await quotesAPI.list(params);
      setQuotes(response.items || response);
      setPagination(prev => ({
        ...prev,
        total: response.total || response.length,
      }));
      setInitialized(true);
    } catch (err) {
      console.error('[QuoteContext] Error fetching quotes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, pagination.page, pagination.limit, sortBy, sortOrder, filters]);

  useEffect(() => {
    if (preferencesLoaded) {
      fetchQuotes();
    }
  }, [fetchQuotes, refreshKey, preferencesLoaded]);

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

  // Fetch stats when user is loaded
  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user, fetchStats, refreshKey]);

  // Fetch quote templates
  const fetchTemplates = useCallback(async () => {
    if (!user) return;

    try {
      setTemplatesLoading(true);
      const data = await quotesAPI.listTemplates();
      setTemplates(data || []);
    } catch (err) {
      console.error('[QuoteContext] Error fetching templates:', err);
    } finally {
      setTemplatesLoading(false);
    }
  }, [user]);

  const createQuote = useCallback(async (quoteData) => {
    try {
      setLoading(true);
      const created = await quotesAPI.create(quoteData);
      setQuotes(prev => [created, ...prev]);
      return created;
    } catch (err) {
      console.error('[QuoteContext] Error creating quote:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateQuote = useCallback(async (quoteId, quoteData) => {
    try {
      setLoading(true);
      const updated = await quotesAPI.update(quoteId, quoteData);
      setQuotes(prev => prev.map(q => q.id === quoteId ? updated : q));
      return updated;
    } catch (err) {
      console.error('[QuoteContext] Error updating quote:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteQuote = useCallback(async (quoteId) => {
    try {
      setLoading(true);
      await quotesAPI.delete(quoteId);
      setQuotes(prev => prev.filter(q => q.id !== quoteId));
    } catch (err) {
      console.error('[QuoteContext] Error deleting quote:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendQuote = useCallback(async (quoteId, emailData) => {
    try {
      setLoading(true);
      const result = await quotesAPI.send(quoteId, emailData);
      setQuotes(prev => prev.map(q =>
        q.id === quoteId ? { ...q, status: 'sent', sent_at: new Date().toISOString() } : q
      ));
      return result;
    } catch (err) {
      console.error('[QuoteContext] Error sending quote:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const acceptQuote = useCallback(async (quoteId, acceptanceData) => {
    try {
      setLoading(true);
      const result = await quotesAPI.accept(quoteId, acceptanceData);
      setQuotes(prev => prev.map(q =>
        q.id === quoteId ? { ...q, status: 'accepted', accepted_at: new Date().toISOString() } : q
      ));
      return result;
    } catch (err) {
      console.error('[QuoteContext] Error accepting quote:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const rejectQuote = useCallback(async (quoteId, rejectionData) => {
    try {
      setLoading(true);
      const result = await quotesAPI.reject(quoteId, rejectionData);
      setQuotes(prev => prev.map(q =>
        q.id === quoteId ? { ...q, status: 'rejected', rejected_at: new Date().toISOString() } : q
      ));
      return result;
    } catch (err) {
      console.error('[QuoteContext] Error rejecting quote:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const convertToInvoice = useCallback(async (quoteId, conversionData) => {
    try {
      setLoading(true);
      const invoice = await quotesAPI.convertToInvoice(quoteId, conversionData);
      setQuotes(prev => prev.map(q =>
        q.id === quoteId ? { ...q, status: 'invoiced', converted_to_invoice_id: invoice.id } : q
      ));
      return invoice;
    } catch (err) {
      console.error('[QuoteContext] Error converting quote:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const cloneQuote = useCallback(async (quoteId) => {
    try {
      setLoading(true);
      const cloned = await quotesAPI.clone(quoteId);
      setQuotes(prev => [cloned, ...prev]);
      return cloned;
    } catch (err) {
      console.error('[QuoteContext] Error cloning quote:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createRevision = useCallback(async (quoteId, revisionData = {}) => {
    try {
      setLoading(true);
      const revision = await quotesAPI.createRevision(quoteId, revisionData);
      // Refresh the quotes list to get the new revision
      await fetchQuotes();
      return revision;
    } catch (err) {
      console.error('[QuoteContext] Error creating revision:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchQuotes]);

  // Template management functions
  const createTemplate = useCallback(async (templateData) => {
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

  const updateTemplate = useCallback(async (templateId, templateData) => {
    try {
      setTemplatesLoading(true);
      const updated = await quotesAPI.updateTemplate(templateId, templateData);
      setTemplates(prev => prev.map(t => t.id === templateId ? updated : t));
      return updated;
    } catch (err) {
      console.error('[QuoteContext] Error updating template:', err);
      throw err;
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  const deleteTemplate = useCallback(async (templateId) => {
    try {
      setTemplatesLoading(true);
      await quotesAPI.deleteTemplate(templateId);
      setTemplates(prev => prev.filter(t => t.id !== templateId));
    } catch (err) {
      console.error('[QuoteContext] Error deleting template:', err);
      throw err;
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  const createFromTemplate = useCallback(async (templateId, quoteData = {}) => {
    try {
      setLoading(true);
      const quote = await quotesAPI.createFromTemplate(templateId, quoteData);
      setQuotes(prev => [quote, ...prev]);
      return quote;
    } catch (err) {
      console.error('[QuoteContext] Error creating quote from template:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 }));

    if (newFilters.status !== undefined) {
      updatePreference('quote_filter_status', newFilters.status, 'finance');
    }
    if (newFilters.search !== undefined) {
      updatePreference('quote_search', newFilters.search, 'finance');
    }
  }, [updatePreference]);

  const updateSort = useCallback((field, order) => {
    setSortBy(field);
    setSortOrder(order);
    updatePreference('quote_sort_by', field, 'finance');
    updatePreference('quote_sort_order', order, 'finance');
  }, [updatePreference]);

  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const openQuoteModal = useCallback((quote = null) => {
    setEditingQuote(quote);
    setShowQuoteModal(true);
  }, []);

  const closeQuoteModal = useCallback(() => {
    setShowQuoteModal(false);
    setEditingQuote(null);
  }, []);

  const selectQuote = useCallback((quote) => {
    setSelectedQuote(quote);
  }, []);

  const value = useMemo(() => ({
    // State
    quotes,
    loading,
    error,
    initialized,
    filters,
    pagination,
    sortBy,
    sortOrder,
    showQuoteModal,
    editingQuote,
    selectedQuote,
    // Stats
    stats,
    statsLoading,
    // Templates
    templates,
    templatesLoading,
    // Quote actions
    fetchQuotes,
    createQuote,
    updateQuote,
    deleteQuote,
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
    // UI actions
    updateFilters,
    updateSort,
    setPagination,
    refresh,
    openQuoteModal,
    closeQuoteModal,
    selectQuote,
  }), [
    quotes,
    loading,
    error,
    initialized,
    filters,
    pagination,
    sortBy,
    sortOrder,
    showQuoteModal,
    editingQuote,
    selectedQuote,
    stats,
    statsLoading,
    templates,
    templatesLoading,
    fetchQuotes,
    createQuote,
    updateQuote,
    deleteQuote,
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
    updateFilters,
    updateSort,
    refresh,
    openQuoteModal,
    closeQuoteModal,
    selectQuote,
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
