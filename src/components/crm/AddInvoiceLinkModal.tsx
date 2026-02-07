import React, { useState, useEffect } from 'react';
import Modal from '../ui/modal/Modal';
import { formatCurrency } from '../../utils/currencyUtils';
import { useNotification } from '../../contexts/NotificationContext';
import { invoicesAPI } from '../../services/api/finance';

interface AddInvoiceLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { invoice_id?: string; amount: number; notes?: string }) => Promise<void>;
  amountRemaining: number;
  currencyCode: string;
  contactId: string;
}

/**
 * Modal for creating an invoice link (partial invoicing)
 */
const AddInvoiceLinkModal: React.FC<AddInvoiceLinkModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  amountRemaining,
  currencyCode,
  contactId,
}) => {
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [linkWithoutInvoice, setLinkWithoutInvoice] = useState(false);

  const { showError } = useNotification() as any;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedInvoice(null);
      setAmount('');
      setNotes('');
      setSearchQuery('');
      setInvoices([]);
      setLinkWithoutInvoice(false);
    }
  }, [isOpen]);

  // Search invoices
  useEffect(() => {
    const searchInvoices = async () => {
      if (linkWithoutInvoice) {
        setInvoices([]);
        return;
      }

      try {
        setSearching(true);
        // Fetch invoices for this contact
        const response = await (invoicesAPI as any).list({
          contact_ids: contactId,
          search: searchQuery || undefined,
          per_page: 10,
        });
        setInvoices(response?.items || []);
      } catch (error) {
        console.error('Failed to search invoices:', error);
      } finally {
        setSearching(false);
      }
    };

    const debounce = setTimeout(searchInvoices, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, contactId, linkWithoutInvoice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      showError('Please enter a valid amount');
      return;
    }

    if (parsedAmount > amountRemaining) {
      showError(`Amount cannot exceed remaining value (${formatCurrency(amountRemaining, currencyCode)})`);
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        invoice_id: linkWithoutInvoice ? undefined : selectedInvoice?.id,
        amount: parsedAmount,
        notes: notes || undefined,
      });
      onClose();
    } catch (error: any) {
      showError(error.message || 'Failed to create invoice link');
    } finally {
      setLoading(false);
    }
  };

  const remainingAfterLink = amountRemaining - (parseFloat(amount) || 0);

  return (
    <Modal
      open={isOpen}
      onOpenChange={onClose}
      title="Add Invoice Link"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Link Without Invoice Option */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="linkWithoutInvoice"
            checked={linkWithoutInvoice}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setLinkWithoutInvoice(e.target.checked);
              if (e.target.checked) {
                setSelectedInvoice(null);
              }
            }}
            className="rounded border-gray-300 text-zenible-primary focus:ring-zenible-primary"
          />
          <label htmlFor="linkWithoutInvoice" className="text-sm text-gray-700 dark:text-gray-300">
            Record invoiced amount without linking to a specific invoice
          </label>
        </div>

        {/* Invoice Search (only if not linking without invoice) */}
        {!linkWithoutInvoice && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Link to Invoice
            </label>
            {selectedInvoice ? (
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedInvoice.invoice_number || `Invoice #${selectedInvoice.id.slice(0, 8)}`}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatCurrency(parseFloat(selectedInvoice.total || 0), selectedInvoice.currency?.code)}
                    {' - '}
                    {selectedInvoice.status}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  placeholder="Search invoices..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-zenible-primary focus:border-transparent"
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-zenible-primary"></div>
                  </div>
                )}
                {invoices.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {invoices.map((invoice: any) => (
                      <button
                        key={invoice.id}
                        type="button"
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setSearchQuery('');
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <p className="font-medium text-gray-900 dark:text-white">
                          {invoice.invoice_number || `Invoice #${invoice.id.slice(0, 8)}`}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(parseFloat(invoice.total || 0), invoice.currency?.code)}
                          {' - '}
                          {invoice.status}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
                {!searching && invoices.length === 0 && searchQuery.length >= 2 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 text-center text-gray-500">
                    No invoices found
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Amount *
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              max={amountRemaining}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-zenible-primary focus:border-transparent"
            />
          </div>
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span>Available: {formatCurrency(amountRemaining, currencyCode)}</span>
            {amount && (
              <span className={remainingAfterLink < 0 ? 'text-red-500' : ''}>
                After: {formatCurrency(Math.max(0, remainingAfterLink), currencyCode)}
              </span>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
            placeholder="e.g., 50% milestone payment..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-zenible-primary focus:border-transparent"
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !amount || parseFloat(amount) > amountRemaining}
            className="px-4 py-2 text-sm font-medium text-white bg-zenible-primary rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Invoice Link'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddInvoiceLinkModal;
