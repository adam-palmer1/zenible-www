import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';
import { calculateDiscountAmount } from '../../../utils/invoiceCalculations';

const DiscountModal = ({
  isOpen,
  onClose,
  onSave,
  initialDiscountType = 'percentage',
  initialDiscountValue = 0,
  subtotal = 0,
  currency = 'USD',
}) => {
  const [discountType, setDiscountType] = useState(initialDiscountType);
  const [discountValue, setDiscountValue] = useState(initialDiscountValue);

  useEffect(() => {
    if (isOpen) {
      setDiscountType(initialDiscountType);
      setDiscountValue(initialDiscountValue);
    }
  }, [isOpen, initialDiscountType, initialDiscountValue]);

  const handleSave = () => {
    const value = parseFloat(discountValue) || 0;

    if (value < 0) {
      alert('Discount value cannot be negative');
      return;
    }

    if (discountType === 'percentage' && value > 100) {
      alert('Percentage discount cannot exceed 100%');
      return;
    }

    if (discountType === 'fixed' && value > subtotal) {
      alert('Fixed discount cannot exceed subtotal');
      return;
    }

    onSave(discountType, value);
    onClose();
  };

  const handleRemove = () => {
    onSave('percentage', 0);
    onClose();
  };

  const previewAmount = calculateDiscountAmount(subtotal, discountType, discountValue);

  return isOpen ? (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10">
          <div className="bg-white dark:bg-gray-800 px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {initialDiscountValue > 0 ? 'Edit Discount' : 'Add Discount'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Discount Type */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Discount Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDiscountType('percentage')}
                    className={`px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                      discountType === 'percentage'
                        ? 'bg-zenible-primary text-white'
                        : 'bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    Percentage (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('fixed')}
                    className={`px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                      discountType === 'fixed'
                        ? 'bg-zenible-primary text-white'
                        : 'bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    Fixed Amount
                  </button>
                </div>
              </div>

              {/* Discount Value */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {discountType === 'percentage' ? 'Discount Percentage' : 'Discount Amount'}
                </label>
                <div className="relative">
                  {discountType === 'fixed' && (
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 dark:text-gray-300">
                      {currency}
                    </span>
                  )}
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'percentage' ? 'Enter percentage' : 'Enter amount'}
                    min="0"
                    max={discountType === 'percentage' ? '100' : subtotal}
                    step="0.01"
                    className={`w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 rounded-md ${
                      discountType === 'fixed' ? 'pl-12' : ''
                    }`}
                  />
                  {discountType === 'percentage' && (
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 dark:text-gray-300">
                      %
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Percentage Buttons */}
              {discountType === 'percentage' && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Quick Select
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 15, 20].map((percent) => (
                      <button
                        key={percent}
                        type="button"
                        onClick={() => setDiscountValue(percent)}
                        className="px-3 py-2 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-sm font-medium transition-colors"
                      >
                        {percent}%
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Subtotal:</span>
                  <span className="text-gray-900 dark:text-white">{formatCurrency(subtotal, currency)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Discount:</span>
                  <span className="text-gray-900 dark:text-white font-medium text-red-600 dark:text-red-400">
                    -{formatCurrency(previewAmount, currency)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-900 dark:text-white font-medium">After Discount:</span>
                  <span className="text-gray-900 dark:text-white font-semibold">
                    {formatCurrency(subtotal - previewAmount, currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-between gap-3">
            {initialDiscountValue > 0 && (
              <button
                type="button"
                onClick={handleRemove}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Remove Discount
              </button>
            )}
            <div className="flex gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-zenible-primary rounded-md hover:bg-zenible-primary/90"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;
};

export default DiscountModal;
