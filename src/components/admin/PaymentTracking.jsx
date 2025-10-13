import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import adminAPI from '../../services/adminAPI';

export default function PaymentTracking() {
  const { darkMode } = useOutletContext();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'list'

  // Payment list state
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);

  // Statistics state
  const [statistics, setStatistics] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsDateRange, setStatsDateRange] = useState('month'); // month, quarter, year, custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Refund modal
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchStatistics();
    } else {
      fetchPayments();
    }
  }, [page, statusFilter, typeFilter, startDate, endDate, userIdFilter, activeTab, statsDateRange, customStartDate, customEndDate]);

  const getDateRangeParams = () => {
    const now = new Date();
    let start, end;

    switch (statsDateRange) {
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'quarter': {
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
        break;
      }
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
      case 'custom':
        start = customStartDate ? new Date(customStartDate) : new Date(now.getFullYear(), 0, 1);
        end = customEndDate ? new Date(customEndDate) : now;
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = now;
    }

    return {
      start_date: start.toISOString(),
      end_date: end.toISOString()
    };
  };

  const fetchStatistics = async () => {
    setStatsLoading(true);
    try {
      const params = getDateRangeParams();
      const response = await adminAPI.getPaymentStats(params);
      setStatistics(response);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
      setError('Failed to load payment statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        per_page: perPage,
      };

      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      if (startDate) params.start_date = new Date(startDate).toISOString();
      if (endDate) params.end_date = new Date(endDate).toISOString();
      if (userIdFilter) params.user_id = userIdFilter;

      const response = await adminAPI.getAllPayments(params);
      setPayments(response.payments || []);
      setTotalPages(response.pages || 1);
      setTotalPayments(response.total || 0);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
      setError('Failed to load payments: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!selectedPayment) return;

    setProcessing(true);
    try {
      const data = {
        amount: refundAmount || selectedPayment.amount,
        reason: refundReason
      };

      await adminAPI.refundPayment(selectedPayment.id, data);
      setShowRefundModal(false);
      setSelectedPayment(null);
      setRefundAmount('');
      setRefundReason('');
      await fetchPayments();
    } catch (err) {
      alert(`Refund failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const resetFilters = () => {
    setStatusFilter('');
    setTypeFilter('');
    setStartDate('');
    setEndDate('');
    setUserIdFilter('');
    setSearchTerm('');
    setPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount, currency = 'USD') => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(parseFloat(amount));
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'succeeded':
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

  const getTypeBadgeClass = (type) => {
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

  const filteredPayments = payments.filter(payment => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      payment.stripe_payment_intent_id?.toLowerCase().includes(term) ||
      payment.user_email?.toLowerCase().includes(term) ||
      payment.user_name?.toLowerCase().includes(term) ||
      payment.id?.toLowerCase().includes(term)
    );
  });

  return (
    <div className={`flex-1 overflow-auto ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`border-b px-6 py-4 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
              Payment Management
            </h1>
            <p className={`text-sm mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
              Track and manage all payment transactions
            </p>
          </div>

          {/* Tab Switcher */}
          <div className={`flex space-x-1 p-1 rounded-lg ${darkMode ? 'bg-zenible-dark-card' : 'bg-gray-100'}`}>
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'overview'
                  ? darkMode
                    ? 'bg-zenible-dark-bg text-zenible-primary'
                    : 'bg-white text-zenible-primary shadow-sm'
                  : darkMode
                    ? 'text-zenible-dark-text-secondary hover:text-zenible-dark-text'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'list'
                  ? darkMode
                    ? 'bg-zenible-dark-bg text-zenible-primary'
                    : 'bg-white text-zenible-primary shadow-sm'
                  : darkMode
                    ? 'text-zenible-dark-text-secondary hover:text-zenible-dark-text'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Payments List
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'overview' ? (
        // Statistics Overview
        <div className="p-6">
          {/* Date Range Selector */}
          <div className={`mb-6 p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
            <div className="flex items-center gap-4 flex-wrap">
              <label className={`text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                Period:
              </label>
              <select
                value={statsDateRange}
                onChange={(e) => setStatsDateRange(e.target.value)}
                className={`px-3 py-2 rounded-lg border text-sm ${
                  darkMode
                    ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>

              {statsDateRange === 'custom' && (
                <>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className={`px-3 py-2 rounded-lg border text-sm ${
                      darkMode
                        ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                  <span className={darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}>to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className={`px-3 py-2 rounded-lg border text-sm ${
                      darkMode
                        ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </>
              )}
            </div>
          </div>

          {statsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary"></div>
            </div>
          ) : statistics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Revenue Card */}
              <div className={`rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                      darkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-800'
                    }`}>
                      Revenue
                    </span>
                  </div>
                  <div className={`text-2xl font-bold mb-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                    {formatCurrency(statistics.total_amount, statistics.currency)}
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                    Total revenue
                  </div>
                </div>
              </div>

              {/* Total Payments Card */}
              <div className={`rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                      darkMode ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-100 text-blue-800'
                    }`}>
                      Transactions
                    </span>
                  </div>
                  <div className={`text-2xl font-bold mb-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                    {statistics.total_payments?.toLocaleString() || 0}
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                    Total payments
                  </div>
                </div>
              </div>

              {/* Successful Payments Card */}
              <div className={`rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                      darkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-800'
                    }`}>
                      Success Rate
                    </span>
                  </div>
                  <div className={`text-2xl font-bold mb-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                    {statistics.successful_payments?.toLocaleString() || 0}
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                    Successful ({statistics.total_payments ? Math.round((statistics.successful_payments / statistics.total_payments) * 100) : 0}%)
                  </div>
                </div>
              </div>

              {/* Failed/Refunded Card */}
              <div className={`rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                      darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-800'
                    }`}>
                      Issues
                    </span>
                  </div>
                  <div className={`text-2xl font-bold mb-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                    {statistics.failed_payments?.toLocaleString() || 0}
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                    Failed payments
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={`text-center py-12 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
              No statistics available for the selected period
            </div>
          )}
        </div>
      ) : (
        // Payments List
        <div className="p-6">
          {/* Filters */}
          <div className={`rounded-xl border overflow-hidden mb-6 ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <div className="flex items-center justify-between">
                <h3 className={`font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                  Filters
                </h3>
                {(statusFilter || typeFilter || startDate || endDate || userIdFilter || searchTerm) && (
                  <button
                    onClick={resetFilters}
                    className={`text-sm font-medium ${
                      darkMode ? 'text-zenible-primary hover:text-zenible-primary/80' : 'text-zenible-primary hover:text-zenible-primary/80'
                    }`}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Search */}
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                    Search
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Payment ID, email, or name..."
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode
                        ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text placeholder-zenible-dark-text-secondary'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>

                {/* Status Filter */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                    }}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode
                        ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">All Status</option>
                    <option value="succeeded">Succeeded</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="failed">Failed</option>
                    <option value="canceled">Canceled</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>

                {/* Type Filter */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                    Type
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => {
                      setTypeFilter(e.target.value);
                      setPage(1);
                    }}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode
                        ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">All Types</option>
                    <option value="subscription">Subscription</option>
                    <option value="refund">Refund</option>
                    <option value="adjustment">Adjustment</option>
                    <option value="manual">Manual</option>
                    <option value="one_time">One Time</option>
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPage(1);
                    }}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode
                        ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPage(1);
                    }}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode
                        ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              {/* User ID Filter (separate row) */}
              <div className="mt-4">
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                  User ID (UUID)
                </label>
                <input
                  type="text"
                  value={userIdFilter}
                  onChange={(e) => {
                    setUserIdFilter(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Filter by specific user ID..."
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode
                      ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text placeholder-zenible-dark-text-secondary'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Payments Table */}
          <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary"></div>
              </div>
            ) : error ? (
              <div className="text-red-500 text-center py-12">Error: {error}</div>
            ) : filteredPayments.length === 0 ? (
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
                  <thead className={`border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Date
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        User
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Amount
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Type
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Status
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Payment ID
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-zenible-dark-border' : 'divide-neutral-200'}`}>
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id}>
                        <td className={`px-6 py-4 text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                          {formatDate(payment.created_at)}
                        </td>
                        <td className={`px-6 py-4 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                          <div className="text-sm font-medium">{payment.user_name || 'Unknown'}</div>
                          <div className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                            {payment.user_email || 'N/A'}
                          </div>
                        </td>
                        <td className={`px-6 py-4 text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                          {formatCurrency(payment.amount, payment.currency)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeClass(payment.type)}`}>
                            {payment.type || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(payment.status)}`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-xs font-mono ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                          {payment.stripe_payment_intent_id || payment.id?.slice(0, 8) + '...'}
                        </td>
                        <td className="px-6 py-4">
                          {payment.status === 'succeeded' && (
                            <button
                              onClick={() => {
                                setSelectedPayment(payment);
                                setShowRefundModal(true);
                              }}
                              className="text-red-600 hover:text-red-900 text-sm font-medium"
                            >
                              Refund
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && totalPages > 1 && (
              <div className={`px-6 py-4 border-t flex items-center justify-between ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
                <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                  Showing {((page - 1) * perPage) + 1} to {Math.min(page * perPage, totalPayments)} of {totalPayments} payments
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className={`px-3 py-1 rounded-lg border ${
                      page === 1
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-opacity-10 hover:bg-zenible-primary'
                    } ${darkMode ? 'border-zenible-dark-border text-zenible-dark-text' : 'border-gray-300 text-gray-700'}`}
                  >
                    Previous
                  </button>
                  <span className={`px-3 py-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className={`px-3 py-1 rounded-lg border ${
                      page === totalPages
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
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md mx-4 rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                Process Refund
              </h3>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                    Payment Details
                  </label>
                  <div className={`p-3 rounded-lg ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'} space-y-1 text-sm`}>
                    <div className={darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}>
                      <span className="font-medium">Amount:</span> {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                    </div>
                    <div className={darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}>
                      <span className="font-medium">User:</span> {selectedPayment.user_name} ({selectedPayment.user_email})
                    </div>
                    <div className={darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}>
                      <span className="font-medium">Date:</span> {formatDate(selectedPayment.created_at)}
                    </div>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                    Refund Amount (leave empty for full refund)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder={selectedPayment.amount}
                    max={selectedPayment.amount}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      darkMode
                        ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                    Reason for Refund
                  </label>
                  <textarea
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Enter reason for refund..."
                    rows="3"
                    className={`w-full px-3 py-2 border rounded-lg ${
                      darkMode
                        ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowRefundModal(false);
                    setSelectedPayment(null);
                    setRefundAmount('');
                    setRefundReason('');
                  }}
                  disabled={processing}
                  className={`flex-1 px-4 py-2 border rounded-lg font-medium ${
                    darkMode
                      ? 'border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-bg'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  } disabled:opacity-50`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRefund}
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    'Process Refund'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}