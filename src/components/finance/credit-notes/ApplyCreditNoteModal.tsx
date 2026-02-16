import React, { useState, useEffect } from 'react';
import { X, DollarSign, Loader2, FileText, Check } from 'lucide-react';
import { useNotification } from '../../../contexts/NotificationContext';
import { useEscapeKey } from '../../../hooks/useEscapeKey';
import { formatCurrency } from '../../../utils/currency';
import creditNotesAPI from '../../../services/api/finance/creditNotes';
import invoicesAPI from '../../../services/api/finance/invoices';

interface ApplyCreditNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  creditNote: any;
  onSuccess?: () => void;
}

interface InvoiceAllocation {
  invoice_id: string;
  invoice_number: string;
  outstanding_balance: number;
  amount: string;
  selected: boolean;
}

const ApplyCreditNoteModal: React.FC<ApplyCreditNoteModalProps> = ({ isOpen, onClose, creditNote, onSuccess }) => {
  const { showSuccess, showError } = useNotification();
  useEscapeKey(onClose, isOpen);

  const [invoices, setInvoices] = useState<InvoiceAllocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currencyCode = creditNote?.currency?.code || 'USD';
  const remainingAmount = parseFloat(creditNote?.remaining_amount ?? '0');

  useEffect(() => {
    if (isOpen && creditNote?.contact_id) {
      fetchInvoices();
    } else if (!isOpen) {
      setInvoices([]);
    }
  }, [isOpen, creditNote?.contact_id]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const contactId = creditNote.contact?.id;
      if (!contactId) return;

      const data = await invoicesAPI.list({
        contact_id: contactId,
        status: 'sent,viewed,partially_paid',
        per_page: '100',
      }) as any;

      const items = data?.items || [];
      const eligible = items
        .filter((inv: any) => parseFloat(inv.outstanding_balance || '0') > 0)
        .map((inv: any) => ({
          invoice_id: inv.id,
          invoice_number: inv.invoice_number,
          outstanding_balance: parseFloat(inv.outstanding_balance || '0'),
          amount: '',
          selected: false,
        }));

      setInvoices(eligible);
    } catch (err: any) {
      console.error('Failed to fetch invoices:', err);
      showError('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const toggleInvoice = (index: number) => {
    setInvoices(prev => {
      const updated = [...prev];
      const inv = { ...updated[index] };
      inv.selected = !inv.selected;
      if (inv.selected && !inv.amount) {
        // Default to min(remaining credit after other selections, invoice outstanding)
        const usedByOthers = updated.reduce((sum, item, i) =>
          i !== index && item.selected ? sum + (parseFloat(item.amount) || 0) : sum, 0);
        const available = remainingAmount - usedByOthers;
        inv.amount = Math.min(available, inv.outstanding_balance).toFixed(2);
      }
      if (!inv.selected) {
        inv.amount = '';
      }
      updated[index] = inv;
      return updated;
    });
  };

  const updateAmount = (index: number, value: string) => {
    setInvoices(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], amount: value };
      return updated;
    });
  };

  const selectedAllocations = invoices.filter(inv => inv.selected && parseFloat(inv.amount) > 0);
  const totalAllocated = selectedAllocations.reduce((sum, inv) => sum + parseFloat(inv.amount || '0'), 0);
  const isOverAllocated = totalAllocated > remainingAmount + 0.01;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedAllocations.length === 0) {
      showError('Please select at least one invoice');
      return;
    }

    if (isOverAllocated) {
      showError('Total allocated amount exceeds the remaining credit note balance');
      return;
    }

    try {
      setSubmitting(true);
      await creditNotesAPI.applyToInvoices(
        creditNote.id,
        selectedAllocations.map(alloc => ({
          invoice_id: alloc.invoice_id,
          amount: parseFloat(alloc.amount),
        }))
      );
      showSuccess('Credit note applied successfully');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      showError(err.message || 'Failed to apply credit note');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !creditNote) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
          onClick={onClose}
        />

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full relative z-10">
          <form onSubmit={handleSubmit}>
            <div className="bg-white dark:bg-gray-800 px-6 pt-6 pb-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Apply Credit Note
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      #{creditNote.credit_note_number}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Credit Note Summary */}
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg mb-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Total</span>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(creditNote.total, currencyCode)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Applied</span>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(parseFloat(creditNote.total) - remainingAmount, currencyCode)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Remaining</span>
                    <div className="font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(remainingAmount, currencyCode)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoice List */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  Select Invoices to Apply
                </label>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No outstanding invoices found for this contact</p>
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
                    {invoices.map((inv, index) => (
                      <div
                        key={inv.invoice_id}
                        className={`p-3 transition-colors ${
                          inv.selected
                            ? 'bg-green-50 dark:bg-green-900/10'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => toggleInvoice(index)}
                            className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                              inv.selected
                                ? 'bg-green-600 border-green-600 text-white'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}
                          >
                            {inv.selected && <Check className="h-3 w-3" />}
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                Invoice #{inv.invoice_number}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                Outstanding: {formatCurrency(inv.outstanding_balance, currencyCode)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {inv.selected && (
                          <div className="mt-2 ml-8">
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-gray-500 dark:text-gray-400">Amount:</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={Math.min(remainingAmount, inv.outstanding_balance)}
                                value={inv.amount}
                                onChange={(e) => updateAmount(index, e.target.value)}
                                disabled={submitting}
                                className="w-32 px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Allocation Summary */}
              {selectedAllocations.length > 0 && (
                <div className={`mt-4 p-3 rounded-lg text-sm ${
                  isOverAllocated
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                    : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                }`}>
                  <div className="flex justify-between">
                    <span>Allocating to {selectedAllocations.length} invoice{selectedAllocations.length !== 1 ? 's' : ''}</span>
                    <span className="font-medium">
                      {formatCurrency(totalAllocated, currencyCode)} of {formatCurrency(remainingAmount, currencyCode)}
                    </span>
                  </div>
                  {isOverAllocated && (
                    <p className="mt-1 text-xs">Total exceeds remaining credit note balance</p>
                  )}
                </div>
              )}
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || selectedAllocations.length === 0 || isOverAllocated}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Apply Credit
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplyCreditNoteModal;
