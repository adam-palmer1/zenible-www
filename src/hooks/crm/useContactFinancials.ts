import { useState, useCallback, useEffect, useMemo } from 'react';
import { contactsAPI } from '../../services/api/crm';
import type { ContactResponse } from '../../types';

interface ExtractedValue {
  amount: number;
  currency: string | null;
}

interface SummaryCurrencies {
  income: string | null;
  outstanding: string | null;
  expenses: string | null;
}

interface SummaryEntry {
  billed: number;
  paid: number;
  outstanding: number;
  expenses: number;
  overdueCount: number;
  total: number;
}

/** Currency amount entry returned when preserve_currencies=true */
interface CurrencyAmountEntry {
  currency_code: string;
  amount: string;
}

/**
 * ContactResponse extended with optional financial detail fields.
 * These fields are added dynamically by the backend when
 * include_financial_details=true and/or preserve_currencies=true.
 */
interface ContactWithFinancials extends ContactResponse {
  invoiced_total?: string | CurrencyAmountEntry[];
  payments_total?: string | CurrencyAmountEntry[];
  paid_total?: string | CurrencyAmountEntry[];
  total_outstanding?: string | CurrencyAmountEntry[];
  total_expenses_paid?: string | CurrencyAmountEntry[];
}

/**
 * Custom hook for managing contact financial data
 * Fetches contact with include_financial_details=true from contacts API
 */
export function useContactFinancials(contactId: string | undefined) {
  const [contact, setContact] = useState<ContactWithFinancials | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch contact with financial details
  const fetchContact = useCallback(async (): Promise<void> => {
    if (!contactId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch single contact with financial details and original currencies
      // Backend endpoint: GET /crm/contacts/{id}?include_financial_details=true&preserve_currencies=true
      const contactData = await contactsAPI.get(contactId, {
        include_financial_details: 'true',
        preserve_currencies: 'true',
      });
      setContact(contactData as ContactWithFinancials);
    } catch (err: unknown) {
      console.error('[useContactFinancials] Failed to fetch contact:', err);
      setError((err as Error).message);
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
  const refresh = useCallback((): void => {
    fetchContact();
  }, [fetchContact]);

  // Helper to extract value and currency from a field
  // Handles both array format (preserve_currencies=true) and single value format
  const extractValue = useCallback((field: string | CurrencyAmountEntry[] | undefined): ExtractedValue => {
    if (Array.isArray(field)) {
      // Array format: [{ currency_code: "GBP", amount: "5000.00" }, ...]
      if (field.length === 0) return { amount: 0, currency: null };
      // Sum all amounts (in case of multiple currencies, we'll use the first currency)
      const total = field.reduce((sum: number, item: CurrencyAmountEntry) => sum + (parseFloat(item.amount) || 0), 0);
      return { amount: total, currency: field[0]?.currency_code || null };
    }
    // Single value format
    return { amount: parseFloat(field as string) || 0, currency: null };
  }, []);

  // Get the currency codes for different financial categories
  // Falls back to contact's default currency for null fields
  const summaryCurrencies = useMemo((): SummaryCurrencies => {
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
  const summaryByCurrency = useMemo((): Record<string, SummaryEntry> => {
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
