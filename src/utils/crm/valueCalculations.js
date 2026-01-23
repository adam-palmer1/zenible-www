/**
 * Contact value calculation utilities
 *
 * Provides functions for calculating contact values, totals, and projections
 */

/**
 * Calculate total annual value for a contact
 * Formula: (confirmed_recurring + active_recurring) + (confirmed_one_off + active_one_off)
 * Note: recurring totals from API are already annualized
 *
 * @param {Object} contact - Contact object with financial data
 * @param {number} contact.confirmed_recurring_total - Confirmed annualized recurring revenue
 * @param {number} contact.active_recurring_total - Active annualized recurring revenue
 * @param {number} contact.confirmed_one_off_total - Confirmed one-off total
 * @param {number} contact.active_one_off_total - Active one-off total
 * @returns {number} Total annual value
 */
export const calculateContactValue = (contact) => {
  const confirmedRecurring = parseFloat(contact?.confirmed_recurring_total) || 0;
  const activeRecurring = parseFloat(contact?.active_recurring_total) || 0;
  const confirmedOneOff = parseFloat(contact?.confirmed_one_off_total) || 0;
  const activeOneOff = parseFloat(contact?.active_one_off_total) || 0;
  return confirmedRecurring + activeRecurring + confirmedOneOff + activeOneOff;
};

/**
 * Calculate annual recurring revenue (ARR) for a contact
 * Sums confirmed and active recurring totals (already annualized from API)
 *
 * @param {Object} contact - Contact object
 * @param {number} contact.confirmed_recurring_total - Confirmed annualized recurring
 * @param {number} contact.active_recurring_total - Active annualized recurring
 * @returns {number} Annual recurring revenue
 */
export const calculateMRR = (contact) => {
  const confirmedRecurring = parseFloat(contact?.confirmed_recurring_total) || 0;
  const activeRecurring = parseFloat(contact?.active_recurring_total) || 0;
  // Note: API returns annualized values, so divide by 12 for monthly
  return (confirmedRecurring + activeRecurring) / 12;
};

/**
 * Calculate annual recurring revenue (ARR) for a contact
 *
 * @param {Object} contact - Contact object
 * @param {number} contact.confirmed_recurring_total - Confirmed annualized recurring
 * @param {number} contact.active_recurring_total - Active annualized recurring
 * @returns {number} Annual recurring revenue
 */
export const calculateARR = (contact) => {
  const confirmedRecurring = parseFloat(contact?.confirmed_recurring_total) || 0;
  const activeRecurring = parseFloat(contact?.active_recurring_total) || 0;
  return confirmedRecurring + activeRecurring;
};

/**
 * Calculate total one-off value for a contact
 *
 * @param {Object} contact - Contact object
 * @param {number} contact.one_off_total - One-time payment total
 * @returns {number} One-off total
 */
export const calculateOneOffTotal = (contact) => {
  return contact?.one_off_total || 0;
};

/**
 * Calculate lifetime value (LTV) projection for a contact
 * Uses simplified formula: ARR + One-off total
 *
 * @param {Object} contact - Contact object
 * @returns {number} Projected lifetime value
 */
export const calculateLTV = (contact) => {
  return calculateARR(contact) + calculateOneOffTotal(contact);
};

/**
 * Get value breakdown for a contact
 *
 * @param {Object} contact - Contact object
 * @returns {Object} Value breakdown with all calculations
 */
export const getValueBreakdown = (contact) => {
  return {
    mrr: calculateMRR(contact),
    arr: calculateARR(contact),
    oneOffTotal: calculateOneOffTotal(contact),
    totalValue: calculateContactValue(contact),
    ltv: calculateLTV(contact)
  };
};
