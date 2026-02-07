import React from 'react';
import { formatCurrency } from '../../utils/currencyUtils';

interface ServiceValueDisplayProps {
  oneOffTotal?: string | number;
  recurringTotal?: string | number;
  currency?: string;
  numberFormat?: any;
  variant?: 'default' | 'pending' | 'confirmed';
}

/**
 * Display service values with separation between one-off and recurring
 * Format: $123.00 + $10/yr
 */
const ServiceValueDisplay: React.FC<ServiceValueDisplayProps> = ({ oneOffTotal, recurringTotal, currency, numberFormat = null, variant = 'default' }) => {
  // Default to GBP if no currency provided
  const displayCurrency = currency || 'GBP';

  if (!oneOffTotal && !recurringTotal) {
    return <span className="text-gray-400 dark:text-gray-500 text-sm">No value</span>;
  }

  const parts: string[] = [];

  if (oneOffTotal && parseFloat(oneOffTotal as string) > 0) {
    parts.push(formatCurrency(oneOffTotal, displayCurrency, numberFormat));
  }

  if (recurringTotal && parseFloat(recurringTotal as string) > 0) {
    const formatted = formatCurrency(recurringTotal, displayCurrency, numberFormat);
    parts.push(`${formatted}/yr`);
  }

  // Style based on variant
  const textColorClass = variant === 'pending'
    ? 'text-amber-600 dark:text-amber-400'
    : variant === 'confirmed'
    ? 'text-zenible-primary'
    : 'text-gray-700 dark:text-gray-300';

  return (
    <div className="flex items-center gap-1">
      <span className={`text-sm font-medium ${textColorClass}`}>
        {parts.join(' + ')}
      </span>
    </div>
  );
};

export default ServiceValueDisplay;
