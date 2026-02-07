import React from 'react';
import type { InvoiceDetailData } from './InvoiceDetailTypes';

interface InvoiceDetailNotesProps {
  invoice: InvoiceDetailData;
}

const InvoiceDetailNotes: React.FC<InvoiceDetailNotesProps> = ({
  invoice,
}) => {
  return (
    <>
      {/* Notes Section */}
      {invoice.notes && (
        <div className="flex flex-col gap-2">
          <p className="text-[14px] font-medium leading-[22px] text-[#09090b] dark:text-white">
            Notes
          </p>
          <p className="text-[14px] font-normal leading-[22px] text-[#71717a] whitespace-pre-wrap">
            {invoice.notes}
          </p>
        </div>
      )}

      {/* Payment Instructions Section */}
      {invoice.payment_instructions && (
        <div className="flex flex-col gap-2">
          <p className="text-[14px] font-medium leading-[22px] text-[#09090b] dark:text-white">
            Payment Instructions
          </p>
          <p className="text-[14px] font-normal leading-[22px] text-[#71717a] whitespace-pre-wrap">
            {invoice.payment_instructions}
          </p>
        </div>
      )}

      {/* Preserved: Terms & Conditions */}
      {invoice.terms && (
        <div className="flex flex-col gap-4 pt-4 border-t border-[#e5e5e5] dark:border-gray-700">
          <p className="text-[14px] font-medium leading-[22px] text-[#09090b] dark:text-white">
            Terms & Conditions
          </p>
          <p className="text-[14px] font-normal leading-[22px] text-[#71717a] whitespace-pre-wrap">
            {invoice.terms}
          </p>
        </div>
      )}
    </>
  );
};

export default InvoiceDetailNotes;
