import React from 'react';

export interface InvoiceHeaderProps {
  invoice: any;
  formatDate: (dateString: string) => string;
}

const InvoiceHeader: React.FC<InvoiceHeaderProps> = ({ invoice, formatDate }) => {
  return (
    <div className="flex items-start justify-between">
      <div className="flex flex-col">
        {/* Company Logo */}
        {invoice.company_logo_url && (
          <img
            src={invoice.company_logo_url}
            alt={invoice.company_name || 'Company Logo'}
            className="max-h-16 max-w-[200px] object-contain mb-4"
          />
        )}
        <h2 className="text-[32px] font-semibold leading-[40px] text-[#09090b]">
          {invoice.invoice_number}
        </h2>
      </div>
      <div className="flex flex-col gap-3 items-end">
        <div className="text-right">
          <p className="text-[12px] font-normal leading-[20px] text-[#71717a]">Invoice Date</p>
          <p className="text-[16px] font-semibold leading-[24px] text-[#09090b]">
            {formatDate(invoice.issue_date || invoice.invoice_date)}
          </p>
        </div>
        {invoice.due_date && (
          <div className="text-right">
            <p className="text-[12px] font-normal leading-[20px] text-[#71717a]">Due Date</p>
            <p className="text-[16px] font-semibold leading-[24px] text-[#09090b]">
              {formatDate(invoice.due_date)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceHeader;
