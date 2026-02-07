import { useState, useCallback, useEffect } from 'react';
import { currenciesAPI } from '../../services/api/crm';

/**
 * Custom hook for managing currencies
 * Handles loading active currencies
 */
export function useCurrencies() {
  const [currencies, setCurrencies] = useState<unknown[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch currencies
  const fetchCurrencies = useCallback(async (): Promise<unknown> => {
    try {
      setLoading(true);
      setError(null);

      const response = await currenciesAPI.list();
      setCurrencies((response as unknown[]) || []);

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
  const getCurrencyByCode = useCallback((code: string): unknown => {
    return currencies.find((c: unknown) => (c as any).code === code);
  }, [currencies]);

  // Get currency by ID
  const getCurrencyById = useCallback((id: string): unknown => {
    return currencies.find((c: unknown) => (c as any).id === id);
  }, [currencies]);

  // Get default currency (GBP by default, or first in list)
  const defaultCurrency = currencies.find((c: unknown) => (c as any).code === 'GBP') || currencies[0];

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
