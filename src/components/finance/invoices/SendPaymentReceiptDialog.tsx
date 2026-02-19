import React, { useCallback } from 'react';
import SendDocumentModal from '../shared/SendDocumentModal';
import type { SendDocumentFormData } from '../shared/SendDocumentModal';
import { usePaymentReceiptPreview } from '../../../hooks/queries/usePaymentReceiptPreview';
import invoicesAPI from '../../../services/api/finance/invoices';

interface PaymentData {
  payment_amount: number;
  payment_date: string;
  payment_method: string;
  transaction_id?: string;
}

interface SendPaymentReceiptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  contact: any;
  onSuccess?: () => void;
  paymentData?: PaymentData | null;
}

const SendPaymentReceiptDialog: React.FC<SendPaymentReceiptDialogProps> = ({
  isOpen,
  onClose,
  invoice,
  contact,
  onSuccess,
  paymentData,
}) => {
  // ---- Fetch rendered receipt email preview ----
  const { data: receiptPreview, isLoading: previewLoading } = usePaymentReceiptPreview(
    invoice?.id,
    { enabled: isOpen, paymentData }
  );

  // ---- Send handler ----
  const handleSend = useCallback(
    async (formData: SendDocumentFormData) => {
      const sendData = {
        to_email: formData.to_email,
        cc_emails: formData.cc_emails.length > 0 ? formData.cc_emails : undefined,
        email_subject: formData.email_subject,
        email_body: formData.email_body,
        attach_pdf: formData.attach_pdf,
        ...(paymentData ? {
          payment_amount: paymentData.payment_amount,
          payment_date: paymentData.payment_date,
          payment_method: paymentData.payment_method,
          transaction_id: paymentData.transaction_id,
        } : {}),
      };
      await invoicesAPI.sendPaymentReceipt(invoice.id, sendData);
    },
    [invoice?.id, paymentData]
  );

  // ---- Document info section ----
  const renderDocumentInfo = useCallback(
    () => (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium text-gray-900 dark:text-white">Invoice:</span>{' '}
          {invoice?.invoice_number}
        </p>
        {contact && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            <span className="font-medium text-gray-900 dark:text-white">Client:</span>{' '}
            {contact.first_name} {contact.last_name}
            {contact.business_name && ` (${contact.business_name})`}
          </p>
        )}
      </div>
    ),
    [invoice?.invoice_number, contact]
  );

  // ---- Preview extra: PDF attachment note ----
  const renderPreviewExtra = useCallback(
    (formData: SendDocumentFormData) =>
      formData.attach_pdf ? (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Invoice PDF will be attached
        </div>
      ) : null,
    []
  );

  return (
    <SendDocumentModal
      isOpen={isOpen}
      onClose={onClose}
      documentType="invoice"
      documentLabel="Payment Receipt"
      contact={contact}
      onSend={handleSend}
      onSendSuccess={onSuccess}
      renderDocumentInfo={renderDocumentInfo}
      renderPreviewExtra={renderPreviewExtra}
      showSubjectField={true}
      bodyRequired={true}
      htmlPreview={true}
      renderedContent={receiptPreview ?? null}
      renderedContentLoading={previewLoading}
      useWysiwyg={true}
    />
  );
};

export default SendPaymentReceiptDialog;
