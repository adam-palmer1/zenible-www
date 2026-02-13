import React, { useState, useEffect } from 'react';
import { TrophyIcon } from '@heroicons/react/24/outline';
import reportsAPI from '../../../services/api/finance/reports';
import { useCompanyCurrencies } from '../../../hooks/crm/useCompanyCurrencies';
import { formatCurrency } from '../../../utils/currency';
import { LoadingSpinner } from '../../shared';

interface MonthlyIncomeGoalWidgetProps {
  settings?: Record<string, any>;
}

/**
 * Monthly Income Goal Widget for Dashboard
 * Shows progress toward monthly income target with two-segment ring
 */
const MonthlyIncomeGoalWidget = ({ settings = {} }: MonthlyIncomeGoalWidgetProps) => {
  const { defaultCurrency: companyDefaultCurrency, loading: currencyLoading } = useCompanyCurrencies();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveringOutstanding, setHoveringOutstanding] = useState(false);

  const monthlyGoal = settings.monthlyGoal || 5000;
  const currency = settings.currency || companyDefaultCurrency?.currency?.code || 'GBP';

  useEffect(() => {
    if (currencyLoading) {
      return;
    }

    const loadSummary = async () => {
      try {
        setLoading(true);
        setError(null);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const response = await reportsAPI.getSummary({
          start_date: startOfMonth.toISOString().split('T')[0],
          end_date: endOfMonth.toISOString().split('T')[0],
        });

        setSummary(response);
      } catch (err: any) {
        console.error('Failed to load income summary:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, [currencyLoading]);

  // Get values from summary
  const paymentsCollected = parseFloat(summary?.income_total || 0);
  const outstandingInvoices = parseFloat(summary?.outstanding_invoices || 0);
  const totalWithOutstanding = paymentsCollected + outstandingInvoices;

  // Calculate percentages for the ring segments
  const circumference = 2 * Math.PI * 40; // ~251
  const paymentsPercent = monthlyGoal > 0 ? Math.min((paymentsCollected / monthlyGoal) * 100, 100) : 0;
  const outstandingPercent = monthlyGoal > 0 ? Math.min((outstandingInvoices / monthlyGoal) * 100, 100 - paymentsPercent) : 0;

  // Dash arrays for segments
  const paymentsDash = (paymentsPercent / 100) * circumference;
  const outstandingDash = (outstandingPercent / 100) * circumference;
  const outstandingDashOffset = -paymentsDash;

  // Display percentage based on hover
  const displayPercent = hoveringOutstanding
    ? Math.min(((paymentsCollected + outstandingInvoices) / monthlyGoal) * 100, 100)
    : paymentsPercent;

  const isGoalMet = paymentsCollected >= monthlyGoal;
  const remaining = Math.max(monthlyGoal - (hoveringOutstanding ? totalWithOutstanding : paymentsCollected), 0);

  // Get motivational message based on percentage
  const getMessage = () => {
    if (displayPercent >= 100) return "Outstanding work!";
    if (displayPercent >= 90) return "Almost at the finish line!";
    if (displayPercent >= 75) return "Almost there!";
    if (displayPercent >= 66) return "Making great progress!";
    if (displayPercent >= 51) return "Past half way!";
    if (displayPercent === 50) return "Half way there!";
    if (displayPercent >= 31) return "Nearly half way!";
    if (displayPercent >= 11) return "Great progress!";
    if (displayPercent >= 1) return "Off to a great start!";
    return "Let's get started!";
  };

  const monthName = new Date().toLocaleDateString('en-US', { month: 'long' });

  if (loading || currencyLoading) {
    return <LoadingSpinner size="h-8 w-8" height="h-full min-h-[100px]" />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[100px] text-gray-500 text-sm">
        Failed to load income data
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
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
          <svg className="w-24 h-24 transform -rotate-90">
            {/* Background ring */}
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="#e5e7eb"
              strokeWidth="8"
              fill="none"
            />
            {/* Payments collected segment (dark purple) */}
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke={isGoalMet ? '#22c55e' : '#8e51ff'}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${paymentsDash} ${circumference}`}
              className="transition-all duration-500"
            />
            {/* Outstanding invoices segment (light purple) */}
            {outstandingInvoices > 0 && (
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke={hoveringOutstanding ? '#8e51ff' : '#c4a5ff'}
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${outstandingDash} ${circumference}`}
                strokeDashoffset={outstandingDashOffset}
                className="transition-all duration-300 cursor-pointer"
                style={{ pointerEvents: 'stroke' }}
                onMouseEnter={() => setHoveringOutstanding(true)}
                onMouseLeave={() => setHoveringOutstanding(false)}
              />
            )}
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className={`text-xl font-bold ${isGoalMet ? 'text-green-600' : 'text-gray-900'}`}>
              {Math.round(displayPercent)}%
            </p>
          </div>
          {/* Hover overlay for light purple segment area */}
          {outstandingInvoices > 0 && (
            <svg
              className="absolute inset-0 w-24 h-24 transform -rotate-90 cursor-pointer"
              onMouseEnter={() => setHoveringOutstanding(true)}
              onMouseLeave={() => setHoveringOutstanding(false)}
            >
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="transparent"
                strokeWidth="16"
                fill="none"
                strokeDasharray={`${outstandingDash} ${circumference}`}
                strokeDashoffset={outstandingDashOffset}
                pointerEvents="stroke"
              />
            </svg>
          )}
        </div>

        {/* Stats */}
        <div className="ml-4">
          <p className="text-sm text-gray-600">
            <span className={`font-semibold ${isGoalMet ? 'text-green-600' : 'text-gray-900'}`}>
              {formatCurrency(paymentsCollected, currency)}
            </span>
            <span className="text-gray-400"> collected</span>
          </p>
          {hoveringOutstanding && outstandingInvoices > 0 && (
            <>
              <p className="text-xs text-gray-500 mt-1">
                <span className="font-medium">{formatCurrency(outstandingInvoices, currency)}</span>
                <span className="text-gray-400"> outstanding</span>
              </p>
              {!isGoalMet && (
                <p className="text-xs text-gray-500 mt-1">
                  {formatCurrency(remaining, currency)} to go
                </p>
              )}
            </>
          )}
          {!hoveringOutstanding && (
            <>
              {!isGoalMet && (
                <p className="text-xs text-gray-500 mt-1">
                  {formatCurrency(remaining, currency)} to go
                </p>
              )}
              <p className="text-xs text-[#8e51ff] font-medium mt-2">
                {getMessage()}
              </p>
            </>
          )}
        </div>
      </div>

    </div>
  );
};

export default MonthlyIncomeGoalWidget;
