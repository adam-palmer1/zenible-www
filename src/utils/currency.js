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
 * @param {Object} numberFormat - Number format object with decimal_separator and thousands_separator
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currencyCode = 'USD', numberFormat = null) => {
  if (amount === null || amount === undefined) return '';

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);

  // Ensure currencyCode is valid
  const code = currencyCode || 'USD';
  const symbol = getCurrencySymbol(code);

  // If no number format specified, use default with thousands separators
  if (!numberFormat) {
    const formatted = numAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${symbol}${formatted}`;
  }

  // Apply custom number format
  const parts = numAmount.toFixed(2).split('.');
  const integerPart = parts[0].replace(
    /\B(?=(\d{3})+(?!\d))/g,
    numberFormat.thousands_separator || ','
  );
  const formattedNumber = `${integerPart}${numberFormat.decimal_separator || '.'}${parts[1]}`;

  return `${symbol}${formattedNumber}`;
};

/**
 * Format currency with thousands separator
 * @param {number} amount - Numeric amount
 * @param {string} currencyCode - ISO 4217 currency code
 * @param {Object} numberFormat - Number format object with decimal_separator and thousands_separator
 * @returns {string} Formatted currency with separators
 */
export const formatCurrencyWithCommas = (amount, currencyCode = 'USD', numberFormat = null) => {
  if (amount === null || amount === undefined) return '';

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);

  // Ensure currencyCode is valid
  const code = currencyCode || 'USD';
  const symbol = getCurrencySymbol(code);

  // If no number format specified, use default locale formatting
  if (!numberFormat) {
    const formatted = numAmount.toLocaleString('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return `${symbol}${formatted}`;
  }

  // Apply custom number format
  const parts = numAmount.toFixed(2).split('.');
  const integerPart = parts[0].replace(
    /\B(?=(\d{3})+(?!\d))/g,
    numberFormat.thousands_separator || ','
  );
  const formattedNumber = `${integerPart}${numberFormat.decimal_separator || '.'}${parts[1]}`;

  return `${symbol}${formattedNumber}`;
};
