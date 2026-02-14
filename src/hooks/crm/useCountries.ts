import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import countriesAPI from '../../services/api/crm/countries';
import { queryKeys } from '../../lib/query-keys';

export interface Country {
  id: string;
  name: string;
  code: string;
  [key: string]: unknown;
}

export interface CompanyCountry {
  id: string;
  country: Country;
  is_default: boolean;
  [key: string]: unknown;
}

interface MutationResult {
  success: boolean;
  error?: string;
}

/**
 * Hook for managing countries and company-country associations
 * Uses React Query for caching, deduplication, and automatic invalidation
 */
export const useCountries = () => {
  const queryClient = useQueryClient();

  // All countries query
  const countriesQuery = useQuery({
    queryKey: queryKeys.countries.list(),
    queryFn: async () => {
      const result = await countriesAPI.list();
      return (result as Country[]) || [];
    },
  });

  // Company-enabled countries query
  const companyCountriesQuery = useQuery({
    queryKey: queryKeys.countries.company(),
    queryFn: async () => {
      const result = await countriesAPI.getCompanyCountries();
      return (result as CompanyCountry[]) || [];
    },
  });

  const countries = countriesQuery.data || [];
  const companyCountries = companyCountriesQuery.data || [];
  const loading = countriesQuery.isLoading || companyCountriesQuery.isLoading;
  const error = countriesQuery.error?.message || companyCountriesQuery.error?.message || null;

  // Add country to company
  const addCountryMutation = useMutation({
    mutationFn: (countryId: string) => countriesAPI.addCountryToCompany(countryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.countries.company() });
    },
  });

  // Remove country from company
  const removeCountryMutation = useMutation({
    mutationFn: (associationId: string) => countriesAPI.removeCountryFromCompany(associationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.countries.company() });
    },
  });

  // Set country as default
  const setDefaultCountryMutation = useMutation({
    mutationFn: (associationId: string) => countriesAPI.setDefaultCountry(associationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.countries.company() });
    },
  });

  // Backwards-compatible wrapper functions
  const addCountry = useCallback(async (countryId: string): Promise<MutationResult> => {
    try {
      await addCountryMutation.mutateAsync(countryId);
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  }, [addCountryMutation]);

  const removeCountry = useCallback(async (associationId: string): Promise<MutationResult> => {
    try {
      await removeCountryMutation.mutateAsync(associationId);
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  }, [removeCountryMutation]);

  const setDefaultCountry = useCallback(async (associationId: string): Promise<MutationResult> => {
    try {
      await setDefaultCountryMutation.mutateAsync(associationId);
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  }, [setDefaultCountryMutation]);

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
      queryClient.invalidateQueries({ queryKey: queryKeys.countries.all });
    },
  };
};
