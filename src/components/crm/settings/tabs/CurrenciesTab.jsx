import React, { useState, useRef, useEffect } from 'react';
import { CheckCircleIcon, XMarkIcon, PlusIcon, CheckIcon } from '@heroicons/react/24/outline';
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

  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [converterAmount, setConverterAmount] = useState(100);
  const [converterFrom, setConverterFrom] = useState('');
  const [converterTo, setConverterTo] = useState('');
  const [convertedAmount, setConvertedAmount] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get currencies not yet enabled, filtered by search
  const availableCurrencies = currencies.filter(
    (c) =>
      !companyCurrencies.find((cc) => cc.currency.id === c.id) &&
      (c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddCurrency = async (currencyId) => {
    const result = await addCurrency(currencyId);
    if (result.success) {
      showSuccess('Currency added');
      setSearchTerm('');
      setShowDropdown(false);
    } else {
      showError(result.error || 'Failed to add currency');
    }
  };

  const handleRemoveCurrency = async (associationId) => {
    const result = await removeCurrency(associationId);
    if (result.success) {
      showSuccess('Currency removed');
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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Enabled Currencies
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Currencies for services, invoices, and quotes. Click a currency to set it as default.
        </p>

        {/* Currencies as Pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {companyCurrencies.map((cc) => (
            <div
              key={cc.id}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                transition-colors cursor-pointer group
                ${cc.is_default
                  ? 'bg-zenible-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }
              `}
              onClick={() => !cc.is_default && handleSetDefault(cc.id)}
              title={cc.is_default ? 'Default currency' : 'Click to set as default'}
            >
              {cc.is_default && <CheckIcon className="h-3.5 w-3.5" />}
              <span className="font-semibold">{cc.currency.code}</span>
              <span className="opacity-60">{cc.currency.symbol}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveCurrency(cc.id);
                }}
                className={`
                  ml-1 p-0.5 rounded-full transition-colors
                  ${cc.is_default
                    ? 'hover:bg-white/20'
                    : 'hover:bg-gray-300 dark:hover:bg-gray-500'
                  }
                `}
                title="Remove currency"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {/* Add Currency Button/Search */}
          <div className="relative" ref={dropdownRef}>
            {showDropdown ? (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search currencies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setShowDropdown(false);
                      setSearchTerm('');
                    }
                  }}
                  autoFocus
                  className="w-48 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-zenible-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />

                {/* Dropdown */}
                <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                  {availableCurrencies.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                      {searchTerm ? `No currencies matching "${searchTerm}"` : 'All currencies added'}
                    </div>
                  ) : (
                    availableCurrencies.slice(0, 20).map((currency) => (
                      <button
                        key={currency.id}
                        onClick={() => handleAddCurrency(currency.id)}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
                      >
                        <span className="text-gray-900 dark:text-white">
                          <span className="font-medium">{currency.code}</span>
                          <span className="text-gray-500 ml-2">{currency.name}</span>
                        </span>
                        <span className="text-gray-400">{currency.symbol}</span>
                      </button>
                    ))
                  )}
                  {availableCurrencies.length > 20 && (
                    <div className="px-4 py-2 text-xs text-gray-400 text-center border-t border-gray-200 dark:border-gray-700">
                      Type to filter more currencies...
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowDropdown(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-zenible-primary hover:text-zenible-primary transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add Currency</span>
              </button>
            )}
          </div>
        </div>

        {companyCurrencies.length === 0 && (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            No currencies enabled yet. Click "Add Currency" to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrenciesTab;
