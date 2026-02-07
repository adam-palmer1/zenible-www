import { useMemo } from 'react';
import { useInvoices } from '../../contexts/InvoiceContext';

interface CurrencyBreakdown {
  currency_code: string;
  currency_symbol: string;
  total: number;
}

interface ConvertedAmount {
  amount: number;
  currency_code: string;
  currency_symbol: string;
}

/** Shape of per-currency stats from the backend (matches InvoiceCurrencyStats) */
interface BackendCurrencyStats {
  currency_code?: string;
  currency_symbol?: string;
  total_invoiced?: string | number;
  total_paid?: string | number;
  total_outstanding?: string | number;
  total_overdue?: string | number;
  [key: string]: unknown;
}

/** Shape of the stats object returned by the invoice list endpoint (matches InvoiceListStats) */
interface BackendInvoiceStats {
  total_invoices?: number;
  overdue_count?: number;
  by_currency?: BackendCurrencyStats[];
  converted_total?: ConvertedAmount | null;
  converted_outstanding?: ConvertedAmount | null;
  converted_overdue?: ConvertedAmount | null;
  [key: string]: unknown;
}

export interface InvoiceStats {
  total: number;
  revenue: number;
  outstanding: number;
  overdue: number;
  overdueCount: number;
  outstandingByCurrency: Record<string, number>;
  revenueByCurrency: Record<string, number>;
  overdueByCurrency: Record<string, number>;
  convertedTotal: ConvertedAmount | null;
  convertedOutstanding: ConvertedAmount | null;
  convertedOverdue: ConvertedAmount | null;
  totalByCurrency: CurrencyBreakdown[];
  outstandingByCurrencyArray: CurrencyBreakdown[];
  overdueByCurrencyArray: CurrencyBreakdown[];
}

/**
 * Custom hook to get invoice statistics from backend
 * Returns KPI metrics for invoice dashboard
 */
export function useInvoiceStats(): InvoiceStats {
  const { stats: backendStats } = useInvoices() as { stats: unknown };

  const stats = useMemo((): InvoiceStats => {
    const defaultStats: InvoiceStats = {
      total: 0,
      revenue: 0,
      outstanding: 0,
      overdue: 0,
      overdueCount: 0,
      outstandingByCurrency: {},
      revenueByCurrency: {},
      overdueByCurrency: {},
      // Converted totals (in default currency)
      convertedTotal: null,
      convertedOutstanding: null,
      convertedOverdue: null,
      // By currency breakdown arrays (for subtitle display)
      totalByCurrency: [],
      outstandingByCurrencyArray: [],
      overdueByCurrencyArray: [],
    };

    const typedStats = backendStats as BackendInvoiceStats | null | undefined;

    if (!typedStats || !typedStats.by_currency) {
      return defaultStats;
    }

    const result: InvoiceStats = {
      total: typedStats.total_invoices || 0,
      revenue: 0,
      outstanding: 0,
      overdue: 0,
      overdueCount: typedStats.overdue_count || 0,
      outstandingByCurrency: {},
      revenueByCurrency: {},
      overdueByCurrency: {},
      // Converted totals from API
      convertedTotal: typedStats.converted_total || null,
      convertedOutstanding: typedStats.converted_outstanding || null,
      convertedOverdue: typedStats.converted_overdue || null,
      // By currency breakdown arrays
      totalByCurrency: [],
      outstandingByCurrencyArray: [],
      overdueByCurrencyArray: [],
    };

    // Process stats by currency from backend
    typedStats.by_currency.forEach((currencyStats: BackendCurrencyStats) => {
      const code: string = currencyStats.currency_code || 'USD';
      const symbol: string = currencyStats.currency_symbol || '$';
      const totalInvoiced: number = parseFloat(String(currencyStats.total_invoiced || 0));
      const totalPaid: number = parseFloat(String(currencyStats.total_paid || 0));
      const totalOutstanding: number = parseFloat(String(currencyStats.total_outstanding || 0));
      const totalOverdue: number = parseFloat(String(currencyStats.total_overdue || 0));

      // Revenue is total paid amount
      result.revenue += totalPaid;
      result.revenueByCurrency[code] = totalPaid;

      // Outstanding balance
      result.outstanding += totalOutstanding;
      result.outstandingByCurrency[code] = totalOutstanding;

      // Overdue amounts
      result.overdue += totalOverdue;
      result.overdueByCurrency[code] = totalOverdue;

      // Build currency breakdown arrays for subtitle display
      if (totalInvoiced > 0) {
        result.totalByCurrency.push({
          currency_code: code,
          currency_symbol: symbol,
          total: totalInvoiced,
        });
      }
      if (totalOutstanding > 0) {
        result.outstandingByCurrencyArray.push({
          currency_code: code,
          currency_symbol: symbol,
          total: totalOutstanding,
        });
      }
      if (totalOverdue > 0) {
        result.overdueByCurrencyArray.push({
          currency_code: code,
          currency_symbol: symbol,
          total: totalOverdue,
        });
      }
    });

    return result;
  }, [backendStats]);

  return stats;
}
