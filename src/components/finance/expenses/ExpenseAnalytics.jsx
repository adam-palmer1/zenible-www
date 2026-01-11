import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { useExpenses } from '../../../contexts/ExpenseContext';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

const ExpenseAnalytics = () => {
  const {
    expenses,
    categories,
    loading,
  } = useExpenses();

  // Filter states
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState('6months');
  const [analyticsCategory, setAnalyticsCategory] = useState('');
  const [viewType, setViewType] = useState('overview');

  // Advanced analytics calculations
  const analyticsData = useMemo(() => {
    if (!expenses || expenses.length === 0) {
      return {
        monthlyTrends: [],
        categoryAnalysis: [],
        vendorAnalysis: [],
        expensePatterns: {},
        growthMetrics: {},
        anomalies: [],
      };
    }

    // Time range filtering
    const now = new Date();
    let startDate;

    switch (analyticsTimeRange) {
      case '1month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        break;
      case '3months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case '6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        break;
      case '1year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
      default:
        startDate = new Date(2020, 0, 1);
    }

    let filteredExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.expense_date);
      let passesFilters = expenseDate >= startDate;

      if (analyticsCategory) {
        passesFilters = passesFilters && expense.category_id === analyticsCategory;
      }

      return passesFilters;
    });

    // Monthly trends analysis
    const monthlyData = {};
    filteredExpenses.forEach(expense => {
      const date = new Date(expense.expense_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          total: 0,
          count: 0,
          categories: {},
        };
      }

      monthlyData[monthKey].total += parseFloat(expense.amount || 0);
      monthlyData[monthKey].count += 1;

      const category = expense.category_name || 'Uncategorized';
      monthlyData[monthKey].categories[category] = (monthlyData[monthKey].categories[category] || 0) + parseFloat(expense.amount || 0);
    });

    const monthlyTrends = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        ...data,
        average: data.total / (data.count || 1)
      }));

    // Category analysis with growth rates
    const categoryTotals = {};
    const categoryMonthly = {};

    filteredExpenses.forEach(expense => {
      const category = expense.category_name || 'Uncategorized';
      const date = new Date(expense.expense_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      categoryTotals[category] = (categoryTotals[category] || 0) + parseFloat(expense.amount || 0);

      if (!categoryMonthly[category]) {
        categoryMonthly[category] = {};
      }
      categoryMonthly[category][monthKey] = (categoryMonthly[category][monthKey] || 0) + parseFloat(expense.amount || 0);
    });

    const categoryAnalysis = Object.entries(categoryTotals)
      .map(([category, total]) => {
        const monthlyAmounts = Object.values(categoryMonthly[category] || {});
        const avgMonthly = monthlyAmounts.length > 0 ? total / monthlyAmounts.length : 0;

        // Calculate growth rate
        const sortedMonths = Object.keys(categoryMonthly[category] || {}).sort();
        const lastMonth = sortedMonths[sortedMonths.length - 1];
        const prevMonth = sortedMonths[sortedMonths.length - 2];

        let growthRate = 0;
        if (lastMonth && prevMonth) {
          const lastAmount = categoryMonthly[category][lastMonth];
          const prevAmount = categoryMonthly[category][prevMonth];
          growthRate = prevAmount > 0 ? ((lastAmount - prevAmount) / prevAmount) * 100 : 0;
        }

        return {
          category,
          total,
          avgMonthly,
          growthRate,
          percentage: (total / Object.values(categoryTotals).reduce((a, b) => a + b, 0)) * 100
        };
      })
      .sort((a, b) => b.total - a.total);

    // Expense patterns analysis
    const dayOfWeekData = Array(7).fill(0);

    filteredExpenses.forEach(expense => {
      const date = new Date(expense.expense_date);
      dayOfWeekData[date.getDay()] += parseFloat(expense.amount || 0);
    });

    const expensePatterns = {
      dayOfWeek: dayOfWeekData.map((amount, index) => ({
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index],
        amount
      })),
    };

    // Growth metrics
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);
    const avgExpenseAmount = totalExpenses / (filteredExpenses.length || 1);

    const growthMetrics = {
      totalExpenses,
      totalTransactions: filteredExpenses.length,
      avgExpenseAmount,
      monthlyGrowth: monthlyTrends.length >= 2 ?
        ((monthlyTrends[monthlyTrends.length - 1]?.total || 0) - (monthlyTrends[monthlyTrends.length - 2]?.total || 0)) /
        (monthlyTrends[monthlyTrends.length - 2]?.total || 1) * 100 : 0
    };

    // Anomaly detection
    const amounts = filteredExpenses.map(e => parseFloat(e.amount || 0));
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    const threshold = mean + (2 * stdDev);

    const anomalies = filteredExpenses
      .filter(expense => parseFloat(expense.amount || 0) > threshold)
      .sort((a, b) => parseFloat(b.amount || 0) - parseFloat(a.amount || 0))
      .slice(0, 5);

    return {
      monthlyTrends,
      categoryAnalysis,
      expensePatterns,
      growthMetrics,
      anomalies
    };
  }, [expenses, analyticsTimeRange, analyticsCategory]);

  // Chart configurations
  const monthlyTrendsChartData = {
    labels: analyticsData.monthlyTrends.map(item => {
      const [year, month] = item.month.split('-');
      return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }),
    datasets: [
      {
        label: 'Total Expenses',
        data: analyticsData.monthlyTrends.map(item => item.total),
        borderColor: '#8e51ff',
        backgroundColor: 'rgba(142, 81, 255, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Transaction Count',
        data: analyticsData.monthlyTrends.map(item => item.count),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  };

  const monthlyTrendsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            if (context.datasetIndex === 0) {
              return `Total: $${context.parsed.y.toFixed(2)}`;
            } else {
              return `Transactions: ${context.parsed.y}`;
            }
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: {
          color: '#F3F4F6',
        },
        ticks: {
          callback: function(value) {
            return '$' + value.toFixed(0);
          },
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const categoryAnalysisChartData = {
    labels: analyticsData.categoryAnalysis.slice(0, 8).map(item => item.category),
    datasets: [
      {
        label: 'Total Amount',
        data: analyticsData.categoryAnalysis.slice(0, 8).map(item => item.total),
        backgroundColor: [
          '#8e51ff', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
          '#EC4899', '#14B8A6', '#F97316'
        ],
        borderWidth: 0,
      },
    ],
  };

  const expensePatternsChartData = {
    labels: analyticsData.expensePatterns.dayOfWeek?.map(item => item.day) || [],
    datasets: [
      {
        label: 'Daily Spending Pattern',
        data: analyticsData.expensePatterns.dayOfWeek?.map(item => item.amount) || [],
        backgroundColor: '#8e51ff',
        borderRadius: 4,
      },
    ],
  };

  const expensePatternsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.label}: $${context.parsed.y.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
      },
      y: {
        display: true,
        grid: {
          color: '#F3F4F6',
        },
        ticks: {
          callback: function(value) {
            return '$' + value.toFixed(0);
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="design-bg-primary rounded-lg p-6 shadow-sm">
        <div className="flex flex-col space-y-4">
          <div>
            <h1 className="text-2xl font-bold design-text-primary">Expense Analytics</h1>
            <p className="design-text-secondary mt-1">Deep insights into your spending patterns</p>
          </div>

          {/* View Type Tabs */}
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'trends', label: 'Trends' },
              { id: 'categories', label: 'Categories' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setViewType(tab.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  viewType === tab.id
                    ? 'border-zenible-primary text-zenible-primary'
                    : 'border-transparent design-text-secondary hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={analyticsTimeRange}
              onChange={(e) => setAnalyticsTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary design-bg-primary design-text-primary"
            >
              <option value="1month">Last Month</option>
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last Year</option>
              <option value="all">All Time</option>
            </select>

            <select
              value={analyticsCategory}
              onChange={(e) => setAnalyticsCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary design-bg-primary design-text-primary"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Overview Tab */}
      {viewType === 'overview' && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="design-bg-primary rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium design-text-secondary">Total Spent</p>
                  <p className="text-2xl font-bold design-text-primary">
                    ${parseFloat(analyticsData.growthMetrics.totalExpenses || 0).toFixed(2)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-zenible-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <span className={`text-sm ${analyticsData.growthMetrics.monthlyGrowth >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {analyticsData.growthMetrics.monthlyGrowth >= 0 ? '+' : ''}
                  {analyticsData.growthMetrics.monthlyGrowth?.toFixed(1) || '0'}% from last month
                </span>
              </div>
            </div>

            <div className="design-bg-primary rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium design-text-secondary">Transactions</p>
                  <p className="text-2xl font-bold design-text-primary">
                    {analyticsData.growthMetrics.totalTransactions || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="design-bg-primary rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium design-text-secondary">Avg Transaction</p>
                  <p className="text-2xl font-bold design-text-primary">
                    ${analyticsData.growthMetrics.avgExpenseAmount?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="design-bg-primary rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium design-text-secondary">Anomalies</p>
                  <p className="text-2xl font-bold design-text-primary">
                    {analyticsData.anomalies?.length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.866-.833-2.634 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Spending Patterns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="design-bg-primary rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold design-text-primary mb-4">Spending by Day of Week</h3>
              <div className="h-64">
                <Bar data={expensePatternsChartData} options={expensePatternsChartOptions} />
              </div>
            </div>

            <div className="design-bg-primary rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold design-text-primary mb-4">Unusual Expenses</h3>
              <div className="space-y-3">
                {analyticsData.anomalies?.length > 0 ? (
                  analyticsData.anomalies.map((expense) => (
                    <div key={expense.id} className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <div>
                        <p className="font-medium design-text-primary text-sm">{expense.description}</p>
                        <p className="text-xs design-text-secondary">
                          {expense.category_name} • {new Date(expense.expense_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600 text-sm">
                          ${parseFloat(expense.amount || 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-red-500">High amount</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="design-text-secondary text-center py-8">No unusual expenses detected</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Trends Tab */}
      {viewType === 'trends' && (
        <div className="design-bg-primary rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold design-text-primary mb-4">Monthly Expense Trends</h3>
          <div className="h-96">
            <Line data={monthlyTrendsChartData} options={monthlyTrendsChartOptions} />
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {viewType === 'categories' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="design-bg-primary rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold design-text-primary mb-4">Category Distribution</h3>
              <div className="h-64">
                <Doughnut data={categoryAnalysisChartData} />
              </div>
            </div>

            <div className="design-bg-primary rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold design-text-primary mb-4">Category Performance</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {analyticsData.categoryAnalysis?.map((category) => (
                  <div key={category.category} className="flex justify-between items-center p-3 design-bg-secondary rounded-lg">
                    <div>
                      <p className="font-medium design-text-primary text-sm">{category.category}</p>
                      <p className="text-xs design-text-secondary">
                        {parseFloat(category.percentage || 0).toFixed(1)}% of total
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium design-text-primary text-sm">
                        ${parseFloat(category.total || 0).toFixed(2)}
                      </p>
                      <p className={`text-xs ${category.growthRate >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {category.growthRate >= 0 ? '+' : ''}
                        {parseFloat(category.growthRate || 0).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExpenseAnalytics;
