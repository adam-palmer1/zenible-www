/**
 * Tax calculation utilities
 * Handles tax calculations for invoices, quotes, and expenses
 */

/**
 * Calculate tax amount
 * @param {number} amount - Amount before tax
 * @param {number} taxRate - Tax rate percentage (0-100)
 * @returns {number} Tax amount
 */
export const calculateTaxAmount = (amount, taxRate) => {
  const amt = parseFloat(amount) || 0;
  const rate = parseFloat(taxRate) || 0;
  return (amt * rate) / 100;
};

/**
 * Calculate amount with tax included
 * @param {number} amount - Amount before tax
 * @param {number} taxRate - Tax rate percentage
 * @returns {number} Amount including tax
 */
export const calculateAmountWithTax = (amount, taxRate) => {
  const amt = parseFloat(amount) || 0;
  const tax = calculateTaxAmount(amt, taxRate);
  return amt + tax;
};

/**
 * Calculate amount from tax-inclusive price
 * @param {number} totalAmount - Total amount including tax
 * @param {number} taxRate - Tax rate percentage
 * @returns {Object} Breakdown { amountBeforeTax, taxAmount }
 */
export const calculateAmountFromTaxInclusive = (totalAmount, taxRate) => {
  const total = parseFloat(totalAmount) || 0;
  const rate = parseFloat(taxRate) || 0;

  const amountBeforeTax = total / (1 + rate / 100);
  const taxAmount = total - amountBeforeTax;

  return {
    amountBeforeTax: parseFloat(amountBeforeTax.toFixed(2)),
    taxAmount: parseFloat(taxAmount.toFixed(2)),
  };
};

/**
 * Calculate compound tax (tax on tax)
 * @param {number} amount - Amount before tax
 * @param {Array<number>} taxRates - Array of tax rates
 * @returns {Object} Breakdown of taxes
 */
export const calculateCompoundTax = (amount, taxRates = []) => {
  const amt = parseFloat(amount) || 0;
  let currentAmount = amt;
  const taxBreakdown = [];

  taxRates.forEach((rate, index) => {
    const taxAmount = calculateTaxAmount(currentAmount, rate);
    taxBreakdown.push({
      rate,
      amount: parseFloat(taxAmount.toFixed(2)),
      label: `Tax ${index + 1} (${rate}%)`,
    });
    currentAmount += taxAmount;
  });

  const totalTax = taxBreakdown.reduce((sum, tax) => sum + tax.amount, 0);

  return {
    amountBeforeTax: amt,
    taxBreakdown,
    totalTax: parseFloat(totalTax.toFixed(2)),
    totalAmount: parseFloat(currentAmount.toFixed(2)),
  };
};

/**
 * Calculate combined tax (multiple taxes on same base)
 * @param {number} amount - Amount before tax
 * @param {Array<Object>} taxes - Array of tax objects { name, rate }
 * @returns {Object} Breakdown of taxes
 */
export const calculateCombinedTax = (amount, taxes = []) => {
  const amt = parseFloat(amount) || 0;
  const taxBreakdown = [];

  taxes.forEach((tax) => {
    const taxAmount = calculateTaxAmount(amt, tax.rate);
    taxBreakdown.push({
      name: tax.name,
      rate: tax.rate,
      amount: parseFloat(taxAmount.toFixed(2)),
    });
  });

  const totalTax = taxBreakdown.reduce((sum, tax) => sum + tax.amount, 0);

  return {
    amountBeforeTax: amt,
    taxBreakdown,
    totalTax: parseFloat(totalTax.toFixed(2)),
    totalAmount: parseFloat((amt + totalTax).toFixed(2)),
  };
};

/**
 * Get common tax rates by country
 * @param {string} countryCode - ISO country code
 * @returns {Array<Object>} Common tax rates for country
 */
