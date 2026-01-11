/**
 * Currency utility functions for formatting and conversion
 */

/**
 * Currency symbols mapping
 */
const CURRENCY_SYMBOLS = {
  GBP: '£',
  USD: '$',
  EUR: '€',
  JPY: '¥',
  CNY: '¥',
  INR: '₹',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'Fr',
  SEK: 'kr',
  NZD: 'NZ$',
  ZAR: 'R',
  BRL: 'R$',
  MXN: '$',
  SGD: 'S$',
  HKD: 'HK$',
  KRW: '₩',
  TRY: '₺',
  RUB: '₽',
  PLN: 'zł',
  THB: '฿',
  IDR: 'Rp',
  MYR: 'RM',
  PHP: '₱',
  DKK: 'kr',
  NOK: 'kr',
};

/**
 * Get currency symbol for a currency code
 * @param {string} code - Currency code (e.g., 'GBP', 'USD')
 * @returns {string} Currency symbol or code if not found
 */
export const getCurrencySymbol = (code) => {
  if (!code) return '';
  return CURRENCY_SYMBOLS[code.toUpperCase()] || code;
};

/**
 * Format currency amount with symbol and number format
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @param {Object} numberFormat - Number format object with decimal_separator and thousands_separator
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency, numberFormat = null) => {
  if (amount === null || amount === undefined) return '';

  // Convert to number if it's a string (from API Decimal serialization)
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);

  if (!currency) return numAmount.toFixed(2);

  const symbol = getCurrencySymbol(currency);

  // If no number format specified, use default
  if (!numberFormat) {
    return `${symbol}${numAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
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
 * Convert currency using exchange rates
 * Client-side conversion using cached rates
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @param {Object} rates - Exchange rates object (with USD as base)
 * @returns {number} Converted amount
 */
export const convertCurrency = (amount, fromCurrency, toCurrency, rates) => {
  if (!amount || fromCurrency === toCurrency) return amount;

  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  // Direct conversion from USD
  if (from === 'USD') {
    return amount * (rates[to] || 1);
  }

  // Direct conversion to USD
  if (to === 'USD') {
    return amount / (rates[from] || 1);
  }

  // Cross conversion through USD
  const amountInUSD = amount / (rates[from] || 1);
  return amountInUSD * (rates[to] || 1);
};

/**
 * Parse formatted currency string to number
 * @param {string} formattedString - Formatted currency string
 * @param {Object} numberFormat - Number format object
 * @returns {number} Parsed number
 */
export const parseFormattedCurrency = (formattedString, numberFormat = null) => {
  if (!formattedString) return 0;

  // Remove currency symbols
  let cleaned = formattedString.replace(/[£$€¥₹]/g, '').trim();

  if (!numberFormat) {
    // Use default: remove commas, parse
    cleaned = cleaned.replace(/,/g, '');
    return parseFloat(cleaned) || 0;
  }

  // Remove thousands separator
  const thousandsSep = numberFormat.thousands_separator || ',';
  const decimalSep = numberFormat.decimal_separator || '.';

  cleaned = cleaned.replace(new RegExp(`\\${thousandsSep}`, 'g'), '');
  cleaned = cleaned.replace(decimalSep, '.');

  return parseFloat(cleaned) || 0;
};

/**
 * Calculate total value of services with currency conversion
 * @param {Array} services - Array of service objects with price and currency
 * @param {string} targetCurrency - Target currency for total
 * @param {Object} rates - Exchange rates
 * @returns {Object} Object with total and hasMixedCurrencies flag
 */
export const calculateServiceTotal = (services, targetCurrency, rates) => {
  if (!services || services.length === 0) {
    return { total: 0, hasMixedCurrencies: false };
  }

  let total = 0;
  const currencies = new Set();

  services.forEach((service) => {
    // Extract currency code from currency object or use string directly
    const serviceCurrency = service.currency?.code || service.currency || targetCurrency;
    currencies.add(serviceCurrency);

    if (serviceCurrency === targetCurrency) {
      total += Number(service.price) || 0;
    } else if (rates) {
      const converted = convertCurrency(
        Number(service.price) || 0,
        serviceCurrency,
        targetCurrency,
        rates
      );
      total += converted;
    } else {
      // No rates available, just add the amount (fallback)
      total += Number(service.price) || 0;
    }
  });

  return {
    total,
    hasMixedCurrencies: currencies.size > 1,
  };
};

/**
 * Get service value breakdown by currency
 * @param {Array} services - Array of service objects
 * @param {string} targetCurrency - Target currency
 * @param {Object} rates - Exchange rates
 * @returns {Array} Array of {currency, count, total, convertedTotal}
 */
