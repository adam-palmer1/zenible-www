import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Clock } from 'lucide-react';
import KPICard from '../shared/KPICard';
import { useReports } from '../../../contexts/ReportsContext';

/**
 * Format currency value with symbol
 */
const formatCurrency = (value, currencySymbol = '$') => {
  const num = parseFloat(value) || 0;
  return `${currencySymbol}${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Format currency breakdown array into a subtitle string
 * e.g., "£507.00 + $246.00"
 * Only returns a string if there are 2+ currencies
 */
const formatCurrencyBreakdown = (currencyArray) => {
  if (!currencyArray || currencyArray.length <= 1) return null;

  return currencyArray
    .map((item) => {
      const symbol = item.currency_symbol || '$';
      const amount = parseFloat(item.total_amount || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return `${symbol}${amount}`;
    })
    .join(' + ');
};

/**
 * Transaction Summary KPI Cards
 * Displays: Total Income, Total Expenses, Net Amount, Outstanding
 * Shows main total in default currency with breakdown subtitle when multiple currencies exist
 */
const TransactionSummaryCards = () => {
  const { summary, summaryLoading } = useReports();

  if (summaryLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white border border-[#e5e5e5] rounded-xl p-4 h-[88px] animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
            <div className="h-6 bg-gray-200 rounded w-32" />
          </div>
        ))}
      </div>
    );
  }

  // Get default currency symbol (fallback to $)
  const defaultSymbol = summary?.default_currency?.symbol || '$';

  // Main totals (in default currency)
  const incomeTotal = summary?.income_total || '0';
  const expenseTotal = summary?.expense_total || '0';
  const netAmount = summary?.net_amount || '0';
  const outstanding = summary?.outstanding_invoices || '0';
  const overdueCount = summary?.overdue_count || 0;

  // Currency breakdowns (for subtitle display)
  const incomeBreakdown = formatCurrencyBreakdown(summary?.income_by_currency);
  const expenseBreakdown = formatCurrencyBreakdown(summary?.expense_by_currency);
  const outstandingBreakdown = formatCurrencyBreakdown(summary?.outstanding_by_currency);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        title="Total Income"
        value={formatCurrency(incomeTotal, defaultSymbol)}
        subtitle={incomeBreakdown}
        icon={TrendingUp}
        iconColor="green"
      />
      <KPICard
        title="Total Expenses"
        value={formatCurrency(expenseTotal, defaultSymbol)}
        subtitle={expenseBreakdown}
        icon={TrendingDown}
        iconColor="red"
      />
      <KPICard
        title="Net Amount"
        value={formatCurrency(netAmount, defaultSymbol)}
        icon={DollarSign}
        iconColor={parseFloat(netAmount) >= 0 ? 'green' : 'red'}
      />
      <KPICard
        title="Outstanding"
        value={
          <span>
            {formatCurrency(outstanding, defaultSymbol)}
            {overdueCount > 0 && (
              <span className="text-sm text-[#71717a] ml-1">
                ({overdueCount} overdue)
              </span>
            )}
          </span>
        }
        subtitle={outstandingBreakdown}
        icon={Clock}
        iconColor="yellow"
      />
    </div>
  );
};

export default TransactionSummaryCards;
