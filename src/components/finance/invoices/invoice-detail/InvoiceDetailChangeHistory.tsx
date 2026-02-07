import React from 'react';
import InvoiceHistory from '../InvoiceHistory';

interface InvoiceDetailChangeHistoryProps {
  invoiceId: string;
}

const InvoiceDetailChangeHistory: React.FC<InvoiceDetailChangeHistoryProps> = ({
  invoiceId,
}) => {
  return (
    <div className="w-full max-w-[840px] bg-white dark:bg-gray-800 border-2 border-[#e5e5e5] dark:border-gray-700 rounded-[12px] overflow-hidden">
      {/* Header */}
      <div className="border-b border-[#e5e5e5] dark:border-gray-700 p-4">
        <h3 className="text-[16px] font-semibold leading-[24px] text-[#09090b] dark:text-white">
          Change History
        </h3>
      </div>

      {/* Content */}
      <div className="p-3">
        <InvoiceHistory invoiceId={invoiceId} />
      </div>
    </div>
  );
};

export default InvoiceDetailChangeHistory;
