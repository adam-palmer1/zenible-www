import { useState, useCallback } from 'react';
import currencyConversionAPI from '../../services/api/crm/currencyConversion';

interface ConversionRequest {
  amount: number;
  from_currency: string;
  to_currency: string;
}

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

interface BatchConversionResponse {
  results: Record<string, unknown>[];
}

/**
 * Hook for currency conversion with caching
 * Provides methods to convert currencies and get exchange rates
 */
export const useCurrencyConversion = () => {
  const [rates, setRates] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheTimestamp, setCacheTimestamp] = useState<number | null>(null);

  // Cache TTL: 1 hour (matching backend)
  const CACHE_TTL = 60 * 60 * 1000;

  /**
   * Convert amount from one currency to another
   */
  const convert = useCallback(async (amount: number, fromCurrency: string, toCurrency: string): Promise<number> => {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await currencyConversionAPI.convert(
        amount,
        fromCurrency,
        toCurrency
      ) as CurrencyConversionResponse;
      return Number(response.converted_amount);
    } catch (err: unknown) {
      setError((err as Error).message);
      console.error('Currency conversion failed:', err);
      return amount; // Fallback to original amount
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get exchange rates for multiple currencies
   */
  const getRates = useCallback(async (baseCurrency: string, currencies: string[]): Promise<unknown> => {
    // Check cache validity
    const now = Date.now();
    if (
      rates[baseCurrency] &&
      cacheTimestamp &&
      now - cacheTimestamp < CACHE_TTL
    ) {
      return rates[baseCurrency];
    }

    setLoading(true);
    setError(null);

    try {
      const response = await currencyConversionAPI.getRates(
        baseCurrency,
        currencies
      ) as ExchangeRatesResponse;

      // Update cache
      setRates((prev) => ({
        ...prev,
        [baseCurrency]: response.rates,
      }));
      setCacheTimestamp(now);

      return response.rates;
    } catch (err: unknown) {
      setError((err as Error).message);
      console.error('Failed to get exchange rates:', err);
      return {};
    } finally {
      setLoading(false);
    }
  }, [rates, cacheTimestamp, CACHE_TTL]);

  /**
   * Batch convert multiple amounts
   */
  const batchConvert = useCallback(async (conversions: ConversionRequest[]): Promise<unknown[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await currencyConversionAPI.batchConvert(conversions) as BatchConversionResponse;
      return response.results;
    } catch (err: unknown) {
      setError((err as Error).message);
      console.error('Batch conversion failed:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear cache manually
   */
  const clearCache = useCallback(() => {
    setRates({});
    setCacheTimestamp(null);
  }, []);

  return {
    convert,
    getRates,
    batchConvert,
    clearCache,
    rates,
    loading,
    error,
  };
};
