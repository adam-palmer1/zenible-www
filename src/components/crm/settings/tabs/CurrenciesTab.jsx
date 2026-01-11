import React, { useState } from 'react';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useCompanyCurrencies } from '../../../../hooks/crm/useCompanyCurrencies';
import { useCurrencyConversion } from '../../../../hooks/crm/useCurrencyConversion';
import { useNotification } from '../../../../contexts/NotificationContext';

/**
 * Currencies Tab - Manage company-enabled currencies and preview converter
 */
const CurrenciesTab = () => {
  const {
    currencies,
    companyCurrencies,
    defaultCurrency,
    loading,
    addCurrency,
    removeCurrency,
    setDefaultCurrency: setDefault,
    refresh,
  } = useCompanyCurrencies();

  const { convert, loading: convertLoading } = useCurrencyConversion();
  const { showSuccess, showError } = useNotification();

  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [converterAmount, setConverterAmount] = useState(100);
  const [converterFrom, setConverterFrom] = useState('');
  const [converterTo, setConverterTo] = useState('');
  const [convertedAmount, setConvertedAmount] = useState(null);

  // Get currencies not yet enabled
  const availableCurrencies = currencies.filter(
    (c) => !companyCurrencies.find((cc) => cc.currency.id === c.id)
  );

  const handleAddCurrency = async () => {
    if (!selectedCurrency) return;

    const result = await addCurrency(selectedCurrency);
    if (result.success) {
      showSuccess('Currency added successfully');
      setSelectedCurrency('');
    } else {
      showError(result.error || 'Failed to add currency');
    }
  };

  const handleRemoveCurrency = async (associationId) => {
    const result = await removeCurrency(associationId);
    if (result.success) {
      showSuccess('Currency removed successfully');
    } else {
      showError(result.error || 'Failed to remove currency');
    }
  };

  const handleSetDefault = async (associationId) => {
    const result = await setDefault(associationId);
    if (result.success) {
      showSuccess('Default currency updated');
    } else {
      showError(result.error || 'Failed to set default currency');
    }
  };

  const handleConvert = async () => {
    if (!converterAmount || !converterFrom || !converterTo) return;

    const result = await convert(converterAmount, converterFrom, converterTo);
    setConvertedAmount(result);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading currencies...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enabled Currencies */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Enabled Currencies
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Currencies that can be used in services, invoices, and quotes. The default currency is used for reports and totals.
        </p>

        <div className="space-y-2">
          {companyCurrencies.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No currencies enabled yet. Add your first currency below.
            </div>
          ) : (
            companyCurrencies.map((cc) => (
              <div
                key={cc.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <input
                    type="radio"
                    checked={cc.is_default}
                    onChange={() => handleSetDefault(cc.id)}
                    className="h-4 w-4 text-zenible-primary focus:ring-zenible-primary"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {cc.currency.code} - {cc.currency.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Symbol: {cc.currency.symbol}
                      {cc.is_default && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveCurrency(cc.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  title="Remove currency"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Currency */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Add Currency
        </h3>
        <div className="flex gap-3">
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select a currency to add...</option>
            {availableCurrencies.map((currency) => (
              <option key={currency.id} value={currency.id}>
                {currency.code} - {currency.name} ({currency.symbol})
              </option>
            ))}
          </select>
          <button
            onClick={handleAddCurrency}
            disabled={!selectedCurrency}
            className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add Currency
          </button>
        </div>
      </div>

      {/* Currency Converter Preview */}
      {companyCurrencies.length >= 2 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Currency Converter (Preview)
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Test currency conversion between your enabled currencies
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount
              </label>
              <input
                type="number"
                value={converterAmount}
                onChange={(e) => setConverterAmount(parseFloat(e.target.value))}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                From
              </label>
              <select
                value={converterFrom}
                onChange={(e) => setConverterFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select...</option>
                {companyCurrencies.map((cc) => (
                  <option key={cc.id} value={cc.currency.code}>
                    {cc.currency.code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                To
              </label>
              <select
                value={converterTo}
                onChange={(e) => setConverterTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select...</option>
                {companyCurrencies.map((cc) => (
                  <option key={cc.id} value={cc.currency.code}>
                    {cc.currency.code}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleConvert}
                disabled={!converterAmount || !converterFrom || !converterTo || convertLoading}
                className="w-full px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {convertLoading ? 'Converting...' : 'Convert'}
              </button>
            </div>
          </div>

          {convertedAmount !== null && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-green-800 dark:text-green-200">
                  {converterAmount} {converterFrom} = {convertedAmount.toFixed(2)} {converterTo}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CurrenciesTab;
