/**
 * Currency utility functions
 * Shared helpers for currency formatting and symbols
 */

/**
 * Currency symbol mapping
 */
export const CURRENCY_SYMBOLS = {
  GBP: '£',
  USD: '$',
  EUR: '€',
  JPY: '¥',
  CNY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'Fr',
  INR: '₹',
  SEK: 'kr',
  NZD: 'NZ$',
  SGD: 'S$',
  HKD: 'HK$'
};

/**
 * Get currency symbol
 * @param {string} currencyCode - ISO 4217 currency code (e.g., 'GBP', 'USD')
 * @returns {string} Currency symbol or code if not found
 */
export const getCurrencySymbol = (currencyCode) => {
  if (!currencyCode || typeof currencyCode !== 'string') return '$';
  return CURRENCY_SYMBOLS[currencyCode.toUpperCase()] || currencyCode;
};

/**
 * Format amount with currency symbol
 * @param {number} amount - Numeric amount
 * @param {string} currencyCode - ISO 4217 currency code
 * @param {boolean} showCode - Show currency code instead of symbol
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currencyCode = 'USD', showCode = false) => {
  if (amount === null || amount === undefined) return '';

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  const formatted = numAmount.toFixed(2);

  // Ensure currencyCode is valid
  const code = currencyCode || 'USD';

  if (showCode) {
    return `${code} ${formatted}`;
  }

  const symbol = getCurrencySymbol(code);
  return `${symbol}${formatted}`;
};

/**
 * Format currency with thousands separator
 * @param {number} amount - Numeric amount
 * @param {string} currencyCode - ISO 4217 currency code
 * @returns {string} Formatted currency with commas
 */
export const formatCurrencyWithCommas = (amount, currencyCode = 'USD') => {
  if (amount === null || amount === undefined) return '';

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  const formatted = numAmount.toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  // Ensure currencyCode is valid
  const code = currencyCode || 'USD';
  const symbol = getCurrencySymbol(code);
  return `${symbol}${formatted}`;
};
