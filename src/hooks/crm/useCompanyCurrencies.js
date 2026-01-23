import { useState, useEffect, useCallback, useRef } from 'react';
import currenciesAPI from '../../services/api/crm/currencies';
import numberFormatsAPI from '../../services/api/crm/numberFormats';

/**
 * Hook for managing currencies and company-currency associations
 * @param {Object} options - Hook options
 * @param {boolean} options.skipInitialFetch - Skip the initial fetch on mount
 */
export const useCompanyCurrencies = (options = {}) => {
  const { skipInitialFetch = false } = options;
  const [currencies, setCurrencies] = useState([]);
  const [companyCurrencies, setCompanyCurrencies] = useState([]);
  const [numberFormatAttribute, setNumberFormatAttribute] = useState(null);
  const [numberFormatDetails, setNumberFormatDetails] = useState(null);
  const [loading, setLoading] = useState(!skipInitialFetch);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);

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

  // Fetch company number format attribute and its details
  const fetchNumberFormat = useCallback(async () => {
    try {
      const result = await currenciesAPI.getNumberFormat();
      setNumberFormatAttribute(result);

      // If we got a format ID, fetch the format details
      if (result?.attribute_value) {
        try {
          const formatDetails = await numberFormatsAPI.get(result.attribute_value);
          setNumberFormatDetails(formatDetails);
        } catch (detailsErr) {
          console.warn('Failed to fetch number format details:', detailsErr);
          setNumberFormatDetails(null);
        }
      }
    } catch (err) {
      // Number format might not be set, which is okay
      console.warn('Failed to fetch number format:', err);
      setNumberFormatAttribute(null);
      setNumberFormatDetails(null);
    }
  }, []);

  // Initial load (skip if skipInitialFetch is true)
  useEffect(() => {
    if (skipInitialFetch || hasFetched.current) return;

    const loadData = async () => {
      setLoading(true);
      hasFetched.current = true;
      await Promise.all([fetchCurrencies(), fetchCompanyCurrencies(), fetchNumberFormat()]);
      setLoading(false);
    };
    loadData();
  }, [fetchCurrencies, fetchCompanyCurrencies, fetchNumberFormat, skipInitialFetch]);

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

  // Manual load function for components that skip initial fetch
  const loadData = useCallback(async () => {
    if (hasFetched.current && companyCurrencies.length > 0) return; // Already loaded
    setLoading(true);
    hasFetched.current = true;
    await Promise.all([fetchCurrencies(), fetchCompanyCurrencies(), fetchNumberFormat()]);
    setLoading(false);
  }, [fetchCurrencies, fetchCompanyCurrencies, fetchNumberFormat, companyCurrencies.length]);

  return {
    currencies,
    companyCurrencies,
    defaultCurrency,
    // Number format data
    numberFormat: numberFormatDetails,
    numberFormatId: numberFormatAttribute?.attribute_value || null,
    loading,
    error,
    addCurrency,
    removeCurrency,
    setDefaultCurrency,
    loadData,
    refresh: async () => {
      setLoading(true);
      await Promise.all([fetchCurrencies(), fetchCompanyCurrencies(), fetchNumberFormat()]);
      setLoading(false);
    },
  };
};
