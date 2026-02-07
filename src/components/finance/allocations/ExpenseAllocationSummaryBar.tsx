import React, { useMemo, useEffect, useState } from 'react';
import { Receipt, Settings2, Loader2 } from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';
import expensesAPI from '../../../services/api/finance/expenses';

/**
 * Color palette for expense allocations
 * Each expense gets a different color from this palette
 */
const EXPENSE_COLORS = [
  { bg: 'bg-amber-500', text: 'text-amber-700', light: 'bg-amber-100' },
  { bg: 'bg-rose-500', text: 'text-rose-700', light: 'bg-rose-100' },
  { bg: 'bg-cyan-500', text: 'text-cyan-700', light: 'bg-cyan-100' },
  { bg: 'bg-violet-500', text: 'text-violet-700', light: 'bg-violet-100' },
  { bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-100' },
  { bg: 'bg-blue-500', text: 'text-blue-700', light: 'bg-blue-100' },
  { bg: 'bg-orange-500', text: 'text-orange-700', light: 'bg-orange-100' },
  { bg: 'bg-pink-500', text: 'text-pink-700', light: 'bg-pink-100' },
];

interface ExpenseAllocationSummaryBarProps {
  entityType: string;
  entityId: string | number;
  totalAmount?: number;
  currency?: string;
  onManageClick?: () => void;
  showManageButton?: boolean;
  compact?: boolean;
  refreshKey?: number;
}

const ExpenseAllocationSummaryBar: React.FC<ExpenseAllocationSummaryBarProps> = ({
  entityType,
  entityId,
  totalAmount = 0,
  currency = 'GBP',
  onManageClick,
  showManageButton = true,
  compact = false,
  refreshKey = 0,
}) => {
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch expenses allocated to this entity
  useEffect(() => {
    const fetchAllocations = async () => {
      if (!entityType || !entityId) return;

      try {
        setLoading(true);
        const response = await (expensesAPI as any).getExpensesByEntity(entityType, entityId);
        // The API returns expenses that have allocations to this entity (allocations included)
        // We need to extract the allocation details from each expense
        const expenses = response.items || response.data || response.expenses || response || [];

        // Transform the data - each expense has an allocations array
        // We need to find the allocation that matches this entity
        const expenseAllocations = expenses.map((expense: any) => {
          // Find the allocation for this specific entity
          const allocation = expense.allocations?.find(
            (a: any) => a.entity_type === entityType && String(a.entity_id) === String(entityId)
          );

          const percentage = parseFloat(allocation?.percentage || 0);
          const expenseAmount = parseFloat(expense.amount) || 0;
          // Use allocation amount directly from API response
          const allocatedAmount = parseFloat(allocation?.amount) || (expenseAmount * percentage) / 100;

          // Get display name: vendor name > category name > expense number
          const vendor = expense.vendor;
          const vendorName = vendor
            ? (vendor.first_name || vendor.last_name
                ? `${vendor.first_name || ''} ${vendor.last_name || ''}`.trim()
                : vendor.business_name)
            : null;
          const displayName = vendorName || expense.expense_category?.full_name || expense.expense_number;

          return {
            expense_id: expense.id,
            expense_number: expense.expense_number,
            description: expense.description,
            vendor_name: vendorName,
            category_name: expense.expense_category?.full_name,
            display_name: displayName,
            percentage,
            amount: allocatedAmount,
            total_expense_amount: expenseAmount,
          };
        }).filter((a: any) => a.percentage > 0);

        setAllocations(expenseAllocations);
      } catch (err) {
        console.error('Error fetching expense allocations:', err);
        setAllocations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllocations();
  }, [entityType, entityId, refreshKey]);

  // Calculate totals
  const { totalAllocatedAmount } = useMemo(() => {
    const allocatedSum = allocations.reduce((sum: number, alloc: any) => sum + (alloc.amount || 0), 0);
    // Calculate what percentage of the entity's amount these expenses represent
    const percentOfEntity = totalAmount > 0 ? (allocatedSum / totalAmount) * 100 : 0;
    return {
      totalAllocatedAmount: allocatedSum,
      totalPercentageOfEntity: Math.min(percentOfEntity, 100),
    };
  }, [allocations, totalAmount]);

  const hasAllocations = allocations.length > 0;

  // Compact mode - just a simple bar with tooltip
  if (compact) {
    // For compact mode with multiple allocations, show average allocation percentage
    const avgPercentage = allocations.length > 0
      ? allocations.reduce((sum: number, a: any) => sum + a.percentage, 0) / allocations.length
      : 0;

    return (
      <div className="group relative">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          {loading ? (
            <div className="h-full w-full bg-gray-300 dark:bg-gray-600 animate-pulse" />
          ) : (
            <div
              className={`h-full ${EXPENSE_COLORS[0].bg}`}
              style={{ width: `${avgPercentage}%` }}
            />
          )}
        </div>

        {/* Tooltip on hover */}
        {hasAllocations && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
            {allocations.map((alloc: any, index: number) => (
              <div key={alloc.expense_id || index} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${EXPENSE_COLORS[index % EXPENSE_COLORS.length].bg}`} />
                <span>{alloc.display_name || 'Expense'}: {formatCurrency(alloc.amount, currency)} ({alloc.percentage}%)</span>
              </div>
            ))}
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
          <Receipt className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Expense Allocations
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

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      ) : !hasAllocations ? (
        /* Empty state */
        <div className="text-center py-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No expenses allocated
          </p>
          {showManageButton && onManageClick && (
            <button
              onClick={onManageClick}
              className="mt-2 text-sm text-zenible-primary hover:text-purple-600 font-medium"
            >
              + Assign Expenses
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Allocation Details with Progress Bars */}
          <div className="space-y-3">
            {allocations.map((alloc: any, index: number) => (
              <div key={alloc.expense_id || index}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-3 h-3 rounded-full flex-shrink-0 ${EXPENSE_COLORS[index % EXPENSE_COLORS.length].bg}`}
                    />
                    <span className="text-gray-700 dark:text-gray-300 font-medium truncate">
                      {alloc.display_name || 'Expense'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                    <span className="text-gray-500 dark:text-gray-400">
                      {alloc.percentage}%
                    </span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {formatCurrency(alloc.amount, currency)}
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${EXPENSE_COLORS[index % EXPENSE_COLORS.length].bg} transition-all duration-300`}
                    style={{ width: `${alloc.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Total Expenses
            </span>
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
              {formatCurrency(totalAllocatedAmount, currency)}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default ExpenseAllocationSummaryBar;
