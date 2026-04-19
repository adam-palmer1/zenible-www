import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { formatCurrency } from '../../../../utils/currency';
import invoicesAPI from '../../../../services/api/finance/invoices';
import { useNotification } from '../../../../contexts/NotificationContext';
import logger from '../../../../utils/logger';
import type { InvoiceDetailData, InvoicePaymentAllocation } from './InvoiceDetailTypes';

interface InvoiceDetailPaymentSummaryProps {
  invoice: InvoiceDetailData;
  onPaymentUnlinked?: () => void;
}

const InvoiceDetailPaymentSummary: React.FC<InvoiceDetailPaymentSummaryProps> = ({
  invoice,
  onPaymentUnlinked,
}) => {
  const currencyCode = invoice.currency?.code;
  const { showSuccess, showError } = useNotification();
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

  const linkedPayments = invoice.invoice_payments || [];

  const handleUnlink = async (allocation: InvoicePaymentAllocation) => {
    try {
      setUnlinkingId(allocation.id);
      await invoicesAPI.unlinkPayment(invoice.id, allocation.id);
      showSuccess('Payment unlinked from invoice');
      onPaymentUnlinked?.();
    } catch (error: any) {
      logger.error('Error unlinking payment:', error);
      showError(error.message || 'Failed to unlink payment');
    } finally {
      setUnlinkingId(null);
    }
  };

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

      {/* Linked Payments */}
      {linkedPayments.length > 0 && (
        <>
          <div className="h-px bg-[#e5e5e5] dark:bg-gray-700 w-full" />
          <p className="text-[14px] font-medium leading-[22px] text-[#09090b] dark:text-white">
            Linked Payments
          </p>
          <div className="flex flex-col gap-2">
            {linkedPayments.map((allocation) => (
              <div
                key={allocation.id}
                className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
              >
                <div className="flex flex-col">
                  <span className="text-[13px] font-medium text-blue-700 dark:text-blue-300">
                    {allocation.payment_number || `Payment`}
                  </span>
                  <span className="text-[12px] text-[#71717a]">
                    {allocation.applied_date
                      ? new Date(allocation.applied_date).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-[#09090b] dark:text-white">
                    {formatCurrency(allocation.amount_applied, currencyCode)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUnlink(allocation)}
                    disabled={unlinkingId === allocation.id}
                    className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Unlink payment"
                  >
                    {unlinkingId === allocation.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <X className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default InvoiceDetailPaymentSummary;
