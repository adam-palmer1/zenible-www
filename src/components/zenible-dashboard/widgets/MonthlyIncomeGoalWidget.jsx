import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrophyIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import reportsAPI from '../../../services/api/finance/reports';
import { useCompanyCurrencies } from '../../../hooks/crm/useCompanyCurrencies';
import { formatCurrency } from '../../../utils/currency';

/**
 * Monthly Income Goal Widget for Dashboard
 * Shows progress toward monthly income target
 * Uses transactions summary API for accurate multi-currency totals
 *
 * Settings:
 * - monthlyGoal: Target amount (default: 5000)
 * - currency: Currency code (defaults to company default currency)
 */
const MonthlyIncomeGoalWidget = ({ settings = {} }) => {
  const navigate = useNavigate();
  const { defaultCurrency: companyDefaultCurrency, loading: currencyLoading } = useCompanyCurrencies();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const monthlyGoal = settings.monthlyGoal || 5000;
  const currency = settings.currency || companyDefaultCurrency?.currency?.code || 'GBP';

  useEffect(() => {
    // Wait for company currency to load
    if (currencyLoading) {
      return;
    }

    const loadSummary = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current month date range
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const response = await reportsAPI.getSummary({
          start_date: startOfMonth.toISOString().split('T')[0],
          end_date: endOfMonth.toISOString().split('T')[0],
        });

        setSummary(response);
      } catch (err) {
        console.error('Failed to load income summary:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, [currencyLoading]);

  // Get income total from summary - the API returns totals converted to default currency
  const currentMonthIncome = parseFloat(summary?.income_total || 0);

  // Calculate percentage
  const percentage = monthlyGoal > 0 ? Math.min((currentMonthIncome / monthlyGoal) * 100, 100) : 0;
  const remaining = Math.max(monthlyGoal - currentMonthIncome, 0);
  const isGoalMet = currentMonthIncome >= monthlyGoal;

  // Get motivational message
  const getMessage = () => {
    if (isGoalMet) return "Goal achieved! Great work!";
    if (percentage >= 75) return "Almost there! Keep it up!";
    if (percentage >= 50) return "Halfway there!";
    if (percentage >= 25) return "Good progress!";
    return "Let's get started!";
  };

  // Get current month name
  const monthName = new Date().toLocaleDateString('en-US', { month: 'long' });

  const handleViewInvoices = () => navigate('/finance/invoices');

  if (loading || currencyLoading) {
    return (
      <div className="flex items-center justify-center h-[180px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8e51ff]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[180px] text-gray-500 text-sm">
        Failed to load income data
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[180px]">
      {/* Goal Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-gray-500">{monthName} Goal</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatCurrency(monthlyGoal, currency)}
          </p>
        </div>
        {isGoalMet && (
          <div className="p-2 bg-green-100 rounded-full">
            <TrophyIcon className="w-6 h-6 text-green-600" />
          </div>
        )}
      </div>

      {/* Progress Ring */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative">
          {/* Background ring */}
          <svg className="w-24 h-24 transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="#e5e7eb"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke={isGoalMet ? '#22c55e' : '#8e51ff'}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${percentage * 2.51} 251`}
              className="transition-all duration-500"
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className={`text-xl font-bold ${isGoalMet ? 'text-green-600' : 'text-gray-900'}`}>
              {Math.round(percentage)}%
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="ml-4">
          <p className="text-sm text-gray-600">
            <span className={`font-semibold ${isGoalMet ? 'text-green-600' : 'text-gray-900'}`}>
              {formatCurrency(currentMonthIncome, currency)}
            </span>
            <span className="text-gray-400"> earned</span>
          </p>
          {!isGoalMet && (
            <p className="text-xs text-gray-500 mt-1">
              {formatCurrency(remaining, currency)} to go
            </p>
          )}
          <p className="text-xs text-[#8e51ff] font-medium mt-2">
            {getMessage()}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={handleViewInvoices}
          className="w-full text-sm text-[#8e51ff] hover:text-[#7b3ff0] font-medium flex items-center justify-center gap-1"
        >
          View invoices
          <ArrowRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default MonthlyIncomeGoalWidget;
