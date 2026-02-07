import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import DOMPurify from 'dompurify';
import { X, Mail, Eye, Plus, Users } from 'lucide-react';
import { useEffectiveTemplateQuery } from '../../../hooks/queries/useEmailTemplatesQuery';
import { useNotification } from '../../../contexts/NotificationContext';
import contactsAPI from '../../../services/api/crm/contacts';

const contactsAPIAny = contactsAPI as unknown as Record<string, Function>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DocumentType = 'invoice' | 'quote' | 'credit_note';

export interface SendDocumentFormData {
  to_email: string;
  cc_emails: string[];
  email_subject: string;
  email_body: string;
  attach_pdf: boolean;
  template_id: string | null;
}

export interface SendDocumentModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;

  /**
   * Document type – drives the email template key and default labels.
   * Template keys are derived as `${documentType}_send`, e.g. `invoice_send`.
   */
  documentType: DocumentType;

  /**
   * Human-readable document label shown in the header and buttons.
   * Examples: "Invoice", "Quote", "Credit Note".
   * If omitted, a sensible default is derived from `documentType`.
   */
  documentLabel?: string;

  /**
   * Contact object for the recipient.  Must have at least `id` and `email`.
   * When present the modal fetches full contact details (contact persons) from
   * the CRM API so the user can pick multiple recipients.
   */
  contact?: any;

  /**
   * Render prop for the document-specific info section displayed at the top of
   * the form body (e.g. invoice number, quote total, credit note number).
   */
  renderDocumentInfo?: () => ReactNode;

  /**
   * Additional content rendered between the message textarea and the footer
   * (e.g. an "Attach PDF" checkbox or an info box).  If omitted, a default
   * "Attach PDF" checkbox is rendered.
   */
  renderExtraFields?: (formData: SendDocumentFormData, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void) => ReactNode;

  /**
   * Whether to show the Subject field.  Defaults to `true`.
   * Credit Note sends currently do not use a subject input.
   */
  showSubjectField?: boolean;

  /**
   * Whether the email body is required for validation.  Defaults to `true`.
   */
  bodyRequired?: boolean;

  /**
   * Whether to render the email body preview using DOMPurify-sanitised HTML
   * (true, the default) or as plain pre-wrapped text (false).
   */
  htmlPreview?: boolean;

  /**
   * Label for the body textarea.  Defaults to "Message *" (or "Message (Optional)"
   * when `bodyRequired` is false).
   */
  bodyLabel?: string;

  /**
   * Placeholder for the body textarea.
   */
  bodyPlaceholder?: string;

  /**
   * Number of rows for the body textarea.  Defaults to 8.
   */
  bodyRows?: number;

  /**
   * Render prop for extra preview content shown below the message in the
   * preview modal (e.g. "Invoice PDF will be attached").
   */
  renderPreviewExtra?: (formData: SendDocumentFormData) => ReactNode;

  /**
   * Default form values used when the modal first opens.
   * Useful for pre-populating subject/body when no template exists (credit notes).
   */
  defaultFormValues?: Partial<Pick<SendDocumentFormData, 'email_subject' | 'email_body'>>;

  /**
   * Callback invoked when the user clicks Send.  Receives the current form
   * data.  Should return a promise – if the promise rejects the error message
   * is shown.  On resolve the modal closes automatically.
   */
  onSend: (formData: SendDocumentFormData) => Promise<void>;

  /**
   * Optional callback invoked after a successful send (before close).
   */
  onSendSuccess?: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DOCUMENT_LABELS: Record<DocumentType, string> = {
  invoice: 'Invoice',
  quote: 'Quote',
  credit_note: 'Credit Note',
};

