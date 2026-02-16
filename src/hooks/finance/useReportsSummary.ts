import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import reportsAPI from '../../services/api/finance/reports';
import { queryKeys } from '../../lib/query-keys';
import { formatLocalDate } from '../../utils/dateUtils';

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
  invoice_total?: string | number;
  quote_total?: string | number;
  expense_total?: string | number;
  paid_expenses_total?: string | number;
  unpaid_expenses_total?: string | number;
  net_amount?: string | number;
  outstanding_invoices?: string | number;
  paid_invoices_total?: string | number;
  credit_notes_total?: string | number;
  unlinked_payments_total?: string | number;
  overdue_count?: number;
  total_count?: number;
  income_by_currency?: CurrencyBreakdown[];
  expense_by_currency?: CurrencyBreakdown[];
  outstanding_by_currency?: CurrencyBreakdown[];
  by_period?: PeriodData[];
  by_type?: TypeBreakdown[];
  [key: string]: unknown;
}

export interface UseReportsSummaryReturn {
  summary: ReportSummary | null;
  summaryLoading: boolean;
  summaryError: string | null;
}

const getDateDaysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatLocalDate(date);
};

const getToday = (): string => formatLocalDate(new Date());

export interface ReportsSummaryParams {
  start_date?: string;
  end_date?: string;
  contact_id?: string;
  transaction_types?: string[];
  group_by_period?: string;
}

/**
 * Lightweight hook that only fetches the reports summary (KPI cards + chart data).
 * Default: last 30 days, all transaction types, grouped by month.
 * Caller can override any param via the optional `params` argument.
 */
export function useReportsSummary(params?: ReportsSummaryParams): UseReportsSummaryReturn {
  const { user } = useAuth();

  const summaryParams = useMemo(() => ({
    start_date: getDateDaysAgo(30),
    end_date: getToday(),
    group_by_period: 'month',
    ...params,
  }), [params]);

  const summaryQuery = useQuery({
    queryKey: queryKeys.financeReports.summary(summaryParams),
    queryFn: async () => {
      const response = await reportsAPI.getSummary(summaryParams);
      return response as ReportSummary;
    },
    enabled: !!user,
  });

  return useMemo(() => ({
    summary: summaryQuery.data || null,
    summaryLoading: summaryQuery.isLoading,
    summaryError: summaryQuery.error?.message || null,
  }), [summaryQuery.data, summaryQuery.isLoading, summaryQuery.error]);
}

export default useReportsSummary;
