import { useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { contactsAPI } from '../../services/api/crm';
import { queryKeys } from '../../lib/query-keys';
import type { ContactResponse } from '../../types';

/** Currency amount entry returned when preserve_currencies=true */
interface CurrencyAmountEntry {
  currency_code: string;
  amount: string;
}

interface CurrencyBreakdown {
  code: string;
  amount: number;
}

export interface FinancialField {
  total: number;
  currencies: CurrencyBreakdown[];
}

export interface FinancialSummary {
  billed: FinancialField;
  paid: FinancialField;
  outstanding: FinancialField;
  expenses: FinancialField;
  attributedOut: FinancialField;
  attributedIn: FinancialField;
  net: FinancialField;
  overdueCount: number;
}

/**
 * ContactResponse extended with optional financial detail fields.
 * Fields are numbers when preserve_currencies=false, arrays when true.
 */
interface ContactWithFinancials extends ContactResponse {
  invoiced_total?: number | CurrencyAmountEntry[] | null;
  payments_total?: number | CurrencyAmountEntry[] | null;
  paid_total?: number | CurrencyAmountEntry[] | null;
  total_outstanding?: number | CurrencyAmountEntry[] | null;
  total_expenses_paid?: number | CurrencyAmountEntry[] | null;
  attributed_out_total?: number | CurrencyAmountEntry[] | null;
  attribution_total?: number | CurrencyAmountEntry[] | null;
  financial_currency?: string;
}

interface FetchResult {
  totals: ContactWithFinancials;
  breakdown: ContactWithFinancials;
}

/**
 * Custom hook for managing contact financial data.
 * Fetches both converted totals and per-currency breakdowns in parallel.
 */
export function useContactFinancials(contactId: string | undefined) {
  const queryClient = useQueryClient();

  const contactQuery = useQuery({
    queryKey: [...queryKeys.contactFinancials.detail(contactId!), 'v2'],
    queryFn: async (): Promise<FetchResult> => {
      const [totals, breakdown] = await Promise.all([
        contactsAPI.get(contactId!, { include_financial_details: 'true' }),
        contactsAPI.get(contactId!, { include_financial_details: 'true', preserve_currencies: 'true' }),
      ]);
      return {
        totals: totals as ContactWithFinancials,
        breakdown: breakdown as ContactWithFinancials,
      };
    },
    enabled: !!contactId,
  });

  const result = contactQuery.data as FetchResult | undefined;
  const contact = result?.totals || null;

  const refresh = useCallback((): void => {
    if (contactId) {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.contactFinancials.detail(contactId), 'v2'] });
    }
  }, [queryClient, contactId]);

  // Build a FinancialField from converted total + currency breakdown
  const buildField = useCallback((
    totalValue: number | CurrencyAmountEntry[] | null | undefined,
    breakdownValue: number | CurrencyAmountEntry[] | null | undefined,
  ): FinancialField => {
    const total = typeof totalValue === 'number' ? totalValue
      : (typeof totalValue === 'string' ? parseFloat(totalValue) || 0 : 0);

    let currencies: CurrencyBreakdown[] = [];
    if (Array.isArray(breakdownValue)) {
      currencies = breakdownValue
        .map(item => ({ code: item.currency_code, amount: parseFloat(item.amount) || 0 }))
        .filter(item => item.amount > 0);
    }

    return { total, currencies };
  }, []);

  const defaultCurrency = result?.totals?.financial_currency || contact?.currency?.code || null;

  const summary = useMemo((): FinancialSummary | null => {
    if (!result || !result.totals || !result.breakdown) return null;

    const { totals, breakdown } = result;

    const billed = buildField(totals.invoiced_total, breakdown.invoiced_total);
    const paymentsField = buildField(
      totals.payments_total || totals.paid_total,
      breakdown.payments_total || breakdown.paid_total,
    );
    const outstanding = buildField(totals.total_outstanding, breakdown.total_outstanding);
    const expenses = buildField(totals.total_expenses_paid, breakdown.total_expenses_paid);
    const attributedOut = buildField(totals.attributed_out_total, breakdown.attributed_out_total);
    const attributedIn = buildField(totals.attribution_total, breakdown.attribution_total);

    // Derive paid: use payments if available, otherwise invoiced minus outstanding (only when invoiced > 0)
    const paidTotal = paymentsField.total > 0
      ? paymentsField.total
      : (billed.total > 0 ? Math.max(0, billed.total - outstanding.total) : 0);
    const paid: FinancialField = { total: paidTotal, currencies: paymentsField.currencies };

    const netTotal = paid.total - expenses.total;
    const net: FinancialField = { total: netTotal, currencies: [] };

    return {
      billed,
      paid,
      outstanding,
      expenses,
      attributedOut,
      attributedIn,
      net,
      overdueCount: 0,
    };
  }, [result, buildField]);

  return {
    contact,
    summary,
    defaultCurrency,
    loading: contactQuery.isLoading,
    error: contactQuery.error?.message || null,
    refresh,
  };
}
