import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import adminAPI from '../../services/adminAPI';
import Combobox from '../ui/combobox/Combobox';

interface AdminOutletContext {
  darkMode: boolean;
}

export default function AdminDashboard() {
  const { darkMode } = useOutletContext<AdminOutletContext>();
  const [stats, setStats] = useState<any>(null);
  const [revenue, setRevenue] = useState<any>(null);
  const [userAnalytics, setUserAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<string>('30');

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, revenueData, userAnalyticsData] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getDashboardRevenue({ days: dateRange }),
        adminAPI.getDashboardUsers({ days: dateRange }),
      ]);

      setStats(statsData);
      setRevenue(revenueData);
      setUserAnalytics(userAnalyticsData);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };


  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-red-500">Error loading dashboard: {error}</div>
      </div>
    );
  }

  return (
    <div className={`flex-1 overflow-auto ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
      {/* Header */}
      <div
        className={`border-b px-4 sm:px-6 py-4 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1
              className={`text-xl sm:text-2xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}
            >
              Admin Dashboard
            </h1>
            <p className={`text-sm mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
              Overview of system metrics and analytics
            </p>
          </div>
          <Combobox
            options={[
              { id: '7', label: 'Last 7 days' },
              { id: '30', label: 'Last 30 days' },
              { id: '90', label: 'Last 90 days' },
            ]}
            value={dateRange}
            onChange={(value) => setDateRange(value || '30')}
            allowClear={false}
            className="w-48"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
        {/* Total Users Card */}
        <div
          className={`p-6 rounded-xl border ${
            darkMode
              ? 'bg-zenible-dark-card border-zenible-dark-border'
              : 'bg-white border-neutral-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className={`text-sm font-medium ${
                  darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'
                }`}
              >
                Total Users
              </p>
              <p
                className={`text-2xl font-semibold mt-2 ${
                  darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
                }`}
              >
                {stats?.total_users || 0}
              </p>
              {stats?.user_growth !== undefined && (
                <p
                  className={`text-sm mt-2 ${
                    stats.user_growth >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {formatPercentage(stats.user_growth)} from last period
                </p>
              )}
            </div>
            <div className="text-blue-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Verified Users Card */}
        <div
          className={`p-6 rounded-xl border ${
            darkMode
              ? 'bg-zenible-dark-card border-zenible-dark-border'
              : 'bg-white border-neutral-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className={`text-sm font-medium ${
                  darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'
                }`}
              >
                Verified Users
              </p>
              <p
                className={`text-2xl font-semibold mt-2 ${
                  darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
                }`}
              >
                {stats?.verified_users || 0}
              </p>
              {stats?.total_users > 0 && (
                <p
                  className={`text-sm mt-2 ${
                    darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'
                  }`}
                >
                  {((stats.verified_users / stats.total_users) * 100).toFixed(1)}% of total
                </p>
              )}
            </div>
            <div className="text-green-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Active Subscriptions Card */}
        <div
          className={`p-6 rounded-xl border ${
            darkMode
              ? 'bg-zenible-dark-card border-zenible-dark-border'
              : 'bg-white border-neutral-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className={`text-sm font-medium ${
                  darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'
                }`}
              >
                Active Subscriptions
              </p>
              <p
                className={`text-2xl font-semibold mt-2 ${
                  darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
                }`}
              >
                {stats?.active_subscriptions || 0}
              </p>
              {stats?.subscription_growth !== undefined && (
                <p
                  className={`text-sm mt-2 ${
                    stats.subscription_growth >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {formatPercentage(stats.subscription_growth)} from last period
                </p>
              )}
            </div>
            <div className="text-purple-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Revenue Card */}
        <div
          className={`p-6 rounded-xl border ${
            darkMode
              ? 'bg-zenible-dark-card border-zenible-dark-border'
              : 'bg-white border-neutral-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className={`text-sm font-medium ${
                  darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'
                }`}
              >
                Total Revenue
              </p>
              <p
                className={`text-2xl font-semibold mt-2 ${
                  darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
                }`}
              >
                {formatCurrency(stats?.total_revenue || 0)}
              </p>
              {stats?.monthly_revenue !== undefined && (
                <p
                  className={`text-sm mt-2 ${
                    darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'
                  }`}
                >
                  {formatCurrency(stats.monthly_revenue)} this month
                </p>
              )}
            </div>
            <div className="text-yellow-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* Revenue Summary */}
        {revenue && (
          <div
            className={`p-6 rounded-xl border ${
              darkMode
                ? 'bg-zenible-dark-card border-zenible-dark-border'
                : 'bg-white border-neutral-200'
            }`}
          >
            <h3
              className={`text-lg font-semibold mb-4 ${
                darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
              }`}
            >
              Revenue Summary ({dateRange} days)
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className={`${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                  Total Revenue
                </span>
                <span className={`font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                  {formatCurrency(revenue.total || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                  Average Daily
                </span>
                <span className={`font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                  {formatCurrency((revenue.total || 0) / parseInt(dateRange))}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                  Transactions
                </span>
                <span className={`font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                  {revenue.transaction_count || 0}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* User Activity Summary */}
        {userAnalytics && (
          <div
            className={`p-6 rounded-xl border ${
              darkMode
                ? 'bg-zenible-dark-card border-zenible-dark-border'
                : 'bg-white border-neutral-200'
            }`}
          >
            <h3
              className={`text-lg font-semibold mb-4 ${
                darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
              }`}
            >
              User Activity ({dateRange} days)
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className={`${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                  New Registrations
                </span>
                <span className={`font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                  {userAnalytics.new_users || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                  Active Users
                </span>
                <span className={`font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                  {userAnalytics.active_users || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                  Churn Rate
                </span>
                <span className={`font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                  {userAnalytics.churn_rate ? `${userAnalytics.churn_rate.toFixed(1)}%` : '0%'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="p-6">
        <div
          className={`p-6 rounded-xl border ${
            darkMode
              ? 'bg-zenible-dark-card border-zenible-dark-border'
              : 'bg-white border-neutral-200'
          }`}
        >
          <h3
            className={`text-lg font-semibold mb-4 ${
              darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
            }`}
          >
            System Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p
                className={`text-sm font-medium mb-2 ${
                  darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'
                }`}
              >
                User Distribution
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-700'}`}>
                    Verified
                  </span>
                  <span className={`text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                    {stats?.verified_users || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-700'}`}>
                    Unverified
                  </span>
                  <span className={`text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                    {(stats?.total_users || 0) - (stats?.verified_users || 0)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <p
                className={`text-sm font-medium mb-2 ${
                  darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'
                }`}
              >
                Subscription Health
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-700'}`}>
                    Active
                  </span>
                  <span className={`text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                    {stats?.active_subscriptions || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-700'}`}>
                    Growth Rate
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      (stats?.subscription_growth || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {formatPercentage(stats?.subscription_growth || 0)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <p
                className={`text-sm font-medium mb-2 ${
                  darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'
                }`}
              >
                Revenue Metrics
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-700'}`}>
                    Monthly
                  </span>
                  <span className={`text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                    {formatCurrency(stats?.monthly_revenue || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-700'}`}>
                    Total
                  </span>
                  <span className={`text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                    {formatCurrency(stats?.total_revenue || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
