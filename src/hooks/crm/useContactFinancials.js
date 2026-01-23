import { useState, useCallback, useEffect, useMemo } from 'react';
import { contactsAPI } from '../../services/api/crm';

/**
 * Custom hook for managing contact financial data
 * Fetches contact with include_financial_details=true from contacts API
 *
 * @param {string} contactId - The contact ID
 * @returns {Object} Financials state and methods
 */
export function useContactFinancials(contactId) {
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch contact with financial details
  const fetchContact = useCallback(async () => {
    if (!contactId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch single contact with financial details and original currencies
      // Backend endpoint: GET /crm/contacts/{id}?include_financial_details=true&preserve_currencies=true
      const contactData = await contactsAPI.get(contactId, {
        include_financial_details: true,
        preserve_currencies: true,
      });
      setContact(contactData);
    } catch (err) {
      console.error('[useContactFinancials] Failed to fetch contact:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  // Initial fetch
  useEffect(() => {
    if (contactId) {
      fetchContact();
    }
  }, [contactId, fetchContact]);

  // Refresh data
  const refresh = useCallback(() => {
    fetchContact();
  }, [fetchContact]);

  // Helper to extract value and currency from a field
  // Handles both array format (preserve_currencies=true) and single value format
  const extractValue = useCallback((field) => {
    if (Array.isArray(field)) {
      // Array format: [{ currency_code: "GBP", amount: "5000.00" }, ...]
      if (field.length === 0) return { amount: 0, currency: null };
      // Sum all amounts (in case of multiple currencies, we'll use the first currency)
      const total = field.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      return { amount: total, currency: field[0]?.currency_code || null };
    }
    // Single value format
    return { amount: parseFloat(field) || 0, currency: null };
  }, []);

  // Get the currency codes for different financial categories
  // Falls back to contact's default currency for null fields
  const summaryCurrencies = useMemo(() => {
    if (!contact) {
      return { income: null, outstanding: null, expenses: null };
    }

    // Contact's default currency as fallback
    const contactCurrency = contact.currency?.code || null;

    // Extract currencies from the financial fields (array format has currency_code)
    const invoicedData = extractValue(contact.invoiced_total);
    const outstandingData = extractValue(contact.total_outstanding);
    const expensesData = extractValue(contact.total_expenses_paid);

    return {
      income: invoicedData.currency || contactCurrency,
      outstanding: outstandingData.currency || contactCurrency,
      expenses: expensesData.currency || contactCurrency,
    };
  }, [contact, extractValue]);

  // Primary currency for the summary
  const summaryCurrency = summaryCurrencies.income || summaryCurrencies.outstanding || summaryCurrencies.expenses;

  // Transform contact data into summary format for display
  const summaryByCurrency = useMemo(() => {
    if (!contact) return {};

    const invoicedData = extractValue(contact.invoiced_total);
    const paymentsData = extractValue(contact.payments_total || contact.paid_total);
    const outstandingData = extractValue(contact.total_outstanding);
    const expensesData = extractValue(contact.total_expenses_paid);

    const invoiced = invoicedData.amount;
    const payments = paymentsData.amount;
    const outstanding = outstandingData.amount;
    const expenses = expensesData.amount;

    // Calculate paid from payments, or derive from invoiced - outstanding
    const paid = payments > 0 ? payments : (invoiced - outstanding);

    // Net = paid - expenses
    const net = paid - expenses;

    return {
      ALL: {
        billed: invoiced,
        paid: paid,
        outstanding: outstanding,
        expenses: expenses,
        overdueCount: 0,
        total: net,
      },
    };
  }, [contact, extractValue]);

  return {
    // Contact data
    contact,

    // Summary data
    summaryByCurrency,
    summaryCurrency,
    summaryCurrencies,

    // State
    loading,
    error,

    // Actions
    refresh,
  };
}
