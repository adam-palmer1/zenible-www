import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import currenciesAPI from '../../services/api/crm/currencies';
import numberFormatsAPI from '../../services/api/crm/numberFormats';
import { queryKeys } from '../../lib/query-keys';

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  [key: string]: unknown;
}

export interface CompanyCurrency {
  id: string;
  currency: Currency;
  is_default: boolean;
  [key: string]: unknown;
}

export interface NumberFormatAttribute {
  attribute_name: string;
  attribute_value: string;
  [key: string]: unknown;
}

export interface NumberFormatConfig {
  id: string;
  format_string: string;
  decimal_separator: string;
  thousands_separator: string;
  decimal_places: number;
  [key: string]: unknown;
}

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
    data: currencies = [] as Currency[],
    isLoading: currenciesLoading,
    error: currenciesError,
  } = useQuery({
    queryKey: queryKeys.currencies.list(),
    queryFn: () => currenciesAPI.list() as Promise<Currency[]>,
  });

  // Fetch company-enabled currencies
  const {
    data: companyCurrencies = [] as CompanyCurrency[],
    isLoading: companyCurrenciesLoading,
    error: companyCurrenciesError,
  } = useQuery({
    queryKey: queryKeys.currencies.company(),
    queryFn: () => currenciesAPI.getCompanyCurrencies() as Promise<CompanyCurrency[]>,
  });

  // Fetch number format attribute
  const {
    data: numberFormatAttribute = null,
    isLoading: numberFormatLoading,
    error: numberFormatError,
  } = useQuery<NumberFormatAttribute | null>({
    queryKey: queryKeys.currencies.numberFormat(),
    queryFn: async () => {
      try {
        return await currenciesAPI.getNumberFormat() as NumberFormatAttribute;
      } catch (err: unknown) {
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
  } = useQuery<NumberFormatConfig | null>({
    queryKey: queryKeys.currencies.numberFormatDetails(formatId!),
    queryFn: async () => {
      try {
        return await numberFormatsAPI.get(formatId!) as NumberFormatConfig;
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
    () => (companyCurrencies as CompanyCurrency[]).find((cc) => cc.is_default),
    [companyCurrencies]
  );

  // loadData is kept for backward compatibility but is essentially a no-op
  // since React Query handles initial fetching automatically
  const loadData = useCallback(async (): Promise<void> => {
    // React Query handles initial fetch automatically
    // This function exists for backward compatibility
    if ((companyCurrencies as CompanyCurrency[]).length === 0) {
      await refresh();
    }
  }, [(companyCurrencies as CompanyCurrency[]).length, refresh]);

  return {
    currencies: currencies as Currency[],
    companyCurrencies: companyCurrencies as CompanyCurrency[],
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
