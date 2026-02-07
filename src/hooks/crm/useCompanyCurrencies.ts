import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import currenciesAPI from '../../services/api/crm/currencies';
import numberFormatsAPI from '../../services/api/crm/numberFormats';
import { queryKeys } from '../../lib/query-keys';

interface MutationResult {
  success: boolean;
  error?: string;
}

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
      } catch (err: unknown) {
        // Number format might not be set, which is okay
        console.warn('Failed to fetch number format:', err);
        return null;
      }
    },
  });

  // Fetch number format details (dependent on numberFormatAttribute)
  const formatId = (numberFormatAttribute as any)?.attribute_value as string | undefined;
  const {
    data: numberFormatDetails = null,
    isLoading: numberFormatDetailsLoading,
  } = useQuery({
    queryKey: queryKeys.currencies.numberFormatDetails(formatId),
    queryFn: async () => {
      try {
        return await numberFormatsAPI.get(formatId);
      } catch (err: unknown) {
        console.warn('Failed to fetch number format details:', err);
        return null;
      }
    },
    enabled: !!formatId,
  });

  // Add currency mutation
  const addCurrencyMutation = useMutation({
    mutationFn: (currencyId: string) => currenciesAPI.addCurrencyToCompany(currencyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.currencies.company() });
    },
  });

  // Remove currency mutation
  const removeCurrencyMutation = useMutation({
    mutationFn: (associationId: string) => currenciesAPI.removeCurrencyFromCompany(associationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.currencies.company() });
    },
  });

  // Set default currency mutation
  const setDefaultCurrencyMutation = useMutation({
    mutationFn: (associationId: string) => currenciesAPI.setDefaultCurrency(associationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.currencies.company() });
    },
  });

  // Wrapper functions to maintain backward compatibility
  const addCurrency = useCallback(async (currencyId: string): Promise<MutationResult> => {
    try {
      await addCurrencyMutation.mutateAsync(currencyId);
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  }, [addCurrencyMutation]);

  const removeCurrency = useCallback(async (associationId: string): Promise<MutationResult> => {
    try {
      await removeCurrencyMutation.mutateAsync(associationId);
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  }, [removeCurrencyMutation]);

  const setDefaultCurrency = useCallback(async (associationId: string): Promise<MutationResult> => {
    try {
      await setDefaultCurrencyMutation.mutateAsync(associationId);
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  }, [setDefaultCurrencyMutation]);

  // Refresh all currency data
  const refresh = useCallback(async (): Promise<void> => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.currencies.list() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.currencies.company() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.currencies.numberFormat() }),
    ]);
  }, [queryClient]);

  // Combined loading state
  const loading = currenciesLoading || companyCurrenciesLoading || numberFormatLoading || numberFormatDetailsLoading;

  // Combined error state (first error found)
  const error = useMemo((): string | null => {
    const err = currenciesError || companyCurrenciesError || numberFormatError;
    return (err as Error)?.message || null;
  }, [currenciesError, companyCurrenciesError, numberFormatError]);

  // Get default currency
  const defaultCurrency = useMemo(
    () => (companyCurrencies as unknown[]).find((cc: unknown) => (cc as any).is_default),
    [companyCurrencies]
  );

  // loadData is kept for backward compatibility but is essentially a no-op
  // since React Query handles initial fetching automatically
  const loadData = useCallback(async (): Promise<void> => {
    // React Query handles initial fetch automatically
    // This function exists for backward compatibility
    if ((companyCurrencies as unknown[]).length === 0) {
      await refresh();
    }
  }, [(companyCurrencies as unknown[]).length, refresh]);

  return {
    currencies,
    companyCurrencies,
    defaultCurrency,
    // Number format data
    numberFormat: numberFormatDetails,
    numberFormatId: (numberFormatAttribute as any)?.attribute_value || null,
    loading,
    error,
    addCurrency,
    removeCurrency,
    setDefaultCurrency,
    loadData,
    refresh,
  };
};
