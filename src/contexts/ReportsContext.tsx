import { createContext, useCallback, useMemo, useContext, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import reportsAPI from '../services/api/finance/reports';
import { useReportFilters, type ReportFilters, type FilterUpdates, type UpdateFilterOptions, type DatePresetName } from '../hooks/finance/useReportFilters';
import { queryKeys } from '../lib/query-keys';

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
  const queryClient = useQueryClient();
  const filterHook = useReportFilters();
  const { apiParams, filters, updateFilters, updateSearch, setPage, setSort, applyDatePreset, resetFilters } = filterHook;

  // Transactions query
  const transactionsQuery = useQuery({
    queryKey: queryKeys.financeReports.transactions(apiParams),
    queryFn: async () => {
      const response = await reportsAPI.listTransactions(apiParams) as { items?: Transaction[]; total?: number; total_pages?: number };
      return {
        items: response.items || [],
        total: response.total || 0,
        totalPages: response.total_pages || 0,
      };
    },
    enabled: !!user,
  });

  // Summary query (separate from transactions - different params)
  const summaryParams = useMemo(() => {
    const params: Record<string, unknown> = {
      ...apiParams,
      group_by_period: 'month',
    };
    delete params.page;
    delete params.per_page;
    delete params.sort_by;
    delete params.sort_direction;
    return params;
  }, [apiParams]);

  const summaryQuery = useQuery({
    queryKey: queryKeys.financeReports.summary(summaryParams),
    queryFn: async () => {
      const response = await reportsAPI.getSummary(summaryParams);
      return response as ReportSummary;
    },
    enabled: !!user,
  });

  // Export transactions (imperative, not cached)
  const exportTransactions = useCallback(
    async (format = 'csv', includeSummary = true) => {
      try {
        const exportParams: Record<string, unknown> = {
          ...apiParams,
          format,
          include_summary: includeSummary,
        };
        delete exportParams.page;
        delete exportParams.per_page;

        const blob = await reportsAPI.export(exportParams);

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
    queryClient.invalidateQueries({ queryKey: queryKeys.financeReports.all });
  }, [queryClient]);

  const value = useMemo(
    () => ({
      transactions: transactionsQuery.data?.items || [],
      total: transactionsQuery.data?.total || 0,
      totalPages: transactionsQuery.data?.totalPages || 0,
      loading: transactionsQuery.isLoading,
      error: transactionsQuery.error?.message || null,
      summary: summaryQuery.data || null,
      summaryLoading: summaryQuery.isLoading,
      summaryError: summaryQuery.error?.message || null,
      filters,
      updateFilters,
      updateSearch,
      setPage,
      setSort,
      applyDatePreset,
      resetFilters,
      exportTransactions,
      refresh,
    }),
    [
      transactionsQuery.data,
      transactionsQuery.isLoading,
      transactionsQuery.error,
      summaryQuery.data,
      summaryQuery.isLoading,
      summaryQuery.error,
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
