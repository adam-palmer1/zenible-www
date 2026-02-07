import React from 'react';
import { Plus } from 'lucide-react';
import { getCurrencySymbol } from '../../../utils/currencyUtils';
import { applyNumberFormat } from '../../../utils/numberFormatUtils';

interface DocumentTotalsProps {
  totals: any;
  currencyCode?: string;
  numberFormat?: any;
  documentTaxes?: any[];
  onEditTax?: () => void;
  onRemoveTax?: () => void;
  discountType?: string;
  discountValue?: number;
  onEditDiscount?: () => void;
  onRemoveDiscount?: () => void;
  depositType?: string | null;
  depositValue?: number;
  onEditDeposit?: () => void;
  onRemoveDeposit?: () => void;
}

/**
 * DocumentTotals - Shared totals section for invoices and quotes
 *
 * Consolidates ~100 lines of duplicated code between InvoiceForm and QuoteForm
 */
const DocumentTotals: React.FC<DocumentTotalsProps> = ({
  totals,
  currencyCode = 'USD',
  numberFormat = null,
  // Document-level taxes (array of { tax_name, tax_rate })
  documentTaxes = [],
  onEditTax,
  onRemoveTax,
  // Discount
  discountType = 'percentage',
  discountValue = 0,
  onEditDiscount,
  onRemoveDiscount,
  // Deposit
  depositType = null,
  depositValue = 0,
  onEditDeposit,
  onRemoveDeposit,
}) => {
  const formatNumber = (num: any) => applyNumberFormat(num, numberFormat);
  const symbol = getCurrencySymbol(currencyCode);

  const depositAmount = depositType === 'percentage'
    ? (totals.total * depositValue / 100)
    : depositValue;

  return (
    <div className="space-y-2">
      {/* Subtotal */}
      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-gray-600">Sub Total:</span>
        <span className="text-sm font-medium text-gray-900">
          {symbol}{formatNumber(totals.subtotal)}
        </span>
      </div>

      {/* Discount */}
      {discountValue > 0 && (
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Discount {discountType === 'percentage' ? `(${discountValue}%)` : ''}:
            </span>
            <button
              onClick={onEditDiscount}
              className="text-xs text-purple-600 hover:text-purple-700"
            >
              Edit
            </button>
            <button
              onClick={onRemoveDiscount}
              className="text-xs text-red-600 hover:text-red-700"
            >
              Remove
            </button>
          </div>
          <span className="text-sm font-medium text-red-600">
            -{symbol}{formatNumber(totals.discount || 0)}
          </span>
        </div>
      )}

      {/* Document-level Taxes (applied after discount) */}
      {totals.documentTaxBreakdown && totals.documentTaxBreakdown.length > 0 && (
        <>
          {totals.documentTaxBreakdown.map((tax: any, index: number) => (
            <div key={index} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {tax.tax_name} ({tax.tax_rate}%):
                </span>
                {index === 0 && (
                  <>
                    <button
                      onClick={onEditTax}
                      className="text-xs text-purple-600 hover:text-purple-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={onRemoveTax}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
              <span className="text-sm font-medium text-gray-900">
                {symbol}{formatNumber(tax.tax_amount || 0)}
              </span>
            </div>
          ))}
        </>
      )}

      {/* Total */}
      <div className="flex items-center justify-between py-3 px-4 bg-purple-100 rounded-lg">
        <span className="text-sm font-semibold text-gray-900">Total Amount:</span>
        <span className="text-lg font-bold text-gray-900">
          {symbol}{formatNumber(totals.total)}
        </span>
      </div>

      {/* Deposit */}
      {depositValue > 0 && depositType && (
        <div className="flex items-center justify-between py-2 px-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm text-blue-700">
              Deposit Required {depositType === 'percentage' ? `(${depositValue}%)` : ''}:
            </span>
            <button
              onClick={onEditDeposit}
              className="text-xs text-purple-600 hover:text-purple-700"
            >
              Edit
            </button>
            <button
              onClick={onRemoveDeposit}
              className="text-xs text-red-600 hover:text-red-700"
            >
              Remove
            </button>
          </div>
          <span className="text-sm font-medium text-blue-700">
            {symbol}{formatNumber(depositAmount)}
          </span>
        </div>
      )}

      {/* Add buttons */}
      <div className="flex items-center gap-3 pt-2">
        {documentTaxes.length === 0 && (
          <button
            onClick={onEditTax}
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <Plus className="h-4 w-4" />
            Add Tax
          </button>
        )}
        {discountValue === 0 && (
          <button
            onClick={onEditDiscount}
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <Plus className="h-4 w-4" />
            Add Discount
          </button>
        )}
        {(!depositValue || depositValue === 0) && (
          <button
            onClick={onEditDeposit}
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <Plus className="h-4 w-4" />
            Add Deposit
          </button>
        )}
      </div>
    </div>
  );
};

export default DocumentTotals;
