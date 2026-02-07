import React from 'react';
import { PieChart } from 'lucide-react';

const ENTITY_COLORS: Record<string, { bg: string; text: string; light: string }> = {
  invoice: { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-100' },
  project: { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-100' },
  payment: { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-100' },
  contact: { bg: 'bg-purple-500', text: 'text-purple-600', light: 'bg-purple-100' },
};

interface ExpenseAllocationBarProps {
  totalPercentage?: number;
  allocations?: any[];
  compact?: boolean;
  showLabel?: boolean;
  showTooltip?: boolean;
  onClick?: (e?: React.MouseEvent) => void;
}

const ExpenseAllocationBar: React.FC<ExpenseAllocationBarProps> = ({
  totalPercentage = 0,
  allocations = [],
  compact = false,
  showLabel = true,
  showTooltip = true,
  onClick,
}) => {
  const total = parseFloat(String(totalPercentage)) || 0;
  const isFullyAllocated = total >= 100;
  const hasAllocations = total > 0;
  const barHeight = compact ? 'h-1.5' : 'h-2';

  const allocationsByType = allocations.reduce((acc: Record<string, { percentage: number; count: number }>, alloc: any) => {
    const type = alloc.entity_type;
    if (!acc[type]) {
      acc[type] = { percentage: 0, count: 0 };
    }
    acc[type].percentage += parseFloat(alloc.percentage) || 0;
    acc[type].count += 1;
    return acc;
  }, {});

  const segments = Object.entries(allocationsByType).map(([type, data]) => ({
    type,
    percentage: (data as any).percentage,
    count: (data as any).count,
    color: ENTITY_COLORS[type]?.bg || 'bg-gray-500',
  }));

  return (
    <div
      className={`group relative ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick as any}
      title={showTooltip ? `${total.toFixed(0)}% allocated` : undefined}
    >
      <div className="flex items-center gap-2">
        <div className={`flex-1 ${barHeight} bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}>
          {hasAllocations ? (
            <div className="h-full flex">
              {segments.map((segment) => (
                <div
                  key={segment.type}
                  className={`${segment.color} transition-all duration-300`}
                  style={{ width: `${segment.percentage}%` }}
                />
              ))}
            </div>
          ) : (
            <div className="h-full w-0" />
          )}
        </div>

        {showLabel && (
          <span
            className={`text-xs font-medium whitespace-nowrap ${
              isFullyAllocated
                ? 'text-green-600 dark:text-green-400'
                : hasAllocations
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            {total.toFixed(0)}%
          </span>
        )}
      </div>

      {showTooltip && hasAllocations && (
        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10">
          <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg py-2 px-3 shadow-lg min-w-[140px]">
            <div className="font-medium mb-1.5">Allocation Breakdown</div>
            {segments.map((segment) => (
              <div key={segment.type} className="flex items-center justify-between gap-3 py-0.5">
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${segment.color}`} />
                  <span className="capitalize">{segment.type}s</span>
                </div>
                <span className="font-medium">{segment.percentage.toFixed(0)}%</span>
              </div>
            ))}
            <div className="border-t border-gray-700 dark:border-gray-600 mt-1.5 pt-1.5 flex justify-between">
              <span>Total</span>
              <span className="font-medium">{total.toFixed(0)}%</span>
            </div>
            <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
          </div>
        </div>
      )}
    </div>
  );
};

interface ExpenseAllocationBadgeProps {
  totalPercentage?: number;
  onClick?: () => void;
}

export const ExpenseAllocationBadge: React.FC<ExpenseAllocationBadgeProps> = ({ totalPercentage = 0, onClick }) => {
  const total = parseFloat(String(totalPercentage)) || 0;
  const isFullyAllocated = total >= 100;
  const hasAllocations = total > 0;

  if (!hasAllocations) {
    return (
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <PieChart className="h-3 w-3" />
        Allocate
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded transition-colors ${
        isFullyAllocated
          ? 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50'
          : 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50'
      }`}
    >
      <PieChart className="h-3 w-3" />
      {total.toFixed(0)}%
    </button>
  );
};

export default ExpenseAllocationBar;
