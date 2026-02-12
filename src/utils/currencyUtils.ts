/**
 * Currency utility functions for formatting and conversion
 */

interface NumberFormatConfig {
  decimal_separator?: string;
  thousands_separator?: string;
}

/**
 * Currency symbols mapping
 */
const CURRENCY_SYMBOLS: Record<string, string> = {
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

export const getCurrencySymbol = (code: string | null | undefined): string => {
  if (!code) return '';
  return CURRENCY_SYMBOLS[code.toUpperCase()] || code;
};

export const formatCurrency = (amount: number | string | null | undefined, currency: string | null | undefined, numberFormat: NumberFormatConfig | null = null): string => {
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

export const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string, rates: Record<string, number>): number => {
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

export const parseFormattedCurrency = (formattedString: string | null | undefined, numberFormat: NumberFormatConfig | null = null): number => {
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

interface ServiceLike {
  price?: number | string;
  currency?: string | { code?: string };
}

export const calculateServiceTotal = (services: ServiceLike[] | null | undefined, targetCurrency: string, rates: Record<string, number> | null): { total: number; hasMixedCurrencies: boolean } => {
  if (!services || services.length === 0) {
    return { total: 0, hasMixedCurrencies: false };
  }

  let total = 0;
  const currencies = new Set<string>();

  services.forEach((service) => {
    // Extract currency code from currency object or use string directly
    const serviceCurrency = (typeof service.currency === 'object' ? service.currency?.code : service.currency) || targetCurrency;
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

interface BreakdownEntry {
  currency: string;
  count: number;
  total: number;
  convertedTotal: number;
}

export const getServiceValueBreakdown = (services: ServiceLike[] | null | undefined, targetCurrency: string, rates: Record<string, number> | null): BreakdownEntry[] => {
  if (!services || services.length === 0) return [];

  const breakdown: Record<string, BreakdownEntry> = {};

  services.forEach((service) => {
    const currency = (typeof service.currency === 'string' ? service.currency : service.currency?.code) || targetCurrency;
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

export const calculateAnnualValue = (amount: number | string, frequency: string): number => {
  const multipliers: Record<string, number> = {
    monthly: 12,
    quarterly: 4,
    annual: 1,
    one_time: 1,
  };

  return (Number(amount) || 0) * (multipliers[frequency] || 1);
};

export const isValidCurrencyCode = (code: string | null | undefined): boolean => {
  if (!code || typeof code !== 'string') return false;
  return /^[A-Z]{3}$/.test(code.toUpperCase());
};

export const getCurrencyName = (code: string | null | undefined): string => {
  const names: Record<string, string> = {
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

  return names[code?.toUpperCase() ?? ''] || code || '';
};

export const formatCurrencyWithLocale = (amount: number | string | null | undefined, currencyCode = 'USD', locale = 'en-US', options: Intl.NumberFormatOptions = {}): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);

  if (isNaN(numAmount)) return '';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      ...options,
    }).format(numAmount);
  } catch {
    // Fallback if Intl fails
    return formatCurrency(numAmount, currencyCode);
  }
};

export const formatAmount = (amount: number | string | null | undefined, decimals = 2, numberFormat: NumberFormatConfig | null = null): string => {
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

export const roundToSmallestUnit = (amount: number | string): number => {
  return Math.round((parseFloat(String(amount)) || 0) * 100) / 100;
};

export const toSmallestUnit = (amount: number | string, currencyCode: string | null | undefined): number => {
  const numAmount = parseFloat(String(amount)) || 0;

  // Zero-decimal currencies (JPY, KRW, etc.)
  const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND', 'CLP', 'BIF', 'DJF', 'GNF', 'ISK', 'KMF', 'PYG', 'RWF', 'UGX', 'XAF', 'XOF', 'XPF'];

  if (zeroDecimalCurrencies.includes(currencyCode?.toUpperCase() ?? '')) {
    return Math.round(numAmount);
  }

  // Standard currencies (2 decimal places)
  return Math.round(numAmount * 100);
};

export const fromSmallestUnit = (amount: number | string, currencyCode: string | null | undefined): number => {
  const numAmount = parseInt(String(amount)) || 0;

  // Zero-decimal currencies
  const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND', 'CLP', 'BIF', 'DJF', 'GNF', 'ISK', 'KMF', 'PYG', 'RWF', 'UGX', 'XAF', 'XOF', 'XPF'];

  if (zeroDecimalCurrencies.includes(currencyCode?.toUpperCase() ?? '')) {
    return numAmount;
  }

  // Standard currencies
  return numAmount / 100;
};

interface MultiCurrencyItem {
  currency_code?: string;
  currency?: string;
  amount?: number | string;
  total?: number | string;
  price?: number | string;
}

interface AggregateResult {
  total: number;
  currency: string;
  breakdown: Array<{ currency: string; total: number; count: number }>;
  hasMixedCurrencies: boolean;
}

export const aggregateMultiCurrency = (items: MultiCurrencyItem[] = [], targetCurrency: string, exchangeRates: Record<string, number> | null): AggregateResult => {
  const breakdown: Record<string, { currency: string; total: number; count: number }> = {};
  let totalInTargetCurrency = 0;

  items.forEach((item) => {
    const itemCurrency = item.currency_code || item.currency || targetCurrency;
    const amount = parseFloat(String(item.amount)) || parseFloat(String(item.total)) || parseFloat(String(item.price)) || 0;

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

export const getExchangeRate = (fromCurrency: string, toCurrency: string, rates: Record<string, number>): number => {
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

export const formatExchangeRate = (fromCurrency: string, toCurrency: string, rate: number | string): string => {
  const formattedRate = parseFloat(String(rate)).toFixed(4);
  return `1 ${fromCurrency} = ${formattedRate} ${toCurrency}`;
};

export const needsCurrencyConversion = (fromCurrency: string | null | undefined, toCurrency: string | null | undefined): boolean => {
  if (!fromCurrency || !toCurrency) return false;
  return fromCurrency.toUpperCase() !== toCurrency.toUpperCase();
};
