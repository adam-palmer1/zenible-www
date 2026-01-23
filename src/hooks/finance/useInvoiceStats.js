import { useMemo } from 'react';
import { useInvoices } from '../../contexts/InvoiceContext';

/**
 * Custom hook to get invoice statistics from backend
 * Returns KPI metrics for invoice dashboard
 */
export function useInvoiceStats() {
  const { stats: backendStats } = useInvoices();

  const stats = useMemo(() => {
    const defaultStats = {
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

    if (!backendStats || !backendStats.by_currency) {
      return defaultStats;
    }

    const result = {
      total: backendStats.total_invoices || 0,
      revenue: 0,
      outstanding: 0,
      overdue: 0,
      overdueCount: backendStats.overdue_count || 0,
      outstandingByCurrency: {},
      revenueByCurrency: {},
      overdueByCurrency: {},
      // Converted totals from API
      convertedTotal: backendStats.converted_total || null,
      convertedOutstanding: backendStats.converted_outstanding || null,
      convertedOverdue: backendStats.converted_overdue || null,
      // By currency breakdown arrays
      totalByCurrency: [],
      outstandingByCurrencyArray: [],
      overdueByCurrencyArray: [],
    };

    // Process stats by currency from backend
    backendStats.by_currency.forEach((currencyStats) => {
      const code = currencyStats.currency_code || 'USD';
      const symbol = currencyStats.currency_symbol || '$';
      const totalInvoiced = parseFloat(currencyStats.total_invoiced || 0);
      const totalPaid = parseFloat(currencyStats.total_paid || 0);
      const totalOutstanding = parseFloat(currencyStats.total_outstanding || 0);
      const totalOverdue = parseFloat(currencyStats.total_overdue || 0);

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
