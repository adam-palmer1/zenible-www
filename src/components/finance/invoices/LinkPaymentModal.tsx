import React, { useState, useEffect } from 'react';
import { X, Link2, Loader2, Search, CreditCard, AlertCircle } from 'lucide-react';
import { useNotification } from '../../../contexts/NotificationContext';
import { formatCurrency } from '../../../utils/currency';
import paymentsAPI from '../../../services/api/finance/payments';

interface LinkPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  onSuccess?: () => void;
}

const LinkPaymentModal: React.FC<LinkPaymentModalProps> = ({ isOpen, onClose, invoice, onSuccess }) => {
  const { showSuccess, showError } = useNotification() as any;

  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [amountToApply, setAmountToApply] = useState('');

  // Load unallocated payments for the same contact when modal opens
  useEffect(() => {
    if (isOpen && invoice?.contact_id) {
      loadPayments();
    }
  }, [isOpen, invoice?.contact_id]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPayments([]);
      setSelectedPayment(null);
      setAmountToApply('');
      setSearchQuery('');
    }
  }, [isOpen]);

  // Pre-fill amount when payment is selected
  useEffect(() => {
    if (selectedPayment && invoice) {
      const outstanding = parseFloat(invoice.outstanding_balance || 0);
      const unallocated = parseFloat(selectedPayment.unallocated_amount || selectedPayment.amount || 0);
      // Default to the smaller of outstanding balance or unallocated amount
      const suggestedAmount = Math.min(outstanding, unallocated);
      setAmountToApply(suggestedAmount.toFixed(2));
    }
  }, [selectedPayment, invoice]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      // Fetch payments for this contact that have unallocated amounts
      // Backend already filters with unallocated_only=true
      const response = await (paymentsAPI as any).list({
        contact_id: invoice.contact_id,
        unallocated_only: true,
        per_page: 100,
      });

      const rawPayments = response.items || response || [];

      // Filter to only show payments with matching currency
      const currencyFilteredPayments = rawPayments.filter((payment: any) => {
        const paymentCurrencyId = payment.currency_id || payment.currency?.id;
        const invoiceCurrencyId = invoice.currency_id || invoice.currency?.id;
        return paymentCurrencyId === invoiceCurrencyId;
      });

      // Fetch unallocated amounts for each payment
      const paymentsWithUnallocated = await Promise.all(
        currencyFilteredPayments.map(async (payment: any) => {
          try {
            const unallocatedData = await (paymentsAPI as any).getUnallocated(payment.id);
            return {
              ...payment,
              unallocated_amount: unallocatedData.unallocated_amount,
            };
          } catch (err) {
            // If we can't get unallocated amount, use full amount as fallback
            console.warn(`Could not fetch unallocated amount for payment ${payment.id}:`, err);
            return {
              ...payment,
              unallocated_amount: payment.amount,
            };
          }
        })
      );

      // Filter out payments with no unallocated amount
      const availablePayments = paymentsWithUnallocated.filter(
        (payment: any) => parseFloat(payment.unallocated_amount || 0) > 0
      );

      setPayments(availablePayments);
    } catch (error) {
      console.error('Error loading payments:', error);
      showError('Failed to load available payments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPayment) {
      showError('Please select a payment to link');
      return;
    }

    const amount = parseFloat(amountToApply);
    if (!amount || amount <= 0) {
      showError('Please enter a valid amount to apply');
      return;
    }

    const unallocated = parseFloat(selectedPayment.unallocated_amount || selectedPayment.amount || 0);
    if (amount > unallocated) {
      showError(`Amount cannot exceed unallocated balance of ${formatCurrency(unallocated, invoice.currency?.code)}`);
      return;
    }

    const outstanding = parseFloat(invoice.outstanding_balance || 0);
    if (amount > outstanding) {
      showError(`Amount cannot exceed outstanding balance of ${formatCurrency(outstanding, invoice.currency?.code)}`);
      return;
    }

    try {
      setSubmitting(true);

      await (paymentsAPI as any).allocate(selectedPayment.id, {
        allocations: [
          {
            invoice_id: invoice.id,
            amount_applied: amount,
          },
        ],
      });

      showSuccess(`Payment of ${formatCurrency(amount, invoice.currency?.code)} linked to invoice successfully`);

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error: any) {
      console.error('Error linking payment:', error);
      showError(error.message || 'Failed to link payment to invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const getPaymentDisplayName = (payment: any) => {
    return payment.payment_number || `PAY-${payment.id?.toString().slice(-8)}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const filteredPayments = payments.filter((payment: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const paymentName = getPaymentDisplayName(payment).toLowerCase();
    const reference = (payment.reference_number || '').toLowerCase();
    return paymentName.includes(query) || reference.includes(query);
  });

  const getAmountHelper = () => {
    if (!selectedPayment || !amountToApply) return null;

    const amount = parseFloat(amountToApply) || 0;
    const outstanding = parseFloat(invoice?.outstanding_balance || 0);
    const unallocated = parseFloat(selectedPayment.unallocated_amount || selectedPayment.amount || 0);

    if (amount > unallocated) {
      return {
        text: `Exceeds unallocated balance (${formatCurrency(unallocated, invoice.currency?.code)})`,
        color: 'text-red-600 dark:text-red-400',
      };
    }

    if (amount > outstanding) {
      return {
        text: `Exceeds outstanding balance (${formatCurrency(outstanding, invoice.currency?.code)})`,
        color: 'text-red-600 dark:text-red-400',
      };
    }

    if (amount < outstanding) {
      const remaining = outstanding - amount;
      return {
        text: `Partial payment - remaining balance: ${formatCurrency(remaining, invoice.currency?.code)}`,
        color: 'text-yellow-600 dark:text-yellow-400',
      };
    }

    return {
      text: 'This will fully pay the invoice',
      color: 'text-green-600 dark:text-green-400',
    };
  };

  if (!isOpen || !invoice) return null;

  const amountHelper = getAmountHelper();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
          onClick={onClose}
        ></div>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10">
          <form onSubmit={handleSubmit}>
            <div className="bg-white dark:bg-gray-800 px-6 pt-6 pb-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Link2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Link Existing Payment
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Invoice #{invoice.invoice_number}
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

              <div className="space-y-4">
                {/* Invoice Summary */}
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-300">Invoice Total:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(invoice.total, invoice.currency?.code)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">Outstanding Balance:</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {formatCurrency(invoice.outstanding_balance, invoice.currency?.code)}
                    </span>
                  </div>
                </div>

                {/* Payment Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Select Payment <span className="text-red-500">*</span>
                  </label>

                  {/* Search */}
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                      placeholder="Search payments..."
                      className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md text-sm"
                    />
                  </div>

                  {/* Payment List */}
                  <div className="border border-gray-300 dark:border-gray-600 rounded-md max-h-48 overflow-y-auto">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading payments...</span>
                      </div>
                    ) : filteredPayments.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 px-4">
                        <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                          {payments.length === 0
                            ? 'No unallocated payments found for this contact in the same currency'
                            : 'No payments match your search'}
                        </p>
                      </div>
                    ) : (
                      filteredPayments.map((payment: any) => {
                        const isSelected = selectedPayment?.id === payment.id;
                        const unallocated = parseFloat(payment.unallocated_amount || payment.amount || 0);

                        return (
                          <button
                            key={payment.id}
                            type="button"
                            onClick={() => setSelectedPayment(payment)}
                            className={`w-full px-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
                              isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded ${isSelected ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                  <CreditCard className={`h-4 w-4 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                                </div>
                                <div>
                                  <div className={`text-sm font-medium ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                                    #{getPaymentDisplayName(payment)}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatDate(payment.payment_date)}
                                    {payment.reference_number && ` \u2022 Ref: ${payment.reference_number}`}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {formatCurrency(unallocated, invoice.currency?.code)}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  available
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Amount to Apply */}
                {selectedPayment && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Amount to Apply <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={Math.min(
                        parseFloat(selectedPayment.unallocated_amount || selectedPayment.amount || 0),
                        parseFloat(invoice.outstanding_balance || 0)
                      )}
                      value={amountToApply}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmountToApply(e.target.value)}
                      disabled={submitting}
                      className="w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md"
                      placeholder="0.00"
                      required
                    />
                    {amountHelper && (
                      <p className={`text-xs mt-1 ${amountHelper.color}`}>
                        {amountHelper.text}
                      </p>
                    )}
                  </div>
                )}
              </div>
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
                disabled={submitting || !selectedPayment || !amountToApply || parseFloat(amountToApply) <= 0}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Linking...
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4 mr-2" />
                    Link Payment
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

export default LinkPaymentModal;
