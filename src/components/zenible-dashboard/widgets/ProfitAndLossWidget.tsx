import React, { useState, useRef } from 'react';

import { ChartBarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { useCompanyCurrencies } from '../../../hooks/crm/useCompanyCurrencies';
import { formatCurrency } from '../../../utils/currency';
import { LoadingSpinner } from '../../shared';
import { useDashboardWidget } from '../../../contexts/DashboardDataContext';

interface ProfitAndLossWidgetProps {
  settings?: Record<string, any>;
}

interface HoveredBar {
  month: string;
  category: string;
  value: number;
  isPaid: boolean;
  x: number;
  y: number;
}

/**
 * Profit and Loss Widget for Dashboard
 * Shows revenue vs expenses with net profit/loss chart
 */
const ProfitAndLossWidget = ({ settings = {} }: ProfitAndLossWidgetProps) => {
  const { defaultCurrency } = useCompanyCurrencies();
  const { data: summary, isLoading: loading, error } = useDashboardWidget('profitAndLoss');
  const [hoveredBar, setHoveredBar] = useState<HoveredBar | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const periodMonths = settings.periodMonths || 12;
  const currency = defaultCurrency?.currency?.code || 'GBP';

  const periodData = summary?.by_period || [];

  // Get current month name and period key
  const now = new Date();
  const currentPeriodKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Use selected period or default to current month
  const displayPeriodKey = selectedPeriod || currentPeriodKey;

  // Get display month name from period key
  const getMonthName = (periodKey: string): string => {
    if (!periodKey) return '';
    const [year, month] = periodKey.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long' });
  };

  const displayMonthName = getMonthName(displayPeriodKey);

  // Get selected month's data from period data
  const displayMonthData = periodData.find((p: any) => p.period === displayPeriodKey) || {};

  // Revenue = paid invoices + unlinked payments (already reduced by credit notes on the backend)
  // Expenses = all expenses
  // Profit = revenue - expenses
  const revenue = parseFloat(displayMonthData?.income_total || 0);
  const expenses = parseFloat(displayMonthData?.expense_total || 0);
  const profit = revenue - expenses;

  // Format amount for Y-axis labels (compact)
  const formatAxisAmount = (value: number): string => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toFixed(0);
  };

  // Render SVG bar chart with axes
  const renderChart = () => {
    const data = periodData.slice(-periodMonths);
    if (data.length === 0) return null;

    // Calculate max value considering total bars (paid + unpaid)
    const maxValue = Math.max(
      ...data.map((d: any) => {
        const totalIncome = parseFloat(d.income_total || 0) +
                           parseFloat(d.outstanding_invoices || 0);
        const totalExpenses = parseFloat(d.paid_expenses || d.expense_total || 0) +
                             parseFloat(d.unpaid_expenses || 0);
        return Math.max(totalIncome, totalExpenses);
      })
    );

    if (maxValue === 0) return null;

    // Chart dimensions
    const width = 320;
    const height = 120;
    const paddingLeft = 40;
    const paddingRight = 10;
    const paddingTop = 10;
    const paddingBottom = 25;
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Calculate bar dimensions
    const barGroupWidth = chartWidth / data.length;
    const groupPadding = 6;
    const barGap = 3;
    const availableWidth = barGroupWidth - groupPadding;
    const barWidth = Math.max(3, (availableWidth - barGap) / 2.5);

    // Y-axis values (0, mid, max)
    const yLabels = [
      { value: maxValue, y: paddingTop },
      { value: maxValue / 2, y: paddingTop + chartHeight / 2 },
      { value: 0, y: paddingTop + chartHeight },
    ];

    // Handle bar hover
    const handleBarHover = (e: React.MouseEvent, monthData: any, category: string, value: number, isPaid: boolean) => {
      if (!chartRef.current) return;
      const rect = chartRef.current.getBoundingClientRect();

      let monthName = '';
      if (monthData.period) {
        const [year, m] = monthData.period.split('-');
        monthName = new Date(parseInt(year), parseInt(m) - 1).toLocaleDateString('en-US', { month: 'long' });
      }

      setHoveredBar({
        month: monthName,
        category,
        value,
        isPaid,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    return (
      <div className="relative h-full" ref={chartRef}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          onMouseLeave={() => setHoveredBar(null)}
        >
          {/* Grid lines */}
          {yLabels.map((label, i) => (
            <line
              key={i}
              x1={paddingLeft}
              y1={label.y}
              x2={width - paddingRight}
              y2={label.y}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray={i === yLabels.length - 1 ? "0" : "2,2"}
            />
          ))}

          {/* Y-axis labels */}
          {yLabels.map((label, i) => (
            <text
              key={i}
              x={paddingLeft - 5}
              y={label.y + 4}
              textAnchor="end"
              className="text-[9px] fill-gray-400"
            >
              {formatAxisAmount(label.value)}
            </text>
          ))}

          {/* Bars and X-axis labels */}
          {data.map((month: any, i: number) => {
            const paidIncome = parseFloat(month.income_total || 0);
            const unpaidIncome = parseFloat(month.outstanding_invoices || 0);
            const paidExpenses = parseFloat(month.paid_expenses || month.expense_total || 0);
            const unpaidExpenses = parseFloat(month.unpaid_expenses || 0);

            const paidIncomeHeight = (paidIncome / maxValue) * chartHeight;
            const unpaidIncomeHeight = (unpaidIncome / maxValue) * chartHeight;
            const totalIncomeHeight = paidIncomeHeight + unpaidIncomeHeight;

            const paidExpenseHeight = (paidExpenses / maxValue) * chartHeight;
            const unpaidExpenseHeight = (unpaidExpenses / maxValue) * chartHeight;
            const totalExpenseHeight = paidExpenseHeight + unpaidExpenseHeight;

            const groupX = paddingLeft + i * barGroupWidth + (barGroupWidth - barWidth * 2 - barGap) / 2;

            let monthLabel = '';
            if (month.period) {
              const [year, m] = month.period.split('-');
              monthLabel = new Date(parseInt(year), parseInt(m) - 1).toLocaleDateString('en-US', { month: 'short' });
            }

            return (
              <g key={i}>
                {unpaidIncome > 0 && (
                  <rect
                    x={groupX}
                    y={paddingTop + chartHeight - totalIncomeHeight}
                    width={barWidth}
                    height={Math.max(unpaidIncomeHeight, 2)}
                    className="fill-gray-300 hover:fill-gray-400 transition-colors duration-200 cursor-pointer"
                    rx="1"
                    onClick={() => setSelectedPeriod(month.period)}
                    onMouseEnter={(e) => handleBarHover(e, month, 'Income', unpaidIncome, false)}
                    onMouseMove={(e) => handleBarHover(e, month, 'Income', unpaidIncome, false)}
                    onMouseLeave={() => setHoveredBar(null)}
                  />
                )}

                {paidIncome > 0 && (
                  <rect
                    x={groupX}
                    y={paddingTop + chartHeight - paidIncomeHeight}
                    width={barWidth}
                    height={Math.max(paidIncomeHeight, 2)}
                    className="fill-green-200 hover:fill-green-500 transition-colors duration-200 cursor-pointer"
                    rx="1"
                    onClick={() => setSelectedPeriod(month.period)}
                    onMouseEnter={(e) => handleBarHover(e, month, 'Income', paidIncome, true)}
                    onMouseMove={(e) => handleBarHover(e, month, 'Income', paidIncome, true)}
                    onMouseLeave={() => setHoveredBar(null)}
                  />
                )}

                {unpaidExpenses > 0 && (
                  <rect
                    x={groupX + barWidth + barGap}
                    y={paddingTop + chartHeight - totalExpenseHeight}
                    width={barWidth}
                    height={Math.max(unpaidExpenseHeight, 2)}
                    className="fill-gray-300 hover:fill-gray-400 transition-colors duration-200 cursor-pointer"
                    rx="1"
                    onClick={() => setSelectedPeriod(month.period)}
                    onMouseEnter={(e) => handleBarHover(e, month, 'Expenses', unpaidExpenses, false)}
                    onMouseMove={(e) => handleBarHover(e, month, 'Expenses', unpaidExpenses, false)}
                    onMouseLeave={() => setHoveredBar(null)}
                  />
                )}

                {paidExpenses > 0 && (
                  <rect
                    x={groupX + barWidth + barGap}
                    y={paddingTop + chartHeight - paidExpenseHeight}
                    width={barWidth}
                    height={Math.max(paidExpenseHeight, 2)}
                    className="fill-red-200 hover:fill-red-500 transition-colors duration-200 cursor-pointer"
                    rx="1"
                    onClick={() => setSelectedPeriod(month.period)}
                    onMouseEnter={(e) => handleBarHover(e, month, 'Expenses', paidExpenses, true)}
                    onMouseMove={(e) => handleBarHover(e, month, 'Expenses', paidExpenses, true)}
                    onMouseLeave={() => setHoveredBar(null)}
                  />
                )}

                <text
                  x={groupX + barWidth + barGap / 2}
                  y={height - 8}
                  textAnchor="middle"
                  className="text-[8px] fill-gray-400"
                >
                  {monthLabel}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredBar && (
          <div
            className="absolute bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg pointer-events-none z-10"
            style={{
              left: Math.min(hoveredBar.x, (chartRef.current?.offsetWidth || hoveredBar.x) - 100),
              top: Math.max(hoveredBar.y - 70, 0),
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-medium text-gray-300">{hoveredBar.month}</div>
            <div className={`font-medium ${
              hoveredBar.isPaid
                ? (hoveredBar.category === 'Income' ? 'text-green-400' : 'text-red-400')
                : 'text-gray-400'
            }`}>
              {hoveredBar.category} ({hoveredBar.isPaid ? 'Paid' : 'Unpaid'})
            </div>
            <div className="font-bold text-white">{formatCurrency(hoveredBar.value, currency)}</div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner size="h-8 w-8" height="h-full min-h-[100px]" />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[100px] text-center">
        <ChartBarIcon className="w-12 h-12 text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">Failed to load data</p>
      </div>
    );
  }

  const isProfit = profit >= 0;

  return (
    <div className="flex flex-col h-full">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-2 mb-2">
        <div className="text-center">
          <p className="text-xs text-gray-500">{displayMonthName} Revenue</p>
          <p className="text-sm font-semibold text-green-600">
            {formatCurrency(revenue, currency)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">{displayMonthName} Expenses</p>
          <p className="text-sm font-semibold text-red-600">
            {formatCurrency(expenses, currency)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">{displayMonthName} Profit</p>
          <div className="flex items-center justify-center gap-1">
            {isProfit ? (
              <ArrowTrendingUpIcon className="w-3 h-3 text-green-600" />
            ) : (
              <ArrowTrendingDownIcon className="w-3 h-3 text-red-600" />
            )}
            <p className={`text-sm font-semibold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(profit), currency)}
            </p>
          </div>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Ratio</p>
          <p className={`text-sm font-semibold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
            {revenue === 0 && expenses === 0
              ? '0x'
              : expenses === 0
                ? '\u221e'
                : revenue === 0
                  ? '-\u221e'
                  : revenue >= expenses
                    ? `${(revenue / expenses).toFixed(1)}x`
                    : `-${(expenses / revenue).toFixed(1)}x`}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        {periodData.length > 0 ? (
          renderChart()
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <ChartBarIcon className="w-10 h-10 text-gray-300 mb-1" />
            <p className="text-xs text-gray-500">No data available</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 mt-2 flex-wrap">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-200 rounded" />
          <span className="text-[10px] text-gray-500">Income (Paid)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-red-200 rounded" />
          <span className="text-[10px] text-gray-500">Expenses (Paid)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-gray-300 rounded" />
          <span className="text-[10px] text-gray-500">Unpaid</span>
        </div>
      </div>

    </div>
  );
};

export default ProfitAndLossWidget;
