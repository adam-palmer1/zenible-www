import React, { useState, useEffect } from 'react';
import { X, Mail, Send } from 'lucide-react';
import { useQuotes } from '../../../contexts/QuoteContext';
import { useNotification } from '../../../contexts/NotificationContext';
import quotesAPI from '../../../services/api/finance/quotes';

const SendQuoteModal = ({ isOpen, onClose, quote }) => {
  const { refresh } = useQuotes();
  const { showSuccess, showError } = useNotification();

  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachPdf, setAttachPdf] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isOpen && quote) {
      setTo(quote.contact?.email || '');
      setCc('');
      setSubject(`Quote ${quote.quote_number}`);
      setMessage(getDefaultMessage());
      setAttachPdf(true);
    }
  }, [isOpen, quote]);

  const getDefaultMessage = () => {
    return `Hello,

Please find attached quote ${quote?.quote_number || ''} for your review.

${quote?.total ? `Total: ${quote.currency} ${quote.total}` : ''}
${quote?.valid_until ? `Valid Until: ${new Date(quote.valid_until).toLocaleDateString()}` : ''}

You can review and accept the quote by clicking the link in this email.

If you have any questions, please don't hesitate to reach out.

Thank you!`;
  };

  const handleSend = async () => {
    if (!to) {
      showError('Please enter a recipient email address');
      return;
    }

    try {
      setSending(true);
      await quotesAPI.send(quote.id, {
        to,
        cc: cc || undefined,
        subject,
        message,
        attach_pdf: attachPdf,
      });

      showSuccess('Quote sent successfully!');
      refresh();
      onClose();
    } catch (error) {
      console.error('Error sending quote:', error);
      showError(error.message || 'Failed to send quote');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen || !quote) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block align-bottom design-bg-primary rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="design-bg-primary px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zenible-primary/10 rounded-lg">
                  <Mail className="h-6 w-6 text-zenible-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold design-text-primary">
                    Send Quote
                  </h3>
                  <p className="text-sm design-text-secondary">
                    Quote #{quote.quote_number}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={sending}
                className="design-text-secondary hover:design-text-primary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium design-text-primary mb-2">
                  To <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="recipient@example.com"
                  disabled={sending}
                  className="w-full px-3 py-2 design-input rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium design-text-primary mb-2">
                  CC (Optional)
                </label>
                <input
                  type="email"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="cc@example.com"
                  disabled={sending}
                  className="w-full px-3 py-2 design-input rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium design-text-primary mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Quote subject"
                  disabled={sending}
                  className="w-full px-3 py-2 design-input rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium design-text-primary mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Email message"
                  disabled={sending}
                  rows={8}
                  className="w-full px-3 py-2 design-input rounded-md resize-none"
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="attachPdf"
                  checked={attachPdf}
                  onChange={(e) => setAttachPdf(e.target.checked)}
                  disabled={sending}
                  className="h-4 w-4 text-zenible-primary focus:ring-zenible-primary border-gray-300 rounded"
                />
                <label htmlFor="attachPdf" className="ml-2 design-text-primary">
                  Attach quote PDF
                </label>
              </div>
            </div>
          </div>

          <div className="design-bg-secondary px-6 py-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              className="px-4 py-2 text-sm font-medium design-text-primary design-bg-tertiary rounded-md hover:design-bg-quaternary disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !to || !subject || !message}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-zenible-primary rounded-md hover:bg-zenible-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Quote
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendQuoteModal;
