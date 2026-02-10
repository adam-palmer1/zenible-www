import React, { useCallback } from 'react';
import SendDocumentModal from '../shared/SendDocumentModal';
import type { SendDocumentFormData } from '../shared/SendDocumentModal';
import creditNotesAPI from '../../../services/api/finance/creditNotes';
import { formatCurrency } from '../../../utils/currency';
import { useCreditNoteEmailPreview } from '../../../hooks/queries/useCreditNoteEmailPreview';

interface SendCreditNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  creditNote: any;
  contact: any;
  onSuccess?: () => void;
}

const SendCreditNoteModal: React.FC<SendCreditNoteModalProps> = ({
  isOpen,
  onClose,
  creditNote,
  contact,
  onSuccess
}) => {
  // ---- Fetch rendered email preview ----
  const { data: emailPreview, isLoading: previewLoading } = useCreditNoteEmailPreview(
    creditNote?.id,
    { enabled: isOpen }
  );

  // ---- Send handler (maps shared form data to the credit note API shape) ----
  const handleSend = useCallback(
    async (formData: SendDocumentFormData) => {
      const sendData = {
        email: formData.to_email,
        cc_emails: formData.cc_emails.length > 0 ? formData.cc_emails : undefined,
        email_subject: formData.email_subject,
        email_body: formData.email_body,
        attach_pdf: formData.attach_pdf,
        template_id: formData.template_id,
      };
      await creditNotesAPI.send(creditNote.id, sendData);
    },
    [creditNote?.id]
  );

  // ---- Document info section ----
  const renderDocumentInfo = useCallback(
    () => (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium text-gray-900 dark:text-white">Credit Note:</span>{' '}
          {creditNote?.credit_note_number}
        </p>
        {(contact || creditNote?.contact) && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            <span className="font-medium text-gray-900 dark:text-white">Client:</span>{' '}
            {(contact || creditNote.contact).first_name} {(contact || creditNote.contact).last_name}
            {(contact || creditNote.contact).business_name && ` (${(contact || creditNote.contact).business_name})`}
          </p>
        )}
        {creditNote?.total && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            <span className="font-medium text-gray-900 dark:text-white">Total:</span>{' '}
            {formatCurrency(creditNote.total, creditNote.currency?.code)}
          </p>
        )}
      </div>
    ),
    [creditNote?.credit_note_number, contact, creditNote?.contact, creditNote?.total, creditNote?.currency?.code]
  );

  // ---- Preview extra: PDF attachment note ----
  const renderPreviewExtra = useCallback(
    (formData: SendDocumentFormData) =>
      formData.attach_pdf ? (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Credit note PDF will be attached
        </div>
      ) : null,
    []
  );

  if (!creditNote) return null;

  return (
    <SendDocumentModal
      isOpen={isOpen}
      onClose={onClose}
      documentType="credit_note"
      documentLabel="Credit Note"
      contact={contact || creditNote.contact}
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

export default SendCreditNoteModal;
