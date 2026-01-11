/**
 * Number formatting utility functions
 * Handles different number formats (US, EU, etc.)
 */

/**
 * Apply number format to a number
 * @param {number} number - Number to format
 * @param {Object} format - Format object with decimal_separator, thousands_separator, format_string
 * @returns {string} Formatted number string
 */
export const applyNumberFormat = (number, format) => {
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

/**
 * Parse formatted number string to number
 * @param {string} formattedString - Formatted number string
 * @param {Object} format - Format object
 * @returns {number} Parsed number
 */
export const parseFormattedNumber = (formattedString, format) => {
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

/**
 * Format integer (no decimals)
 * @param {number} number - Number to format
 * @param {Object} format - Format object
 * @returns {string} Formatted integer string
 */
export const formatInteger = (number, format) => {
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

/**
 * Format percentage
 * @param {number} number - Number to format as percentage
 * @param {Object} format - Format object
 * @param {number} decimals - Number of decimal places (default 2)
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (number, format = null, decimals = 2) => {
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
export const NUMBER_FORMATS = {
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

/**
 * Detect number format from a formatted string
 * @param {string} formattedString - Sample formatted number
 * @returns {Object|null} Detected format or null
 */
export const detectNumberFormat = (formattedString) => {
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

/**
 * Validate number format object
 * @param {Object} format - Format to validate
 * @returns {boolean} True if valid
 */
export const isValidNumberFormat = (format) => {
  return (
    format &&
    typeof format === 'object' &&
    typeof format.decimal_separator === 'string' &&
    typeof format.thousands_separator === 'string' &&
    format.decimal_separator !== format.thousands_separator
  );
};
