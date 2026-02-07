/**
 * Currency Conversion API Service
 */

import { createRequest } from '../httpClient';

const request = createRequest('CurrencyConversionAPI');

const currencyConversionAPI = {
  /** Convert single amount */
  convert: (amount: number, fromCurrency: string, toCurrency: string) => request('/crm/currency/convert', {
    method: 'POST',
    body: JSON.stringify({
      amount,
      from_currency: fromCurrency,
      to_currency: toCurrency,
    }),
  }),

  /** Batch convert multiple amounts */
  batchConvert: (conversions: unknown[]) => request('/crm/currency/batch-convert', {
    method: 'POST',
    body: JSON.stringify({ conversions }),
  }),

  /** Get exchange rates for multiple currencies */
  getRates: (baseCurrency: string, currencies: string[]) => request('/crm/currency/rates', {
    method: 'POST',
    body: JSON.stringify({
      base_currency: baseCurrency,
      currencies,
    }),
  }),

  /** Get cache information (for monitoring) */
  getCacheInfo: () => request('/crm/currency/cache/info', { method: 'GET' }),

  /** Clear cache (admin only) */
  clearCache: () => request('/crm/currency/cache/clear', { method: 'POST' }),

  /** Get historical exchange rate for a specific date */
  getHistoricalRate: (fromCurrency: string, toCurrency: string, date: string) => request('/crm/currency/historical/rate', {
    method: 'POST',
    body: JSON.stringify({
      from_currency: fromCurrency,
      to_currency: toCurrency,
      date,
    }),
  }),

  /** Get historical exchange rates for a date range (for charting) */
  getHistoricalRange: (fromCurrency: string, toCurrency: string, startDate: string, endDate: string) => request('/crm/currency/historical/range', {
    method: 'POST',
    body: JSON.stringify({
      from_currency: fromCurrency,
      to_currency: toCurrency,
      start_date: startDate,
      end_date: endDate,
    }),
  }),

  /** Convert amount using historical rate */
  historicalConvert: (amount: number, fromCurrency: string, toCurrency: string, date: string) => request('/crm/currency/historical/convert', {
    method: 'POST',
    body: JSON.stringify({
      amount,
      from_currency: fromCurrency,
      to_currency: toCurrency,
      date,
    }),
  }),
};

export default currencyConversionAPI;