const TEMPLATE_KEYS: Record<DocumentType, string> = {
  invoice: 'invoice_send',
  quote: 'quote_send',
  credit_note: 'credit_note_send',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SendDocumentModal: React.FC<SendDocumentModalProps> = ({
  isOpen,
  onClose,
  documentType,
  documentLabel: documentLabelProp,
  contact,
  renderDocumentInfo,
  renderExtraFields,
  showSubjectField = true,
  bodyRequired = true,
  htmlPreview = true,
  bodyLabel: bodyLabelProp,
  bodyPlaceholder,
  bodyRows = 8,
  renderPreviewExtra,
  defaultFormValues,
  onSend,
  onSendSuccess,
}) => {
  const { showSuccess, showError } = useNotification();

  const documentLabel = documentLabelProp || DOCUMENT_LABELS[documentType];
  const templateKey = TEMPLATE_KEYS[documentType];

  const bodyLabel =
    bodyLabelProp ?? (bodyRequired ? 'Message *' : 'Message (Optional)');

  // ---- Form state ----
  const [formData, setFormData] = useState<SendDocumentFormData>({
    to_email: '',
    cc_emails: [],
    email_subject: '',
    email_body: '',
    attach_pdf: true,
    template_id: null,
  });

  const [ccInput, setCcInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showContactSelector, setShowContactSelector] = useState(false);
  const [relatedContacts, setRelatedContacts] = useState<any[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // ---- Template fetching ----
  const { data: effectiveTemplate, isLoading: loadingTemplate } =
    useEffectiveTemplateQuery(templateKey, { enabled: isOpen }) as { data: { id?: string; subject?: string; body?: string } | undefined; isLoading: boolean };

  // ---- Fetch related contacts ----
  useEffect(() => {
    const fetchRelatedContacts = async () => {
      if (!isOpen || !contact) return;

      try {
        setLoadingContacts(true);

        const fullContact = await contactsAPIAny.get(contact.id);

        const contactsList: any[] = [];

        if (fullContact.email) {
          contactsList.push({
            id: fullContact.id,
            first_name: fullContact.first_name,
            last_name: fullContact.last_name,
            email: fullContact.email,
            business_name: fullContact.business_name,
            is_primary: true,
          });
        }

        if (
          fullContact.contact_persons &&
          Array.isArray(fullContact.contact_persons)
        ) {
          fullContact.contact_persons.forEach((contactPerson: any) => {
            if (contactPerson.email) {
              contactsList.push({
                id: contactPerson.id,
                first_name: contactPerson.first_name,
                last_name: contactPerson.last_name,
                email: contactPerson.email,
                business_name: fullContact.business_name,
                is_primary: false,
              });
            }
          });
        }

        setRelatedContacts(contactsList);

        if (contact.id) {
          setSelectedContactIds([contact.id]);
        }
      } catch (error: any) {
        console.error('Failed to fetch related contacts:', error);
        if (contact.email) {
          setRelatedContacts([contact]);
          setSelectedContactIds([contact.id]);
        }
      } finally {
        setLoadingContacts(false);
      }
    };

    fetchRelatedContacts();
  }, [isOpen, contact]);

  // ---- Pre-fill form when dialog opens ----
  useEffect(() => {
    if (isOpen) {
      setFormData({
        to_email: contact?.email || '',
        cc_emails: [],
        email_subject:
          effectiveTemplate?.subject || defaultFormValues?.email_subject || '',
        email_body:
          effectiveTemplate?.body || defaultFormValues?.email_body || '',
        attach_pdf: true,
        template_id: effectiveTemplate?.id || null,
      });
    }
  }, [isOpen, effectiveTemplate, contact, defaultFormValues]);

  // ---- Handlers ----
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    },
    []
  );

  const handleAddCcEmail = useCallback(() => {
    const email = ccInput.trim();
    if (!email) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError('Please enter a valid email address');
      return;
    }

    if (formData.cc_emails.includes(email)) {
      showError('This email is already in the CC list');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      cc_emails: [...prev.cc_emails, email],
    }));
    setCcInput('');
  }, [ccInput, formData.cc_emails, showError]);

  const handleRemoveCcEmail = useCallback((emailToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      cc_emails: prev.cc_emails.filter((email) => email !== emailToRemove),
    }));
  }, []);

  const handleCcKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddCcEmail();
      }
    },
    [handleAddCcEmail]
  );

  const handleToggleContact = useCallback((contactId: string) => {
    setSelectedContactIds((prev) => {
      if (prev.includes(contactId)) {
        return prev.filter((id) => id !== contactId);
      } else {
        return [...prev, contactId];
      }
    });
  }, []);

  const handleApplyContacts = useCallback(() => {
    const selectedEmails = relatedContacts
      .filter((c: any) => selectedContactIds.includes(c.id))
      .map((c: any) => c.email);

    if (selectedEmails.length === 0) {
      showError('Please select at least one contact');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      to_email: selectedEmails[0],
      cc_emails: selectedEmails.slice(1),
    }));

    setShowContactSelector(false);
  }, [relatedContacts, selectedContactIds, showError]);

  const handlePreview = useCallback(() => {
    setShowPreview(true);
  }, []);

  const handleSend = useCallback(async () => {
    if (!formData.to_email) {
      showError('Recipient email is required');
      return;
    }

    if (showSubjectField && !formData.email_subject) {
      showError('Email subject is required');
      return;
    }

    if (bodyRequired && !formData.email_body) {
      showError('Email body is required');
      return;
    }

    try {
      setIsSending(true);
      await onSend(formData);
      showSuccess(`${documentLabel} sent successfully to ${formData.to_email}`);
      onSendSuccess?.();
      onClose();
    } catch (error: any) {
      showError(error.message || `Failed to send ${documentLabel.toLowerCase()}`);
    } finally {
      setIsSending(false);
    }
  }, [
    formData,
    showSubjectField,
    bodyRequired,
    onSend,
    showSuccess,
    showError,
    documentLabel,
    onSendSuccess,
    onClose,
  ]);

  // ---- Derived state for button disabled ----
  const sendDisabled =
    isSending ||
    !formData.to_email ||
    (showSubjectField && !formData.email_subject) ||
    (bodyRequired && !formData.email_body);

  const previewDisabled =
    (showSubjectField && !formData.email_subject && bodyRequired && !formData.email_body) ||
    !formData.to_email;

  if (!isOpen) return null;

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <>
      {/* Main Dialog */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-zenible-primary" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Send {documentLabel}
              </h2>
            </div>
            <button
              onClick={onClose}
              disabled={isSending}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-4">
            {loadingTemplate ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zenible-primary"></div>
              </div>
            ) : (
              <>
                {/* Document Info (render prop) */}
                {renderDocumentInfo && renderDocumentInfo()}

                {/* Contact Selector Button */}
                {relatedContacts.length > 0 && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {relatedContacts.length}{' '}
                            {relatedContacts.length === 1
                              ? 'Contact'
                              : 'Contacts'}{' '}
                            Available
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {selectedContactIds.length} selected
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowContactSelector(true)}
                        className="px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-700 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30"
                      >
                        Select Recipients
                      </button>
                    </div>
                  </div>
                )}

                {/* To Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    To Email *
                  </label>
                  <input
                    type="email"
                    name="to_email"
                    value={formData.to_email}
                    onChange={handleChange}
                    placeholder="client@example.com"
                    disabled={isSending}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50"
                    required
                  />
                </div>

                {/* CC Emails */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    CC Emails (Optional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={ccInput}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCcInput(e.target.value)
                      }
                      onKeyDown={handleCcKeyDown}
                      placeholder="manager@example.com"
                      disabled={isSending}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={handleAddCcEmail}
                      disabled={isSending}
                      className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-zenible-primary border border-zenible-primary rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </button>
                  </div>
                  {formData.cc_emails.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.cc_emails.map((email, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm"
                        >
                          <span className="text-gray-700 dark:text-gray-300">
                            {email}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCcEmail(email)}
                            disabled={isSending}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Subject (optional) */}
                {showSubjectField && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Subject *
                    </label>
                    <input
                      type="text"
                      name="email_subject"
                      value={formData.email_subject}
                      onChange={handleChange}
                      disabled={isSending}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50"
                      required
                    />
                  </div>
                )}

                {/* Body */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {bodyLabel}
                  </label>
                  <textarea
                    name="email_body"
                    value={formData.email_body}
                    onChange={handleChange}
                    rows={bodyRows}
                    placeholder={bodyPlaceholder}
                    disabled={isSending}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm resize-none disabled:opacity-50"
                    required={bodyRequired}
                  />
                </div>

                {/* Extra fields (render prop) */}
                {renderExtraFields
                  ? renderExtraFields(formData, handleChange)
                  : (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="attach_pdf"
                        name="attach_pdf"
                        checked={formData.attach_pdf}
                        onChange={handleChange}
                        disabled={isSending}
                        className="h-4 w-4 text-zenible-primary focus:ring-zenible-primary border-gray-300 rounded"
                      />
                      <label
                        htmlFor="attach_pdf"
                        className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        Attach {documentLabel.toLowerCase()} PDF to email
                      </label>
                    </div>
                  )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handlePreview}
              disabled={previewDisabled}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSending}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={sendDisabled}
                className="inline-flex items-center gap-1.5 px-6 py-2 text-sm font-medium text-white bg-zenible-primary rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Mail className="h-4 w-4" />
                {isSending ? 'Sending...' : `Send ${documentLabel}`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Email Preview
              </h3>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  To
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  {formData.to_email}
                </div>
              </div>

              {formData.cc_emails.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    CC
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                    {formData.cc_emails.join(', ')}
                  </div>
                </div>
              )}

              {showSubjectField && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subject
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                    {formData.email_subject}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message
                </label>
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  {htmlPreview ? (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(formData.email_body),
                      }}
                    />
                  ) : (
                    <div className="whitespace-pre-wrap">
                      {formData.email_body || '(No custom message)'}
                    </div>
                  )}
                </div>
              </div>

              {renderPreviewExtra && renderPreviewExtra(formData)}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Selector Modal */}
      {showContactSelector && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4"
          onClick={() => setShowContactSelector(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Select Recipients
                  </h3>
                </div>
                <button
                  onClick={() => setShowContactSelector(false)}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Select recipients from{' '}
                {contact?.business_name ||
                  `${contact?.first_name} ${contact?.last_name}`}
                's contacts
              </p>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {loadingContacts ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zenible-primary"></div>
                </div>
              ) : relatedContacts.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No contacts found
                </div>
              ) : (
                <div className="space-y-2">
                  {relatedContacts.map((c: any) => (
                    <label
                      key={c.id}
                      className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedContactIds.includes(c.id)
                          ? 'border-purple-300 bg-purple-50 dark:border-purple-700 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedContactIds.includes(c.id)}
                        onChange={() => handleToggleContact(c.id)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {c.first_name} {c.last_name}
                          </p>
                          {c.is_primary && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded">
                              Primary
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {c.email}
                        </p>
                        {c.business_name && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                            {c.business_name}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedContactIds.length}{' '}
                {selectedContactIds.length === 1 ? 'contact' : 'contacts'}{' '}
                selected
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowContactSelector(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyContacts}
                  disabled={selectedContactIds.length === 0}
                  className="px-6 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  Apply Selection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SendDocumentModal;
