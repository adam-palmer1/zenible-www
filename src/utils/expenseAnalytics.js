/**
 * Expense analytics utilities
 * Handles expense data analysis, trends, and reporting
 */

import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, isWithinInterval } from 'date-fns';

/**
 * Calculate total expenses for a period
 * @param {Array<Object>} expenses - Array of expense objects
 * @returns {number} Total amount
 */
export const calculateTotalExpenses = (expenses = []) => {
  return expenses.reduce((total, expense) => {
    return total + (parseFloat(expense.amount) || 0);
  }, 0);
};

/**
 * Group expenses by category
 * @param {Array<Object>} expenses - Array of expense objects
 * @returns {Object} Expenses grouped by category
 */
export const groupExpensesByCategory = (expenses = []) => {
  const grouped = {};

  expenses.forEach((expense) => {
    const categoryId = expense.expense_category_id || expense.category_id || 'uncategorized';
    const categoryName = expense.category?.name || expense.category_name || 'Uncategorized';

    if (!grouped[categoryId]) {
      grouped[categoryId] = {
        id: categoryId,
        name: categoryName,
        expenses: [],
        total: 0,
        count: 0,
      };
    }

    grouped[categoryId].expenses.push(expense);
    grouped[categoryId].total += parseFloat(expense.amount) || 0;
    grouped[categoryId].count += 1;
  });

  return grouped;
};

/**
 * Group expenses by vendor
 * @param {Array<Object>} expenses - Array of expense objects
 * @returns {Object} Expenses grouped by vendor
 */
export const groupExpensesByVendor = (expenses = []) => {
  const grouped = {};

  expenses.forEach((expense) => {
    const vendorId = expense.vendor_id || 'no_vendor';
    const vendorName = expense.vendor?.name || expense.vendor_name || 'No Vendor';

    if (!grouped[vendorId]) {
      grouped[vendorId] = {
        id: vendorId,
        name: vendorName,
        expenses: [],
        total: 0,
        count: 0,
      };
    }

    grouped[vendorId].expenses.push(expense);
    grouped[vendorId].total += parseFloat(expense.amount) || 0;
    grouped[vendorId].count += 1;
  });

  return grouped;
};

/**
 * Group expenses by month
 * @param {Array<Object>} expenses - Array of expense objects
 * @returns {Object} Expenses grouped by month (YYYY-MM)
 */
export const groupExpensesByMonth = (expenses = []) => {
  const grouped = {};

  expenses.forEach((expense) => {
    const date = new Date(expense.expense_date || expense.date);
    const monthKey = format(date, 'yyyy-MM');
    const monthLabel = format(date, 'MMM yyyy');

    if (!grouped[monthKey]) {
      grouped[monthKey] = {
        key: monthKey,
        label: monthLabel,
        expenses: [],
        total: 0,
        count: 0,
      };
    }

    grouped[monthKey].expenses.push(expense);
    grouped[monthKey].total += parseFloat(expense.amount) || 0;
    grouped[monthKey].count += 1;
  });

  return grouped;
};

/**
 * Calculate category breakdown with percentages
 * @param {Array<Object>} expenses - Array of expense objects
 * @returns {Array<Object>} Category breakdown
 */
export const calculateCategoryBreakdown = (expenses = []) => {
  const grouped = groupExpensesByCategory(expenses);
  const total = calculateTotalExpenses(expenses);

  return Object.values(grouped)
    .map((category) => ({
      ...category,
      percentage: total > 0 ? (category.total / total) * 100 : 0,
      average: category.count > 0 ? category.total / category.count : 0,
    }))
    .sort((a, b) => b.total - a.total);
};

/**
 * Calculate vendor analysis
 * @param {Array<Object>} expenses - Array of expense objects
 * @returns {Array<Object>} Vendor analysis
 */
export const calculateVendorAnalysis = (expenses = []) => {
  const grouped = groupExpensesByVendor(expenses);
  const total = calculateTotalExpenses(expenses);

  return Object.values(grouped)
    .map((vendor) => ({
      ...vendor,
      percentage: total > 0 ? (vendor.total / total) * 100 : 0,
      average: vendor.count > 0 ? vendor.total / vendor.count : 0,
    }))
    .sort((a, b) => b.total - a.total);
};

/**
 * Calculate monthly trends
 * @param {Array<Object>} expenses - Array of expense objects
 * @param {number} months - Number of months to analyze
 * @returns {Array<Object>} Monthly trend data
 */
export const calculateMonthlyTrends = (expenses = [], months = 12) => {
  const grouped = groupExpensesByMonth(expenses);
  const sortedMonths = Object.values(grouped).sort((a, b) => a.key.localeCompare(b.key));

  // Calculate month-over-month growth
  return sortedMonths.map((month, index) => {
    const previousMonth = sortedMonths[index - 1];
    let growthRate = 0;

    if (previousMonth && previousMonth.total > 0) {
      growthRate = ((month.total - previousMonth.total) / previousMonth.total) * 100;
    }

    return {
      ...month,
      growthRate,
      average: month.count > 0 ? month.total / month.count : 0,
    };
  });
};

/**
 * Filter expenses by date range
 * @param {Array<Object>} expenses - Array of expense objects
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {Array<Object>} Filtered expenses
 */
