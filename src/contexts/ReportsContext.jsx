import React, { createContext, useState, useCallback, useMemo, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import reportsAPI from '../services/api/finance/reports';
import { useReportFilters } from '../hooks/finance/useReportFilters';

export const ReportsContext = createContext(null);

export const ReportsProvider = ({ children }) => {
  const { user } = useAuth();
  const filterHook = useReportFilters();
  const { apiParams, filters, updateFilters, updateSearch, setPage, setSort, applyDatePreset, resetFilters } = filterHook;

  // Transaction list state
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Summary state
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const response = await reportsAPI.listTransactions(apiParams);

      setTransactions(response.items || []);
      setTotal(response.total || 0);
      setTotalPages(response.total_pages || 0);
    } catch (err) {
      console.error('[ReportsContext] Error fetching transactions:', err);
      setError(err.message);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [user, apiParams]);

  // Fetch summary with period grouping for charts
  const fetchSummary = useCallback(async () => {
    if (!user) return;

    try {
      setSummaryLoading(true);
      setSummaryError(null);

      // Include group_by_period for chart data
      const summaryParams = {
        ...apiParams,
        group_by_period: 'month',
      };

      // Remove pagination params for summary
      delete summaryParams.page;
      delete summaryParams.per_page;
      delete summaryParams.sort_by;
      delete summaryParams.sort_direction;

      const response = await reportsAPI.getSummary(summaryParams);
      setSummary(response);
    } catch (err) {
      console.error('[ReportsContext] Error fetching summary:', err);
      setSummaryError(err.message);
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, [user, apiParams]);

  // Fetch both transactions and summary when filters change
  useEffect(() => {
    if (user) {
      fetchTransactions();
      fetchSummary();
    }
  }, [fetchTransactions, fetchSummary, user]);

  // Export transactions
  const exportTransactions = useCallback(
    async (format = 'csv', includeSummary = true) => {
      try {
        const exportParams = {
          ...apiParams,
          format,
          include_summary: includeSummary,
        };

        // Remove pagination for export
        delete exportParams.page;
        delete exportParams.per_page;

        const blob = await reportsAPI.export(exportParams);

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = blob.filename || `transactions.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        return true;
      } catch (err) {
        console.error('[ReportsContext] Export error:', err);
        throw err;
      }
    },
    [apiParams]
  );

  // Refresh data
  const refresh = useCallback(() => {
    fetchTransactions();
    fetchSummary();
  }, [fetchTransactions, fetchSummary]);

  const value = useMemo(
    () => ({
      // Transaction data
      transactions,
      total,
      totalPages,
      loading,
      error,

      // Summary data
      summary,
      summaryLoading,
      summaryError,

      // Filter state
      filters,

      // Filter actions
      updateFilters,
      updateSearch,
      setPage,
      setSort,
      applyDatePreset,
      resetFilters,

      // Other actions
      exportTransactions,
      refresh,
    }),
    [
      transactions,
      total,
      totalPages,
      loading,
      error,
      summary,
      summaryLoading,
      summaryError,
      filters,
      updateFilters,
      updateSearch,
      setPage,
      setSort,
      applyDatePreset,
      resetFilters,
      exportTransactions,
      refresh,
    ]
  );

  return <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>;
};

export const useReports = () => {
  const context = useContext(ReportsContext);
  if (!context) {
    throw new Error('useReports must be used within a ReportsProvider');
  }
  return context;
};
