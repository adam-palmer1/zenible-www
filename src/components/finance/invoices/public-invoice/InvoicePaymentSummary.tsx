import React from 'react';
import { formatCurrency } from '../../../../utils/currency';

export interface InvoicePaymentSummaryProps {
  invoice: any;
  amountDue: number;
}

const InvoicePaymentSummary: React.FC<InvoicePaymentSummaryProps> = ({ invoice, amountDue }) => {
  return (
    <div className="border-[1.5px] border-[#e5e5e5] rounded-[8px] p-4 flex flex-col gap-4">
      <p className="text-[14px] font-medium leading-[22px] text-[#09090b]">
        Payment Summary
      </p>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-normal leading-[22px] text-[#71717a]">Total Amount</span>
          <span className="text-[16px] font-normal leading-[24px] text-[#09090b]">
            {formatCurrency(invoice.total, invoice.currency_code)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-normal leading-[22px] text-[#71717a]">Amount Paid</span>
          <span className="text-[16px] font-normal leading-[24px] text-[#09090b]">
            {formatCurrency(invoice.paid_amount || 0, invoice.currency_code)}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[#e5e5e5] w-full" />

      {/* Outstanding Balance */}
      <div className="flex items-center justify-between">
        <span className="text-[14px] font-medium leading-[22px] text-[#09090b]">
          Outstanding Balance
        </span>
        <span className={`text-[16px] font-bold leading-[24px] text-right w-[216px] ${
          amountDue > 0
            ? 'text-[#fb2c36]'
            : amountDue < 0
              ? 'text-green-600'
              : 'text-[#09090b]'
        }`}>
          {amountDue > 0
            ? formatCurrency(amountDue, invoice.currency_code)
            : amountDue < 0
              ? `${formatCurrency(Math.abs(amountDue), invoice.currency_code)} Credit`
              : 'Paid in Full'}
        </span>
      </div>
    </div>
  );
};

export default InvoicePaymentSummary;
