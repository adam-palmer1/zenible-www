import React, { useState, useEffect } from 'react';
import Modal from '../ui/modal/Modal';
import { formatCurrency } from '../../utils/currencyUtils';
import { useNotification } from '../../contexts/NotificationContext';
import { useContacts } from '../../hooks/crm';

/**
 * Modal for creating a one-off invoice from a service
 * Allows specifying amount as fixed value or percentage of remaining
 */
const CreateInvoiceFromServiceModal = ({
  isOpen,
  onClose,
  service,
  contactId,
  onSuccess,
}) => {
  const [amountType, setAmountType] = useState('fixed'); // 'fixed' or 'percentage'
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const { showError, showSuccess } = useNotification();
  const { createInvoiceFromService } = useContacts({}, 0, { skipInitialFetch: true });

  // Calculate service values
  const price = parseFloat(service?.price) || 0;
  const totalInvoiced = parseFloat(service?.total_invoiced) || 0;
  const amountRemaining = parseFloat(service?.amount_remaining) ?? price;
  const currencyCode = service?.currency?.code || 'USD';

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmountType('fixed');
      setAmount('');
    }
  }, [isOpen]);

  // Calculate the invoice amount based on type
  const calculateInvoiceAmount = () => {
    const parsedAmount = parseFloat(amount) || 0;
    if (amountType === 'percentage') {
      return (parsedAmount / 100) * amountRemaining;
    }
    return parsedAmount;
  };

  const invoiceAmount = calculateInvoiceAmount();
  const remainingAfter = amountRemaining - invoiceAmount;
  const isValidAmount = invoiceAmount > 0 && invoiceAmount <= amountRemaining;

  // Quick percentage buttons
  const quickPercentages = [25, 50, 75, 100];

  const handleQuickPercentage = (percent) => {
    setAmountType('percentage');
    setAmount(percent.toString());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValidAmount) {
      showError('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      const result = await createInvoiceFromService(contactId, service.id, {
        amount: invoiceAmount,
        amount_type: amountType,
      });
      showSuccess('Invoice created successfully');
      onSuccess?.(result);
      onClose();
    } catch (error) {
      showError(error.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  if (!service) return null;

  return (
    <Modal
      open={isOpen}
      onOpenChange={onClose}
      title="Create Invoice from Service"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Service Info */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            {service.name}
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Service Total</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(price, currencyCode)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Already Invoiced</span>
              <span className="text-gray-900 dark:text-white">
                {formatCurrency(totalInvoiced, currencyCode)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="font-medium text-gray-900 dark:text-white">Available to Invoice</span>
              <span className="font-medium text-zenible-primary">
                {formatCurrency(amountRemaining, currencyCode)}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Percentage Buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Quick Select
          </label>
          <div className="flex gap-2">
            {quickPercentages.map((percent) => (
              <button
                key={percent}
                type="button"
                onClick={() => handleQuickPercentage(percent)}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  amountType === 'percentage' && amount === percent.toString()
                    ? 'bg-zenible-primary text-white border-zenible-primary'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-zenible-primary'
                }`}
              >
                {percent}%
              </button>
            ))}
          </div>
        </div>

        {/* Amount Type Toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Amount Type
          </label>
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
            <button
              type="button"
              onClick={() => setAmountType('fixed')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                amountType === 'fixed'
                  ? 'bg-zenible-primary text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Fixed Amount
            </button>
            <button
              type="button"
              onClick={() => setAmountType('percentage')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                amountType === 'percentage'
                  ? 'bg-zenible-primary text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Percentage
            </button>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {amountType === 'fixed' ? 'Amount *' : 'Percentage *'}
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={amountType === 'fixed' ? '0.00' : '0'}
              step={amountType === 'fixed' ? '0.01' : '1'}
              min="0"
              max={amountType === 'fixed' ? amountRemaining : 100}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-zenible-primary focus:border-transparent"
            />
            {amountType === 'percentage' && (
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                %
              </span>
            )}
          </div>
          {amountType === 'percentage' && amount && (
            <p className="mt-1 text-xs text-gray-500">
              = {formatCurrency(invoiceAmount, currencyCode)}
            </p>
          )}
        </div>

        {/* Summary */}
        {amount && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Invoice Summary
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700 dark:text-blue-300">This Invoice</span>
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  {formatCurrency(invoiceAmount, currencyCode)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700 dark:text-blue-300">Remaining After</span>
                <span className={`font-medium ${remainingAfter < 0 ? 'text-red-600' : 'text-blue-900 dark:text-blue-100'}`}>
                  {formatCurrency(Math.max(0, remainingAfter), currencyCode)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Validation Error */}
        {amount && !isValidAmount && (
          <p className="text-sm text-red-600 dark:text-red-400">
            Amount cannot exceed available balance ({formatCurrency(amountRemaining, currencyCode)})
          </p>
        )}

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
            disabled={loading || !isValidAmount}
            className="px-4 py-2 text-sm font-medium text-white bg-zenible-primary rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateInvoiceFromServiceModal;
