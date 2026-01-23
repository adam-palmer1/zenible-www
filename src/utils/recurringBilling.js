/**
 * Recurring billing utilities
 * Handles recurring invoice and expense calculations
 */

import { addDays, addWeeks, addMonths, addYears, isAfter, isBefore, format } from 'date-fns';

/**
 * Calculate next billing date based on recurring settings
 * @param {Date|string} startDate - Start date
 * @param {string} recurringType - Type: 'Weekly', 'Monthly', 'Quarterly', 'Yearly', 'Custom'
 * @param {number} customEvery - For custom: every X periods
 * @param {string} customPeriod - For custom: 'Days', 'Weeks', 'Months', 'Years'
 * @returns {Date} Next billing date
 */
export const calculateNextBillingDate = (
  startDate,
  recurringType = 'Monthly',
  customEvery = 1,
  customPeriod = 'Months'
) => {
  const start = new Date(startDate);
  // Normalize to lowercase for case-insensitive matching
  const type = (recurringType || 'monthly').toLowerCase();
  const period = (customPeriod || 'months').toLowerCase();

  switch (type) {
    case 'weekly':
      return addWeeks(start, 1);

    case 'monthly':
      return addMonths(start, 1);

    case 'quarterly':
      return addMonths(start, 3);

    case 'yearly':
      return addYears(start, 1);

    case 'custom':
      const every = parseInt(customEvery) || 1;
      switch (period) {
        case 'days':
          return addDays(start, every);
        case 'weeks':
          return addWeeks(start, every);
        case 'months':
          return addMonths(start, every);
        case 'years':
          return addYears(start, every);
        default:
          return addMonths(start, every);
      }

    default:
      return addMonths(start, 1);
  }
};

/**
 * Calculate all future billing dates up to a limit
 * @param {Date|string} startDate - Start date
 * @param {string} recurringType - Recurring type
 * @param {number} occurrences - Number of occurrences (-1 for unlimited)
 * @param {number} customEvery - For custom recurring
 * @param {string} customPeriod - For custom recurring
 * @param {number} maxDates - Maximum dates to return (default: 12)
 * @returns {Array<Date>} Array of billing dates
 */
export const calculateFutureBillingDates = (
  startDate,
  recurringType,
  occurrences = -1,
  customEvery = 1,
  customPeriod = 'Months',
  maxDates = 12
) => {
  const dates = [];
  let currentDate = new Date(startDate);
  const limit = occurrences === -1 ? maxDates : Math.min(occurrences, maxDates);

  for (let i = 0; i < limit; i++) {
    dates.push(new Date(currentDate));
    currentDate = calculateNextBillingDate(
      currentDate,
      recurringType,
      customEvery,
      customPeriod
    );
  }

  return dates;
};

/**
 * Check if a recurring invoice/expense is still active
 * @param {number} occurrences - Total occurrences (-1 for unlimited)
 * @param {number} currentOccurrence - Current occurrence number
 * @param {Date|string} endDate - End date (optional)
 * @returns {boolean} Is active
 */
export const isRecurringActive = (occurrences, currentOccurrence = 0, endDate = null) => {
  // Check occurrence limit
  if (occurrences !== -1 && currentOccurrence >= occurrences) {
    return false;
  }

  // Check end date
  if (endDate) {
    const now = new Date();
    const end = new Date(endDate);
    if (isAfter(now, end)) {
      return false;
    }
  }

  return true;
};

/**
 * Get recurring frequency label
 * @param {string} recurringType - Recurring type
 * @param {number} customEvery - For custom recurring
 * @param {string} customPeriod - For custom recurring
 * @returns {string} Human-readable frequency label
 */
