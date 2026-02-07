import React, { useEffect, useState } from 'react';
import { useCurrencyConversion } from '../../hooks/crm/useCurrencyConversion';
import { calculateServiceTotal, formatCurrency } from '../../utils/currencyUtils';

interface EstimatedValueProps {
  services?: any[];
  total?: number | string | null;
  currency?: string | null;
  numberFormat?: any;
}

const EstimatedValue: React.FC<EstimatedValueProps> = ({
  services = [],
  total: serverTotal = null,
  currency: serverCurrency = null,
  numberFormat = null
}) => {
  const { getRates } = useCurrencyConversion();
  const [total, setTotal] = useState(0);
  const [hasMixedCurrencies, setHasMixedCurrencies] = useState(false);
  const [loading, setLoading] = useState(true);
  const [displayCurrency, setDisplayCurrency] = useState<string | null>(null);

  useEffect(() => {
    const calculateTotal = async () => {
      try {
        // If server provided pre-calculated total, use it directly
        if (serverTotal !== null && serverTotal !== undefined && serverCurrency) {
          setTotal(parseFloat(serverTotal as string));
          setDisplayCurrency(serverCurrency);
          setHasMixedCurrencies(false);
          setLoading(false);
          return;
        }

        // Otherwise, calculate from services array (backwards compatibility)
        if (!services || services.length === 0) {
          setTotal(0);
          setHasMixedCurrencies(false);
          setLoading(false);
          return;
        }

        // Get unique currencies from services (extract currency code)
        const uniqueCurrencies = [...new Set(services.map((s: any) => s.currency?.code).filter(Boolean))] as string[];

        // If no currency specified, use the first service's currency or first unique currency
        const targetCurrency = uniqueCurrencies[0] || 'USD';
        setDisplayCurrency(targetCurrency);

        const needsConversion = uniqueCurrencies.length > 1;

        if (!needsConversion) {
          // Simple sum if all services use the same currency
          const simpleTotal = services.reduce((sum: number, service: any) => {
            return sum + (parseFloat(service.price) || 0);
          }, 0);
          setTotal(simpleTotal);
          setHasMixedCurrencies(false);
          setLoading(false);
          return;
        }

        // Get exchange rates for conversion
        const currenciesToConvert = uniqueCurrencies.filter((c: string) => c !== targetCurrency);
        let rates: any = {};

        if (currenciesToConvert.length > 0) {
          rates = await getRates(targetCurrency, currenciesToConvert);
        }

        // Calculate total with conversion
        const result = calculateServiceTotal(services, targetCurrency, rates);
        setTotal(result.total);
        setHasMixedCurrencies(result.hasMixedCurrencies);
        setLoading(false);
      } catch (error) {
        console.error('Failed to convert currencies:', error);
        // Fallback to simple sum without conversion
        const fallbackTotal = services.reduce((sum: number, service: any) => {
          return sum + (parseFloat(service.price) || 0);
        }, 0);
        setTotal(fallbackTotal);
        setHasMixedCurrencies(true);
        setLoading(false);
      }
    };

    calculateTotal();
  }, [services, serverTotal, serverCurrency]);

  if (loading) {
    return <span className="text-gray-400 text-sm">Calculating...</span>;
  }

  if (total === 0) {
    return <span className="text-gray-400 dark:text-gray-500 text-sm">No value</span>;
  }

  // Format the total value
  const formattedValue = formatCurrency(total, displayCurrency, numberFormat);

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {formattedValue}
      </span>
      {hasMixedCurrencies && (
        <span
          className="text-xs text-gray-500 dark:text-gray-400"
          title="Services use multiple currencies - converted to display currency"
        >
          {'\uD83D\uDCB1'}
        </span>
      )}
    </div>
  );
};

export default EstimatedValue;
