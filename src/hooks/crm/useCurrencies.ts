import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { currenciesAPI } from '../../services/api/crm';
import { queryKeys } from '../../lib/query-keys';
import type { CurrencyResponse } from '../../types/common';

/**
 * Custom hook for managing currencies
 * Uses React Query for caching and deduplication across components
 */
export function useCurrencies() {
  // Currencies list query - auto-fetches on mount
  const currenciesQuery = useQuery({
    queryKey: queryKeys.currencies.list(),
    queryFn: async () => {
      const response = await currenciesAPI.list() as CurrencyResponse[];
      return response || [];
    },
  });

  const currencies = currenciesQuery.data || [];

  // Get currency by code
  const getCurrencyByCode = useCallback((code: string): CurrencyResponse | undefined => {
    return currencies.find((c: CurrencyResponse) => c.code === code);
  }, [currencies]);

  // Get currency by ID
  const getCurrencyById = useCallback((id: string): CurrencyResponse | undefined => {
    return currencies.find((c: CurrencyResponse) => c.id === id);
  }, [currencies]);

  // Get default currency (GBP by default, or first in list)
  const defaultCurrency = currencies.find((c: CurrencyResponse) => c.code === 'GBP') || currencies[0];

  // Backwards-compatible fetch function
  const fetchCurrencies = useCallback(async (): Promise<CurrencyResponse[]> => {
    const result = await currenciesQuery.refetch();
    return result.data || [];
  }, [currenciesQuery]);

  return {
    currencies,
    defaultCurrency,
    loading: currenciesQuery.isLoading,
    error: currenciesQuery.error?.message || null,
    fetchCurrencies,
    getCurrencyByCode,
    getCurrencyById,
  };
}
