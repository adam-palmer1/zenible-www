import React from 'react';
import { ChevronLeft, Loader2 } from 'lucide-react';
import InvoiceActionsMenu from '../InvoiceActionsMenu';
import { INVOICE_STATUS } from '../../../../constants/finance';
import type { InvoiceDetailData } from './InvoiceDetailTypes';

interface InvoiceDetailTopBarProps {
  invoice: InvoiceDetailData;
  downloadingPdf: boolean;
  hasOutstandingBalance: boolean;
  canChargeCard: boolean;
  status: string;
  onBack: () => void;
  onDownloadPdf: () => void;
  onAddPayment: () => void;
  onSendEmail: () => void;
  onEdit: () => void;
  onClone: () => void;
  onDelete: () => void;
  onLinkPayment: () => void;
  onExpenses: () => void;
  onProjects: () => void;
  onSendReminder: () => void;
  onMarkAsSent: () => void;
  onRevertToDraft: () => void;
  onChargeCard: () => void;
}

const InvoiceDetailTopBar: React.FC<InvoiceDetailTopBarProps> = ({
  invoice,
  downloadingPdf,
  hasOutstandingBalance,
  canChargeCard,
  status,
  onBack,
  onDownloadPdf,
  onAddPayment,
  onSendEmail,
  onEdit,
  onClone,
  onDelete,
  onLinkPayment,
  onExpenses,
  onProjects,
  onSendReminder,
  onMarkAsSent,
  onRevertToDraft,
  onChargeCard,
}) => {
  return (
    <div className="border-b border-[#e5e5e5] dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-[10px] flex items-center gap-4">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center justify-center w-[40px] h-[40px] bg-white dark:bg-gray-800 border border-[#e5e5e5] dark:border-gray-600 rounded-[10px] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        aria-label="Back to invoices"
      >
        <ChevronLeft className="h-5 w-5 text-[#09090b] dark:text-white" />
      </button>

      {/* Title */}
      <h1 className="flex-1 text-[18px] font-semibold leading-[26px] text-[#09090b] dark:text-white">
        Invoice Preview : {invoice.invoice_number}
      </h1>

      {/* Save PDF Button */}
      <button
        onClick={onDownloadPdf}
        disabled={downloadingPdf}
        className="h-[40px] px-3 flex items-center justify-center bg-white dark:bg-gray-800 border border-[#e5e5e5] dark:border-gray-600 rounded-[10px] text-[16px] font-medium text-[#09090b] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
      >
        {downloadingPdf ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          'Save PDF'
        )}
      </button>

      {/* Add Payment Button - Green */}
      {hasOutstandingBalance && (
        <button
          onClick={onAddPayment}
          className="h-[40px] px-3 flex items-center justify-center bg-[#00a63e] rounded-[10px] text-[16px] font-medium text-white hover:bg-[#00913a] transition-colors"
        >
          Add Payment
        </button>
      )}

      {/* Send Email Button - Purple */}
      <button
        onClick={onSendEmail}
        className="h-[40px] px-3 flex items-center justify-center bg-[#8e51ff] rounded-[10px] text-[16px] font-medium text-white hover:bg-[#7a44db] transition-colors"
      >
        Send Email
      </button>

      {/* 3-dot Actions Menu */}
      <InvoiceActionsMenu
        invoice={invoice}
        onEdit={onEdit}
        onClone={onClone}
        onDelete={onDelete}
        onLinkPayment={onLinkPayment}
        onExpenses={onExpenses}
        onProjects={onProjects}
        onSendReminder={onSendReminder}
        onMarkAsSent={onMarkAsSent}
        onRevertToDraft={onRevertToDraft}
        onChargeCard={onChargeCard}
        showLinkPayment={hasOutstandingBalance}
        showSendReminder={['sent', 'viewed', 'partially_paid'].includes(status)}
        showMarkAsSent={status === INVOICE_STATUS.DRAFT}
        showRevertToDraft={status === INVOICE_STATUS.SENT}
        showChargeCard={canChargeCard}
      />
    </div>
  );
};

export default InvoiceDetailTopBar;
