import React, { useState, useEffect } from 'react';
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
 * - periodMonths: Number of months to show (default: 6)
 */
const ProfitAndLossWidget = ({ settings = {} }) => {
  const navigate = useNavigate();
  const { defaultCurrency, loading: currencyLoading } = useCompanyCurrencies();
  const [summary, setSummary] = useState(null);
  const [periodData, setPeriodData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const periodMonths = settings.periodMonths || 6;
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

        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - periodMonths);

        const response = await reportsAPI.getSummary({
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          group_by_period: 'month',
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

  // Get totals from summary
  const totals = {
    revenue: parseFloat(summary?.income_total || 0),
    expenses: parseFloat(summary?.expense_total || 0),
    net: parseFloat(summary?.net_amount || 0),
  };

  // Render mini bar chart
  const renderChart = () => {
    if (periodData.length === 0) return null;

    const maxValue = Math.max(
      ...periodData.map(d => Math.max(
        parseFloat(d.income_total || d.revenue || 0),
        parseFloat(d.expense_total || d.expenses || 0)
      ))
    );

    if (maxValue === 0) return null;

    return (
      <div className="flex items-end justify-between gap-1 h-16 mt-2">
        {periodData.slice(-periodMonths).map((month, i) => {
          const revenue = parseFloat(month.income_total || month.revenue || 0);
          const expenses = parseFloat(month.expense_total || month.expenses || 0);
          const revenueHeight = maxValue > 0 ? (revenue / maxValue) * 100 : 0;
          const expenseHeight = maxValue > 0 ? (expenses / maxValue) * 100 : 0;

          return (
            <div key={i} className="flex-1 flex items-end gap-0.5">
              <div
                className="flex-1 bg-green-400 rounded-t transition-all"
                style={{ height: `${revenueHeight}%`, minHeight: revenueHeight > 0 ? '4px' : '0' }}
                title={`Revenue: ${formatCurrency(revenue, currency)}`}
              />
              <div
                className="flex-1 bg-red-400 rounded-t transition-all"
                style={{ height: `${expenseHeight}%`, minHeight: expenseHeight > 0 ? '4px' : '0' }}
                title={`Expenses: ${formatCurrency(expenses, currency)}`}
              />
            </div>
          );
        })}
      </div>
    );
  };

  // Format month labels
  const getMonthLabels = () => {
    return periodData.slice(-periodMonths).map(d => {
      if (!d.period) return '';
      const [year, month] = d.period.split('-');
      return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short' });
    });
  };

  const handleViewReports = () => navigate('/finance/reports');

  if (loading || currencyLoading) {
    return (
      <div className="flex items-center justify-center h-[180px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8e51ff]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[180px] text-center">
        <ChartBarIcon className="w-12 h-12 text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  const isProfit = totals.net >= 0;

  return (
    <div className="flex flex-col h-[180px]">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <div className="text-center">
          <p className="text-xs text-gray-500">Revenue</p>
          <p className="text-sm font-semibold text-green-600">
            {formatCurrency(totals.revenue, currency)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Expenses</p>
          <p className="text-sm font-semibold text-red-600">
            {formatCurrency(totals.expenses, currency)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Net</p>
          <div className="flex items-center justify-center gap-1">
            {isProfit ? (
              <ArrowTrendingUpIcon className="w-3 h-3 text-green-600" />
            ) : (
              <ArrowTrendingDownIcon className="w-3 h-3 text-red-600" />
            )}
            <p className={`text-sm font-semibold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(totals.net), currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1">
        {periodData.length > 0 ? (
          <>
            {renderChart()}
            <div className="flex justify-between mt-1 px-1">
              {getMonthLabels().map((label, i) => (
                <span key={i} className="text-[10px] text-gray-400 flex-1 text-center">
                  {label}
                </span>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <ChartBarIcon className="w-10 h-10 text-gray-300 mb-1" />
            <p className="text-xs text-gray-500">No data available</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-400 rounded" />
          <span className="text-xs text-gray-500">Revenue</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-red-400 rounded" />
          <span className="text-xs text-gray-500">Expenses</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-2 pt-2 border-t border-gray-100">
        <button
          onClick={handleViewReports}
          className="w-full text-sm text-[#8e51ff] hover:text-[#7b3ff0] font-medium flex items-center justify-center gap-1"
        >
          View full report
          <ArrowRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ProfitAndLossWidget;
