import { useState, useEffect, useCallback } from 'react';
import currenciesAPI from '../../services/api/crm/currencies';

/**
 * Hook for managing currencies and company-currency associations
 */
export const useCompanyCurrencies = () => {
  const [currencies, setCurrencies] = useState([]);
  const [companyCurrencies, setCompanyCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all currencies
  const fetchCurrencies = useCallback(async () => {
    try {
      const result = await currenciesAPI.list();
      setCurrencies(result);
    } catch (err) {
      console.error('Failed to fetch currencies:', err);
      setError(err.message);
    }
  }, []);

  // Fetch company-enabled currencies
  const fetchCompanyCurrencies = useCallback(async () => {
    try {
      const result = await currenciesAPI.getCompanyCurrencies();
      setCompanyCurrencies(result);
    } catch (err) {
      console.error('Failed to fetch company currencies:', err);
      setError(err.message);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchCurrencies(), fetchCompanyCurrencies()]);
      setLoading(false);
    };
    loadData();
  }, [fetchCurrencies, fetchCompanyCurrencies]);

  // Add currency to company
  const addCurrency = useCallback(async (currencyId) => {
    setError(null);
    try {
      await currenciesAPI.addCurrencyToCompany(currencyId);
      await fetchCompanyCurrencies();
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [fetchCompanyCurrencies]);

  // Remove currency from company
  const removeCurrency = useCallback(async (associationId) => {
    setError(null);
    try {
      await currenciesAPI.removeCurrencyFromCompany(associationId);
      await fetchCompanyCurrencies();
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [fetchCompanyCurrencies]);

  // Set currency as default
  const setDefaultCurrency = useCallback(async (associationId) => {
    setError(null);
    try {
      await currenciesAPI.setDefaultCurrency(associationId);
      await fetchCompanyCurrencies();
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [fetchCompanyCurrencies]);

  // Get default currency
  const defaultCurrency = companyCurrencies.find((cc) => cc.is_default);

  return {
    currencies,
    companyCurrencies,
    defaultCurrency,
    loading,
    error,
    addCurrency,
    removeCurrency,
    setDefaultCurrency,
    refresh: () => {
      fetchCurrencies();
      fetchCompanyCurrencies();
    },
  };
};
