import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Clock } from 'lucide-react';
import KPICard from '../shared/KPICard';
import { useReportsSummaryContext } from '../../../contexts/ReportsSummaryContext';
import { useCompanyCurrencies } from '../../../hooks/crm/useCompanyCurrencies';

/**
 * Format currency value with symbol
 */
const formatCurrency = (value: any, currencySymbol: string = '$'): string => {
  const num = parseFloat(value) || 0;
  return `${currencySymbol}${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Format currency breakdown array into a subtitle string
 * e.g., "£507.00 + $246.00"
 * Shows when 2+ currencies exist, or when a single currency differs from the default
 */
const formatCurrencyBreakdown = (currencyArray: any[], defaultCurrencyCode?: string): string | null => {
  if (!currencyArray || currencyArray.length === 0) return null;

  // Show breakdown if 2+ currencies, or if single currency differs from default
  if (currencyArray.length === 1) {
    const onlyCode = currencyArray[0]?.currency_code;
    if (!defaultCurrencyCode || onlyCode === defaultCurrencyCode) return null;
  }

  return currencyArray
    .map((item: any) => {
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
 * Combine two currency breakdown arrays by currency_code, summing total_amount.
 */
const combineByC = (a: any[], b: any[]): any[] => {
  const map: Record<string, { total_amount: number; currency_symbol: string; currency_code: string }> = {};

  for (const item of (a || [])) {
    const code = item.currency_code;
    if (!code) continue;
    if (!map[code]) map[code] = { total_amount: 0, currency_symbol: item.currency_symbol || '$', currency_code: code };
    map[code].total_amount += parseFloat(item.total_amount || 0);
  }

  for (const item of (b || [])) {
    const code = item.currency_code;
    if (!code) continue;
    if (!map[code]) map[code] = { total_amount: 0, currency_symbol: item.currency_symbol || '$', currency_code: code };
    map[code].total_amount += parseFloat(item.total_amount || 0);
  }

  return Object.values(map);
};

/**
 * Compute net amount breakdown per currency from income and expense breakdowns.
 * For each currency: net = income - expense. Only shows if 2+ currencies exist.
 */
const computeNetBreakdown = (incomeByC: any[], expenseByC: any[], defaultCurrencyCode?: string): string | null => {
  const currencyMap: Record<string, { net: number; symbol: string; code: string }> = {};

  for (const item of (incomeByC || [])) {
    const code = item.currency_code;
    if (!code) continue;
    if (!currencyMap[code]) currencyMap[code] = { net: 0, symbol: item.currency_symbol || '$', code };
    currencyMap[code].net += parseFloat(item.total_amount || 0);
  }

  for (const item of (expenseByC || [])) {
    const code = item.currency_code;
    if (!code) continue;
    if (!currencyMap[code]) currencyMap[code] = { net: 0, symbol: item.currency_symbol || '$', code };
    currencyMap[code].net -= parseFloat(item.total_amount || 0);
  }

  const entries = Object.values(currencyMap);
  // Show if 2+ currencies, or single currency differs from default
  if (entries.length === 0) return null;
  if (entries.length === 1 && (!defaultCurrencyCode || entries[0].code === defaultCurrencyCode)) return null;

  return entries
    .map(({ net, symbol }) => {
      const formatted = Math.abs(net).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return net < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
    })
    .join(' + ');
};

/**
 * Transaction Summary KPI Cards
 * Displays: Total Income, Total Expenses, Net Amount, Outstanding
 * Shows main total in default currency with breakdown subtitle when multiple currencies exist
 */
const TransactionSummaryCards: React.FC = () => {
  const { summary, summaryLoading } = useReportsSummaryContext();
  const { defaultCurrency } = useCompanyCurrencies();

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

  // Get default currency info from backend summary or company settings
  const defaultSymbol = summary?.default_currency?.symbol || defaultCurrency?.currency?.symbol || '$';
  const defaultCode = summary?.default_currency?.code || defaultCurrency?.currency?.code || '';

  // Main totals (in default currency)
  // Total Income = paid_invoices_total + unlinked_payments_total (matches P&L widget formula)
  const paidInvoicesTotal = parseFloat(String(summary?.paid_invoices_total || '0'));
  const unlinkedPaymentsTotal = parseFloat(String(summary?.unlinked_payments_total || '0'));
  const incomeTotal = paidInvoicesTotal + unlinkedPaymentsTotal;
  const expenseTotal = summary?.expense_total || '0';
  const netAmount = incomeTotal - parseFloat(String(expenseTotal) || '0');
  const outstanding = summary?.outstanding_invoices || '0';
  const overdueCount = summary?.overdue_count || 0;

  // Currency breakdowns (for subtitle display)
  // Show breakdown when 2+ currencies, or single currency differs from default
  const combinedIncomeByC = combineByC(
    summary?.paid_invoices_by_currency || [],
    summary?.unlinked_payments_by_currency || []
  );
  const incomeBreakdown = formatCurrencyBreakdown(combinedIncomeByC, defaultCode);
  const expenseBreakdown = formatCurrencyBreakdown(summary?.expense_by_currency || [], defaultCode);
  const netBreakdown = computeNetBreakdown(combinedIncomeByC, summary?.expense_by_currency || [], defaultCode);
  const outstandingBreakdown = formatCurrencyBreakdown(summary?.outstanding_by_currency || [], defaultCode);

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
        subtitle={netBreakdown}
        icon={DollarSign}
        iconColor={parseFloat(String(netAmount)) >= 0 ? 'green' : 'red'}
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
