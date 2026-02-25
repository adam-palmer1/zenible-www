import React from 'react';
import { formatCurrency } from '../../../../utils/currency';

export interface InvoiceTotalsSectionProps {
  invoice: any;
  subtotal: number;
  itemLevelTax: number;
}

const InvoiceTotalsSection: React.FC<InvoiceTotalsSectionProps> = ({ invoice, subtotal, itemLevelTax }) => {
  return (
    <div className="flex flex-col items-end">
      {/* Sub Total */}
      <div className="flex items-center gap-4 px-4 py-2 bg-[#f4f4f5] text-right">
        <span className="w-[150px] text-[16px] font-normal leading-[24px] text-[#09090b]">
          Sub Total:
        </span>
        <span className="w-[216px] text-[16px] font-medium leading-[24px] text-[#09090b]">
          {formatCurrency(invoice.subtotal || subtotal, invoice.currency_code)}
        </span>
      </div>

      {/* Discount */}
      {parseFloat(invoice.discount_amount || 0) > 0 && (
        <div className="flex items-center gap-4 px-4 py-2 bg-[#f4f4f5] text-right">
          <span className="w-[150px] text-[16px] font-normal leading-[24px] text-[#09090b]">
            Discount{invoice.discount_percentage && parseFloat(invoice.discount_percentage) > 0 ? ` (${parseFloat(invoice.discount_percentage)}%)` : ''}:
          </span>
          <span className="w-[216px] text-[16px] font-medium leading-[24px] text-red-600">
            - {formatCurrency(parseFloat(invoice.discount_amount), invoice.currency_code)}
          </span>
        </div>
      )}

      {/* Line Item Tax */}
      {(parseFloat(invoice.tax_total || 0) > 0 || itemLevelTax > 0) && (
        <div className="flex items-center gap-4 px-4 py-2 bg-[#f4f4f5] text-right">
          <span className="w-[150px] text-[16px] font-normal leading-[24px] text-[#09090b]">
            Tax (Line Items):
          </span>
          <span className="w-[216px] text-[16px] font-medium leading-[24px] text-[#09090b]">
            + {formatCurrency(parseFloat(invoice.tax_total || 0) || itemLevelTax, invoice.currency_code)}
          </span>
        </div>
      )}

      {/* Document Taxes - show each tax line when breakdown exists */}
      {invoice.document_taxes?.length > 0 && invoice.document_taxes.map((tax: any, index: number) => (
        <div key={tax.id || index} className="flex items-center gap-4 px-4 py-2 bg-[#f4f4f5] text-right">
          <span className="w-[150px] text-[16px] font-normal leading-[24px] text-[#09090b]">
            {tax.tax_name || 'Tax'} ({parseFloat(tax.tax_rate)}%):
          </span>
          <span className="w-[216px] text-[16px] font-medium leading-[24px] text-[#09090b]">
            + {formatCurrency(parseFloat(tax.tax_amount || 0), invoice.currency_code)}
          </span>
        </div>
      ))}

      {/* Document Tax fallback - single line when no breakdown but total exists */}
      {(!invoice.document_taxes || invoice.document_taxes.length === 0) &&
       parseFloat(invoice.document_tax_total || 0) > 0 && (
        <div className="flex items-center gap-4 px-4 py-2 bg-[#f4f4f5] text-right">
          <span className="w-[150px] text-[16px] font-normal leading-[24px] text-[#09090b]">
            Tax:
          </span>
          <span className="w-[216px] text-[16px] font-medium leading-[24px] text-[#09090b]">
            + {formatCurrency(parseFloat(invoice.document_tax_total), invoice.currency_code)}
          </span>
        </div>
      )}

      {/* Total Amount */}
      <div className="flex items-center gap-4 px-4 py-2 bg-[#ddd6ff] text-right">
        <span className="w-[150px] text-[16px] font-bold leading-[24px] text-[#09090b]">
          Total Amount:
        </span>
        <span className="w-[216px] text-[16px] font-bold leading-[24px] text-[#09090b]">
          {formatCurrency(invoice.total, invoice.currency_code)}
        </span>
      </div>

      {/* Deposit Requested - shown underneath Total Amount */}
      {parseFloat(invoice.deposit_amount || 0) > 0 && (
        <div className="flex items-center gap-4 px-4 py-2 bg-[#f4f4f5] text-right">
          <span className="w-[150px] text-[16px] font-normal leading-[24px] text-[#09090b]">
            Deposit Requested{invoice.deposit_percentage && parseFloat(invoice.deposit_percentage) > 0 ? ` (${parseFloat(invoice.deposit_percentage)}%)` : ''}:
          </span>
          <span className="w-[216px] text-[16px] font-medium leading-[24px] text-[#09090b]">
            {formatCurrency(parseFloat(invoice.deposit_amount), invoice.currency_code)}
          </span>
        </div>
      )}
    </div>
  );
};

export default InvoiceTotalsSection;
