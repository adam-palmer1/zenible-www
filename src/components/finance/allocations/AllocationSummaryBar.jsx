import React, { useMemo } from 'react';
import { FolderKanban, Settings2 } from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';

/**
 * Color palette for project allocations
 * Each project gets a different color from this palette
 */
const PROJECT_COLORS = [
  { bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-100' },
  { bg: 'bg-blue-500', text: 'text-blue-700', light: 'bg-blue-100' },
  { bg: 'bg-purple-500', text: 'text-purple-700', light: 'bg-purple-100' },
  { bg: 'bg-amber-500', text: 'text-amber-700', light: 'bg-amber-100' },
  { bg: 'bg-rose-500', text: 'text-rose-700', light: 'bg-rose-100' },
  { bg: 'bg-cyan-500', text: 'text-cyan-700', light: 'bg-cyan-100' },
  { bg: 'bg-orange-500', text: 'text-orange-700', light: 'bg-orange-100' },
  { bg: 'bg-indigo-500', text: 'text-indigo-700', light: 'bg-indigo-100' },
];

/**
 * AllocationSummaryBar - Visual progress bar showing project allocations
 *
 * @param {Object} props
 * @param {Array} props.allocations - Array of { project_id, project_name, percentage, amount }
 * @param {number} props.totalAmount - Total entity amount for calculations
 * @param {string} props.currency - Currency code (e.g., 'GBP')
 * @param {Function} props.onManageClick - Callback when "Manage" button is clicked
 * @param {boolean} props.showManageButton - Whether to show the manage button
 * @param {boolean} props.compact - Use compact layout (for inline display)
 */
const AllocationSummaryBar = ({
  allocations = [],
  totalAmount = 0,
  currency = 'GBP',
  onManageClick,
  showManageButton = true,
  compact = false,
}) => {
  // Calculate totals
  const { totalPercentage, unallocatedPercentage, unallocatedAmount } = useMemo(() => {
    const total = allocations.reduce((sum, alloc) => sum + (parseFloat(alloc.percentage) || 0), 0);
    const unallocated = Math.max(0, 100 - total);
    const unallocatedAmt = (totalAmount * unallocated) / 100;
    return {
      totalPercentage: total,
      unallocatedPercentage: unallocated,
      unallocatedAmount: unallocatedAmt,
    };
  }, [allocations, totalAmount]);

  const isFullyAllocated = totalPercentage >= 100;
  const hasAllocations = allocations.length > 0;

  // Compact mode - just a simple bar with tooltip
  if (compact) {
    return (
      <div className="group relative">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          {allocations.map((alloc, index) => (
            <div
              key={alloc.project_id || index}
              className={`h-full inline-block ${PROJECT_COLORS[index % PROJECT_COLORS.length].bg}`}
              style={{ width: `${alloc.percentage}%` }}
            />
          ))}
        </div>

        {/* Tooltip on hover */}
        {hasAllocations && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
            {allocations.map((alloc, index) => (
              <div key={alloc.project_id || index} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${PROJECT_COLORS[index % PROJECT_COLORS.length].bg}`} />
                <span>{alloc.project_name}: {alloc.percentage}%</span>
              </div>
            ))}
            {unallocatedPercentage > 0 && (
              <div className="flex items-center gap-2 text-gray-400">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                <span>Unallocated: {unallocatedPercentage.toFixed(0)}%</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full mode - card with details
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FolderKanban className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Project Allocations
          </span>
        </div>
        {showManageButton && onManageClick && (
          <button
            onClick={onManageClick}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Manage
          </button>
        )}
      </div>

      {!hasAllocations ? (
        /* Empty state */
        <div className="text-center py-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Not allocated to any project
          </p>
          {showManageButton && onManageClick && (
            <button
              onClick={onManageClick}
              className="mt-2 text-sm text-zenible-primary hover:text-purple-600 font-medium"
            >
              + Add Project Allocation
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Progress Bar */}
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
            {allocations.map((alloc, index) => (
              <div
                key={alloc.project_id || index}
                className={`h-full inline-block ${PROJECT_COLORS[index % PROJECT_COLORS.length].bg} transition-all duration-300`}
                style={{ width: `${alloc.percentage}%` }}
                title={`${alloc.project_name}: ${alloc.percentage}%`}
              />
            ))}
          </div>

          {/* Allocation Details */}
          <div className="space-y-2">
            {allocations.map((alloc, index) => (
              <div
                key={alloc.project_id || index}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${PROJECT_COLORS[index % PROJECT_COLORS.length].bg}`}
                  />
                  <span className="text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                    {alloc.project_name || 'Unknown Project'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 dark:text-gray-400">
                    {alloc.percentage}%
                  </span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {formatCurrency(alloc.amount || (totalAmount * alloc.percentage / 100), currency)}
                  </span>
                </div>
              </div>
            ))}

            {/* Unallocated row */}
            {unallocatedPercentage > 0 && (
              <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600" />
                  <span className="text-gray-500 dark:text-gray-400">Unallocated</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">{unallocatedPercentage.toFixed(0)}%</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {formatCurrency(unallocatedAmount, currency)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Total Allocated
            </span>
            <span className={`text-sm font-bold ${isFullyAllocated ? 'text-green-600' : 'text-gray-700 dark:text-gray-300'}`}>
              {totalPercentage}% ({formatCurrency(totalAmount * totalPercentage / 100, currency)})
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default AllocationSummaryBar;
