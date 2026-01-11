import React from 'react';
import { formatCurrency } from '../../utils/currencyUtils';

/**
 * Display service values with separation between one-off and recurring
 * Format: $123.00 + $10/yr
 */
const ServiceValueDisplay = ({ oneOffTotal, recurringTotal, currency, numberFormat = null }) => {
  if (!oneOffTotal && !recurringTotal) {
    return <span className="text-gray-400 dark:text-gray-500 text-sm">No value</span>;
  }

  const parts = [];

  if (oneOffTotal && parseFloat(oneOffTotal) > 0) {
    parts.push(formatCurrency(oneOffTotal, currency, numberFormat));
  }

  if (recurringTotal && parseFloat(recurringTotal) > 0) {
    const formatted = formatCurrency(recurringTotal, currency, numberFormat);
    parts.push(`${formatted}/yr`);
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {parts.join(' + ')}
      </span>
    </div>
  );
};

export default ServiceValueDisplay;
