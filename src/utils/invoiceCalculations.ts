/**
 * Invoice calculation utilities
 * Handles tax, discount, deposit, and total calculations for invoices and quotes
 */

interface LineItem {
  quantity?: number | string;
  price?: number | string;
  tax_rate?: number | string;
  tax?: number | string;
  taxes?: Array<{ tax_name?: string; tax_rate?: number | string; tax_amount?: number | string }>;
}

interface DocumentTax {
  tax_name?: string;
  tax_rate?: number | string;
}

interface TaxBreakdownEntry {
  tax_name: string;
  tax_rate: number | string;
  tax_amount: number;
}

export const calculateLineItemAmount = (quantity: number | string | undefined, price: number | string | undefined): number => {
  const qty = parseFloat(String(quantity)) || 0;
  const prc = parseFloat(String(price)) || 0;
  return qty * prc;
};

export const calculateLineItemTax = (amount: number | string | undefined, taxRate: number | string | undefined): number => {
  const amt = parseFloat(String(amount)) || 0;
  const rate = parseFloat(String(taxRate)) || 0;
  return (amt * rate) / 100;
};

export const calculateSubtotal = (lineItems: LineItem[] = []): number => {
  return lineItems.reduce((total, item) => {
    const amount = calculateLineItemAmount(item.quantity, item.price);
    return total + amount;
  }, 0);
};

export const calculateTotalTax = (lineItems: LineItem[] = []): number => {
  return lineItems.reduce((total, item) => {
    const amount = calculateLineItemAmount(item.quantity, item.price);
    const tax = calculateLineItemTax(amount, item.tax_rate || item.tax || 0);
    return total + tax;
  }, 0);
};

export const calculateDiscountAmount = (subtotal: number | string, discountPercentage: number | string = 0, discountAmount: number | string | null = null): number => {
  if (discountAmount !== null && discountAmount !== undefined) {
    return parseFloat(String(discountAmount)) || 0;
  }

  const sub = parseFloat(String(subtotal)) || 0;
  const discPct = parseFloat(String(discountPercentage)) || 0;
  return (sub * discPct) / 100;
};

export const calculateDepositAmount = (total: number | string, depositPercentage: number | string = 0, depositAmount: number | string | null = null): number => {
  if (depositAmount !== null && depositAmount !== undefined) {
    return parseFloat(String(depositAmount)) || 0;
  }

  const tot = parseFloat(String(total)) || 0;
  const depPct = parseFloat(String(depositPercentage)) || 0;
  return (tot * depPct) / 100;
};

export const calculateItemLevelTaxes = (lineItems: LineItem[] = []): number => {
  return lineItems.reduce((total, item) => {
    if (item.taxes && Array.isArray(item.taxes)) {
      return total + item.taxes.reduce((taxSum, tax) => taxSum + (parseFloat(String(tax.tax_amount)) || 0), 0);
    }
    return total;
  }, 0);
};

export const getTaxBreakdown = (lineItems: LineItem[] = []): TaxBreakdownEntry[] => {
  const taxGroups: Record<string, TaxBreakdownEntry> = {};

  lineItems.forEach(item => {
    if (item.taxes && Array.isArray(item.taxes)) {
      item.taxes.forEach(tax => {
        const key = `${tax.tax_name}_${tax.tax_rate}`;
        if (!taxGroups[key]) {
          taxGroups[key] = {
            tax_name: tax.tax_name || '',
            tax_rate: tax.tax_rate || 0,
            tax_amount: 0
          };
        }
        taxGroups[key].tax_amount += parseFloat(String(tax.tax_amount)) || 0;
      });
    }
  });

  return Object.values(taxGroups).map(tax => ({
    ...tax,
    tax_amount: parseFloat(tax.tax_amount.toFixed(2))
  }));
};

interface InvoiceTotalResult {
  subtotal: number;
  discount: number;
  subtotalAfterDiscount: number;
  itemLevelTax: number;
  documentTax: number;
  documentTaxBreakdown: TaxBreakdownEntry[];
  tax: number;
  taxTotal: number;
  taxBreakdown: TaxBreakdownEntry[];
  total: number;
}

export const calculateInvoiceTotal = (lineItems: LineItem[] = [], documentTaxes: DocumentTax[] | number = [], discountType = 'percentage', discountValue: number | string = 0): InvoiceTotalResult => {
  // Calculate subtotal (before tax and discount)
  const subtotal = calculateSubtotal(lineItems);

  // Calculate item-level taxes (from each item's taxes array)
  const itemLevelTax = calculateItemLevelTaxes(lineItems);

  // Calculate discount
  let discount = 0;
  const discVal = parseFloat(String(discountValue)) || 0;
  if (discVal > 0) {
    if (discountType === 'percentage') {
      discount = (subtotal * discVal) / 100;
    } else {
      discount = discVal;
    }
  }

  // Subtotal after discount
  const subtotalAfterDiscount = Math.max(0, subtotal - discount);

  // Calculate document-level taxes on subtotal after discount
  let documentTaxTotal = 0;
  let documentTaxBreakdown: TaxBreakdownEntry[] = [];

  if (Array.isArray(documentTaxes) && documentTaxes.length > 0) {
    // New format: array of { tax_name, tax_rate }
    documentTaxBreakdown = documentTaxes.map(tax => {
      const rate = parseFloat(String(tax.tax_rate)) || 0;
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

export const calculateBalanceDue = (total: number | string, paidAmount: number | string = 0): number => {
  const tot = parseFloat(String(total)) || 0;
  const paid = parseFloat(String(paidAmount)) || 0;
  return Math.max(0, tot - paid);
};

export const calculatePaymentPercentage = (paidAmount: number | string, total: number | string): number => {
  const paid = parseFloat(String(paidAmount)) || 0;
  const tot = parseFloat(String(total)) || 0;

  if (tot === 0) return 0;

  return Math.min(100, (paid / tot) * 100);
};

export const determineInvoiceStatus = (total: number | string, paidAmount: number | string = 0, dueDate: Date | string | null | undefined, currentStatus = 'draft'): string => {
  const tot = parseFloat(String(total)) || 0;
  const paid = parseFloat(String(paidAmount)) || 0;

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

export const formatCurrency = (amount: number | string | undefined, currencyCode = 'USD', locale = 'en-US'): string => {
  const amt = parseFloat(String(amount)) || 0;

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
    }).format(amt);
  } catch {
    // Fallback if currency code is invalid
    return `${currencyCode} ${amt.toFixed(2)}`;
  }
};

export const roundCurrency = (amount: number | string): number => {
  return Math.round((parseFloat(String(amount)) || 0) * 100) / 100;
};
