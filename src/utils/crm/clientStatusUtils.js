/**
 * Client status calculation utilities
 *
 * Provides functions for determining client status based on financial data and activity
 */

/**
 * Calculate the number of days between two dates
 *
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date (defaults to now)
 * @returns {number|null} Number of days, or null if date1 is invalid
 */
export const daysBetween = (date1, date2 = new Date()) => {
  if (!date1) return null;

  const d1 = date1 instanceof Date ? date1 : new Date(date1);
  const d2 = date2 instanceof Date ? date2 : new Date(date2);

  if (isNaN(d1.getTime())) return null;

  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
};

/**
 * Calculate client status based on financial data and dates
 *
 * Status logic:
 * - NEW: Created within last 30 days AND never made a payment
 * - ACTIVE: Made payment within last 30 days OR has active recurring invoice
 * - COLD: Created more than 90 days ago AND has made at least 1 payment BUT doesn't meet Active criteria
 * - INACTIVE: Created more than 30 days ago AND has made at least 1 payment BUT doesn't meet Active criteria
 *
 * @param {Object} client - Client object
 * @param {string} client.created_at - Client creation date
 * @param {Object} financialData - Financial data for the client
 * @param {string} financialData.last_payment_date - Date of last payment
 * @param {number} financialData.payment_count - Total number of payments
 * @param {boolean} financialData.has_recurring_invoice - Whether client has active recurring invoice
 * @returns {Object} Status object with status and color
 */
export const calculateClientStatus = (client, financialData = {}) => {
  const now = new Date();
  const daysSinceCreated = daysBetween(client.created_at, now);
  const paymentCount = financialData.payment_count || 0;
  const hasActiveRecurring = financialData.has_recurring_invoice || false;
  const daysSinceLastPayment = daysBetween(financialData.last_payment_date, now);

  // NEW: Created within last 30 days AND never made a payment
  if (daysSinceCreated !== null && daysSinceCreated <= 30 && paymentCount === 0) {
    return { status: 'New', color: 'orange' };
  }

  // ACTIVE: Made payment within last 30 days OR has active recurring invoice
  if ((daysSinceLastPayment !== null && daysSinceLastPayment <= 30) || hasActiveRecurring) {
    return { status: 'Active', color: 'green' };
  }

  // COLD: Created more than 90 days ago AND has made at least 1 payment BUT doesn't meet Active criteria
  if (daysSinceCreated !== null && daysSinceCreated > 90 && paymentCount > 0) {
    return { status: 'Cold', color: 'red' };
  }

  // INACTIVE: Created more than 30 days ago AND has made at least 1 payment BUT doesn't meet Active criteria
  if (daysSinceCreated !== null && daysSinceCreated > 30 && paymentCount > 0) {
    return { status: 'Inactive', color: 'yellow' };
  }

  // Default fallback
  return { status: 'New', color: 'orange' };
};

/**
 * Get color classes for a client status
 *
 * @param {string} status - Client status ('New', 'Active', 'Inactive', 'Cold')
 * @returns {Object} Object with CSS class names for badge and dot
 */
export const getClientStatusColorClasses = (status) => {
  const colorMap = {
    New: {
      badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      dot: 'bg-orange-600'
    },
    Active: {
      badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      dot: 'bg-green-600'
    },
    Inactive: {
      badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      dot: 'bg-yellow-600'
    },
    Cold: {
      badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      dot: 'bg-red-600'
    }
  };

  return colorMap[status] || colorMap.New;
};

/**
 * Get all possible client statuses
 *
 * @returns {Array} Array of status objects
 */
export const getAllClientStatuses = () => {
  return [
    { value: 'New', label: 'New', color: 'orange' },
    { value: 'Active', label: 'Active', color: 'green' },
    { value: 'Inactive', label: 'Inactive', color: 'yellow' },
    { value: 'Cold', label: 'Cold', color: 'red' }
  ];
};
