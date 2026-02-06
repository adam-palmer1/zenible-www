import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChartBarIcon, ArrowRightIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import reportsAPI from '../../../services/api/finance/reports';
import { useCompanyCurrencies } from '../../../hooks/crm/useCompanyCurrencies';
import { formatCurrency } from '../../../utils/currency';

/**
 * Profit and Loss Widget for Dashboard
 * Shows revenue vs expenses with net profit/loss chart
 *
 * Settings:
 * - periodMonths: Number of months to show (default: 12)
 */
const ProfitAndLossWidget = ({ settings = {} }) => {
  const navigate = useNavigate();
  const { defaultCurrency, loading: currencyLoading } = useCompanyCurrencies();
  const [summary, setSummary] = useState(null);
  const [periodData, setPeriodData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const chartRef = useRef(null);

  const periodMonths = settings.periodMonths || 12;
  const currency = defaultCurrency?.currency?.code || 'GBP';

  useEffect(() => {
    // Wait for company currency to load
    if (currencyLoading) {
      return;
    }

    const loadSummary = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await reportsAPI.getSummary({
          past_months: periodMonths,
        });

        setSummary(response);
        setPeriodData(response.by_period || []);
      } catch (err) {
        console.error('Failed to load P&L summary:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, [periodMonths, currencyLoading]);

  // Get current month name and period key
  const now = new Date();
  const currentPeriodKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Use selected period or default to current month
  const displayPeriodKey = selectedPeriod || currentPeriodKey;

  // Get display month name from period key
  const getMonthName = (periodKey) => {
    if (!periodKey) return '';
    const [year, month] = periodKey.split('-');
    return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long' });
  };

  const displayMonthName = getMonthName(displayPeriodKey);

  // Get selected month's data from period data
  const displayMonthData = periodData.find(p => p.period === displayPeriodKey) || {};

  // Revenue = payments received
  // Expenses = all expenses
  // Profit = revenue - expenses
  const revenue = parseFloat(displayMonthData?.payments_total || 0);
  const expenses = parseFloat(displayMonthData?.expense_total || 0);
  const profit = revenue - expenses;

  // Format amount for Y-axis labels (compact)
  const formatAxisAmount = (value) => {
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
      ...data.map(d => {
        // Total income = paid (payments received) + unpaid (outstanding invoices)
        const totalIncome = parseFloat(d.payments_total || d.paid_invoices_total || 0) +
                           parseFloat(d.outstanding_invoices || 0);
        // Total expenses = paid + unpaid
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
    const groupPadding = 6; // Gap between month groups
    const barGap = 3; // Gap between revenue and expense bars within a month
    const availableWidth = barGroupWidth - groupPadding;
    const barWidth = Math.max(3, (availableWidth - barGap) / 2.5); // Thinner bars

    // Y-axis values (0, mid, max)
    const yLabels = [
      { value: maxValue, y: paddingTop },
      { value: maxValue / 2, y: paddingTop + chartHeight / 2 },
      { value: 0, y: paddingTop + chartHeight },
    ];

    // Handle bar hover
    const handleBarHover = (e, monthData, category, value, isPaid) => {
      if (!chartRef.current) return;
      const rect = chartRef.current.getBoundingClientRect();

      // Get full month name
      let monthName = '';
      if (monthData.period) {
        const [year, m] = monthData.period.split('-');
        monthName = new Date(year, m - 1).toLocaleDateString('en-US', { month: 'long' });
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
      <div className="relative" ref={chartRef}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
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
          {data.map((month, i) => {
            // Income: paid (payments received) vs unpaid (outstanding)
            const paidIncome = parseFloat(month.payments_total || month.paid_invoices_total || 0);
            const unpaidIncome = parseFloat(month.outstanding_invoices || 0);
            const totalIncome = paidIncome + unpaidIncome;

            // Expenses: paid vs unpaid
            const paidExpenses = parseFloat(month.paid_expenses || month.expense_total || 0);
            const unpaidExpenses = parseFloat(month.unpaid_expenses || 0);
            const totalExpenses = paidExpenses + unpaidExpenses;

            // Calculate heights
            const paidIncomeHeight = (paidIncome / maxValue) * chartHeight;
            const unpaidIncomeHeight = (unpaidIncome / maxValue) * chartHeight;
            const totalIncomeHeight = paidIncomeHeight + unpaidIncomeHeight;

            const paidExpenseHeight = (paidExpenses / maxValue) * chartHeight;
            const unpaidExpenseHeight = (unpaidExpenses / maxValue) * chartHeight;
            const totalExpenseHeight = paidExpenseHeight + unpaidExpenseHeight;

            const groupX = paddingLeft + i * barGroupWidth + (barGroupWidth - barWidth * 2 - barGap) / 2;

            // Format month label
            let monthLabel = '';
            if (month.period) {
              const [year, m] = month.period.split('-');
              monthLabel = new Date(year, m - 1).toLocaleDateString('en-US', { month: 'short' });
            }

            return (
              <g key={i}>
                {/* Income bar - Unpaid portion (grey, on top) */}
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

                {/* Income bar - Paid portion (green, on bottom) */}
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

                {/* Expense bar - Unpaid portion (grey, on top) */}
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

                {/* Expense bar - Paid portion (red, on bottom) */}
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

                {/* X-axis label (month) */}
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
              left: Math.min(hoveredBar.x, chartRef.current?.offsetWidth - 100 || hoveredBar.x),
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

  const handleViewReports = () => navigate('/finance/reports');

  if (loading || currencyLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[100px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8e51ff]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[100px] text-center">
        <ChartBarIcon className="w-12 h-12 text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">{error}</p>
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
                ? '∞'
                : revenue === 0
                  ? '-∞'
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