export const getServiceValueBreakdown = (services, targetCurrency, rates) => {
  if (!services || services.length === 0) return [];

  const breakdown = {};

  services.forEach((service) => {
    const currency = service.currency || targetCurrency;
    const price = Number(service.price) || 0;

    if (!breakdown[currency]) {
      breakdown[currency] = {
        currency,
        count: 0,
        total: 0,
        convertedTotal: 0,
      };
    }

    breakdown[currency].count += 1;
    breakdown[currency].total += price;

    if (currency === targetCurrency) {
      breakdown[currency].convertedTotal += price;
    } else if (rates) {
      const converted = convertCurrency(price, currency, targetCurrency, rates);
      breakdown[currency].convertedTotal += converted;
    }
  });

  return Object.values(breakdown);
};

/**
 * Format annual recurring revenue
 * @param {number} amount - Monthly or one-time amount
 * @param {string} frequency - 'monthly', 'quarterly', 'annually', 'one_time'
 * @returns {number} Annual value
 */
export const calculateAnnualValue = (amount, frequency) => {
  const multipliers = {
    monthly: 12,
    quarterly: 4,
    annually: 1,
    one_time: 1,
  };

  return (Number(amount) || 0) * (multipliers[frequency] || 1);
};

/**
 * Validate currency code
 * @param {string} code - Currency code to validate
 * @returns {boolean} Is valid currency code
 */
export const isValidCurrencyCode = (code) => {
  if (!code || typeof code !== 'string') return false;
  return /^[A-Z]{3}$/.test(code.toUpperCase());
};

/**
 * Get currency name
 * @param {string} code - Currency code
 * @returns {string} Currency name
 */
export const getCurrencyName = (code) => {
  const names = {
    USD: 'US Dollar',
    EUR: 'Euro',
    GBP: 'British Pound',
    JPY: 'Japanese Yen',
    CAD: 'Canadian Dollar',
    AUD: 'Australian Dollar',
    CHF: 'Swiss Franc',
    CNY: 'Chinese Yuan',
    INR: 'Indian Rupee',
    SEK: 'Swedish Krona',
    NZD: 'New Zealand Dollar',
    ZAR: 'South African Rand',
    BRL: 'Brazilian Real',
    MXN: 'Mexican Peso',
    SGD: 'Singapore Dollar',
    HKD: 'Hong Kong Dollar',
    KRW: 'South Korean Won',
    TRY: 'Turkish Lira',
    RUB: 'Russian Ruble',
    PLN: 'Polish Zloty',
    THB: 'Thai Baht',
    IDR: 'Indonesian Rupiah',
    MYR: 'Malaysian Ringgit',
    PHP: 'Philippine Peso',
    DKK: 'Danish Krone',
    NOK: 'Norwegian Krone',
  };

  return names[code?.toUpperCase()] || code;
};

/**
 * Format currency with locale support
 * @param {number} amount - Amount to format
 * @param {string} currencyCode - Currency code (ISO 4217)
 * @param {string} locale - Locale for formatting (default: en-US)
 * @param {Object} options - Additional Intl.NumberFormat options
 * @returns {string} Formatted currency string
 */
export const formatCurrencyWithLocale = (amount, currencyCode = 'USD', locale = 'en-US', options = {}) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);

  if (isNaN(numAmount)) return '';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      ...options,
    }).format(numAmount);
  } catch (error) {
    // Fallback if Intl fails
    return formatCurrency(numAmount, currencyCode);
  }
};

/**
 * Format currency amount without symbol (just number formatting)
 * @param {number} amount - Amount to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @param {Object} numberFormat - Number format object
 * @returns {string} Formatted number string
 */
export const formatAmount = (amount, decimals = 2, numberFormat = null) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);

  if (isNaN(numAmount)) return '0.00';

  const fixed = numAmount.toFixed(decimals);

  if (!numberFormat) {
    return fixed.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  const parts = fixed.split('.');
  const integerPart = parts[0].replace(
    /\B(?=(\d{3})+(?!\d))/g,
    numberFormat.thousands_separator || ','
  );

  if (decimals === 0) return integerPart;

  return `${integerPart}${numberFormat.decimal_separator || '.'}${parts[1]}`;
};

/**
 * Round to smallest currency unit (cents, pence, etc.)
 * @param {number} amount - Amount to round
 * @returns {number} Rounded amount
 */
export const roundToSmallestUnit = (amount) => {
  return Math.round((parseFloat(amount) || 0) * 100) / 100;
};

/**
 * Convert amount to smallest unit (for Stripe, etc.)
 * @param {number} amount - Amount in standard units
 * @param {string} currencyCode - Currency code
 * @returns {number} Amount in smallest unit (e.g., cents)
 */
