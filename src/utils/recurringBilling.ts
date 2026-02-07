/**
 * Recurring billing utilities
 * Handles recurring invoice and expense calculations
 */

import { addDays, addWeeks, addMonths, addYears, isAfter, isBefore, format } from 'date-fns';

export const calculateNextBillingDate = (
  startDate: Date | string,
  recurringType = 'Monthly',
  customEvery: number | string = 1,
  customPeriod = 'Months'
): Date => {
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

    case 'custom': {
      const every = parseInt(String(customEvery)) || 1;
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
    }

    default:
      return addMonths(start, 1);
  }
};

export const calculateFutureBillingDates = (
  startDate: Date | string,
  recurringType: string,
  occurrences = -1,
  customEvery: number | string = 1,
  customPeriod = 'Months',
  maxDates = 12
): Date[] => {
  const dates: Date[] = [];
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

export const isRecurringActive = (occurrences: number, currentOccurrence = 0, endDate: Date | string | null = null): boolean => {
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

export const getRecurringFrequencyLabel = (
  recurringType: string,
  customEvery: number | string = 1,
  customPeriod = 'Months'
): string => {
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
    case 'custom': {
      const every = parseInt(String(customEvery)) || 1;
      const period = (customPeriod || 'months').toLowerCase();
      if (every === 1) {
        return `Every ${period.slice(0, -1)}`; // Remove 's' from period
      }
      return `Every ${every} ${period}`;
    }
    default:
      return recurringType;
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const calculateRecurringTotal = (amount: number | string, occurrences: number, _periodInMonths = 12): number | null => {
  if (occurrences === -1) {
    // For unlimited, estimate based on period
    return null; // Or could return amount * (periodInMonths / interval)
  }

  return (parseFloat(String(amount)) || 0) * occurrences;
};

export const formatRecurringSchedule = (
  recurringType: string,
  occurrences: number,
  startDate: Date | string,
  customEvery: number | string = 1,
  customPeriod = 'Months'
): string => {
  const frequency = getRecurringFrequencyLabel(recurringType, customEvery, customPeriod);
  const start = format(new Date(startDate), 'MMM d, yyyy');

  if (occurrences === -1) {
    return `${frequency}, starting ${start} (unlimited)`;
  }

  return `${frequency}, starting ${start} (${occurrences} times)`;
};

export const getRecurringIntervalDays = (
  recurringType: string,
  customEvery: number | string = 1,
  customPeriod = 'Months'
): number => {
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
    case 'custom': {
      const every = parseInt(String(customEvery)) || 1;
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
    }
    default:
      return 30;
  }
};

export const isDueToday = (nextBillingDate: Date | string): boolean => {
  const next = new Date(nextBillingDate);
  const today = new Date();

  return (
    next.getFullYear() === today.getFullYear() &&
    next.getMonth() === today.getMonth() &&
    next.getDate() === today.getDate()
  );
};

export const isOverdue = (nextBillingDate: Date | string): boolean => {
  const next = new Date(nextBillingDate);
  const today = new Date();

  return isBefore(next, today) && !isDueToday(nextBillingDate);
};

export const getDaysUntilBilling = (nextBillingDate: Date | string): number => {
  const next = new Date(nextBillingDate);
  const today = new Date();

  const diffTime = next.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};
