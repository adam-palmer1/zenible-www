import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, FileText, Loader2 } from 'lucide-react';
import { useQuotes } from '../../../contexts/QuoteContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { formatCurrency } from '../../../utils/currency';

interface ConvertToInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: any;
}

const ConvertToInvoiceModal: React.FC<ConvertToInvoiceModalProps> = ({ isOpen, onClose, quote }) => {
  const navigate = useNavigate();
  const { convertToInvoice } = useQuotes() as any;
  const { showSuccess, showError } = useNotification() as any;

  const [converting, setConverting] = useState(false);

  const handleConvert = async () => {
    try {
      setConverting(true);

      const invoice = await convertToInvoice(quote.id, {});

      showSuccess(`Quote converted to invoice ${invoice.invoice_number}`);
      onClose();
      navigate(`/finance/invoices/${invoice.id}`);
    } catch (error: any) {
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

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10">
          <div className="bg-white dark:bg-gray-800 px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zenible-primary/10 rounded-lg">
                  <FileText className="h-6 w-6 text-zenible-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Convert to Invoice
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Quote #{quote.quote_number}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={converting}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quote Summary */}
            <div className="mb-6 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Client:</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {quote.contact?.business_name || (quote.contact?.first_name ? `${quote.contact.first_name} ${quote.contact.last_name || ''}`.trim() : 'N/A')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Total:</span>
                  <span className="text-gray-900 dark:text-white font-semibold">
                    {formatCurrency(quote.total, quote.currency_code || quote.currency?.code)}
                  </span>
                </div>
              </div>
            </div>

          </div>

          <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={converting}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConvert}
              disabled={converting}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-zenible-primary rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
