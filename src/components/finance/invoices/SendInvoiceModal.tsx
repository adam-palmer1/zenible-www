import React, { useState, useEffect } from 'react';
import { X, Mail, Send } from 'lucide-react';
import { useInvoices } from '../../../contexts/InvoiceContext';
import { useNotification } from '../../../contexts/NotificationContext';
import invoicesAPI from '../../../services/api/finance/invoices';

interface SendInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
}

const SendInvoiceModal: React.FC<SendInvoiceModalProps> = ({ isOpen, onClose, invoice }) => {
  const { refresh } = useInvoices();
  const { showSuccess, showError } = useNotification();

  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachPdf, setAttachPdf] = useState(true);
  const [sending, setSending] = useState(false);
  const [, setPreview] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    if (isOpen && invoice) {
      // Set default values
      setTo(invoice.contact?.email || '');
      setCc('');
      setAttachPdf(true);

      // Load email preview
      loadPreview();
    }
  }, [isOpen, invoice]);

  const loadPreview = async () => {
    if (!invoice?.id) return;

    try {
      setLoadingPreview(true);
      const data = await invoicesAPI.previewEmail(invoice.id, {});
      setSubject(data.subject || `Invoice ${invoice.invoice_number}`);
      setMessage(data.body || getDefaultMessage());
      setPreview(data);
    } catch (error: any) {
      console.error('Error loading email preview:', error);
      setSubject(`Invoice ${invoice.invoice_number}`);
      setMessage(getDefaultMessage());
    } finally {
      setLoadingPreview(false);
    }
  };

  const getDefaultMessage = () => {
    return `Hello,

Please find attached invoice ${invoice?.invoice_number || ''} for your review.

${invoice?.total ? `Amount Due: ${invoice.currency} ${invoice.total}` : ''}
${invoice?.due_date ? `Due Date: ${new Date(invoice.due_date).toLocaleDateString()}` : ''}

If you have any questions, please don't hesitate to reach out.

Thank you for your business!`;
  };

  const handleSend = async () => {
    if (!to) {
      showError('Please enter a recipient email address');
      return;
    }

    try {
      setSending(true);
      await invoicesAPI.send(invoice.id, {
        to,
        cc: cc || undefined,
        subject,
        message,
        attach_pdf: attachPdf,
      });

      showSuccess('Invoice sent successfully!');
      refresh();
      onClose();
    } catch (error: any) {
      console.error('Error sending invoice:', error);
      showError(error.message || 'Failed to send invoice');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen || !invoice) return null;

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
                    Send Invoice
                  </h3>
                  <p className="text-sm design-text-secondary">
                    Invoice #{invoice.invoice_number}
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

            {loadingPreview ? (
              <div className="py-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-zenible-primary"></div>
                <p className="mt-2 text-sm design-text-secondary">Loading email preview...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* To */}
                <div>
                  <label className="block text-sm font-medium design-text-primary mb-2">
                    To <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={to}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTo(e.target.value)}
                    placeholder="recipient@example.com"
                    disabled={sending}
                    className="w-full px-3 py-2 design-input rounded-md"
                    required
                  />
                </div>

                {/* CC */}
                <div>
                  <label className="block text-sm font-medium design-text-primary mb-2">
                    CC (Optional)
                  </label>
                  <input
                    type="email"
                    value={cc}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCc(e.target.value)}
                    placeholder="cc@example.com"
                    disabled={sending}
                    className="w-full px-3 py-2 design-input rounded-md"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium design-text-primary mb-2">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)}
                    placeholder="Invoice subject"
                    disabled={sending}
                    className="w-full px-3 py-2 design-input rounded-md"
                    required
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium design-text-primary mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                    placeholder="Email message"
                    disabled={sending}
                    rows={8}
                    className="w-full px-3 py-2 design-input rounded-md resize-none"
                    required
                  />
                </div>

                {/* Attach PDF */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="attachPdf"
                    checked={attachPdf}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAttachPdf(e.target.checked)}
                    disabled={sending}
                    className="h-4 w-4 text-zenible-primary focus:ring-zenible-primary border-gray-300 rounded"
                  />
                  <label htmlFor="attachPdf" className="ml-2 design-text-primary">
                    Attach invoice PDF
                  </label>
                </div>
              </div>
            )}
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
                  Send Invoice
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendInvoiceModal;
