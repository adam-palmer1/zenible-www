import React, { useCallback } from 'react';
import SendDocumentModal from '../shared/SendDocumentModal';
import type { SendDocumentFormData } from '../shared/SendDocumentModal';
import { useInvoices } from '../../../contexts/InvoiceContext';
import { useInvoiceEmailPreview } from '../../../hooks/queries/useInvoiceEmailPreview';

interface SendInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  contact: any;
  onSuccess?: () => void;
}

const SendInvoiceDialog: React.FC<SendInvoiceDialogProps> = ({
  isOpen,
  onClose,
  invoice,
  contact,
  onSuccess
}) => {
  const { sendInvoice } = useInvoices();

  // ---- Fetch rendered email preview ----
  const { data: emailPreview, isLoading: previewLoading } = useInvoiceEmailPreview(
    invoice?.id,
    { enabled: isOpen }
  );

  // ---- Send handler (maps shared form data to the invoice API shape) ----
  const handleSend = useCallback(
    async (formData: SendDocumentFormData) => {
      const sendData = {
        to_email: formData.to_email,
        cc_emails: formData.cc_emails.length > 0 ? formData.cc_emails : undefined,
        email_subject: formData.email_subject,
        email_body: formData.email_body,
        attach_pdf: formData.attach_pdf,
        template_id: formData.template_id,
      };
      await sendInvoice(invoice.id, sendData);
    },
    [invoice?.id, sendInvoice]
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
      documentLabel="Invoice"
      contact={contact}
      onSend={handleSend}
      onSendSuccess={onSuccess}
      renderDocumentInfo={renderDocumentInfo}
      renderPreviewExtra={renderPreviewExtra}
      showSubjectField={true}
      bodyRequired={true}
      htmlPreview={true}
      renderedContent={emailPreview ?? null}
      renderedContentLoading={previewLoading}
      useWysiwyg={true}
    />
  );
};

export default SendInvoiceDialog;
