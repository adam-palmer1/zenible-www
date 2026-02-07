import React from 'react';
import { formatCurrency } from '../../../../utils/currency';
import type { InvoiceDetailData } from './InvoiceDetailTypes';

interface InvoiceDetailPaymentSummaryProps {
  invoice: InvoiceDetailData;
}

const InvoiceDetailPaymentSummary: React.FC<InvoiceDetailPaymentSummaryProps> = ({
  invoice,
}) => {
  const currencyCode = invoice.currency?.code;

  return (
    <div className="border-[1.5px] border-[#e5e5e5] dark:border-gray-700 rounded-[8px] p-4 flex flex-col gap-4">
      <p className="text-[14px] font-medium leading-[22px] text-[#09090b] dark:text-white">
        Payment Summary
      </p>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-normal leading-[22px] text-[#71717a]">Total Amount</span>
          <span className="text-[16px] font-normal leading-[24px] text-[#09090b] dark:text-white">
            {formatCurrency(invoice.total, currencyCode)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-normal leading-[22px] text-[#71717a]">Amount Paid</span>
          <span className="text-[16px] font-normal leading-[24px] text-[#09090b] dark:text-white">
            {formatCurrency(invoice.paid_amount || 0, currencyCode)}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[#e5e5e5] dark:bg-gray-700 w-full" />

      {/* Outstanding Balance */}
      <div className="flex items-center justify-between">
        <span className="text-[14px] font-medium leading-[22px] text-[#09090b] dark:text-white">
          Outstanding Balance
        </span>
        <span className={`text-[16px] font-bold leading-[24px] text-right w-[216px] ${
          parseFloat(String(invoice.outstanding_balance || 0)) > 0
            ? 'text-[#fb2c36]'
            : parseFloat(String(invoice.outstanding_balance || 0)) < 0
              ? 'text-green-600'
              : 'text-[#09090b] dark:text-white'
        }`}>
          {(() => {
            const balance = invoice.outstanding_balance !== undefined && invoice.outstanding_balance !== null
              ? parseFloat(String(invoice.outstanding_balance))
              : parseFloat(String(invoice.total)) - parseFloat(String(invoice.paid_amount || 0));

            if (balance > 0) {
              return formatCurrency(balance, currencyCode);
            } else if (balance < 0) {
              return `${formatCurrency(Math.abs(balance), currencyCode)} Credit`;
            } else {
              return 'Paid in Full';
            }
          })()}
        </span>
      </div>
      {(() => {
        const balance = invoice.outstanding_balance !== undefined && invoice.outstanding_balance !== null
          ? parseFloat(String(invoice.outstanding_balance))
          : parseFloat(String(invoice.total)) - parseFloat(String(invoice.paid_amount || 0));
        return balance < 0;
      })() && (
        <p className="text-[12px] text-[#71717a]">
          Customer has a credit that can be applied to future invoices or refunded
        </p>
      )}
    </div>
  );
};

export default InvoiceDetailPaymentSummary;
