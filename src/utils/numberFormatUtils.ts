/**
 * Number formatting utility functions
 * Handles different number formats (US, EU, etc.)
 */

interface NumberFormatConfig {
  decimal_separator: string;
  thousands_separator: string;
  format_string?: string;
  name?: string;
}

export const applyNumberFormat = (number: number | null | undefined, format?: NumberFormatConfig | null): string => {
  if (number === null || number === undefined || isNaN(number)) {
    return '0.00';
  }

  if (!format) {
    // Default format: 1,234.56 (US/UK format)
    return Number(number)
      .toFixed(2)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  const decimalSeparator = format.decimal_separator || '.';
  const thousandsSeparator = format.thousands_separator || ',';

  // Split into integer and decimal parts
  const parts = Number(number).toFixed(2).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  // Add thousands separators
  const formattedInteger = integerPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    thousandsSeparator
  );

  return `${formattedInteger}${decimalSeparator}${decimalPart}`;
};

export const parseFormattedNumber = (formattedString: string | null | undefined, format?: NumberFormatConfig | null): number => {
  if (!formattedString) return 0;

  if (!format) {
    // Default: remove commas
    return parseFloat(formattedString.replace(/,/g, '')) || 0;
  }

  const decimalSeparator = format.decimal_separator || '.';
  const thousandsSeparator = format.thousands_separator || ',';

  // Remove thousands separator
  let normalized = formattedString.replace(
    new RegExp(`\\${thousandsSeparator}`, 'g'),
    ''
  );

  // Replace decimal separator with standard '.'
  normalized = normalized.replace(decimalSeparator, '.');

  return parseFloat(normalized) || 0;
};

export const formatInteger = (number: number | null | undefined, format?: NumberFormatConfig | null): string => {
  if (number === null || number === undefined || isNaN(number)) {
    return '0';
  }

  const integerValue = Math.floor(Number(number));

  if (!format) {
    return integerValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  const thousandsSeparator = format.thousands_separator || ',';

  return integerValue
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
};

export const formatPercentage = (number: number | null | undefined, format: NumberFormatConfig | null = null, decimals = 2): string => {
  if (number === null || number === undefined || isNaN(number)) {
    return '0%';
  }

  const decimalSeparator = format?.decimal_separator || '.';

  const parts = Number(number).toFixed(decimals).split('.');
  const formattedNumber = parts.join(decimalSeparator);

  return `${formattedNumber}%`;
};

/**
 * Predefined number formats
 */
export const NUMBER_FORMATS: Record<string, NumberFormatConfig> = {
  US: {
    name: '1,234.56',
    decimal_separator: '.',
    thousands_separator: ',',
    format_string: '1,234.56',
  },
  EU: {
    name: '1.234,56',
    decimal_separator: ',',
    thousands_separator: '.',
    format_string: '1.234,56',
  },
  FRENCH: {
    name: '1 234,56',
    decimal_separator: ',',
    thousands_separator: ' ',
    format_string: '1 234,56',
  },
  SWISS: {
    name: "1'234.56",
    decimal_separator: '.',
    thousands_separator: "'",
    format_string: "1'234.56",
  },
  INDIAN: {
    name: '1,23,456.78',
    decimal_separator: '.',
    thousands_separator: ',',
    format_string: '1,23,456.78',
  },
};

export const detectNumberFormat = (formattedString: string | null | undefined): NumberFormatConfig | null => {
  if (!formattedString || typeof formattedString !== 'string') {
    return null;
  }

  // Check for decimal separator
  const hasCommaAsDecimal = /\d,\d{2}$/.test(formattedString);
  const hasDotAsDecimal = /\d\.\d{2}$/.test(formattedString);

  if (hasCommaAsDecimal) {
    // EU or French format
    if (formattedString.includes(' ')) {
      return NUMBER_FORMATS.FRENCH;
    }
    return NUMBER_FORMATS.EU;
  }

  if (hasDotAsDecimal) {
    // US, Swiss, or Indian format
    if (formattedString.includes("'")) {
      return NUMBER_FORMATS.SWISS;
    }
    // Default to US
    return NUMBER_FORMATS.US;
  }

  return null;
};

export const isValidNumberFormat = (format: unknown): format is NumberFormatConfig => {
  return (
    !!format &&
    typeof format === 'object' &&
    typeof (format as NumberFormatConfig).decimal_separator === 'string' &&
    typeof (format as NumberFormatConfig).thousands_separator === 'string' &&
    (format as NumberFormatConfig).decimal_separator !== (format as NumberFormatConfig).thousands_separator
  );
};
