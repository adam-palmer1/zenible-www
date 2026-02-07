import React from 'react';

export interface InvoiceNotesSectionProps {
  invoice: any;
}

const InvoiceNotesSection: React.FC<InvoiceNotesSectionProps> = ({ invoice }) => {
  if (!invoice.payment_instructions && !invoice.notes) {
    return null;
  }

  return (
    <div className="flex gap-8 pt-4 border-t border-[#e5e5e5]">
      {/* Payment Instructions */}
      {invoice.payment_instructions && (
        <div className="flex-1 flex flex-col gap-4">
          <p className="text-[14px] font-medium leading-[22px] text-[#09090b]">
            Payment Instructions
          </p>
          <p className="text-[14px] font-normal leading-[22px] text-[#71717a] whitespace-pre-wrap">
            {invoice.payment_instructions}
          </p>
        </div>
      )}

      {/* Notes Section */}
      {invoice.notes && (
        <div className="flex-1 flex flex-col gap-4">
          <p className="text-[14px] font-medium leading-[22px] text-[#09090b]">
            Notes
          </p>
          <p className="text-[14px] font-normal leading-[22px] text-[#71717a] whitespace-pre-wrap">
            {invoice.notes}
          </p>
        </div>
      )}
    </div>
  );
};

export default InvoiceNotesSection;
