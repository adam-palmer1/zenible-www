import React, { useState, useEffect } from 'react';
import { X, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';
import { usePayments } from '../../../contexts/PaymentsContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { formatCurrency } from '../../../utils/currency';

const RefundModal = ({ isOpen, onClose, payment }) => {
  const { refundPayment, loading } = usePayments();
  const { showSuccess, showError } = useNotification();

  const [refundType, setRefundType] = useState('full');
  const [refundAmount, setRefundAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reset form when payment changes
  useEffect(() => {
    if (payment) {
      setRefundType('full');
      setRefundAmount('');
      setReason('');
    }
  }, [payment]);

  if (!isOpen || !payment) return null;

  const maxRefundable = parseFloat(payment.amount) - parseFloat(payment.refunded_amount || 0);
  const currency = payment.currency?.code || payment.currency_code || 'USD';

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (refundType === 'partial') {
      const amount = parseFloat(refundAmount);
      if (isNaN(amount) || amount <= 0) {
        showError('Please enter a valid refund amount');
        return;
      }
      if (amount > maxRefundable) {
        showError(`Refund amount cannot exceed ${formatCurrency(maxRefundable, currency)}`);
        return;
      }
    }

    try {
      setSubmitting(true);

      const refundData = {
        reason: reason || 'Refund requested',
      };

      if (refundType === 'partial') {
        refundData.amount = parseFloat(refundAmount);
      }

      await refundPayment(payment.id, refundData);

      showSuccess(
        refundType === 'full'
          ? 'Full refund processed successfully'
          : `Partial refund of ${formatCurrency(refundAmount, currency)} processed successfully`
      );
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to process refund');
    } finally {
      setSubmitting(false);
    }
  };

  const refundReasons = [
    { value: '', label: 'Select a reason (optional)' },
    { value: 'duplicate', label: 'Duplicate charge' },
    { value: 'fraudulent', label: 'Fraudulent transaction' },
    { value: 'requested_by_customer', label: 'Customer request' },
    { value: 'product_not_received', label: 'Product not received' },
    { value: 'product_unacceptable', label: 'Product unacceptable' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg dark:bg-orange-900/30">
              <RotateCcw className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Process Refund
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Payment #{payment.payment_number || payment.id?.toString().slice(-8)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Warning */}
          <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-900/20 dark:border-yellow-800">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-700 dark:text-yellow-300">
              <p className="font-medium">This action cannot be undone</p>
              <p className="mt-1">Refunds are processed immediately and may take 5-10 business days to appear in the customer's account.</p>
            </div>
          </div>

          {/* Original Payment Info */}
          <div className="bg-gray-50 rounded-lg p-4 dark:bg-gray-900">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">Original Amount</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(payment.amount, currency)}
              </span>
            </div>
            {parseFloat(payment.refunded_amount || 0) > 0 && (
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-500 dark:text-gray-400">Already Refunded</span>
                <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                  -{formatCurrency(payment.refunded_amount, currency)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">Max Refundable</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatCurrency(maxRefundable, currency)}
              </span>
            </div>
          </div>

          {/* Refund Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Refund Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="refundType"
                  value="full"
                  checked={refundType === 'full'}
                  onChange={(e) => setRefundType(e.target.value)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Full Refund ({formatCurrency(maxRefundable, currency)})
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="refundType"
                  value="partial"
                  checked={refundType === 'partial'}
                  onChange={(e) => setRefundType(e.target.value)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Partial Refund</span>
              </label>
            </div>
          </div>

          {/* Partial Amount Input */}
          {refundType === 'partial' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Refund Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={maxRefundable}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Maximum: {formatCurrency(maxRefundable, currency)}
              </p>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Reason for Refund
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {refundReasons.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4" />
                Process Refund
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RefundModal;
