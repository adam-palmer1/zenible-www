/**
 * Invoice calculation utilities
 * Handles tax, discount, deposit, and total calculations for invoices and quotes
 */

/**
 * Calculate line item total (quantity * price)
 */
export const calculateLineItemAmount = (quantity, price) => {
  const qty = parseFloat(quantity) || 0;
  const prc = parseFloat(price) || 0;
  return qty * prc;
};

/**
 * Calculate tax amount for a line item
 */
export const calculateLineItemTax = (amount, taxRate) => {
  const amt = parseFloat(amount) || 0;
  const rate = parseFloat(taxRate) || 0;
  return (amt * rate) / 100;
};

/**
 * Calculate subtotal from line items
 */
export const calculateSubtotal = (lineItems = []) => {
  return lineItems.reduce((total, item) => {
    const amount = calculateLineItemAmount(item.quantity, item.price);
    return total + amount;
  }, 0);
};

/**
 * Calculate total tax from line items
 */
export const calculateTotalTax = (lineItems = []) => {
  return lineItems.reduce((total, item) => {
    const amount = calculateLineItemAmount(item.quantity, item.price);
    const tax = calculateLineItemTax(amount, item.tax_rate || item.tax || 0);
    return total + tax;
  }, 0);
};

/**
 * Calculate discount amount
 * @param {number} subtotal - Subtotal before discount
 * @param {number} discountPercentage - Discount percentage (0-100)
 * @param {number} discountAmount - Fixed discount amount (optional, overrides percentage)
 * @returns {number} Discount amount
 */
export const calculateDiscountAmount = (subtotal, discountPercentage = 0, discountAmount = null) => {
  if (discountAmount !== null && discountAmount !== undefined) {
    return parseFloat(discountAmount) || 0;
  }

  const sub = parseFloat(subtotal) || 0;
  const discPct = parseFloat(discountPercentage) || 0;
  return (sub * discPct) / 100;
};

/**
 * Calculate deposit amount
 * @param {number} total - Total before deposit
 * @param {number} depositPercentage - Deposit percentage (0-100)
 * @param {number} depositAmount - Fixed deposit amount (optional, overrides percentage)
 * @returns {number} Deposit amount
 */
export const calculateDepositAmount = (total, depositPercentage = 0, depositAmount = null) => {
  if (depositAmount !== null && depositAmount !== undefined) {
    return parseFloat(depositAmount) || 0;
  }

  const tot = parseFloat(total) || 0;
  const depPct = parseFloat(depositPercentage) || 0;
  return (tot * depPct) / 100;
};

/**
 * Calculate invoice/quote total
 * @param {Array} lineItems - Array of line items
 * @param {Object} options - Discount and deposit options
 * @returns {Object} Breakdown of totals
 */
export const calculateInvoiceTotal = (lineItems = [], options = {}) => {
  const {
    discountPercentage = 0,
    discountAmount = null,
    depositPercentage = 0,
    depositAmount = null,
  } = options;

  // Calculate subtotal (before tax)
  const subtotal = calculateSubtotal(lineItems);

  // Calculate discount
  const discount = calculateDiscountAmount(subtotal, discountPercentage, discountAmount);

  // Subtotal after discount
  const subtotalAfterDiscount = subtotal - discount;

  // Calculate tax (on subtotal after discount)
  const taxTotal = lineItems.reduce((total, item) => {
    const itemAmount = calculateLineItemAmount(item.quantity, item.price);
    // Proportionally reduce item amount by discount
    const discountRatio = subtotal > 0 ? discount / subtotal : 0;
    const itemAmountAfterDiscount = itemAmount * (1 - discountRatio);
    const tax = calculateLineItemTax(itemAmountAfterDiscount, item.tax_rate || item.tax || 0);
    return total + tax;
  }, 0);

  // Total (subtotal - discount + tax)
  const total = subtotalAfterDiscount + taxTotal;

  // Calculate deposit
  const deposit = calculateDepositAmount(total, depositPercentage, depositAmount);

  // Amount due (total - deposit)
  const amountDue = total - deposit;

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    discount: parseFloat(discount.toFixed(2)),
    subtotalAfterDiscount: parseFloat(subtotalAfterDiscount.toFixed(2)),
    taxTotal: parseFloat(taxTotal.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
    deposit: parseFloat(deposit.toFixed(2)),
    amountDue: parseFloat(amountDue.toFixed(2)),
  };
};

/**
 * Calculate balance due on an invoice
 * @param {number} total - Invoice total
 * @param {number} paidAmount - Amount already paid
 * @returns {number} Balance due
 */
export const calculateBalanceDue = (total, paidAmount = 0) => {
  const tot = parseFloat(total) || 0;
  const paid = parseFloat(paidAmount) || 0;
  return Math.max(0, tot - paid);
};

/**
 * Calculate payment percentage
 * @param {number} paidAmount - Amount paid
 * @param {number} total - Invoice total
 * @returns {number} Percentage paid (0-100)
 */
export const calculatePaymentPercentage = (paidAmount, total) => {
  const paid = parseFloat(paidAmount) || 0;
  const tot = parseFloat(total) || 0;

  if (tot === 0) return 0;

  return Math.min(100, (paid / tot) * 100);
};

/**
 * Determine invoice status based on payment
 * @param {number} total - Invoice total
 * @param {number} paidAmount - Amount paid
 * @param {Date|string} dueDate - Due date
 * @param {string} currentStatus - Current status
 * @returns {string} Status (draft, sent, paid, partially_paid, overdue)
 */
export const determineInvoiceStatus = (total, paidAmount = 0, dueDate, currentStatus = 'draft') => {
  const tot = parseFloat(total) || 0;
  const paid = parseFloat(paidAmount) || 0;

  // If fully paid
  if (paid >= tot && tot > 0) {
    return 'paid';
  }

  // If partially paid
  if (paid > 0 && paid < tot) {
    return 'partially_paid';
  }

  // If sent and past due date
  if ((currentStatus === 'sent' || currentStatus === 'viewed') && dueDate) {
    const due = new Date(dueDate);
    const now = new Date();
    if (now > due) {
      return 'overdue';
    }
  }

  return currentStatus;
};

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @param {string} currencyCode - Currency code (USD, EUR, GBP, etc.)
 * @param {string} locale - Locale for formatting (default: en-US)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currencyCode = 'USD', locale = 'en-US') => {
  const amt = parseFloat(amount) || 0;

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
    }).format(amt);
  } catch (error) {
    // Fallback if currency code is invalid
    return `${currencyCode} ${amt.toFixed(2)}`;
  }
};

/**
 * Round to 2 decimal places (for currency)
 */
export const roundCurrency = (amount) => {
  return Math.round((parseFloat(amount) || 0) * 100) / 100;
};
