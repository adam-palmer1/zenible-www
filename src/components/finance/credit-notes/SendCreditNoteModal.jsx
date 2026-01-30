import React, { useState, useEffect } from 'react';
import { X, Mail, Eye, Plus, Users } from 'lucide-react';
import { useEffectiveTemplateQuery } from '../../../hooks/queries/useEmailTemplatesQuery';
import { useNotification } from '../../../contexts/NotificationContext';
import creditNotesAPI from '../../../services/api/finance/creditNotes';
import contactsAPI from '../../../services/api/crm/contacts';

/**
 * SendCreditNoteModal Component
 *
 * Dialog for sending credit notes via email with template selection
 *
 * @param {boolean} isOpen - Dialog open state
 * @param {Function} onClose - Callback to close dialog
 * @param {Object} creditNote - Credit note object to send
 * @param {Object} contact - Contact object (for pre-filling email)
 * @param {Function} onSuccess - Callback after successful send
 */
const SendCreditNoteModal = ({
  isOpen,
  onClose,
  creditNote,
  contact,
  onSuccess
}) => {
  const { showSuccess, showError } = useNotification();

  // Form state
  const [formData, setFormData] = useState({
    to_email: '',
    cc_emails: [],
    email_subject: '',
    email_body: '',
    attach_pdf: true,
    template_id: null
  });

  const [ccInput, setCcInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showContactSelector, setShowContactSelector] = useState(false);
  const [relatedContacts, setRelatedContacts] = useState([]);
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Fetch effective template for credit_note_send
  const { data: effectiveTemplate, isLoading: loadingTemplate } = useEffectiveTemplateQuery(
    'credit_note_send',
    { enabled: isOpen }
  );

  // Fetch related contacts when dialog opens
  useEffect(() => {
    const fetchRelatedContacts = async () => {
      if (!isOpen || !contact) return;

      try {
        setLoadingContacts(true);

        // Fetch the full contact details to get additional_contacts
        const fullContact = await contactsAPI.get(contact.id);

        // Build the contacts list: primary contact + additional contacts
        const contactsList = [];

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
          fullContact.contact_persons.forEach(contactPerson => {
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
      } catch (error) {
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
    if (isOpen) {
      // Use template if available, otherwise use defaults
      const defaultSubject = `Credit Note ${creditNote?.credit_note_number || ''}`;
      const defaultBody = `Dear ${contact?.first_name || 'Customer'},\n\nPlease find attached your credit note ${creditNote?.credit_note_number || ''}.\n\nBest regards`;

      setFormData({
        to_email: contact?.email || '',
        cc_emails: [],
        email_subject: effectiveTemplate?.subject || defaultSubject,
        email_body: effectiveTemplate?.body || defaultBody,
        attach_pdf: true,
        template_id: effectiveTemplate?.id || null
      });
    }
  }, [isOpen, effectiveTemplate, contact, creditNote]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
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

  const handleRemoveCcEmail = (emailToRemove) => {
    setFormData(prev => ({
      ...prev,
      cc_emails: prev.cc_emails.filter(email => email !== emailToRemove)
    }));
  };

  const handleCcKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCcEmail();
    }
  };

  const handleToggleContact = (contactId) => {
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
      .filter(c => selectedContactIds.includes(c.id))
      .map(c => c.email);

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

    try {
      setIsSending(true);

      const sendData = {
        email: formData.to_email,
        message: formData.email_body || undefined
      };

      await creditNotesAPI.send(creditNote.id, sendData);

      showSuccess(`Credit note sent successfully to ${formData.to_email}`);
      onSuccess?.();
      onClose();
    } catch (error) {
      showError(error.message || 'Failed to send credit note');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main Dialog */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-zenible-primary" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Send Credit Note
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zenible-primary"></div>
              </div>
            ) : (
              <>
                {/* Credit Note Info */}
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
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
                      onChange={(e) => setCcInput(e.target.value)}
                      onKeyDown={handleCcKeyDown}
                      placeholder="manager@example.com"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddCcEmail}
                      className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-zenible-primary border border-zenible-primary rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20"
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

                {/* Custom Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Message (Optional)
                  </label>
                  <textarea
                    name="email_body"
                    value={formData.email_body}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Add a personal message to include in the email..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    The credit note PDF will be attached to the email automatically.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handlePreview}
              disabled={!formData.to_email}
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
                disabled={isSending || !formData.to_email}
                className="inline-flex items-center gap-1.5 px-6 py-2 text-sm font-medium text-white bg-zenible-primary rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                <Mail className="h-4 w-4" />
                {isSending ? 'Sending...' : 'Send Credit Note'}
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
            onClick={(e) => e.stopPropagation()}
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
                  Credit Note {creditNote?.credit_note_number}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message
                </label>
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 whitespace-pre-wrap">
                  {formData.email_body || '(No custom message)'}
                </div>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                PDF attachment: Credit Note {creditNote?.credit_note_number}.pdf
              </div>
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
            onClick={(e) => e.stopPropagation()}
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
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zenible-primary"></div>
                </div>
              ) : relatedContacts.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No contacts found
                </div>
              ) : (
                <div className="space-y-2">
                  {relatedContacts.map((c) => (
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

export default SendCreditNoteModal;
