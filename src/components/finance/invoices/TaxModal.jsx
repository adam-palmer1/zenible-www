import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getCommonTaxRates } from '../../../utils/taxCalculations';

const TaxModal = ({ isOpen, onClose, onSave, initialTaxRate = 0, initialTaxLabel = 'Tax' }) => {
  const [taxRate, setTaxRate] = useState(initialTaxRate);
  const [taxLabel, setTaxLabel] = useState(initialTaxLabel);
  const [customRate, setCustomRate] = useState('');

  const commonRates = getCommonTaxRates();

  useEffect(() => {
    if (isOpen) {
      setTaxRate(initialTaxRate);
      setTaxLabel(initialTaxLabel);
      setCustomRate('');
    }
  }, [isOpen, initialTaxRate, initialTaxLabel]);

  const handleSave = () => {
    const rate = customRate ? parseFloat(customRate) : taxRate;
    if (rate < 0 || rate > 100) {
      alert('Tax rate must be between 0 and 100');
      return;
    }
    onSave(rate, taxLabel);
    onClose();
  };

  const handleRemove = () => {
    onSave(0, 'Tax');
    onClose();
  };

  const handleQuickSelect = (rate, label) => {
    setTaxRate(rate);
    setTaxLabel(label);
    setCustomRate('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10">
          <div className="bg-white dark:bg-gray-800 px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {initialTaxRate > 0 ? 'Edit Tax' : 'Add Tax'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Tax Label */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Tax Label
                </label>
                <input
                  type="text"
                  value={taxLabel}
                  onChange={(e) => setTaxLabel(e.target.value)}
                  placeholder="e.g., VAT, GST, Sales Tax"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 rounded-md"
                />
              </div>

              {/* Common Tax Rates */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Quick Select
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {commonRates.map((rate) => (
                    <button
                      key={rate.value}
                      type="button"
                      onClick={() => handleQuickSelect(rate.value, rate.label)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        taxRate === rate.value && !customRate
                          ? 'bg-zenible-primary text-white'
                          : 'bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white hover:design-bg-tertiary'
                      }`}
                    >
                      {rate.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Custom Rate (%)
                </label>
                <input
                  type="number"
                  value={customRate}
                  onChange={(e) => {
                    setCustomRate(e.target.value);
                    if (e.target.value) {
                      setTaxRate(0);
                    }
                  }}
                  placeholder="Enter custom rate"
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 rounded-md"
                />
              </div>

              {/* Preview */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300 text-sm">Preview:</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {taxLabel} ({customRate || taxRate}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-between gap-3">
            {initialTaxRate > 0 && (
              <button
                type="button"
                onClick={handleRemove}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Remove Tax
              </button>
            )}
            <div className="flex gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white design-bg-tertiary rounded-md hover:design-bg-quaternary"
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
  );
};

export default TaxModal;
