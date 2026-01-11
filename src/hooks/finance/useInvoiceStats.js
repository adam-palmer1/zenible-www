import { useMemo } from 'react';
import { useInvoices } from '../../contexts/InvoiceContext';
import { INVOICE_STATUS } from '../../constants/finance';

/**
 * Custom hook to calculate invoice statistics
 * Returns KPI metrics and status breakdowns for invoice dashboard
 */
export function useInvoiceStats() {
  const { invoices } = useInvoices();

  const stats = useMemo(() => {
    if (!invoices || invoices.length === 0) {
      return {
        total: 0,
        revenue: 0,
        outstanding: 0,
        overdue: 0,
        draft: 0,
        sent: 0,
        paid: 0,
        overdueCount: 0,
        outstandingByCurrency: {},
        revenueByCurrency: {},
      };
    }

    const result = {
      total: invoices.length,
      revenue: 0,
      outstanding: 0,
      overdue: 0,
      draft: 0,
      sent: 0,
      paid: 0,
      overdueCount: 0,
      outstandingByCurrency: {},
      revenueByCurrency: {},
    };

    invoices.forEach((invoice) => {
      const status = invoice.status;
      const currencyCode = invoice.currency?.code || 'USD';
      const total = parseFloat(invoice.total || 0);
      const outstandingBalance = parseFloat(invoice.outstanding_balance || 0);

      // Count by status and calculate totals
      if (status === INVOICE_STATUS.DRAFT) {
        result.draft++;
        // Draft invoices don't count as outstanding
      } else if (status === INVOICE_STATUS.SENT || status === INVOICE_STATUS.VIEWED) {
        if (status === INVOICE_STATUS.SENT) {
          result.sent++;
        }
        // For sent/viewed invoices, use outstanding_balance if available, otherwise use total
        const amountOutstanding = outstandingBalance > 0 ? outstandingBalance : total;
        result.outstanding += amountOutstanding;
        result.outstandingByCurrency[currencyCode] = (result.outstandingByCurrency[currencyCode] || 0) + amountOutstanding;
      } else if (status === INVOICE_STATUS.PAID) {
        result.paid++;
        // Add to revenue (only fully paid invoices count as revenue)
        result.revenue += total;
        result.revenueByCurrency[currencyCode] = (result.revenueByCurrency[currencyCode] || 0) + total;
      } else if (status === INVOICE_STATUS.PARTIALLY_PAID) {
        // Partially paid invoices have outstanding balance
        if (outstandingBalance > 0) {
          result.outstanding += outstandingBalance;
          result.outstandingByCurrency[currencyCode] = (result.outstandingByCurrency[currencyCode] || 0) + outstandingBalance;
        }
      } else if (status === INVOICE_STATUS.OVERDUE) {
        result.overdueCount++;
        // Use outstanding_balance for overdue invoices
        const amountOutstanding = outstandingBalance > 0 ? outstandingBalance : total;
        result.outstanding += amountOutstanding;
        result.outstandingByCurrency[currencyCode] = (result.outstandingByCurrency[currencyCode] || 0) + amountOutstanding;
      } else if (status === INVOICE_STATUS.CANCELLED) {
        // Cancelled invoices don't count as outstanding
      }
    });

    // Store overdue amount separately (subset of outstanding)
    result.overdue = result.overdueCount;

    return result;
  }, [invoices]);

  return stats;
}
