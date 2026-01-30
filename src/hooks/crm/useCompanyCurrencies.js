import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import currenciesAPI from '../../services/api/crm/currencies';
import numberFormatsAPI from '../../services/api/crm/numberFormats';
import { queryKeys } from '../../lib/query-keys';

/**
 * Hook for managing currencies and company-currency associations
 * Uses React Query for automatic request deduplication and caching
 */
export const useCompanyCurrencies = () => {
  const queryClient = useQueryClient();

  // Fetch all currencies
  const {
    data: currencies = [],
    isLoading: currenciesLoading,
    error: currenciesError,
  } = useQuery({
    queryKey: queryKeys.currencies.list(),
    queryFn: () => currenciesAPI.list(),
  });

  // Fetch company-enabled currencies
  const {
    data: companyCurrencies = [],
    isLoading: companyCurrenciesLoading,
    error: companyCurrenciesError,
  } = useQuery({
    queryKey: queryKeys.currencies.company(),
    queryFn: () => currenciesAPI.getCompanyCurrencies(),
  });

  // Fetch number format attribute
  const {
    data: numberFormatAttribute = null,
    isLoading: numberFormatLoading,
    error: numberFormatError,
  } = useQuery({
    queryKey: queryKeys.currencies.numberFormat(),
    queryFn: async () => {
      try {
        return await currenciesAPI.getNumberFormat();
      } catch (err) {
        // Number format might not be set, which is okay
        console.warn('Failed to fetch number format:', err);
        return null;
      }
    },
  });

  // Fetch number format details (dependent on numberFormatAttribute)
  const formatId = numberFormatAttribute?.attribute_value;
  const {
    data: numberFormatDetails = null,
    isLoading: numberFormatDetailsLoading,
  } = useQuery({
    queryKey: queryKeys.currencies.numberFormatDetails(formatId),
    queryFn: async () => {
      try {
        return await numberFormatsAPI.get(formatId);
      } catch (err) {
        console.warn('Failed to fetch number format details:', err);
        return null;
      }
    },
    enabled: !!formatId,
  });

  // Add currency mutation
  const addCurrencyMutation = useMutation({
    mutationFn: (currencyId) => currenciesAPI.addCurrencyToCompany(currencyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.currencies.company() });
    },
  });

  // Remove currency mutation
  const removeCurrencyMutation = useMutation({
    mutationFn: (associationId) => currenciesAPI.removeCurrencyFromCompany(associationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.currencies.company() });
    },
  });

  // Set default currency mutation
  const setDefaultCurrencyMutation = useMutation({
    mutationFn: (associationId) => currenciesAPI.setDefaultCurrency(associationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.currencies.company() });
    },
  });

  // Wrapper functions to maintain backward compatibility
  const addCurrency = useCallback(async (currencyId) => {
    try {
      await addCurrencyMutation.mutateAsync(currencyId);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [addCurrencyMutation]);

  const removeCurrency = useCallback(async (associationId) => {
    try {
      await removeCurrencyMutation.mutateAsync(associationId);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [removeCurrencyMutation]);

  const setDefaultCurrency = useCallback(async (associationId) => {
    try {
      await setDefaultCurrencyMutation.mutateAsync(associationId);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [setDefaultCurrencyMutation]);

  // Refresh all currency data
  const refresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.currencies.list() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.currencies.company() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.currencies.numberFormat() }),
    ]);
  }, [queryClient]);

  // Combined loading state
  const loading = currenciesLoading || companyCurrenciesLoading || numberFormatLoading || numberFormatDetailsLoading;

  // Combined error state (first error found)
  const error = useMemo(() => {
    const err = currenciesError || companyCurrenciesError || numberFormatError;
    return err?.message || null;
  }, [currenciesError, companyCurrenciesError, numberFormatError]);

  // Get default currency
  const defaultCurrency = useMemo(
    () => companyCurrencies.find((cc) => cc.is_default),
    [companyCurrencies]
  );

  // loadData is kept for backward compatibility but is essentially a no-op
  // since React Query handles initial fetching automatically
  const loadData = useCallback(async () => {
    // React Query handles initial fetch automatically
    // This function exists for backward compatibility
    if (companyCurrencies.length === 0) {
      await refresh();
    }
  }, [companyCurrencies.length, refresh]);

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
    refresh,
  };
};
