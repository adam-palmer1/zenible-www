import React, { useState } from 'react';
import { TrophyIcon } from '@heroicons/react/24/outline';
import { useCompanyCurrencies } from '../../../hooks/crm/useCompanyCurrencies';
import { formatCurrency } from '../../../utils/currency';
import { LoadingSpinner } from '../../shared';
import { useDashboardWidget } from '../../../contexts/DashboardDataContext';

interface MonthlyIncomeGoalWidgetProps {
  settings?: Record<string, any>;
}

/**
 * Monthly Income Goal Widget for Dashboard
 * Shows progress toward monthly income target with two-segment ring
 */
const MonthlyIncomeGoalWidget = ({ settings = {} }: MonthlyIncomeGoalWidgetProps) => {
  const { defaultCurrency: companyDefaultCurrency } = useCompanyCurrencies();
  const { data: summary, isLoading: loading, error } = useDashboardWidget('monthlyIncomeGoal');
  const [hoveringOutstanding, setHoveringOutstanding] = useState(false);

  const monthlyGoal = settings.monthlyGoal || 5000;
  const currency = settings.currency || companyDefaultCurrency?.currency?.code || 'GBP';

  // Get values from summary (revenue = paid invoices + unlinked payments)
  const paymentsCollected = parseFloat(summary?.paid_invoices_total || 0)
                          + parseFloat(summary?.unlinked_payments_total || 0);
  const outstandingInvoices = parseFloat(summary?.outstanding_invoices || 0);
  const totalWithOutstanding = paymentsCollected + outstandingInvoices;

  // Calculate percentages (uncapped — can exceed 100%)
  const circumference = 2 * Math.PI * 40; // ~251
  const paymentsPercent = monthlyGoal > 0 ? (paymentsCollected / monthlyGoal) * 100 : 0;
  const outstandingPercent = monthlyGoal > 0 ? (outstandingInvoices / monthlyGoal) * 100 : 0;

  // Ring segments are capped at 100% visually (can't draw past full circle)
  const paymentsRingPercent = Math.min(paymentsPercent, 100);
  const outstandingRingPercent = Math.min(outstandingPercent, Math.max(100 - paymentsPercent, 0));
  const paymentsDash = (paymentsRingPercent / 100) * circumference;
  const outstandingDash = (outstandingRingPercent / 100) * circumference;
  const outstandingDashOffset = -paymentsDash;

  // Display percentage based on hover (uncapped)
  const displayPercent = hoveringOutstanding
    ? monthlyGoal > 0 ? ((paymentsCollected + outstandingInvoices) / monthlyGoal) * 100 : 0
    : paymentsPercent;

  const isGoalMet = paymentsCollected >= monthlyGoal;
  const currentAmount = hoveringOutstanding ? totalWithOutstanding : paymentsCollected;
  const remaining = Math.max(monthlyGoal - currentAmount, 0);
  const overGoalBy = Math.max(currentAmount - monthlyGoal, 0);

  const monthName = new Date().toLocaleDateString('en-US', { month: 'long' });

  if (loading) {
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
              {!isGoalMet && remaining > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {formatCurrency(remaining, currency)} to go
                </p>
              )}
              {isGoalMet && overGoalBy > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  {formatCurrency(overGoalBy, currency)} over goal
                </p>
              )}
            </>
          )}
          {!hoveringOutstanding && (
            <>
              {!isGoalMet && remaining > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {formatCurrency(remaining, currency)} to go
                </p>
              )}
              {isGoalMet && overGoalBy > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  {formatCurrency(overGoalBy, currency)} over goal
                </p>
              )}
            </>
          )}
        </div>
      </div>

    </div>
  );
};

export default MonthlyIncomeGoalWidget;
