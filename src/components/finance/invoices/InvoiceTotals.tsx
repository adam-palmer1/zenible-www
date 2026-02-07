import React from 'react';
import { formatCurrency } from '../../../utils/currency';
import { calculateInvoiceTotal } from '../../../utils/invoiceCalculations';

interface InvoiceTotalsProps {
  items?: any[];
  currency?: string;
  documentTaxes?: any[];
  taxRate?: number;
  taxLabel?: string;
  discountType?: string;
  discountValue?: number;
  depositType?: string | null;
  depositValue?: number;
  onEditTax?: () => void;
  onEditDiscount?: () => void;
  onEditDeposit?: () => void;
  readOnly?: boolean;
}

const InvoiceTotals: React.FC<InvoiceTotalsProps> = ({
  items = [],
  currency = 'USD',
  documentTaxes = [], // New format: array of { tax_name, tax_rate }
  taxRate = 0, // Legacy: single tax rate
  taxLabel = 'Tax', // Legacy: single tax label
  discountType = 'percentage',
  discountValue = 0,
  depositType = null,
  depositValue = 0,
  onEditTax,
  onEditDiscount,
  onEditDeposit,
  readOnly = false,
}) => {
  // Support both new documentTaxes array and legacy taxRate/taxLabel
  const effectiveDocumentTaxes = documentTaxes.length > 0
    ? documentTaxes
    : (taxRate > 0 ? [{ tax_name: taxLabel, tax_rate: taxRate }] : []);

  const totals = calculateInvoiceTotal(items, effectiveDocumentTaxes, discountType, discountValue) as any;
  const hasItemLevelTaxes = totals.itemLevelTax > 0;
  const hasDocumentTax = totals.documentTax > 0;

  // Calculate deposit amount
  let depositAmount = 0;
  if (depositValue > 0) {
    if (depositType === 'percentage') {
      depositAmount = (totals.total * parseFloat(String(depositValue))) / 100;
    } else {
      depositAmount = parseFloat(String(depositValue)) || 0;
    }
  }
  const balanceDue = Math.max(0, totals.total - depositAmount);

  return (
    <div className="space-y-3 design-bg-secondary rounded-lg p-6">
      {/* Subtotal */}
      <div className="flex justify-between items-center">
        <span className="design-text-secondary">Subtotal:</span>
        <span className="design-text-primary font-medium">
          {formatCurrency(totals.subtotal, currency)}
        </span>
      </div>

      {/* Discount */}
      {discountValue > 0 && (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="design-text-secondary">
              Discount
              {discountType === 'percentage' ? ` (${discountValue}%)` : ''}:
            </span>
            {!readOnly && onEditDiscount && (
              <button
                type="button"
                onClick={onEditDiscount}
                className="text-xs text-zenible-primary hover:text-zenible-primary/80"
              >
                Edit
              </button>
            )}
          </div>
          <span className="design-text-primary font-medium text-red-600 dark:text-red-400">
            -{formatCurrency(totals.discount, currency)}
          </span>
        </div>
      )}

      {/* Subtotal after discount */}
      {discountValue > 0 && (
        <div className="flex justify-between items-center pt-2 border-t design-border">
          <span className="design-text-secondary">Subtotal after discount:</span>
          <span className="design-text-primary font-medium">
            {formatCurrency(totals.subtotalAfterDiscount, currency)}
          </span>
        </div>
      )}

      {/* Item-level taxes breakdown */}
      {hasItemLevelTaxes && totals.taxBreakdown && totals.taxBreakdown.length > 0 && (
        <div className="space-y-1">
          {totals.taxBreakdown.map((tax: any, index: number) => (
            <div key={index} className="flex justify-between items-center">
              <span className="design-text-secondary text-sm">
                {tax.tax_name} ({tax.tax_rate}%):
              </span>
              <span className="design-text-primary font-medium text-sm">
                {formatCurrency(tax.tax_amount, currency)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Document-level Taxes */}
      {hasDocumentTax && totals.documentTaxBreakdown && totals.documentTaxBreakdown.length > 0 && (
        <>
          {totals.documentTaxBreakdown.map((tax: any, index: number) => (
            <div key={index} className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="design-text-secondary">
                  {tax.tax_name} ({tax.tax_rate}%):
                </span>
                {!readOnly && onEditTax && index === 0 && (
                  <button
                    type="button"
                    onClick={onEditTax}
                    className="text-xs text-zenible-primary hover:text-zenible-primary/80"
                  >
                    Edit
                  </button>
                )}
              </div>
              <span className="design-text-primary font-medium">
                {formatCurrency(tax.tax_amount, currency)}
              </span>
            </div>
          ))}
        </>
      )}

      {/* Total */}
      <div className="flex justify-between items-center pt-3 border-t design-border">
        <span className="design-text-primary font-semibold text-lg">Total:</span>
        <span className="design-text-primary font-bold text-xl">
          {formatCurrency(totals.total, currency)}
        </span>
      </div>

      {/* Deposit Required */}
      {depositValue > 0 && (
        <>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="design-text-secondary">
                Deposit Required
                {depositType === 'percentage' ? ` (${depositValue}%)` : ''}:
              </span>
              {!readOnly && onEditDeposit && (
                <button
                  type="button"
                  onClick={onEditDeposit}
                  className="text-xs text-zenible-primary hover:text-zenible-primary/80"
                >
                  Edit
                </button>
              )}
            </div>
            <span className="design-text-primary font-semibold text-zenible-primary">
              {formatCurrency(depositAmount, currency)}
            </span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t design-border">
            <span className="design-text-secondary">Balance Due:</span>
            <span className="design-text-primary font-semibold">
              {formatCurrency(balanceDue, currency)}
            </span>
          </div>
        </>
      )}

      {/* Add buttons for tax/discount/deposit if not set */}
      {!readOnly && (
        <div className="pt-3 border-t design-border flex gap-2">
          {effectiveDocumentTaxes.length === 0 && onEditTax && (
            <button
              type="button"
              onClick={onEditTax}
              className="text-sm text-zenible-primary hover:text-zenible-primary/80 font-medium"
            >
              + Add Tax
            </button>
          )}
          {discountValue === 0 && onEditDiscount && (
            <button
              type="button"
              onClick={onEditDiscount}
              className="text-sm text-zenible-primary hover:text-zenible-primary/80 font-medium"
            >
              + Add Discount
            </button>
          )}
          {depositValue === 0 && onEditDeposit && (
            <button
              type="button"
              onClick={onEditDeposit}
              className="text-sm text-zenible-primary hover:text-zenible-primary/80 font-medium"
            >
              + Add Deposit
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default InvoiceTotals;