export const getRecurringFrequencyLabel = (
  recurringType,
  customEvery = 1,
  customPeriod = 'Months'
) => {
  // Normalize to lowercase for case-insensitive matching
  const type = (recurringType || 'monthly').toLowerCase();

  switch (type) {
    case 'weekly':
      return 'Every week';
    case 'monthly':
      return 'Every month';
    case 'quarterly':
      return 'Every 3 months';
    case 'yearly':
      return 'Every year';
    case 'custom':
      const every = parseInt(customEvery) || 1;
      const period = (customPeriod || 'months').toLowerCase();
      if (every === 1) {
        return `Every ${period.slice(0, -1)}`; // Remove 's' from period
      }
      return `Every ${every} ${period}`;
    default:
      return recurringType;
  }
};

/**
 * Calculate total revenue/cost from recurring billing
 * @param {number} amount - Amount per occurrence
 * @param {number} occurrences - Total occurrences (-1 for unlimited)
 * @param {number} periodInMonths - Period length in months (for unlimited calculation)
 * @returns {number|null} Total amount (null if unlimited)
 */
export const calculateRecurringTotal = (amount, occurrences, periodInMonths = 12) => {
  if (occurrences === -1) {
    // For unlimited, estimate based on period
    return null; // Or could return amount * (periodInMonths / interval)
  }

  return (parseFloat(amount) || 0) * occurrences;
};

/**
 * Format recurring schedule description
 * @param {string} recurringType - Recurring type
 * @param {number} occurrences - Total occurrences
 * @param {Date|string} startDate - Start date
 * @param {number} customEvery - For custom recurring
 * @param {string} customPeriod - For custom recurring
 * @returns {string} Schedule description
 */
export const formatRecurringSchedule = (
  recurringType,
  occurrences,
  startDate,
  customEvery = 1,
  customPeriod = 'Months'
) => {
  const frequency = getRecurringFrequencyLabel(recurringType, customEvery, customPeriod);
  const start = format(new Date(startDate), 'MMM d, yyyy');

  if (occurrences === -1) {
    return `${frequency}, starting ${start} (unlimited)`;
  }

  return `${frequency}, starting ${start} (${occurrences} times)`;
};

/**
 * Get interval in days for a recurring type
 * @param {string} recurringType - Recurring type
 * @param {number} customEvery - For custom recurring
 * @param {string} customPeriod - For custom recurring
 * @returns {number} Interval in days
 */
export const getRecurringIntervalDays = (
  recurringType,
  customEvery = 1,
  customPeriod = 'Months'
) => {
  // Normalize to lowercase for case-insensitive matching
  const type = (recurringType || 'monthly').toLowerCase();
  const period = (customPeriod || 'months').toLowerCase();

  switch (type) {
    case 'weekly':
      return 7;
    case 'monthly':
      return 30; // Approximate
    case 'quarterly':
      return 90; // Approximate
    case 'yearly':
      return 365; // Approximate
    case 'custom':
      const every = parseInt(customEvery) || 1;
      switch (period) {
        case 'days':
          return every;
        case 'weeks':
          return every * 7;
        case 'months':
          return every * 30; // Approximate
        case 'years':
          return every * 365; // Approximate
        default:
          return 30;
      }
    default:
      return 30;
  }
};

/**
 * Check if billing is due today
 * @param {Date|string} nextBillingDate - Next billing date
 * @returns {boolean} Is due today
 */
export const isDueToday = (nextBillingDate) => {
  const next = new Date(nextBillingDate);
  const today = new Date();

  return (
    next.getFullYear() === today.getFullYear() &&
    next.getMonth() === today.getMonth() &&
    next.getDate() === today.getDate()
  );
};

/**
 * Check if billing is overdue
 * @param {Date|string} nextBillingDate - Next billing date
 * @returns {boolean} Is overdue
 */
export const isOverdue = (nextBillingDate) => {
  const next = new Date(nextBillingDate);
  const today = new Date();

  return isBefore(next, today) && !isDueToday(nextBillingDate);
};

/**
 * Get days until next billing
 * @param {Date|string} nextBillingDate - Next billing date
 * @returns {number} Days until billing (negative if overdue)
 */
export const getDaysUntilBilling = (nextBillingDate) => {
  const next = new Date(nextBillingDate);
  const today = new Date();

  const diffTime = next.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};