export const toSmallestUnit = (amount, currencyCode) => {
  const numAmount = parseFloat(amount) || 0;

  // Zero-decimal currencies (JPY, KRW, etc.)
  const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND', 'CLP', 'BIF', 'DJF', 'GNF', 'ISK', 'KMF', 'PYG', 'RWF', 'UGX', 'XAF', 'XOF', 'XPF'];

  if (zeroDecimalCurrencies.includes(currencyCode?.toUpperCase())) {
    return Math.round(numAmount);
  }

  // Standard currencies (2 decimal places)
  return Math.round(numAmount * 100);
};

/**
 * Convert amount from smallest unit to standard units
 * @param {number} amount - Amount in smallest unit
 * @param {string} currencyCode - Currency code
 * @returns {number} Amount in standard units
 */
export const fromSmallestUnit = (amount, currencyCode) => {
  const numAmount = parseInt(amount) || 0;

  // Zero-decimal currencies
  const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND', 'CLP', 'BIF', 'DJF', 'GNF', 'ISK', 'KMF', 'PYG', 'RWF', 'UGX', 'XAF', 'XOF', 'XPF'];

  if (zeroDecimalCurrencies.includes(currencyCode?.toUpperCase())) {
    return numAmount;
  }

  // Standard currencies
  return numAmount / 100;
};

/**
 * Aggregate amounts in multiple currencies to a target currency
 * @param {Array<Object>} items - Array of objects with amount and currency properties
 * @param {string} targetCurrency - Target currency code
 * @param {Object} exchangeRates - Exchange rates object
 * @returns {Object} Aggregated result with breakdown
 */
export const aggregateMultiCurrency = (items = [], targetCurrency, exchangeRates) => {
  const breakdown = {};
  let totalInTargetCurrency = 0;

  items.forEach((item) => {
    const itemCurrency = item.currency_code || item.currency || targetCurrency;
    const amount = parseFloat(item.amount) || parseFloat(item.total) || parseFloat(item.price) || 0;

    // Add to breakdown
    if (!breakdown[itemCurrency]) {
      breakdown[itemCurrency] = {
        currency: itemCurrency,
        total: 0,
        count: 0,
      };
    }
    breakdown[itemCurrency].total += amount;
    breakdown[itemCurrency].count += 1;

    // Convert to target currency
    if (itemCurrency === targetCurrency) {
      totalInTargetCurrency += amount;
    } else if (exchangeRates) {
      const converted = convertCurrency(amount, itemCurrency, targetCurrency, exchangeRates);
      totalInTargetCurrency += converted;
    } else {
      // If no rates, just add amount (fallback)
      totalInTargetCurrency += amount;
    }
  });

  return {
    total: roundToSmallestUnit(totalInTargetCurrency),
    currency: targetCurrency,
    breakdown: Object.values(breakdown).map(b => ({
      ...b,
      total: roundToSmallestUnit(b.total),
    })),
    hasMixedCurrencies: Object.keys(breakdown).length > 1,
  };
};

/**
 * Get exchange rate between two currencies
 * @param {string} fromCurrency - Source currency
 * @param {string} toCurrency - Target currency
 * @param {Object} rates - Exchange rates object (USD-based)
 * @returns {number} Exchange rate
 */
export const getExchangeRate = (fromCurrency, toCurrency, rates) => {
  if (fromCurrency === toCurrency) return 1;

  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  if (from === 'USD') {
    return rates[to] || 1;
  }

  if (to === 'USD') {
    return 1 / (rates[from] || 1);
  }

  // Cross rate
  const fromToUSD = 1 / (rates[from] || 1);
  const USDToTarget = rates[to] || 1;
  return fromToUSD * USDToTarget;
};

/**
 * Format exchange rate for display
 * @param {string} fromCurrency - Source currency
 * @param {string} toCurrency - Target currency
 * @param {number} rate - Exchange rate
 * @returns {string} Formatted rate string (e.g., "1 USD = 0.85 EUR")
 */
export const formatExchangeRate = (fromCurrency, toCurrency, rate) => {
  const formattedRate = parseFloat(rate).toFixed(4);
  return `1 ${fromCurrency} = ${formattedRate} ${toCurrency}`;
};

/**
 * Check if currency requires conversion
 * @param {string} fromCurrency - Source currency
 * @param {string} toCurrency - Target currency
 * @returns {boolean} Needs conversion
 */
export const needsCurrencyConversion = (fromCurrency, toCurrency) => {
  if (!fromCurrency || !toCurrency) return false;
  return fromCurrency.toUpperCase() !== toCurrency.toUpperCase();
};
