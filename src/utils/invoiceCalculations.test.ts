import { describe, it, expect } from 'vitest';
import {
  calculateLineItemAmount,
  calculateLineItemTax,
  calculateSubtotal,
  calculateTotalTax,
  calculateDiscountAmount,
  calculateDepositAmount,
  calculateItemLevelTaxes,
  getTaxBreakdown,
  calculateInvoiceTotal,
  calculateBalanceDue,
  calculatePaymentPercentage,
  determineInvoiceStatus,
  formatCurrency,
  roundCurrency,
} from './invoiceCalculations';

describe('calculateLineItemAmount', () => {
  it('multiplies quantity × price', () => {
    expect(calculateLineItemAmount(3, 10)).toBe(30);
    expect(calculateLineItemAmount(2.5, 4)).toBe(10);
  });

  it('accepts string inputs', () => {
    expect(calculateLineItemAmount('3', '10.50')).toBe(31.5);
  });

  it('returns 0 for invalid inputs', () => {
    expect(calculateLineItemAmount(undefined, 10)).toBe(0);
    expect(calculateLineItemAmount(3, undefined)).toBe(0);
    expect(calculateLineItemAmount('not a number', 'also not')).toBe(0);
  });
});

describe('calculateLineItemTax', () => {
  it('applies tax_rate as a percentage', () => {
    expect(calculateLineItemTax(100, 10)).toBe(10);
    expect(calculateLineItemTax(50, 20)).toBe(10);
  });

  it('returns 0 for zero rate or zero amount', () => {
    expect(calculateLineItemTax(100, 0)).toBe(0);
    expect(calculateLineItemTax(0, 20)).toBe(0);
  });
});

describe('calculateSubtotal', () => {
  it('sums qty*price across line items', () => {
    expect(calculateSubtotal([{ quantity: 2, price: 10 }, { quantity: 3, price: 4 }])).toBe(32);
  });

  it('returns 0 for empty list', () => {
    expect(calculateSubtotal([])).toBe(0);
    expect(calculateSubtotal()).toBe(0);
  });
});

describe('calculateTotalTax', () => {
  it('applies per-line tax_rate', () => {
    // 100 * 10% + 200 * 5% = 10 + 10 = 20
    const items = [
      { quantity: 1, price: 100, tax_rate: 10 },
      { quantity: 2, price: 100, tax_rate: 5 },
    ];
    expect(calculateTotalTax(items)).toBe(20);
  });

  it('falls back to `tax` field if `tax_rate` missing', () => {
    expect(calculateTotalTax([{ quantity: 1, price: 100, tax: 10 }])).toBe(10);
  });
});

describe('calculateDiscountAmount', () => {
  it('uses fixed discountAmount when provided', () => {
    expect(calculateDiscountAmount(100, 10, 25)).toBe(25);
  });

  it('falls back to percentage when discountAmount is null/undefined', () => {
    expect(calculateDiscountAmount(200, 10, null)).toBe(20);
    expect(calculateDiscountAmount(200, 10)).toBe(20);
  });

  it('treats 0 as a fixed discount, not a fallback', () => {
    expect(calculateDiscountAmount(100, 50, 0)).toBe(0);
  });
});

describe('calculateDepositAmount', () => {
  it('uses fixed deposit when provided', () => {
    expect(calculateDepositAmount(500, 20, 100)).toBe(100);
  });

  it('falls back to percentage when null', () => {
    expect(calculateDepositAmount(500, 20, null)).toBe(100);
  });
});

describe('calculateItemLevelTaxes', () => {
  it('sums tax_amount from each tax entry', () => {
    const items = [
      { taxes: [{ tax_amount: 5 }, { tax_amount: 3 }] },
      { taxes: [{ tax_amount: '2.5' }] },
    ];
    expect(calculateItemLevelTaxes(items)).toBe(10.5);
  });

  it('returns 0 when no taxes array', () => {
    expect(calculateItemLevelTaxes([{ quantity: 1, price: 10 }])).toBe(0);
  });
});

describe('getTaxBreakdown', () => {
  it('groups same tax_name + tax_rate', () => {
    const items = [
      { taxes: [{ tax_name: 'VAT', tax_rate: 20, tax_amount: 5 }] },
      { taxes: [{ tax_name: 'VAT', tax_rate: 20, tax_amount: 7 }] },
    ];
    expect(getTaxBreakdown(items)).toEqual([
      { tax_name: 'VAT', tax_rate: 20, tax_amount: 12 },
    ]);
  });

  it('keeps separate entries for different rates', () => {
    const items = [
      { taxes: [{ tax_name: 'VAT', tax_rate: 20, tax_amount: 5 }] },
      { taxes: [{ tax_name: 'VAT', tax_rate: 5, tax_amount: 1 }] },
    ];
    expect(getTaxBreakdown(items)).toHaveLength(2);
  });
});

