import { useState, useEffect, useCallback } from 'react';
import countriesAPI from '../../services/api/crm/countries';

/**
 * Hook for managing countries and company-country associations
 */
export const useCountries = () => {
  const [countries, setCountries] = useState([]);
  const [companyCountries, setCompanyCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all countries
  const fetchCountries = useCallback(async () => {
    try {
      const result = await countriesAPI.list();
      setCountries(result);
    } catch (err) {
      console.error('Failed to fetch countries:', err);
      setError(err.message);
    }
  }, []);

  // Fetch company-enabled countries
  const fetchCompanyCountries = useCallback(async () => {
    try {
      const result = await countriesAPI.getCompanyCountries();
      setCompanyCountries(result);
    } catch (err) {
      console.error('Failed to fetch company countries:', err);
      setError(err.message);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchCountries(), fetchCompanyCountries()]);
      setLoading(false);
    };
    loadData();
  }, [fetchCountries, fetchCompanyCountries]);

  // Add country to company
  const addCountry = useCallback(async (countryId) => {
    setError(null);
    try {
      await countriesAPI.addCountryToCompany(countryId);
      await fetchCompanyCountries();
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [fetchCompanyCountries]);

  // Remove country from company
  const removeCountry = useCallback(async (associationId) => {
    setError(null);
    try {
      await countriesAPI.removeCountryFromCompany(associationId);
      await fetchCompanyCountries();
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [fetchCompanyCountries]);

  // Set country as default
  const setDefaultCountry = useCallback(async (associationId) => {
    setError(null);
    try {
      await countriesAPI.setDefaultCountry(associationId);
      await fetchCompanyCountries();
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [fetchCompanyCountries]);

  // Get default country
  const defaultCountry = companyCountries.find((cc) => cc.is_default);

  return {
    countries,
    companyCountries,
    defaultCountry,
    loading,
    error,
    addCountry,
    removeCountry,
    setDefaultCountry,
    refresh: () => {
      fetchCountries();
      fetchCompanyCountries();
    },
  };
};
