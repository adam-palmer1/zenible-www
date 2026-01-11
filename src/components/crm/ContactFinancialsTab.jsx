import React from 'react';
import { useContactFinancials } from '../../hooks/crm/useContactFinancials';
import { formatCurrencyWithCommas } from '../../utils/currency';

/**
 * Transaction type configuration
 */
const TRANSACTION_TYPES = {
  invoice: {
    label: 'Invoice',
    icon: (
      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    bgColor: 'bg-blue-100',
  },
  payment: {
    label: 'Payment',
    icon: (
      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    bgColor: 'bg-green-100',
  },
  quote: {
    label: 'Quote',
    icon: (
      <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
      </svg>
    ),
    bgColor: 'bg-purple-100',
  },
  expense: {
    label: 'Expense',
    icon: (
      <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
      </svg>
    ),
    bgColor: 'bg-red-100',
  },
  credit_note: {
    label: 'Credit Note',
    icon: (
      <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
      </svg>
    ),
    bgColor: 'bg-orange-100',
  },
};

/**
 * Status badge configuration
 */
const STATUS_STYLES = {
  // Invoice statuses
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  viewed: 'bg-indigo-100 text-indigo-700',
  paid: 'bg-green-100 text-green-700',
  partially_paid: 'bg-yellow-100 text-yellow-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
  // Payment statuses
  pending: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-orange-100 text-orange-700',
  // Quote statuses
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  expired: 'bg-gray-100 text-gray-500',
  invoiced: 'bg-blue-100 text-blue-700',
  // Credit note statuses
  issued: 'bg-green-100 text-green-700',
  applied: 'bg-blue-100 text-blue-700',
  void: 'bg-gray-100 text-gray-500',
  // Expense statuses
  approved: 'bg-green-100 text-green-700',
};

/**
 * Format date for display
 */
const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

/**
 * Currency Summary Card Component
 */
const CurrencySummary = ({ currency, data }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-700">{currency}</h4>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {/* Billed */}
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Billed</p>
          <p className="text-sm font-semibold text-green-700">
            {formatCurrencyWithCommas(data.billed, currency)}
          </p>
        </div>
        {/* Paid */}
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Paid</p>
          <p className="text-sm font-semibold text-blue-700">
            {formatCurrencyWithCommas(data.paid, currency)}
          </p>
        </div>
        {/* Outstanding */}
        <div className="text-center p-2 bg-orange-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Outstanding</p>
          <p className="text-sm font-semibold text-orange-700">
            {formatCurrencyWithCommas(data.outstanding, currency)}
          </p>
        </div>
        {/* Expenses */}
        <div className="text-center p-2 bg-red-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Expenses</p>
          <p className="text-sm font-semibold text-red-700">
            {formatCurrencyWithCommas(data.expenses, currency)}
          </p>
        </div>
        {/* Total (Net) */}
        <div className="text-center p-2 bg-purple-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Net</p>
          <p className={`text-sm font-semibold ${data.total >= 0 ? 'text-purple-700' : 'text-red-700'}`}>
            {formatCurrencyWithCommas(data.total, currency)}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Transaction Item Component
 */
const TransactionItem = ({ transaction }) => {
  const typeConfig = TRANSACTION_TYPES[transaction.type] || TRANSACTION_TYPES.invoice;
  const statusStyle = STATUS_STYLES[transaction.status] || 'bg-gray-100 text-gray-700';
  const isNegative = transaction.type === 'expense' || transaction.type === 'credit_note';

  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg hover:border-gray-200 transition-colors">
      {/* Icon */}
      <div className={`flex-shrink-0 w-10 h-10 ${typeConfig.bgColor} rounded-lg flex items-center justify-center`}>
        {typeConfig.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 truncate">
            {typeConfig.label} {transaction.reference}
          </span>
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusStyle}`}>
            {(transaction.status || 'unknown').replace(/_/g, ' ')}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-500">{formatDate(transaction.date)}</span>
          {transaction.relatedTo && (
            <>
              <span className="text-xs text-gray-300">•</span>
              <span className="text-xs text-gray-500 truncate">{transaction.relatedTo}</span>
            </>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="flex-shrink-0 text-right">
        <span className={`text-sm font-semibold ${isNegative ? 'text-red-600' : 'text-gray-900'}`}>
          {isNegative ? '-' : ''}{formatCurrencyWithCommas(transaction.amount, transaction.currency)}
        </span>
      </div>
    </div>
  );
};

/**
 * Contact Financials Tab Component
 * Displays financial summary and transactions for a contact
 */
const ContactFinancialsTab = ({ contactId, isVendor = false }) => {
  const {
    summaryByCurrency,
    transactions,
    loading,
    error,
    pagination,
    loadMore,
    refresh,
  } = useContactFinancials(contactId, isVendor);

  const currencyEntries = Object.entries(summaryByCurrency);
  const hasData = currencyEntries.length > 0 || transactions.length > 0;

  if (loading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
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
        <p className="text-gray-500 text-sm">No financial transactions yet</p>
        <p className="text-gray-400 text-xs mt-1">
          Invoices, payments, quotes, and other financial records will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary by Currency */}
      {currencyEntries.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Financial Summary</h3>
          {currencyEntries.map(([currency, data]) => (
            <CurrencySummary key={currency} currency={currency} data={data} />
          ))}
        </div>
      )}

      {/* Transactions List */}
      {transactions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">Transactions</h3>
            <p className="text-xs text-gray-500">
              Showing {pagination.displayed} of {pagination.total}
            </p>
          </div>

          <div className="space-y-2">
            {transactions.map((transaction) => (
              <TransactionItem key={`${transaction.type}-${transaction.id}`} transaction={transaction} />
            ))}
          </div>

          {/* Load More Button */}
          {pagination.hasMore && (
            <div className="pt-4 text-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-4 py-2 text-sm text-zenible-primary hover:text-purple-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    Loading...
                  </span>
                ) : (
                  `Load More (${pagination.total - pagination.displayed} remaining)`
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContactFinancialsTab;
