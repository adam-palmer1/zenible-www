import React from 'react';
import { formatCurrency, getCurrencySymbol } from '../../utils/currency';

/**
 * Currency - A reusable currency display component
 *
 * Replaces the 189+ formatCurrency() calls with a consistent component.
 * Handles null/undefined values gracefully and provides consistent formatting.
 *
 * @param {Object} props
 * @param {number|string} props.amount - The amount to display
 * @param {string} props.currency - Currency code (e.g., 'USD', 'GBP')
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showSymbol - Whether to show currency symbol (default: true)
 * @param {number} props.decimals - Number of decimal places (default: 2)
 * @param {boolean} props.showPlus - Show + for positive numbers
 * @param {boolean} props.colorCode - Apply color based on value (green/red)
 * @param {Object} props.numberFormat - Custom number format object
 * @param {string} props.fallback - Fallback text for null/undefined (default: '-')
 *
 * @example
 * // Basic usage
 * <Currency amount={1000} currency="USD" />
 * // Output: $1,000.00
 *
 * @example
 * // With styling
 * <Currency amount={-500} currency="GBP" colorCode className="font-bold" />
 * // Output: -£500.00 (in red)
 *
 * @example
 * // Symbol only
 * <Currency amount={1000} currency="EUR" showSymbol={false} />
 * // Output: 1,000.00
 */
const Currency = ({
  amount,
  currency = 'USD',
  className = '',
  showSymbol = true,
  decimals = 2,
  showPlus = false,
  colorCode = false,
  numberFormat = null,
  fallback = '-',
}) => {
  // Handle null/undefined
  if (amount === null || amount === undefined || amount === '') {
    return <span className={`text-gray-400 ${className}`}>{fallback}</span>;
  }

  // Parse amount
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);

  // Handle NaN
  if (isNaN(numAmount)) {
    return <span className={`text-gray-400 ${className}`}>{fallback}</span>;
  }

  // Format the number
  let formatted;
  if (showSymbol) {
    formatted = formatCurrency(numAmount, currency, numberFormat);
  } else {
    // Format without symbol
    const parts = Math.abs(numAmount).toFixed(decimals).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, numberFormat?.thousands_separator || ',');
    formatted = `${integerPart}${numberFormat?.decimal_separator || '.'}${parts[1]}`;
    if (numAmount < 0) {
      formatted = `-${formatted}`;
    }
  }

  // Add plus sign if requested
  if (showPlus && numAmount > 0) {
    formatted = `+${formatted}`;
  }

  // Determine color classes
  let colorClasses = '';
  if (colorCode) {
    if (numAmount > 0) {
      colorClasses = 'text-green-600 dark:text-green-400';
    } else if (numAmount < 0) {
      colorClasses = 'text-red-600 dark:text-red-400';
    }
  }

  return (
    <span className={`${colorClasses} ${className}`.trim()}>
      {formatted}
    </span>
  );
};

export default Currency;

/**
 * CurrencySymbol - Display just the currency symbol
 */
export const CurrencySymbol = ({ currency = 'USD', className = '' }) => {
  return (
    <span className={className}>
      {getCurrencySymbol(currency)}
    </span>
  );
};

/**
 * CurrencyInput - Input field with currency formatting
 * For use in forms where you need currency input
 */
export const CurrencyInput = ({
  value,
  onChange,
  currency = 'USD',
  placeholder = '0.00',
  className = '',
  disabled = false,
  ...props
}) => {
  const symbol = getCurrencySymbol(currency);

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
        {symbol}
      </span>
      <input
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`pl-8 pr-3 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 ${className}`}
        {...props}
      />
    </div>
  );
};