describe('calculateInvoiceTotal', () => {
  it('combines subtotal, discount, and document-level tax', () => {
    const result = calculateInvoiceTotal(
      [{ quantity: 2, price: 100 }],
      [{ tax_name: 'VAT', tax_rate: 20 }],
      'percentage',
      10,
    );
    // subtotal 200, discount 20, after-discount 180, tax 36, total 216
    expect(result.subtotal).toBe(200);
    expect(result.discount).toBe(20);
    expect(result.subtotalAfterDiscount).toBe(180);
    expect(result.documentTax).toBe(36);
    expect(result.total).toBe(216);
  });

  it('supports legacy numeric tax rate', () => {
    const result = calculateInvoiceTotal([{ quantity: 1, price: 100 }], 10);
    expect(result.documentTax).toBe(10);
    expect(result.total).toBe(110);
  });

  it('applies fixed-amount discount when discountType is "fixed"', () => {
    const result = calculateInvoiceTotal([{ quantity: 1, price: 100 }], 0, 'fixed', 25);
    expect(result.discount).toBe(25);
    expect(result.total).toBe(75);
  });

  it('does not go negative when discount exceeds subtotal', () => {
    const result = calculateInvoiceTotal([{ quantity: 1, price: 50 }], 0, 'fixed', 100);
    expect(result.subtotalAfterDiscount).toBe(0);
    expect(result.total).toBe(0);
  });

  it('adds item-level taxes to document-level taxes', () => {
    const result = calculateInvoiceTotal(
      [{ quantity: 1, price: 100, taxes: [{ tax_amount: 5 }] }],
      [{ tax_rate: 10 }],
    );
    // subtotal 100, document tax 10, item-level tax 5, total 115
    expect(result.itemLevelTax).toBe(5);
    expect(result.documentTax).toBe(10);
    expect(result.tax).toBe(15);
    expect(result.total).toBe(115);
  });

  it('rounds all totals to 2 decimals', () => {
    const result = calculateInvoiceTotal([{ quantity: 3, price: 33.33 }]);
    expect(result.subtotal).toBe(99.99);
  });
});

describe('calculateBalanceDue', () => {
  it('returns total - paid, clamped at 0', () => {
    expect(calculateBalanceDue(100, 30)).toBe(70);
    expect(calculateBalanceDue(100, 150)).toBe(0);
    expect(calculateBalanceDue(100, 0)).toBe(100);
  });
});

describe('calculatePaymentPercentage', () => {
  it('returns paid/total as a percentage, clamped 0-100', () => {
    expect(calculatePaymentPercentage(50, 100)).toBe(50);
    expect(calculatePaymentPercentage(150, 100)).toBe(100); // clamped
  });

  it('returns 0 for zero total', () => {
    expect(calculatePaymentPercentage(10, 0)).toBe(0);
  });
});

describe('determineInvoiceStatus', () => {
  it('is "paid" when fully paid', () => {
    expect(determineInvoiceStatus(100, 100, null)).toBe('paid');
    expect(determineInvoiceStatus(100, 150, null)).toBe('paid');
  });

  it('is "partially_paid" when some paid', () => {
    expect(determineInvoiceStatus(100, 25, null)).toBe('partially_paid');
  });

  it('is "overdue" when sent/viewed past due date with no payment', () => {
    const yesterday = new Date(Date.now() - 86400_000);
    expect(determineInvoiceStatus(100, 0, yesterday, 'sent')).toBe('overdue');
    expect(determineInvoiceStatus(100, 0, yesterday, 'viewed')).toBe('overdue');
  });

  it('preserves currentStatus otherwise', () => {
    expect(determineInvoiceStatus(100, 0, null, 'draft')).toBe('draft');
    expect(determineInvoiceStatus(100, 0, new Date(Date.now() + 86400_000), 'sent')).toBe('sent');
  });

  it('does not flip to "paid" when both are 0 (empty invoice)', () => {
    expect(determineInvoiceStatus(0, 0, null, 'draft')).toBe('draft');
  });
});

describe('formatCurrency', () => {
  it('formats with Intl by default', () => {
    // en-US / USD: $100.00 (may vary slightly by node ICU; just sanity check it returns something sensible)
    const out = formatCurrency(100, 'USD', 'en-US');
    expect(out).toMatch(/\$?100(\.00)?/);
  });

  it('falls back gracefully on invalid currency code', () => {
    const out = formatCurrency(5, 'NOT_A_CURRENCY');
    expect(out).toBe('NOT_A_CURRENCY 5.00');
  });
});

describe('roundCurrency', () => {
  it('rounds to 2 decimals', () => {
    expect(roundCurrency('3.333')).toBe(3.33);
    expect(roundCurrency(1.236)).toBe(1.24);
    expect(roundCurrency(1.234)).toBe(1.23);
  });

  it('returns 0 for invalid input', () => {
    expect(roundCurrency('not a number')).toBe(0);
  });

  // Known float-precision quirk: roundCurrency(1.005) returns 1.00, not 1.01,
  // because 1.005 * 100 === 100.49999999999999. Documented here, not fixed.
});
