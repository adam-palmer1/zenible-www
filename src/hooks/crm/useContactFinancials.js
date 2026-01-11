import { useState, useCallback, useEffect, useMemo } from 'react';
import { invoicesAPI, quotesAPI, expensesAPI, paymentsAPI, creditNotesAPI } from '../../services/api/finance';

/**
 * Custom hook for managing contact financial data
 * Handles loading all financial transactions and calculating summaries by currency
 *
 * @param {string} contactId - The contact ID
 * @param {boolean} isVendor - Whether the contact is a vendor (for expenses)
 * @returns {Object} Financials state and methods
 */
export function useContactFinancials(contactId, isVendor = false) {
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [creditNotes, setCreditNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [displayCount, setDisplayCount] = useState(20);
  const PER_PAGE_INCREMENT = 20;

  // Fetch all financial data for the contact
  const fetchFinancials = useCallback(async () => {
    if (!contactId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch all data types in parallel
      const [invoicesRes, paymentsRes, quotesRes, creditNotesRes, expensesRes] = await Promise.all([
        invoicesAPI.list({ contact_id: contactId, per_page: 1000 }).catch(() => ({ items: [] })),
        paymentsAPI.list({ contact_id: contactId, per_page: 1000 }).catch(() => ({ items: [] })),
        quotesAPI.list({ contact_id: contactId, per_page: 1000 }).catch(() => ({ items: [] })),
        creditNotesAPI.list({ contact_id: contactId, per_page: 1000 }).catch(() => ({ items: [] })),
        // Expenses are linked via vendor_id if this contact is a vendor
        isVendor
          ? expensesAPI.list({ vendor_id: contactId, per_page: 1000 }).catch(() => ({ items: [] }))
          : Promise.resolve({ items: [] }),
      ]);

      // Handle both array and paginated response formats
      setInvoices(Array.isArray(invoicesRes) ? invoicesRes : invoicesRes.items || []);
      setPayments(Array.isArray(paymentsRes) ? paymentsRes : paymentsRes.items || []);
      setQuotes(Array.isArray(quotesRes) ? quotesRes : quotesRes.items || []);
      setCreditNotes(Array.isArray(creditNotesRes) ? creditNotesRes : creditNotesRes.items || []);
      setExpenses(Array.isArray(expensesRes) ? expensesRes : expensesRes.items || []);
      setDisplayCount(PER_PAGE_INCREMENT);
    } catch (err) {
      console.error('[useContactFinancials] Failed to fetch financials:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [contactId, isVendor]);

  // Auto-fetch on mount/contact change
  useEffect(() => {
    fetchFinancials();
  }, [fetchFinancials]);

  // Calculate summary grouped by currency
  const summaryByCurrency = useMemo(() => {
    const summary = {};

    // Process invoices - add to billed, paid, outstanding
    invoices.forEach((inv) => {
      const currency = inv.currency || 'GBP';
      if (!summary[currency]) {
        summary[currency] = { billed: 0, paid: 0, outstanding: 0, expenses: 0, credits: 0, total: 0 };
      }
      const total = parseFloat(inv.total) || 0;
      const amountPaid = parseFloat(inv.amount_paid) || 0;
      const amountDue = parseFloat(inv.amount_due) || total - amountPaid;

      summary[currency].billed += total;
      summary[currency].paid += amountPaid;
      summary[currency].outstanding += amountDue;
    });

    // Process credit notes - reduce outstanding
    creditNotes.forEach((cn) => {
      const currency = cn.currency || 'GBP';
      if (!summary[currency]) {
        summary[currency] = { billed: 0, paid: 0, outstanding: 0, expenses: 0, credits: 0, total: 0 };
      }
      const total = parseFloat(cn.total) || 0;
      summary[currency].credits += total;
    });

    // Process expenses (only for vendors)
    expenses.forEach((exp) => {
      const currency = exp.currency || 'GBP';
      if (!summary[currency]) {
        summary[currency] = { billed: 0, paid: 0, outstanding: 0, expenses: 0, credits: 0, total: 0 };
      }
      const amount = parseFloat(exp.amount) || parseFloat(exp.total) || 0;
      summary[currency].expenses += amount;
    });

    // Calculate total (net position) for each currency
    // Total = Outstanding - Credits - Expenses (what they owe us minus what we owe them)
    Object.keys(summary).forEach((currency) => {
      summary[currency].total =
        summary[currency].outstanding - summary[currency].credits - summary[currency].expenses;
    });

    return summary;
  }, [invoices, creditNotes, expenses]);

  // Combine all transactions into a unified list sorted by date
  const allTransactions = useMemo(() => {
    const transactions = [];

    // Add invoices
    invoices.forEach((inv) => {
      transactions.push({
        id: inv.id,
        type: 'invoice',
        reference: inv.invoice_number || `INV-${inv.id}`,
        date: inv.issue_date || inv.created_at,
        amount: parseFloat(inv.total) || 0,
        currency: inv.currency || 'GBP',
        status: inv.status,
        description: inv.title || `Invoice ${inv.invoice_number || ''}`,
        original: inv,
      });
    });

    // Add payments
    payments.forEach((pay) => {
      transactions.push({
        id: pay.id,
        type: 'payment',
        reference: pay.payment_number || `PAY-${pay.id}`,
        date: pay.payment_date || pay.created_at,
        amount: parseFloat(pay.amount) || 0,
        currency: pay.currency || 'GBP',
        status: pay.status || 'completed',
        description: pay.description || `Payment ${pay.payment_number || ''}`,
        relatedTo: pay.invoice_id ? `Invoice ${pay.invoice_number || pay.invoice_id}` : null,
        original: pay,
      });
    });

    // Add quotes
    quotes.forEach((quote) => {
      transactions.push({
        id: quote.id,
        type: 'quote',
        reference: quote.quote_number || `QUO-${quote.id}`,
        date: quote.issue_date || quote.created_at,
        amount: parseFloat(quote.total) || 0,
        currency: quote.currency || 'GBP',
        status: quote.status,
        description: quote.title || `Quote ${quote.quote_number || ''}`,
        original: quote,
      });
    });

    // Add credit notes
    creditNotes.forEach((cn) => {
      transactions.push({
        id: cn.id,
        type: 'credit_note',
        reference: cn.credit_note_number || `CN-${cn.id}`,
        date: cn.issue_date || cn.created_at,
        amount: parseFloat(cn.total) || 0,
        currency: cn.currency || 'GBP',
        status: cn.status,
        description: cn.title || `Credit Note ${cn.credit_note_number || ''}`,
        relatedTo: cn.invoice_id ? `Invoice ${cn.invoice_number || cn.invoice_id}` : null,
        original: cn,
      });
    });

    // Add expenses (only for vendors)
    expenses.forEach((exp) => {
      transactions.push({
        id: exp.id,
        type: 'expense',
        reference: exp.expense_number || `EXP-${exp.id}`,
        date: exp.expense_date || exp.date || exp.created_at,
        amount: parseFloat(exp.amount) || parseFloat(exp.total) || 0,
        currency: exp.currency || 'GBP',
        status: exp.status || 'approved',
        description: exp.description || exp.title || `Expense ${exp.expense_number || ''}`,
        original: exp,
      });
    });

    // Sort by date (newest first)
    transactions.sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return dateB - dateA;
    });

    return transactions;
  }, [invoices, payments, quotes, creditNotes, expenses]);

  // Get paginated transactions for display
  const transactions = useMemo(() => {
    return allTransactions.slice(0, displayCount);
  }, [allTransactions, displayCount]);

  // Pagination info
  const pagination = useMemo(
    () => ({
      displayed: transactions.length,
      total: allTransactions.length,
      hasMore: displayCount < allTransactions.length,
    }),
    [transactions.length, allTransactions.length, displayCount]
  );

  // Load more transactions
  const loadMore = useCallback(() => {
    setDisplayCount((prev) => Math.min(prev + PER_PAGE_INCREMENT, allTransactions.length));
  }, [allTransactions.length]);

  // Refresh data
  const refresh = useCallback(() => {
    fetchFinancials();
  }, [fetchFinancials]);

  return {
    // Summary data
    summaryByCurrency,

    // Transaction data
    transactions,
    allTransactions,

    // Raw data
    invoices,
    payments,
    quotes,
    creditNotes,
    expenses,

    // State
    loading,
    error,

    // Pagination
    pagination,

    // Actions
    loadMore,
    refresh,
  };
}