export const getCommonTaxRates = (countryCode) => {
  const taxRates = {
    US: [
      { name: 'State Sales Tax', rate: 0, note: 'Varies by state' },
      { name: 'No Tax', rate: 0 },
    ],
    GB: [
      { name: 'Standard VAT', rate: 20 },
      { name: 'Reduced VAT', rate: 5 },
      { name: 'Zero VAT', rate: 0 },
    ],
    CA: [
      { name: 'GST', rate: 5 },
      { name: 'HST (Ontario)', rate: 13 },
      { name: 'HST (Nova Scotia)', rate: 15 },
      { name: 'PST (BC)', rate: 7 },
      { name: 'PST (Saskatchewan)', rate: 6 },
    ],
    AU: [
      { name: 'GST', rate: 10 },
      { name: 'No GST', rate: 0 },
    ],
    EU: [
      { name: 'Standard VAT (DE)', rate: 19 },
      { name: 'Standard VAT (FR)', rate: 20 },
      { name: 'Standard VAT (IT)', rate: 22 },
      { name: 'Standard VAT (ES)', rate: 21 },
      { name: 'Reduced VAT', rate: 10 },
      { name: 'Zero VAT', rate: 0 },
    ],
    IN: [
      { name: 'GST 18%', rate: 18 },
      { name: 'GST 12%', rate: 12 },
      { name: 'GST 5%', rate: 5 },
      { name: 'GST 0%', rate: 0 },
    ],
  };

  return taxRates[countryCode] || [{ name: 'No Tax', rate: 0 }];
};

/**
 * Validate tax rate
 * @param {number} taxRate - Tax rate to validate
 * @returns {boolean} Is valid
 */
export const isValidTaxRate = (taxRate) => {
  const rate = parseFloat(taxRate);
  return !isNaN(rate) && rate >= 0 && rate <= 100;
};

/**
 * Format tax label
 * @param {string} taxName - Tax name
 * @param {number} taxRate - Tax rate
 * @returns {string} Formatted label (e.g., "VAT (20%)")
 */
export const formatTaxLabel = (taxName, taxRate) => {
  const rate = parseFloat(taxRate) || 0;
  return `${taxName} (${rate}%)`;
};

/**
 * Calculate tax for multiple line items
 * @param {Array<Object>} lineItems - Array of line items with amount and taxRate
 * @returns {Object} Tax breakdown
 */
export const calculateLineItemsTax = (lineItems = []) => {
  const taxGroups = {};
  let totalTax = 0;

  lineItems.forEach((item) => {
    const amount = parseFloat(item.amount) || 0;
    const taxRate = parseFloat(item.tax_rate || item.tax || 0);
    const taxName = item.tax_name || `Tax ${taxRate}%`;

    const taxAmount = calculateTaxAmount(amount, taxRate);
    totalTax += taxAmount;

    // Group by tax rate and name
    const key = `${taxName}_${taxRate}`;
    if (!taxGroups[key]) {
      taxGroups[key] = {
        name: taxName,
        rate: taxRate,
        amount: 0,
      };
    }
    taxGroups[key].amount += taxAmount;
  });

  // Convert to array and round amounts
  const taxBreakdown = Object.values(taxGroups).map((tax) => ({
    ...tax,
    amount: parseFloat(tax.amount.toFixed(2)),
  }));

  return {
    taxBreakdown,
    totalTax: parseFloat(totalTax.toFixed(2)),
  };
};

/**
 * Round tax amount to nearest cent/penny
 * @param {number} amount - Amount to round
 * @returns {number} Rounded amount
 */
export const roundTaxAmount = (amount) => {
  return Math.round((parseFloat(amount) || 0) * 100) / 100;
};

/**
 * Check if tax is inclusive or exclusive
 * @param {boolean} taxInclusive - Is tax inclusive
 * @returns {string} Label
 */
export const getTaxInclusiveLabel = (taxInclusive) => {
  return taxInclusive ? 'Tax Inclusive' : 'Tax Exclusive';
};
