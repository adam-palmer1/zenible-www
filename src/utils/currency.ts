/**
 * Currency utility functions
 * Shared helpers for currency formatting and symbols
 */

interface NumberFormatConfig {
  decimal_separator?: string;
  thousands_separator?: string;
}

/**
 * Currency symbol mapping
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
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

export const getCurrencySymbol = (currencyCode: string | null | undefined): string => {
  if (!currencyCode || typeof currencyCode !== 'string') return '$';
  return CURRENCY_SYMBOLS[currencyCode.toUpperCase()] || currencyCode;
};

export const formatCurrency = (amount: number | string | null | undefined, currencyCode = 'USD', numberFormat: NumberFormatConfig | null = null): string => {
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

export const formatCurrencyWithCommas = (amount: number | string | null | undefined, currencyCode = 'USD', numberFormat: NumberFormatConfig | null = null): string => {
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
