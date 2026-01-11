import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, FileText, Loader2 } from 'lucide-react';
import { useQuotes } from '../../../contexts/QuoteContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { formatCurrency } from '../../../utils/currency';

const ConvertToInvoiceModal = ({ isOpen, onClose, quote }) => {
  const navigate = useNavigate();
  const { convertToInvoice } = useQuotes();
  const { showSuccess, showError } = useNotification();

  const [converting, setConverting] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [autoSend, setAutoSend] = useState(false);

  const handleConvert = async () => {
    try {
      setConverting(true);

      const conversionData = {
        invoice_date: invoiceDate,
        due_date: dueDate || undefined,
        auto_send: autoSend,
      };

      const invoice = await convertToInvoice(quote.id, conversionData);

      showSuccess(`Quote converted to invoice ${invoice.invoice_number}`);
      onClose();
      navigate(`/finance/invoices/${invoice.id}`);
    } catch (error) {
      console.error('Error converting quote:', error);
      showError(error.message || 'Failed to convert quote to invoice');
    } finally {
      setConverting(false);
    }
  };

  if (!isOpen || !quote) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block align-bottom design-bg-primary rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="design-bg-primary px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zenible-primary/10 rounded-lg">
                  <FileText className="h-6 w-6 text-zenible-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold design-text-primary">
                    Convert to Invoice
                  </h3>
                  <p className="text-sm design-text-secondary">
                    Quote #{quote.quote_number}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={converting}
                className="design-text-secondary hover:design-text-primary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quote Summary */}
            <div className="mb-6 design-bg-secondary rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="design-text-secondary">Client:</span>
                  <span className="design-text-primary font-medium">
                    {quote.contact?.name || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="design-text-secondary">Total:</span>
                  <span className="design-text-primary font-semibold">
                    {formatCurrency(quote.total, quote.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="design-text-secondary">Items:</span>
                  <span className="design-text-primary">
                    {quote.items?.length || 0} line items
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Invoice Date */}
              <div>
                <label className="block text-sm font-medium design-text-primary mb-2">
                  Invoice Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  disabled={converting}
                  className="w-full px-3 py-2 design-input rounded-md"
                  required
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium design-text-primary mb-2">
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={converting}
                  min={invoiceDate}
                  className="w-full px-3 py-2 design-input rounded-md"
                />
                <p className="mt-1 text-xs design-text-secondary">
                  Leave blank to use default payment terms
                </p>
              </div>

              {/* Auto Send */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoSend"
                  checked={autoSend}
                  onChange={(e) => setAutoSend(e.target.checked)}
                  disabled={converting}
                  className="h-4 w-4 text-zenible-primary focus:ring-zenible-primary border-gray-300 rounded"
                />
                <label htmlFor="autoSend" className="ml-2 design-text-primary">
                  Send invoice to client automatically
                </label>
              </div>

              {/* Info Box */}
              <div className="design-bg-secondary rounded-lg p-4">
                <p className="text-sm design-text-secondary">
                  <strong className="design-text-primary">Note:</strong> Converting this quote will:
                </p>
                <ul className="mt-2 text-sm design-text-secondary list-disc list-inside space-y-1">
                  <li>Create a new invoice with all quote details</li>
                  <li>Mark this quote as "Invoiced"</li>
                  <li>Link the invoice to this quote</li>
                  {autoSend && <li>Send the invoice to {quote.contact?.email}</li>}
                </ul>
              </div>
            </div>
          </div>

          <div className="design-bg-secondary px-6 py-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={converting}
              className="px-4 py-2 text-sm font-medium design-text-primary design-bg-tertiary rounded-md hover:design-bg-quaternary disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConvert}
              disabled={converting || !invoiceDate}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-zenible-primary rounded-md hover:bg-zenible-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {converting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Convert to Invoice
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConvertToInvoiceModal;
