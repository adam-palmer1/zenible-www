import React, { useState, useEffect } from 'react';
import { usePreferences } from '../contexts/PreferencesContext';
import planAPI from '../services/planAPI';
import { LoadingSpinner } from './shared';

export default function PaymentHistory() {
  const { darkMode } = usePreferences();
  const [payments, setPayments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState('payments'); // 'payments' or 'invoices'

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [perPage] = useState(10);

  // Filters state
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Dropdown visibility state
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  // Filter options
  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'succeeded', label: 'Succeeded' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' },
    { value: 'refunded', label: 'Refunded' },
    { value: 'canceled', label: 'Canceled' },
    { value: 'processing', label: 'Processing' },
  ];

  const typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'subscription', label: 'Subscription' },
    { value: 'refund', label: 'Refund' },
    { value: 'adjustment', label: 'Adjustment' },
    { value: 'manual', label: 'Manual' },
    { value: 'one_time', label: 'One Time' },
  ];

  useEffect(() => {
    if (activeView === 'payments') {
      fetchPayments();
    } else {
      fetchInvoices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, typeFilter, startDate, endDate, activeView]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, any> = {
        page: currentPage,
        per_page: perPage,
      };

      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      if (startDate) params.start_date = new Date(startDate).toISOString();
      if (endDate) params.end_date = new Date(endDate).toISOString();

      const response = await planAPI.getPayments(params) as { items?: any[]; total_pages?: number; total?: number };

      setPayments(response.items || []);
      setTotalPages(response.total_pages || 1);
      setTotalItems(response.total || 0);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, any> = {
        page: currentPage,
        per_page: perPage,
      };

      const response = await planAPI.getInvoices(params) as { items?: any[]; total_pages?: number; total?: number };

      setInvoices(response.items || []);
      setTotalPages(response.total_pages || 1);
      setTotalItems(response.total || 0);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterReset = () => {
    setStatusFilter('');
    setTypeFilter('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    setShowStatusDropdown(false);
    setShowTypeDropdown(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: any, currency = 'USD') => {
    if (!amount) return '$0.00';
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    });
    return formatter.format(parseFloat(amount));
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'succeeded':
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'failed':
      case 'canceled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'refunded':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'subscription':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'refund':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'adjustment':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'manual':
      case 'one_time':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with View Toggle */}
      <div className={`rounded-xl shadow-sm border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
              Payment History
            </h2>

            {/* View Toggle */}
            <div className={`flex space-x-1 p-1 rounded-lg ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-100'}`}>
              <button
                onClick={() => {
                  setActiveView('payments');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-md font-medium text-sm transition-colors ${
                  activeView === 'payments'
                    ? darkMode
                      ? 'bg-zenible-dark-card text-zenible-primary'
                      : 'bg-white text-zenible-primary shadow-sm'
                    : darkMode
                      ? 'text-zenible-dark-text-secondary hover:text-zenible-dark-text'
                      : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Payments
              </button>
              <button
                onClick={() => {
                  setActiveView('invoices');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-md font-medium text-sm transition-colors ${
                  activeView === 'invoices'
                    ? darkMode
                      ? 'bg-zenible-dark-card text-zenible-primary'
                      : 'bg-white text-zenible-primary shadow-sm'
                    : darkMode
                      ? 'text-zenible-dark-text-secondary hover:text-zenible-dark-text'
                      : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Invoices
              </button>
            </div>
          </div>
        </div>

        {/* Filters - Only show for payments view */}
        {activeView === 'payments' && (
          <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Status Dropdown */}
              <div className="relative">
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Status
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowStatusDropdown(!showStatusDropdown);
                    setShowTypeDropdown(false);
                  }}
                  className={`w-full px-3 py-2 rounded-lg border text-left flex items-center justify-between ${
                    darkMode
                      ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text hover:border-zenible-primary/50'
                      : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400'
                  }`}
                >
                  <span className={statusFilter ? '' : darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}>
                    {statusOptions.find(opt => opt.value === statusFilter)?.label || 'All Status'}
                  </span>
                  <svg className={`w-4 h-4 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showStatusDropdown && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowStatusDropdown(false)} />
                    <div className={`absolute left-0 right-0 mt-1 rounded-lg shadow-lg border z-40 max-h-64 overflow-y-auto ${
                      darkMode
                        ? 'bg-zenible-dark-card border-zenible-dark-border'
                        : 'bg-white border-gray-200'
                    }`}>
                      {statusOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setStatusFilter(option.value);
                            setCurrentPage(1);
                            setShowStatusDropdown(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between ${
                            statusFilter === option.value
                              ? darkMode
                                ? 'bg-zenible-primary/20 text-zenible-primary'
                                : 'bg-zenible-primary/10 text-zenible-primary'
                              : darkMode
                                ? 'text-zenible-dark-text hover:bg-zenible-dark-bg'
                                : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {option.label}
                          {statusFilter === option.value && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Type Dropdown */}
              <div className="relative">
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Type
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowTypeDropdown(!showTypeDropdown);
                    setShowStatusDropdown(false);
                  }}
                  className={`w-full px-3 py-2 rounded-lg border text-left flex items-center justify-between ${
                    darkMode
                      ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text hover:border-zenible-primary/50'
                      : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400'
                  }`}
                >
                  <span className={typeFilter ? '' : darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}>
                    {typeOptions.find(opt => opt.value === typeFilter)?.label || 'All Types'}
                  </span>
                  <svg className={`w-4 h-4 transition-transform ${showTypeDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showTypeDropdown && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowTypeDropdown(false)} />
                    <div className={`absolute left-0 right-0 mt-1 rounded-lg shadow-lg border z-40 max-h-64 overflow-y-auto ${
                      darkMode
                        ? 'bg-zenible-dark-card border-zenible-dark-border'
                        : 'bg-white border-gray-200'
                    }`}>
                      {typeOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setTypeFilter(option.value);
                            setCurrentPage(1);
                            setShowTypeDropdown(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between ${
                            typeFilter === option.value
                              ? darkMode
                                ? 'bg-zenible-primary/20 text-zenible-primary'
                                : 'bg-zenible-primary/10 text-zenible-primary'
                              : darkMode
                                ? 'text-zenible-dark-text hover:bg-zenible-dark-bg'
                                : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {option.label}
                          {typeFilter === option.value && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode
                      ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode
                      ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>

            {(statusFilter || typeFilter || startDate || endDate) && (
              <button
                onClick={handleFilterReset}
                className={`mt-3 text-sm font-medium ${
                  darkMode ? 'text-zenible-primary hover:text-zenible-primary/80' : 'text-zenible-primary hover:text-zenible-primary/80'
                }`}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-700'}`}>
              {error}
            </div>
          )}

          {loading ? (
            <LoadingSpinner height="py-12" />
          ) : activeView === 'payments' ? (
            // Payments Table
            payments.length === 0 ? (
              <div className={`text-center py-12 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                <svg className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="font-medium mb-1">No payments found</p>
                <p className="text-sm">Adjust your filters to see more results</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`border-b ${darkMode ? 'border-zenible-dark-border' : 'border-gray-200'}`}>
                    <tr>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                      }`}>
                        Date
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                      }`}>
                        Amount
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                      }`}>
                        Type
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                      }`}>
                        Status
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                      }`}>
                        Payment ID
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-zenible-dark-border' : 'divide-gray-200'}`}>
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className={`px-4 py-4 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                          {formatDate(payment.created_at)}
                        </td>
                        <td className={`px-4 py-4 text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                          {formatCurrency(payment.amount, payment.currency)}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeClass(payment.type)}`}>
                            {payment.type}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(payment.status)}`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className={`px-4 py-4 text-xs font-mono ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                          {payment.stripe_payment_intent_id || payment.id.slice(0, 8) + '...'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            // Invoices Table
            invoices.length === 0 ? (
              <div className={`text-center py-12 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                <svg className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="font-medium mb-1">No invoices found</p>
                <p className="text-sm">Invoices will appear here after your first payment</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`border-b ${darkMode ? 'border-zenible-dark-border' : 'border-gray-200'}`}>
                    <tr>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                      }`}>
                        Date
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                      }`}>
                        Invoice ID
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                      }`}>
                        Amount
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                      }`}>
                        Status
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                      }`}>
                        Period
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                      }`}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-zenible-dark-border' : 'divide-gray-200'}`}>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td className={`px-4 py-4 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                          {formatDate(invoice.created_at)}
                        </td>
                        <td className={`px-4 py-4 text-sm font-mono ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                          {invoice.stripe_invoice_id || invoice.id}
                        </td>
                        <td className={`px-4 py-4 text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                          {formatCurrency(invoice.amount_paid, invoice.currency)}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(invoice.status)}`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className={`px-4 py-4 text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                          {formatDate(invoice.period_start)} - {formatDate(invoice.period_end)}
                        </td>
                        <td className="px-4 py-4">
                          {invoice.download_url && (
                            <a
                              href={invoice.download_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`text-sm font-medium ${
                                darkMode ? 'text-zenible-primary hover:text-zenible-primary/80' : 'text-zenible-primary hover:text-zenible-primary/80'
                              }`}
                            >
                              Download
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className={`mt-6 flex items-center justify-between border-t pt-4 ${
              darkMode ? 'border-zenible-dark-border' : 'border-gray-200'
            }`}>
              <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, totalItems)} of {totalItems} {activeView}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-lg border ${
                    currentPage === 1
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-opacity-10 hover:bg-zenible-primary'
                  } ${darkMode ? 'border-zenible-dark-border text-zenible-dark-text' : 'border-gray-300 text-gray-700'}`}
                >
                  Previous
                </button>
                <span className={`px-3 py-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-lg border ${
                    currentPage === totalPages
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-opacity-10 hover:bg-zenible-primary'
                  } ${darkMode ? 'border-zenible-dark-border text-zenible-dark-text' : 'border-gray-300 text-gray-700'}`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}