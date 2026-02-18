import React, { useCallback } from 'react';
import SendDocumentModal from '../shared/SendDocumentModal';
import type { SendDocumentFormData } from '../shared/SendDocumentModal';
import { useQuotes } from '../../../contexts/QuoteContext';
import quotesAPI from '../../../services/api/finance/quotes';
import { formatCurrency } from '../../../utils/currency';
import { useQuoteEmailPreview } from '../../../hooks/queries/useQuoteEmailPreview';

interface SendQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: any;
  contact?: any;
  onSuccess?: () => void;
}

/**
 * SendQuoteModal Component
 *
 * Modal for sending quotes via email with template selection
 */
const SendQuoteModal: React.FC<SendQuoteModalProps> = ({ isOpen, onClose, quote, onSuccess }) => {
  const { refresh } = useQuotes();

  // ---- Fetch rendered email preview ----
  const { data: emailPreview, isLoading: previewLoading } = useQuoteEmailPreview(
    quote?.id,
    { enabled: isOpen }
  );

  // ---- Send handler (maps shared form data to the quote API shape) ----
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
      await quotesAPI.send(quote.id, sendData);
    },
    [quote?.id]
  );

  // ---- Post-send: refresh quote list ----
  const handleSendSuccess = useCallback(() => {
    refresh();
    onSuccess?.();
  }, [refresh, onSuccess]);

  // ---- Document info section (includes quote total/currency) ----
  const renderDocumentInfo = useCallback(
    () => (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium text-gray-900 dark:text-white">Quote:</span>{' '}
          {quote?.quote_number}
        </p>
        {quote?.contact && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            <span className="font-medium text-gray-900 dark:text-white">Client:</span>{' '}
            {quote.contact.first_name} {quote.contact.last_name}
            {quote.contact.business_name && ` (${quote.contact.business_name})`}
          </p>
        )}
        {quote?.total && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            <span className="font-medium text-gray-900 dark:text-white">Total:</span>{' '}
            {formatCurrency(quote.total, quote.currency?.code)}
          </p>
        )}
      </div>
    ),
    [quote?.quote_number, quote?.contact, quote?.total, quote?.currency?.code]
  );

  // ---- Preview extra: PDF attachment note ----
  const renderPreviewExtra = useCallback(
    (formData: SendDocumentFormData) =>
      formData.attach_pdf ? (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Quote PDF will be attached
        </div>
      ) : null,
    []
  );

  if (!quote) return null;

  return (
    <SendDocumentModal
      isOpen={isOpen}
      onClose={onClose}
      documentType="quote"
      documentLabel="Quote"
      contact={quote.contact}
      onSend={handleSend}
      onSendSuccess={handleSendSuccess}
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

export default SendQuoteModal;
