import { useState, useCallback, useEffect } from 'react';
import { currenciesAPI } from '../../services/api/crm';
import type { CurrencyResponse } from '../../types/common';

/**
 * Custom hook for managing currencies
 * Handles loading active currencies
 */
export function useCurrencies() {
  const [currencies, setCurrencies] = useState<CurrencyResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch currencies
  const fetchCurrencies = useCallback(async (): Promise<CurrencyResponse[]> => {
    try {
      setLoading(true);
      setError(null);

      const response = await currenciesAPI.list() as CurrencyResponse[];
      setCurrencies(response || []);

      return response;
    } catch (err: unknown) {
      console.error('[useCurrencies] Failed to fetch currencies:', err);
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

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

  // Load currencies on mount
  useEffect(() => {
    fetchCurrencies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    currencies,
    defaultCurrency,
    loading,
    error,
    fetchCurrencies,
    getCurrencyByCode,
    getCurrencyById,
  };
}