export const filterExpensesByDateRange = (expenses = [], startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  return expenses.filter((expense) => {
    const expenseDate = new Date(expense.expense_date || expense.date);
    return isWithinInterval(expenseDate, { start, end });
  });
};

/**
 * Get expenses for current month
 * @param {Array<Object>} expenses - Array of expense objects
 * @returns {Array<Object>} Current month expenses
 */
export const getCurrentMonthExpenses = (expenses = []) => {
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);

  return filterExpensesByDateRange(expenses, start, end);
};

/**
 * Get expenses for current year
 * @param {Array<Object>} expenses - Array of expense objects
 * @returns {Array<Object>} Current year expenses
 */
export const getCurrentYearExpenses = (expenses = []) => {
  const now = new Date();
  const start = startOfYear(now);
  const end = endOfYear(now);

  return filterExpensesByDateRange(expenses, start, end);
};

/**
 * Calculate expense summary statistics
 * @param {Array<Object>} expenses - Array of expense objects
 * @returns {Object} Summary statistics
 */
export const calculateExpenseSummary = (expenses = []) => {
  const total = calculateTotalExpenses(expenses);
  const count = expenses.length;
  const average = count > 0 ? total / count : 0;

  // Find min and max
  const amounts = expenses.map((e) => parseFloat(e.amount) || 0);
  const min = amounts.length > 0 ? Math.min(...amounts) : 0;
  const max = amounts.length > 0 ? Math.max(...amounts) : 0;

  // Calculate median
  const sorted = [...amounts].sort((a, b) => a - b);
  const median = sorted.length > 0
    ? sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)]
    : 0;

  return {
    total: parseFloat(total.toFixed(2)),
    count,
    average: parseFloat(average.toFixed(2)),
    min: parseFloat(min.toFixed(2)),
    max: parseFloat(max.toFixed(2)),
    median: parseFloat(median.toFixed(2)),
  };
};

/**
 * Compare two periods
 * @param {Array<Object>} currentPeriodExpenses - Current period expenses
 * @param {Array<Object>} previousPeriodExpenses - Previous period expenses
 * @returns {Object} Comparison data
 */
export const comparePeriods = (currentPeriodExpenses = [], previousPeriodExpenses = []) => {
  const currentTotal = calculateTotalExpenses(currentPeriodExpenses);
  const previousTotal = calculateTotalExpenses(previousPeriodExpenses);

  const difference = currentTotal - previousTotal;
  const percentageChange = previousTotal > 0 ? (difference / previousTotal) * 100 : 0;

  return {
    currentTotal: parseFloat(currentTotal.toFixed(2)),
    previousTotal: parseFloat(previousTotal.toFixed(2)),
    difference: parseFloat(difference.toFixed(2)),
    percentageChange: parseFloat(percentageChange.toFixed(2)),
    trend: difference > 0 ? 'increase' : difference < 0 ? 'decrease' : 'stable',
  };
};

/**
 * Find top expenses
 * @param {Array<Object>} expenses - Array of expense objects
 * @param {number} limit - Number of top expenses to return
 * @returns {Array<Object>} Top expenses
 */
export const getTopExpenses = (expenses = [], limit = 10) => {
  return [...expenses]
    .sort((a, b) => (parseFloat(b.amount) || 0) - (parseFloat(a.amount) || 0))
    .slice(0, limit);
};

/**
 * Calculate average expense by day of week
 * @param {Array<Object>} expenses - Array of expense objects
 * @returns {Object} Average by day of week
 */
export const calculateAverageByDayOfWeek = (expenses = []) => {
  const byDay = {
    0: { name: 'Sunday', total: 0, count: 0 },
    1: { name: 'Monday', total: 0, count: 0 },
    2: { name: 'Tuesday', total: 0, count: 0 },
    3: { name: 'Wednesday', total: 0, count: 0 },
    4: { name: 'Thursday', total: 0, count: 0 },
    5: { name: 'Friday', total: 0, count: 0 },
    6: { name: 'Saturday', total: 0, count: 0 },
  };

  expenses.forEach((expense) => {
    const date = new Date(expense.expense_date || expense.date);
    const day = date.getDay();

    byDay[day].total += parseFloat(expense.amount) || 0;
    byDay[day].count += 1;
  });

  return Object.values(byDay).map((day) => ({
    ...day,
    average: day.count > 0 ? parseFloat((day.total / day.count).toFixed(2)) : 0,
  }));
};

/**
 * Format analytics data for charts
 * @param {Object} data - Analytics data
 * @param {string} type - Chart type (category, vendor, monthly)
 * @returns {Object} Formatted chart data
 */
export const formatChartData = (data, type = 'category') => {
  switch (type) {
    case 'category':
      return {
        labels: data.map((d) => d.name),
        datasets: [{
          label: 'Amount',
          data: data.map((d) => d.total),
        }],
      };

    case 'vendor':
      return {
        labels: data.map((d) => d.name),
        datasets: [{
          label: 'Amount',
          data: data.map((d) => d.total),
        }],
      };

    case 'monthly':
      return {
        labels: data.map((d) => d.label),
        datasets: [{
          label: 'Total Expenses',
          data: data.map((d) => d.total),
        }],
      };

    default:
      return data;
  }
};
