import React from 'react';
import { formatCurrency } from '../../../utils/currency';
import { calculateInvoiceTotal } from '../../../utils/invoiceCalculations';

const InvoiceTotals = ({
  items = [],
  currency = 'USD',
  taxRate = 0,
  taxLabel = 'Tax',
  discountType = 'percentage',
  discountValue = 0,
  depositType = null,
  depositValue = 0,
  onEditTax,
  onEditDiscount,
  onEditDeposit,
  readOnly = false,
}) => {
  const totals = calculateInvoiceTotal(items, taxRate, discountType, discountValue, depositType, depositValue);

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
            -{formatCurrency(totals.discountAmount, currency)}
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

      {/* Tax */}
      {taxRate > 0 && (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="design-text-secondary">
              {taxLabel} ({taxRate}%):
            </span>
            {!readOnly && onEditTax && (
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
            {formatCurrency(totals.taxAmount, currency)}
          </span>
        </div>
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
              {formatCurrency(totals.depositAmount, currency)}
            </span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t design-border">
            <span className="design-text-secondary">Balance Due:</span>
            <span className="design-text-primary font-semibold">
              {formatCurrency(totals.balanceDue, currency)}
            </span>
          </div>
        </>
      )}

      {/* Add buttons for tax/discount/deposit if not set */}
      {!readOnly && (
        <div className="pt-3 border-t design-border flex gap-2">
          {taxRate === 0 && onEditTax && (
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
