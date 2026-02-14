import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import currencyConversionAPI from '../../services/api/crm/currencyConversion';
import { queryKeys } from '../../lib/query-keys';

interface CurrencyConversionResponse {
  amount: string;
  from_currency: string;
  to_currency: string;
  converted_amount: string;
  rate: string;
}

interface ExchangeRatesResponse {
  base_currency: string;
  rates: Record<string, string>;
  timestamp: string;
}

interface ConversionRequest {
  amount: number;
  from_currency: string;
  to_currency: string;
}

interface BatchConversionResponse {
  results: Record<string, unknown>[];
}

/**
 * Hook for currency conversion with React Query caching
 * Provides methods to convert currencies and get exchange rates
 * Uses queryClient.fetchQuery for automatic rate caching (1-hour stale time)
 */
export const useCurrencyConversion = () => {
  const queryClient = useQueryClient();

  /**
   * Convert amount from one currency to another
   */
  const convert = useCallback(async (amount: number, fromCurrency: string, toCurrency: string): Promise<number> => {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    try {
      const response = await currencyConversionAPI.convert(
        amount,
        fromCurrency,
        toCurrency
      ) as CurrencyConversionResponse;
      return Number(response.converted_amount);
    } catch (err: unknown) {
      console.error('Currency conversion failed:', err);
      return amount; // Fallback to original amount
    }
  }, []);

  /**
   * Get exchange rates for multiple currencies
   * Uses React Query's fetchQuery for automatic caching with 1-hour staleTime
   */
  const getRates = useCallback(async (baseCurrency: string, currencies: string[]): Promise<unknown> => {
    try {
      const response = await queryClient.fetchQuery({
        queryKey: queryKeys.currencies.rates({ baseCurrency, currencies: currencies.sort().join(',') }),
        queryFn: () => currencyConversionAPI.getRates(baseCurrency, currencies) as Promise<ExchangeRatesResponse>,
        staleTime: 60 * 60 * 1000, // 1 hour - matching backend cache TTL
      });
      return response.rates;
    } catch (err: unknown) {
      console.error('Failed to get exchange rates:', err);
      return {};
    }
  }, [queryClient]);

  /**
   * Batch convert multiple amounts
   */
  const batchConvert = useCallback(async (conversions: ConversionRequest[]): Promise<unknown[]> => {
    try {
      const response = await currencyConversionAPI.batchConvert(conversions) as BatchConversionResponse;
      return response.results;
    } catch (err: unknown) {
      console.error('Batch conversion failed:', err);
      return [];
    }
  }, []);

  /**
   * Clear cached exchange rates
   */
  const clearCache = useCallback(() => {
    queryClient.removeQueries({ queryKey: ['currencies', 'rates'] });
  }, [queryClient]);

  return {
    convert,
    getRates,
    batchConvert,
    clearCache,
    rates: {} as Record<string, Record<string, string>>,
    loading: false,
    error: null as string | null,
  };
};
