import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { X, Mail, Eye, Plus, Users, Bell, AlertCircle } from 'lucide-react';
import { useEffectiveTemplateQuery } from '../../../hooks/queries/useEmailTemplatesQuery';
import { useNotification } from '../../../contexts/NotificationContext';
import { useInvoices } from '../../../contexts/InvoiceContext';
import contactsAPI from '../../../services/api/crm/contacts';

const contactsAPIAny = contactsAPI as any;

interface SendReminderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  contact: any;
  onSuccess?: () => void;
}

const SendReminderDialog: React.FC<SendReminderDialogProps> = ({
  isOpen,
  onClose,
  invoice,
  contact,
  onSuccess
}) => {
  const { showSuccess, showError } = useNotification() as any;
  const { sendReminder } = useInvoices() as any;

  // Form state
  const [formData, setFormData] = useState({
    to_email: '',
    cc_emails: [] as string[],
    email_subject: '',
    email_body: '',
    attach_pdf: true,
    template_id: null as string | null
  });

  const [ccInput, setCcInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showContactSelector, setShowContactSelector] = useState(false);
  const [relatedContacts, setRelatedContacts] = useState<any[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Fetch effective template for invoice_reminder
  const { data: effectiveTemplate, isLoading: loadingTemplate } = useEffectiveTemplateQuery(
    'invoice_reminder',
    { enabled: isOpen }
  ) as any;

  // Calculate days overdue
  const getDaysOverdue = () => {
    if (!invoice?.due_date) return 0;
    const dueDate = new Date(invoice.due_date);
    const today = new Date();
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Fetch related contacts when dialog opens
  useEffect(() => {
    const fetchRelatedContacts = async () => {
      if (!isOpen || !contact) return;

      try {
        setLoadingContacts(true);

        // Fetch the full contact details to get additional_contacts
        const fullContact = await contactsAPIAny.get(contact.id);

        // Build the contacts list: primary contact + additional contacts
        const contactsList: any[] = [];

        // Add primary contact if they have an email
        if (fullContact.email) {
          contactsList.push({
            id: fullContact.id,
            first_name: fullContact.first_name,
            last_name: fullContact.last_name,
            email: fullContact.email,
            business_name: fullContact.business_name,
            is_primary: true
          });
        }

        // Add contact persons if they exist
        if (fullContact.contact_persons && Array.isArray(fullContact.contact_persons)) {
          fullContact.contact_persons.forEach((contactPerson: any) => {
            if (contactPerson.email) {
              contactsList.push({
                id: contactPerson.id,
                first_name: contactPerson.first_name,
                last_name: contactPerson.last_name,
                email: contactPerson.email,
                business_name: fullContact.business_name, // Inherit from primary
                is_primary: false
              });
            }
          });
        }

        setRelatedContacts(contactsList);

        // Pre-select the primary contact
        if (contact.id) {
          setSelectedContactIds([contact.id]);
        }
      } catch (error: any) {
        console.error('Failed to fetch related contacts:', error);
        // Fall back to just the primary contact
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

  // Pre-fill form when dialog opens
  useEffect(() => {
    if (isOpen && effectiveTemplate) {
      setFormData({
        to_email: contact?.email || '',
        cc_emails: [],
        email_subject: effectiveTemplate.subject || '',
        email_body: effectiveTemplate.body || '',
        attach_pdf: true,
        template_id: effectiveTemplate.id
      });
    }
  }, [isOpen, effectiveTemplate, contact]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddCcEmail = () => {
    const email = ccInput.trim();
    if (!email) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError('Please enter a valid email address');
      return;
    }

    if (formData.cc_emails.includes(email)) {
      showError('This email is already in the CC list');
      return;
    }

    setFormData(prev => ({
      ...prev,
      cc_emails: [...prev.cc_emails, email]
    }));
    setCcInput('');
  };

  const handleRemoveCcEmail = (emailToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      cc_emails: prev.cc_emails.filter(email => email !== emailToRemove)
    }));
  };

  const handleCcKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCcEmail();
    }
  };

  const handleToggleContact = (contactId: string) => {
    setSelectedContactIds(prev => {
      if (prev.includes(contactId)) {
        return prev.filter(id => id !== contactId);
      } else {
        return [...prev, contactId];
      }
    });
  };

  const handleApplyContacts = () => {
    const selectedEmails = relatedContacts
      .filter((c: any) => selectedContactIds.includes(c.id))
      .map((c: any) => c.email);

    if (selectedEmails.length === 0) {
      showError('Please select at least one contact');
      return;
    }

    // Set first email as to_email, rest as CC
    setFormData(prev => ({
      ...prev,
      to_email: selectedEmails[0],
      cc_emails: selectedEmails.slice(1)
    }));

    setShowContactSelector(false);
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleSend = async () => {
    // Validation
    if (!formData.to_email) {
      showError('Recipient email is required');
      return;
    }

    if (!formData.email_subject) {
      showError('Email subject is required');
      return;
    }

    if (!formData.email_body) {
      showError('Email body is required');
      return;
    }

    try {
      setIsSending(true);

      const sendData = {
        to_email: formData.to_email,
        additional_recipients: formData.cc_emails.length > 0 ? formData.cc_emails : undefined,
        email_subject: formData.email_subject,
        email_body: formData.email_body,
        attach_pdf: formData.attach_pdf,
        template_id: formData.template_id
      };

      await sendReminder(invoice.id, sendData);

      showSuccess(`Reminder sent successfully to ${formData.to_email}`);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      showError(error.message || 'Failed to send reminder');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  const daysOverdue = getDaysOverdue();
  const reminderCount = invoice?.reminder_count || 0;

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
              <Bell className="h-5 w-5 text-orange-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Send Payment Reminder
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-4">
            {loadingTemplate ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              </div>
            ) : (
              <>
                {/* Invoice Info */}
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

                {/* Reminder Status Info */}
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Reminder Status
                      </p>
                      <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <p>
                          <span className="font-medium">Previous reminders sent:</span> {reminderCount}
                        </p>
                        {daysOverdue > 0 && (
                          <p>
                            <span className="font-medium">Days overdue:</span>{' '}
                            <span className="text-red-600 dark:text-red-400">{daysOverdue} days</span>
                          </p>
                        )}
                        {invoice?.last_reminder_sent_at && (
                          <p>
                            <span className="font-medium">Last reminder:</span>{' '}
                            {new Date(invoice.last_reminder_sent_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Selector Button */}
                {relatedContacts.length > 0 && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {relatedContacts.length} {relatedContacts.length === 1 ? 'Contact' : 'Contacts'} Available
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCcInput(e.target.value)}
                      onKeyDown={handleCcKeyDown}
                      placeholder="manager@example.com"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddCcEmail}
                      className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-orange-600 border border-orange-600 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20"
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
                          <span className="text-gray-700 dark:text-gray-300">{email}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCcEmail(email)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="email_subject"
                    value={formData.email_subject}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                {/* Body */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Message *
                  </label>
                  <textarea
                    name="email_body"
                    value={formData.email_body}
                    onChange={handleChange}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm"
                    required
                  />
                </div>

                {/* Attach PDF */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="attach_pdf"
                    name="attach_pdf"
                    checked={formData.attach_pdf}
                    onChange={handleChange}
                    className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label htmlFor="attach_pdf" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Attach invoice PDF to email
                  </label>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handlePreview}
              disabled={!formData.email_subject || !formData.email_body}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={isSending || !formData.to_email || !formData.email_subject || !formData.email_body}
                className="inline-flex items-center gap-1.5 px-6 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                <Bell className="h-4 w-4" />
                {isSending ? 'Sending...' : 'Send Reminder'}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  {formData.email_subject}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message
                </label>
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formData.email_body) }} />
                </div>
              </div>

              {formData.attach_pdf && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Attached: Invoice PDF will be attached
                </div>
              )}
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
                Select recipients from {contact?.business_name || `${contact?.first_name} ${contact?.last_name}`}'s contacts
              </p>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {loadingContacts ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
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
                {selectedContactIds.length} {selectedContactIds.length === 1 ? 'contact' : 'contacts'} selected
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

export default SendReminderDialog;
