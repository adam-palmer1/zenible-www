import React from 'react';
import { useContactFinancials, useCompanyCurrencies } from '../../hooks/crm';
import { formatCurrencyWithCommas } from '../../utils/currency';
import { LoadingSpinner } from '../shared';

interface FinancialSummaryProps {
  data: any;
  currencies: { income: string; outstanding: string; expenses: string };
  numberFormat: any;
}

/**
 * Financial Summary Card Component
 */
const FinancialSummary: React.FC<FinancialSummaryProps> = ({ data, currencies, numberFormat }) => {
  // Format value with the appropriate currency
  const formatValue = (value: any, currencyCode: string) => formatCurrencyWithCommas(value, currencyCode, numberFormat);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h4 className="text-sm font-medium text-gray-700 mb-3">Financial Summary</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {/* Income/Billed */}
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Income</p>
          <p className="text-sm font-semibold text-green-700">
            {formatValue(data.billed, currencies.income)}
          </p>
        </div>
        {/* Paid */}
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Paid</p>
          <p className="text-sm font-semibold text-blue-700">
            {formatValue(data.paid, currencies.income)}
          </p>
        </div>
        {/* Outstanding */}
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Outstanding</p>
          <p className="text-sm font-semibold text-orange-700">
            {formatValue(data.outstanding, currencies.outstanding)}
          </p>
          {data.overdueCount > 0 && (
            <p className="text-xs text-red-600 mt-0.5">{data.overdueCount} overdue</p>
          )}
        </div>
        {/* Expenses */}
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Expenses</p>
          <p className="text-sm font-semibold text-red-700">
            {formatValue(data.expenses, currencies.expenses)}
          </p>
        </div>
        {/* Net */}
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Net</p>
          <p className={`text-sm font-semibold ${data.total >= 0 ? 'text-purple-700' : 'text-red-700'}`}>
            {formatValue(data.total, currencies.income)}
          </p>
        </div>
      </div>
    </div>
  );
};

interface ContactFinancialsTabProps {
  contactId: string;
}

/**
 * Contact Financials Tab Component
 * Displays financial summary for a contact
 */
const ContactFinancialsTab: React.FC<ContactFinancialsTabProps> = ({ contactId }) => {
  const {
    summaryByCurrency,
    summaryCurrencies,
    loading,
    error,
    refresh,
  } = useContactFinancials(contactId);

  const { defaultCurrency, numberFormat } = useCompanyCurrencies();
  const defaultCurrencyCode = defaultCurrency?.currency?.code || 'GBP';

  // Get per-category currencies with fallback to default
  const currencies = {
    income: summaryCurrencies?.income || defaultCurrencyCode,
    outstanding: summaryCurrencies?.outstanding || defaultCurrencyCode,
    expenses: summaryCurrencies?.expenses || defaultCurrencyCode,
  };

  const summaryData = summaryByCurrency?.ALL;
  const hasData = summaryData && (summaryData.billed > 0 || summaryData.outstanding > 0 || summaryData.expenses > 0);

  if (loading) {
    return <LoadingSpinner size="h-8 w-8" height="py-8" />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 text-sm mb-2">Failed to load financial data</p>
        <button
          onClick={refresh}
          className="text-zenible-primary hover:text-purple-600 text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="text-center py-8">
        <svg
          className="mx-auto h-12 w-12 text-gray-400 mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
          />
        </svg>
        <p className="text-gray-500 text-sm">No financial data yet</p>
        <p className="text-gray-400 text-xs mt-1">
          Financial summary will appear here once invoices or expenses are recorded
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <FinancialSummary
        data={summaryData}
        currencies={currencies}
        numberFormat={numberFormat}
      />
    </div>
  );
};

export default ContactFinancialsTab;
