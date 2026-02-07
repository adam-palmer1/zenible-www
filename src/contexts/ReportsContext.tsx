import { createContext, useState, useCallback, useMemo, useContext, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import reportsAPI from '../services/api/finance/reports';
import { useReportFilters, type ReportFilters, type FilterUpdates, type UpdateFilterOptions, type DatePresetName } from '../hooks/finance/useReportFilters';

export interface Transaction {
  id: string;
  transaction_type: string;
  invoice_number?: string;
  quote_number?: string;
  transaction_date?: string;
  total_amount?: number | string;
  status?: string;
  contact_name?: string;
  currency_code?: string;
  currency_symbol?: string;
  [key: string]: unknown;
}

export interface CurrencyBreakdown {
  currency_code: string;
  currency_symbol: string;
  total: string | number;
  [key: string]: unknown;
}

export interface PeriodData {
  period: string;
  income: number | string;
  expenses: number | string;
  net: number | string;
  [key: string]: unknown;
}

export interface TypeBreakdown {
  type: string;
  count: number;
  total: string | number;
  [key: string]: unknown;
}

export interface ReportSummary {
  default_currency?: { code: string; symbol: string; [key: string]: unknown };
  income_total?: string | number;
  expense_total?: string | number;
  net_amount?: string | number;
  outstanding_invoices?: string | number;
  overdue_count?: number;
  total_count?: number;
  income_by_currency?: CurrencyBreakdown[];
  expense_by_currency?: CurrencyBreakdown[];
  outstanding_by_currency?: CurrencyBreakdown[];
  by_period?: PeriodData[];
  by_type?: TypeBreakdown[];
  [key: string]: unknown;
}

interface ReportsContextValue {
  transactions: Transaction[];
  total: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  summary: ReportSummary | null;
  summaryLoading: boolean;
  summaryError: string | null;
  filters: ReportFilters;
  updateFilters: (newFilters: FilterUpdates, options?: UpdateFilterOptions) => void;
  updateSearch: (search: string | undefined) => void;
  setPage: (page: number) => void;
  setSort: (field: string, direction?: string) => void;
  applyDatePreset: (preset: DatePresetName) => void;
  resetFilters: () => void;
  exportTransactions: (format?: string, includeSummary?: boolean) => Promise<boolean>;
  refresh: () => void;
}

export const ReportsContext = createContext<ReportsContextValue | null>(null);

export const ReportsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const filterHook = useReportFilters();
  const { apiParams, filters, updateFilters, updateSearch, setPage, setSort, applyDatePreset, resetFilters } = filterHook;

  // Transaction list state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Summary state
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const response = await reportsAPI.listTransactions(apiParams) as { items?: Transaction[]; total?: number; total_pages?: number };

      setTransactions(response.items || []);
      setTotal(response.total || 0);
      setTotalPages(response.total_pages || 0);
    } catch (err) {
      console.error('[ReportsContext] Error fetching transactions:', err);
      setError((err as Error).message);
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
      const summaryParams: Record<string, unknown> = {
        ...apiParams,
        group_by_period: 'month',
      };

      // Remove pagination params for summary
      delete summaryParams.page;
      delete summaryParams.per_page;
      delete summaryParams.sort_by;
      delete summaryParams.sort_direction;

      const response = await reportsAPI.getSummary(summaryParams);
      setSummary(response as ReportSummary);
    } catch (err) {
      console.error('[ReportsContext] Error fetching summary:', err);
      setSummaryError((err as Error).message);
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
        const exportParams: Record<string, unknown> = {
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
        link.download = (blob as Blob & { filename?: string }).filename || `transactions.${format}`;
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
