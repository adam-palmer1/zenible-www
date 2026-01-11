/**
 * Contact value calculation utilities
 *
 * Provides functions for calculating contact values, totals, and projections
 */

/**
 * Calculate total annual value for a contact
 * Formula: (recurring_total * 12) + one_off_total
 *
 * @param {Object} contact - Contact object with financial data
 * @param {number} contact.recurring_total - Monthly recurring revenue
 * @param {number} contact.one_off_total - One-time payment total
 * @returns {number} Total annual value
 */
export const calculateContactValue = (contact) => {
  const recurringTotal = contact?.recurring_total || 0;
  const oneOffTotal = contact?.one_off_total || 0;
  return (recurringTotal * 12) + oneOffTotal;
};

/**
 * Calculate monthly recurring revenue (MRR) for a contact
 *
 * @param {Object} contact - Contact object
 * @param {number} contact.recurring_total - Monthly recurring total
 * @returns {number} Monthly recurring revenue
 */
export const calculateMRR = (contact) => {
  return contact?.recurring_total || 0;
};

/**
 * Calculate annual recurring revenue (ARR) for a contact
 *
 * @param {Object} contact - Contact object
 * @param {number} contact.recurring_total - Monthly recurring total
 * @returns {number} Annual recurring revenue
 */
export const calculateARR = (contact) => {
  const mrr = calculateMRR(contact);
  return mrr * 12;
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
