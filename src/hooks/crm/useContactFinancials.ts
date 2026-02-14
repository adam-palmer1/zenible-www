import { useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { contactsAPI } from '../../services/api/crm';
import { queryKeys } from '../../lib/query-keys';
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
 * Uses React Query for caching and automatic refetching
 */
export function useContactFinancials(contactId: string | undefined) {
  const queryClient = useQueryClient();

  // Fetch contact with financial details
  const contactQuery = useQuery({
    queryKey: queryKeys.contactFinancials.detail(contactId!),
    queryFn: () => contactsAPI.get(contactId!, {
      include_financial_details: 'true',
      preserve_currencies: 'true',
    }),
    enabled: !!contactId,
  });

  const contact = (contactQuery.data as ContactWithFinancials) || null;

  // Refresh data
  const refresh = useCallback((): void => {
    if (contactId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.contactFinancials.detail(contactId) });
    }
  }, [queryClient, contactId]);

  // Helper to extract value and currency from a field
  const extractValue = useCallback((field: string | CurrencyAmountEntry[] | undefined): ExtractedValue => {
    if (Array.isArray(field)) {
      if (field.length === 0) return { amount: 0, currency: null };
      const total = field.reduce((sum: number, item: CurrencyAmountEntry) => sum + (parseFloat(item.amount) || 0), 0);
      return { amount: total, currency: field[0]?.currency_code || null };
    }
    return { amount: parseFloat(field as string) || 0, currency: null };
  }, []);

  // Get the currency codes for different financial categories
  const summaryCurrencies = useMemo((): SummaryCurrencies => {
    if (!contact) {
      return { income: null, outstanding: null, expenses: null };
    }

    const contactCurrency = contact.currency?.code || null;

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

    const paid = payments > 0 ? payments : (invoiced - outstanding);
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
    contact,
    summaryByCurrency,
    summaryCurrency,
    summaryCurrencies,
    loading: contactQuery.isLoading,
    error: contactQuery.error?.message || null,
    refresh,
  };
}
