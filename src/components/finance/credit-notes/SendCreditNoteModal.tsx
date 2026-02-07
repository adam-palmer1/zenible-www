import React, { useCallback, useMemo } from 'react';
import SendDocumentModal from '../shared/SendDocumentModal';
import type { SendDocumentFormData } from '../shared/SendDocumentModal';
import creditNotesAPI from '../../../services/api/finance/creditNotes';

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
  // ---- Send handler (maps shared form data to the credit note API shape) ----
  const handleSend = useCallback(
    async (formData: SendDocumentFormData) => {
      const sendData: Record<string, any> = {
        email: formData.to_email,
        message: formData.email_body || undefined,
      };
      await creditNotesAPI.send(creditNote.id, sendData);
    },
    [creditNote?.id]
  );

  // ---- Default form values (used when no email template exists) ----
  const defaultFormValues = useMemo(
    () => ({
      email_subject: `Credit Note ${creditNote?.credit_note_number || ''}`,
      email_body: `Dear ${contact?.first_name || 'Customer'},\n\nPlease find attached your credit note ${creditNote?.credit_note_number || ''}.\n\nBest regards`,
    }),
    [creditNote?.credit_note_number, contact?.first_name]
  );

  // ---- Document info section ----
  const renderDocumentInfo = useCallback(
    () => (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium text-gray-900 dark:text-white">Credit Note:</span>{' '}
          {creditNote?.credit_note_number}
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
    [creditNote?.credit_note_number, contact]
  );

  // ---- Extra fields: info box about automatic PDF attachment ----
  const renderExtraFields = useCallback(
    () => (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-700 dark:text-blue-400">
          The credit note PDF will be attached to the email automatically.
        </p>
      </div>
    ),
    []
  );

  // ---- Preview extra: PDF attachment note ----
  const renderPreviewExtra = useCallback(
    () => (
      <div className="text-sm text-gray-600 dark:text-gray-400">
        PDF attachment: Credit Note {creditNote?.credit_note_number}.pdf
      </div>
    ),
    [creditNote?.credit_note_number]
  );

  return (
    <SendDocumentModal
      isOpen={isOpen}
      onClose={onClose}
      documentType="credit_note"
      documentLabel="Credit Note"
      contact={contact}
      onSend={handleSend}
      onSendSuccess={onSuccess}
      defaultFormValues={defaultFormValues}
      renderDocumentInfo={renderDocumentInfo}
      renderExtraFields={renderExtraFields}
      renderPreviewExtra={renderPreviewExtra}
      showSubjectField={false}
      bodyRequired={false}
      htmlPreview={false}
      bodyLabel="Message (Optional)"
      bodyPlaceholder="Add a personal message to include in the email..."
      bodyRows={6}
    />
  );
};

export default SendCreditNoteModal;
