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
 * Calculate item-level taxes total from line items
 * @param {Array} lineItems - Array of line items with taxes array
 * @returns {number} Total item-level taxes
 */
export const calculateItemLevelTaxes = (lineItems = []) => {
  return lineItems.reduce((total, item) => {
    if (item.taxes && Array.isArray(item.taxes)) {
      return total + item.taxes.reduce((taxSum, tax) => taxSum + (parseFloat(tax.tax_amount) || 0), 0);
    }
    return total;
  }, 0);
};

/**
 * Get tax breakdown grouped by tax name
 * @param {Array} lineItems - Array of line items with taxes array
 * @returns {Array} Array of { tax_name, tax_rate, tax_amount } grouped by name
 */
export const getTaxBreakdown = (lineItems = []) => {
  const taxGroups = {};

  lineItems.forEach(item => {
    if (item.taxes && Array.isArray(item.taxes)) {
      item.taxes.forEach(tax => {
        const key = `${tax.tax_name}_${tax.tax_rate}`;
        if (!taxGroups[key]) {
          taxGroups[key] = {
            tax_name: tax.tax_name,
            tax_rate: tax.tax_rate,
            tax_amount: 0
          };
        }
        taxGroups[key].tax_amount += parseFloat(tax.tax_amount) || 0;
      });
    }
  });

  return Object.values(taxGroups).map(tax => ({
    ...tax,
    tax_amount: parseFloat(tax.tax_amount.toFixed(2))
  }));
};

/**
 * Calculate invoice/quote total
 * @param {Array} lineItems - Array of line items (may include taxes array per item)
 * @param {Array} documentTaxes - Array of document-level taxes { tax_name, tax_rate } (applied after discount)
 * @param {string} discountType - 'percentage' or 'fixed'
 * @param {number} discountValue - Discount value (percentage or fixed amount)
 * @returns {Object} Breakdown of totals
 */
export const calculateInvoiceTotal = (lineItems = [], documentTaxes = [], discountType = 'percentage', discountValue = 0) => {
  // Calculate subtotal (before tax and discount)
  const subtotal = calculateSubtotal(lineItems);

  // Calculate item-level taxes (from each item's taxes array)
  const itemLevelTax = calculateItemLevelTaxes(lineItems);

  // Calculate discount
  let discount = 0;
  if (discountValue > 0) {
    if (discountType === 'percentage') {
      discount = (subtotal * discountValue) / 100;
    } else {
      discount = parseFloat(discountValue) || 0;
    }
  }

  // Subtotal after discount
  const subtotalAfterDiscount = Math.max(0, subtotal - discount);

  // Calculate document-level taxes on subtotal after discount
  // Support both array format and legacy single tax rate
  let documentTaxTotal = 0;
  let documentTaxBreakdown = [];

  if (Array.isArray(documentTaxes) && documentTaxes.length > 0) {
    // New format: array of { tax_name, tax_rate }
    documentTaxBreakdown = documentTaxes.map(tax => {
      const rate = parseFloat(tax.tax_rate) || 0;
      const amount = (subtotalAfterDiscount * rate) / 100;
      return {
        tax_name: tax.tax_name || 'Tax',
        tax_rate: rate,
        tax_amount: parseFloat(amount.toFixed(2))
      };
    });
    documentTaxTotal = documentTaxBreakdown.reduce((sum, t) => sum + t.tax_amount, 0);
  } else if (typeof documentTaxes === 'number' && documentTaxes > 0) {
    // Legacy format: single tax rate number
    documentTaxTotal = (subtotalAfterDiscount * documentTaxes) / 100;
    documentTaxBreakdown = [{
      tax_name: 'Tax',
      tax_rate: documentTaxes,
      tax_amount: parseFloat(documentTaxTotal.toFixed(2))
    }];
  }

  // Total tax = item-level taxes + document-level taxes
  const totalTax = itemLevelTax + documentTaxTotal;

  // Total (subtotal - discount + item taxes + document taxes)
  const total = subtotalAfterDiscount + totalTax;

  // Get item-level tax breakdown for display
  const itemTaxBreakdown = getTaxBreakdown(lineItems);

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    discount: parseFloat(discount.toFixed(2)),
    subtotalAfterDiscount: parseFloat(subtotalAfterDiscount.toFixed(2)),
    itemLevelTax: parseFloat(itemLevelTax.toFixed(2)),
    documentTax: parseFloat(documentTaxTotal.toFixed(2)),
    documentTaxBreakdown,
    tax: parseFloat(totalTax.toFixed(2)),
    taxTotal: parseFloat(totalTax.toFixed(2)), // Alias for backwards compatibility
    taxBreakdown: itemTaxBreakdown,
    total: parseFloat(total.toFixed(2)),
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
