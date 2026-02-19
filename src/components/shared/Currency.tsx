import React from 'react';
import { formatCurrency, getCurrencySymbol } from '../../utils/currency';

interface NumberFormat {
  thousands_separator?: string;
  decimal_separator?: string;
}

interface CurrencyProps {
  amount: number | string | null | undefined;
  currency?: string;
  className?: string;
  showSymbol?: boolean;
  decimals?: number;
  showPlus?: boolean;
  colorCode?: boolean;
  numberFormat?: NumberFormat | null;
  fallback?: string;
}

const Currency: React.FC<CurrencyProps> = ({
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
  let formatted: string;
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

interface CurrencySymbolProps {
  currency?: string;
  className?: string;
}

/**
 * CurrencySymbol - Display just the currency symbol
 */
export const CurrencySymbol: React.FC<CurrencySymbolProps> = ({ currency = 'USD', className = '' }) => {
  return (
    <span className={className}>
      {getCurrencySymbol(currency)}
    </span>
  );
};

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string | number;
  onChange: (value: string) => void;
  currency?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * CurrencyInput - Input field with currency formatting
 * For use in forms where you need currency input
 */
export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  currency = 'USD',
  placeholder = '0.00',
  className = '',
  disabled = false,
  ...props
}) => {
  const symbol = getCurrencySymbol(currency);
  const paddingClass = symbol.length <= 1 ? 'pl-7' : symbol.length <= 2 ? 'pl-10' : 'pl-14';

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
        className={`${paddingClass} pr-3 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 ${className}`}
        {...props}
      />
    </div>
  );
};
