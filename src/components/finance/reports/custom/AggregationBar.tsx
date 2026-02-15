import React from 'react';
import { Hash, DollarSign, TrendingUp, Calculator } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import type { LucideIcon } from 'lucide-react';

interface AggregationBarProps {
  aggregations: Record<string, unknown>;
}

const AGGREGATION_CONFIG: Record<string, { label: string; icon: LucideIcon; iconColor: string; format: 'number' | 'currency' }> = {
  count: { label: 'Count', icon: Hash, iconColor: 'text-blue-600', format: 'number' },
  sum_total: { label: 'Total', icon: DollarSign, iconColor: 'text-green-600', format: 'currency' },
  sum_amount: { label: 'Amount', icon: DollarSign, iconColor: 'text-green-600', format: 'currency' },
  sum_subtotal: { label: 'Subtotal', icon: DollarSign, iconColor: 'text-teal-600', format: 'currency' },
  sum_tax: { label: 'Tax', icon: Calculator, iconColor: 'text-orange-600', format: 'currency' },
  avg_total: { label: 'Avg Total', icon: TrendingUp, iconColor: 'text-purple-600', format: 'currency' },
  avg_amount: { label: 'Avg Amount', icon: TrendingUp, iconColor: 'text-purple-600', format: 'currency' },
  sum_hours: { label: 'Hours', icon: Hash, iconColor: 'text-yellow-600', format: 'number' },
  avg_rate: { label: 'Avg Rate', icon: TrendingUp, iconColor: 'text-indigo-600', format: 'currency' },
};

const AggregationBar: React.FC<AggregationBarProps> = ({ aggregations }) => {
  const entries = Object.entries(aggregations).filter(
    ([, value]) => value !== null && value !== undefined
  );

  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3 mb-4">
      {entries.map(([key, value]) => {
        const config = AGGREGATION_CONFIG[key];
        const Icon = config?.icon || Hash;
        const iconColor = config?.iconColor || 'text-gray-600';
        const label = config?.label || key.replace(/_/g, ' ');
        const formattedValue =
          config?.format === 'currency'
            ? formatCurrency(value as number)
            : typeof value === 'number'
              ? value.toLocaleString()
              : String(value);

        return (
          <div
            key={key}
            className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2"
          >
            <Icon className={`w-4 h-4 ${iconColor}`} />
            <div>
              <div className="text-xs text-[#71717a]">{label}</div>
              <div className="text-sm font-semibold text-[#09090b]">{formattedValue}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AggregationBar;
