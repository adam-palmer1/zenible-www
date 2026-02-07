import React from 'react';
import { formatCurrency } from '../../../../utils/currency';
import type { InvoiceTaxResponse, CompanyResponse } from '../../../../types';
import type { InvoiceDetailData } from './InvoiceDetailTypes';

interface InvoiceTotalsData {
  subtotal: number;
  discount: number;
  itemLevelTax: number;
  documentTax: number;
  total: number;
}

interface InvoiceDetailTotalsProps {
  invoice: InvoiceDetailData;
  totals: InvoiceTotalsData;
  company: CompanyResponse | null;
}

const InvoiceDetailTotals: React.FC<InvoiceDetailTotalsProps> = ({
  invoice,
  totals,
  company,
}) => {
  const currencyCode = invoice.currency?.code;

  return (
    <div className="flex flex-col items-end">
      {/* Sub Total */}
      <div className="flex items-center gap-4 px-4 py-2 bg-[#f4f4f5] dark:bg-gray-700 text-right">
        <span className="w-[150px] text-[16px] font-normal leading-[24px] text-[#09090b] dark:text-white">
          Sub Total:
        </span>
        <span className="w-[216px] text-[16px] font-medium leading-[24px] text-[#09090b] dark:text-white">
          {formatCurrency(invoice.subtotal || totals.subtotal, currencyCode)}
        </span>
      </div>

      {/* Discount */}
      {(parseFloat(String(invoice.discount_amount || 0)) > 0 || parseFloat(String(invoice.discount_value || 0)) > 0) && (
        <div className="flex items-center gap-4 px-4 py-2 bg-[#f4f4f5] dark:bg-gray-700 text-right">
          <span className="w-[150px] text-[16px] font-normal leading-[24px] text-[#09090b] dark:text-white">
            Discount{invoice.discount_type === 'percentage' && invoice.discount_value ? ` (${invoice.discount_value}%)` : ''}:
          </span>
          <span className="w-[216px] text-[16px] font-medium leading-[24px] text-red-600 dark:text-red-400">
            - {formatCurrency(parseFloat(String(invoice.discount_amount || 0)) || totals.discount, currencyCode)}
          </span>
        </div>
      )}

      {/* Document Taxes - show each tax line */}
      {invoice.document_taxes?.length > 0 && invoice.document_taxes.map((tax: InvoiceTaxResponse, index: number) => (
        <div key={tax.id || index} className="flex items-center gap-4 px-4 py-2 bg-[#f4f4f5] dark:bg-gray-700 text-right">
          <span className="w-[150px] text-[16px] font-normal leading-[24px] text-[#09090b] dark:text-white">
            {tax.tax_name || 'Tax'} ({parseFloat(tax.tax_rate)}%):
          </span>
          <span className="w-[216px] text-[16px] font-medium leading-[24px] text-[#09090b] dark:text-white">
            + {formatCurrency(parseFloat(String(tax.tax_amount || 0)), currencyCode)}
          </span>
        </div>
      ))}

      {/* Fallback Tax display if no document_taxes but has tax_total or document_tax_total */}
      {(!invoice.document_taxes || invoice.document_taxes.length === 0) &&
       (parseFloat(String(invoice.document_tax_total || 0)) > 0 || parseFloat(String(invoice.tax_total || 0)) > 0 || totals.itemLevelTax > 0 || totals.documentTax > 0) && (
        <div className="flex items-center gap-4 px-4 py-2 bg-[#f4f4f5] dark:bg-gray-700 text-right">
          <span className="w-[150px] text-[16px] font-normal leading-[24px] text-[#09090b] dark:text-white">
            {invoice.tax_label || 'Tax'}:
          </span>
          <span className="w-[216px] text-[16px] font-medium leading-[24px] text-[#09090b] dark:text-white">
            + {formatCurrency(
              parseFloat(String(invoice.document_tax_total || 0)) ||
              parseFloat(String(invoice.tax_total || 0)) ||
              (totals.itemLevelTax + totals.documentTax),
              currencyCode
            )}
          </span>
        </div>
      )}

      {/* Total Amount - Uses company secondary color if set */}
      <div
        className={`flex items-center gap-4 px-4 py-2 text-right ${!company?.secondary_color ? 'bg-[#ddd6ff] dark:bg-purple-900/50' : ''}`}
        style={company?.secondary_color ? { backgroundColor: company.secondary_color } : undefined}
      >
        <span className="w-[150px] text-[16px] font-bold leading-[24px] text-[#09090b] dark:text-white">
          Total Amount:
        </span>
        <span className="w-[216px] text-[16px] font-bold leading-[24px] text-[#09090b] dark:text-white">
          {formatCurrency(parseFloat(invoice.total) || totals.total, currencyCode)}
        </span>
      </div>

      {/* Deposit Requested - shown underneath Total Amount */}
      {parseFloat(String(invoice.deposit_amount || invoice.deposit || 0)) > 0 && (
        <div className="flex items-center gap-4 px-4 py-2 bg-[#f4f4f5] dark:bg-gray-700 text-right">
          <span className="w-[150px] text-[16px] font-normal leading-[24px] text-[#09090b] dark:text-white">
            Deposit Requested{invoice.deposit_percentage && parseFloat(invoice.deposit_percentage) > 0 ? ` (${parseFloat(invoice.deposit_percentage)}%)` : ''}:
          </span>
          <span className="w-[216px] text-[16px] font-medium leading-[24px] text-[#09090b] dark:text-white">
            {formatCurrency(parseFloat(String(invoice.deposit_amount || invoice.deposit || 0)), currencyCode)}
          </span>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetailTotals;
