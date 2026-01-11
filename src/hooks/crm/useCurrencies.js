import { useState, useCallback, useEffect } from 'react';
import { currenciesAPI } from '../../services/api/crm';

/**
 * Custom hook for managing currencies
 * Handles loading active currencies
 *
 * @returns {Object} Currencies state and methods
 */
export function useCurrencies() {
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch currencies
  const fetchCurrencies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await currenciesAPI.list();
      setCurrencies(response || []);

      return response;
    } catch (err) {
      console.error('[useCurrencies] Failed to fetch currencies:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get currency by code
  const getCurrencyByCode = useCallback((code) => {
    return currencies.find((c) => c.code === code);
  }, [currencies]);

  // Get currency by ID
  const getCurrencyById = useCallback((id) => {
    return currencies.find((c) => c.id === id);
  }, [currencies]);

  // Get default currency (GBP by default, or first in list)
  const defaultCurrency = currencies.find((c) => c.code === 'GBP') || currencies[0];

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
