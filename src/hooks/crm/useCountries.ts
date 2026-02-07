import { useState, useEffect, useCallback } from 'react';
import countriesAPI from '../../services/api/crm/countries';

interface MutationResult {
  success: boolean;
  error?: string;
}

/**
 * Hook for managing countries and company-country associations
 */
export const useCountries = () => {
  const [countries, setCountries] = useState<unknown[]>([]);
  const [companyCountries, setCompanyCountries] = useState<unknown[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all countries
  const fetchCountries = useCallback(async (): Promise<void> => {
    try {
      const result = await countriesAPI.list();
      setCountries(result as unknown[]);
    } catch (err: unknown) {
      console.error('Failed to fetch countries:', err);
      setError((err as Error).message);
    }
  }, []);

  // Fetch company-enabled countries
  const fetchCompanyCountries = useCallback(async (): Promise<void> => {
    try {
      const result = await countriesAPI.getCompanyCountries();
      setCompanyCountries(result as unknown[]);
    } catch (err: unknown) {
      console.error('Failed to fetch company countries:', err);
      setError((err as Error).message);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadData = async (): Promise<void> => {
      setLoading(true);
      await Promise.all([fetchCountries(), fetchCompanyCountries()]);
      setLoading(false);
    };
    loadData();
  }, [fetchCountries, fetchCompanyCountries]);

  // Add country to company
  const addCountry = useCallback(async (countryId: string): Promise<MutationResult> => {
    setError(null);
    try {
      await countriesAPI.addCountryToCompany(countryId);
      await fetchCompanyCountries();
      return { success: true };
    } catch (err: unknown) {
      setError((err as Error).message);
      return { success: false, error: (err as Error).message };
    }
  }, [fetchCompanyCountries]);

  // Remove country from company
  const removeCountry = useCallback(async (associationId: string): Promise<MutationResult> => {
    setError(null);
    try {
      await countriesAPI.removeCountryFromCompany(associationId);
      await fetchCompanyCountries();
      return { success: true };
    } catch (err: unknown) {
      setError((err as Error).message);
      return { success: false, error: (err as Error).message };
    }
  }, [fetchCompanyCountries]);

  // Set country as default
  const setDefaultCountry = useCallback(async (associationId: string): Promise<MutationResult> => {
    setError(null);
    try {
      await countriesAPI.setDefaultCountry(associationId);
      await fetchCompanyCountries();
      return { success: true };
    } catch (err: unknown) {
      setError((err as Error).message);
      return { success: false, error: (err as Error).message };
    }
  }, [fetchCompanyCountries]);

  // Get default country
  const defaultCountry = companyCountries.find((cc: unknown) => (cc as any).is_default);

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
