import React from 'react';
import { useContactFinancials, useCompanyCurrencies } from '../../hooks/crm';
import { formatCurrencyWithCommas } from '../../utils/currency';
import { LoadingSpinner } from '../shared';
import type { FinancialField } from '../../hooks/crm/useContactFinancials';

interface FinancialBoxProps {
  label: string;
  field: FinancialField;
  defaultCurrency: string;
  numberFormat: any;
  bgClass: string;
  textClass: string;
}

const FinancialBox: React.FC<FinancialBoxProps> = ({
  label, field, defaultCurrency, numberFormat, bgClass, textClass,
}) => {
  const showBreakdown = field.currencies.length > 0;

  return (
    <div className={`text-center p-3 ${bgClass} rounded-lg`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-sm font-semibold ${textClass}`}>
        {formatCurrencyWithCommas(field.total, defaultCurrency, numberFormat)}
      </p>
      {showBreakdown && (
        <div className="mt-1 space-y-0.5">
          {field.currencies.map(c => (
            <p key={c.code} className="text-[10px] text-gray-400">
              {formatCurrencyWithCommas(c.amount, c.code, numberFormat)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

interface ContactFinancialsTabProps {
  contactId: string;
}

const ContactFinancialsTab: React.FC<ContactFinancialsTabProps> = ({ contactId }) => {
  const {
    summary,
    defaultCurrency,
    loading,
    error,
    refresh,
  } = useContactFinancials(contactId);

  const { defaultCurrency: companyCurrency, numberFormat } = useCompanyCurrencies();
  const currencyCode = defaultCurrency || companyCurrency?.currency?.code || 'GBP';

  const hasData = summary && (
    summary.billed.total > 0 ||
    summary.outstanding.total > 0 ||
    summary.expenses.total > 0 ||
    summary.attributedOut.total > 0 ||
    summary.attributedIn.total > 0
  );

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

  if (!hasData || !summary) {
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
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Financial Summary</h4>
        {/* Row 1: Invoice-based figures */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
          <FinancialBox label="Direct Income" field={summary.billed} defaultCurrency={currencyCode} numberFormat={numberFormat} bgClass="bg-green-50" textClass="text-green-700" />
          <FinancialBox label="Paid" field={summary.paid} defaultCurrency={currencyCode} numberFormat={numberFormat} bgClass="bg-blue-50" textClass="text-blue-700" />
          <FinancialBox label="Outstanding" field={summary.outstanding} defaultCurrency={currencyCode} numberFormat={numberFormat} bgClass="bg-orange-50" textClass="text-orange-700" />
          <FinancialBox label="Expenses" field={summary.expenses} defaultCurrency={currencyCode} numberFormat={numberFormat} bgClass="bg-red-50" textClass="text-red-700" />
        </div>
        {/* Row 2: Attribution & Net */}
        <div className="grid grid-cols-3 gap-2">
          <FinancialBox label="Attributed Out" field={summary.attributedOut} defaultCurrency={currencyCode} numberFormat={numberFormat} bgClass="bg-indigo-50" textClass="text-indigo-700" />
          <FinancialBox label="Attributed In" field={summary.attributedIn} defaultCurrency={currencyCode} numberFormat={numberFormat} bgClass="bg-violet-50" textClass="text-violet-700" />
          <FinancialBox label="Net" field={summary.net} defaultCurrency={currencyCode} numberFormat={numberFormat} bgClass="bg-purple-50" textClass={summary.net.total >= 0 ? 'text-purple-700' : 'text-red-700'} />
        </div>
      </div>
    </div>
  );
};

export default ContactFinancialsTab;
