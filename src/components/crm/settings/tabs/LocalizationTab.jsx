import React, { useState } from 'react';
import { XMarkIcon, PlusIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useCountries } from '../../../../hooks/crm/useCountries';
import { useCompanyCurrencies } from '../../../../hooks/crm/useCompanyCurrencies';
import { useNotification } from '../../../../contexts/NotificationContext';

/**
 * Localization Tab - Manage company countries and currencies
 */
const LocalizationTab = () => {
  const {
    countries,
    companyCountries,
    loading: countriesLoading,
    addCountry,
    removeCountry,
    setDefaultCountry,
  } = useCountries();

  const {
    currencies,
    companyCurrencies,
    loading: currenciesLoading,
    addCurrency,
    removeCurrency,
    setDefaultCurrency,
  } = useCompanyCurrencies();

  const { showSuccess, showError } = useNotification();

  // Country modal state
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // Currency modal state
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');

  // Filter available countries
  const filteredCountries = countries.filter(
    (c) =>
      !companyCountries.find((cc) => cc.country.id === c.id) &&
      (c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.code.toLowerCase().includes(countrySearch.toLowerCase()))
  );

  // Filter available currencies
  const filteredCurrencies = currencies.filter(
    (c) =>
      !companyCurrencies.find((cc) => cc.currency.id === c.id) &&
      (c.name.toLowerCase().includes(currencySearch.toLowerCase()) ||
        c.code.toLowerCase().includes(currencySearch.toLowerCase()))
  );

  // Country handlers
  const handleAddCountry = async (countryId) => {
    const result = await addCountry(countryId);
    if (result.success) {
      showSuccess('Country added');
      setCountrySearch('');
      setShowCountryModal(false);
    } else {
      showError(result.error || 'Failed to add country');
    }
  };

  const handleRemoveCountry = async (associationId) => {
    const result = await removeCountry(associationId);
    if (result.success) {
      showSuccess('Country removed');
    } else {
      showError(result.error || 'Failed to remove country');
    }
  };

  const handleSetDefaultCountry = async (associationId) => {
    const result = await setDefaultCountry(associationId);
    if (result.success) {
      showSuccess('Default country updated');
    } else {
      showError(result.error || 'Failed to set default country');
    }
  };

  // Currency handlers
  const handleAddCurrency = async (currencyId) => {
    const result = await addCurrency(currencyId);
    if (result.success) {
      showSuccess('Currency added');
      setCurrencySearch('');
      setShowCurrencyModal(false);
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

  const handleSetDefaultCurrency = async (associationId) => {
    const result = await setDefaultCurrency(associationId);
    if (result.success) {
      showSuccess('Default currency updated');
    } else {
      showError(result.error || 'Failed to set default currency');
    }
  };

  if (countriesLoading || currenciesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Countries Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Countries
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Available in contacts, addresses, and forms. Click to set as default.
        </p>

        <div className="flex flex-wrap gap-2">
          {companyCountries.map((cc) => (
            <div
              key={cc.id}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                transition-colors cursor-pointer
                ${cc.is_default
                  ? 'bg-zenible-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }
              `}
              onClick={() => !cc.is_default && handleSetDefaultCountry(cc.id)}
              title={cc.is_default ? 'Default country' : 'Click to set as default'}
            >
              {cc.is_default && <CheckIcon className="h-3.5 w-3.5" />}
              <span>{cc.country.name}</span>
              <span className="text-xs opacity-60">({cc.country.code})</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveCountry(cc.id);
                }}
                className={`ml-1 p-0.5 rounded-full transition-colors ${
                  cc.is_default ? 'hover:bg-white/20' : 'hover:bg-gray-300 dark:hover:bg-gray-500'
                }`}
                title="Remove country"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {/* Add Country Button */}
          <button
            onClick={() => setShowCountryModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-zenible-primary hover:text-zenible-primary transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add</span>
          </button>
        </div>

        {companyCountries.length === 0 && (
          <div className="mt-4 text-center py-6 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            No countries enabled yet. Click "Add" to get started.
          </div>
        )}
      </div>

      {/* Currencies Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Currencies
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          For services, invoices, and quotes. Click to set as default.
        </p>

        <div className="flex flex-wrap gap-2">
          {companyCurrencies.map((cc) => (
            <div
              key={cc.id}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                transition-colors cursor-pointer
                ${cc.is_default
                  ? 'bg-zenible-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }
              `}
              onClick={() => !cc.is_default && handleSetDefaultCurrency(cc.id)}
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
                className={`ml-1 p-0.5 rounded-full transition-colors ${
                  cc.is_default ? 'hover:bg-white/20' : 'hover:bg-gray-300 dark:hover:bg-gray-500'
                }`}
                title="Remove currency"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {/* Add Currency Button */}
          <button
            onClick={() => setShowCurrencyModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-zenible-primary hover:text-zenible-primary transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add</span>
          </button>
        </div>

        {companyCurrencies.length === 0 && (
          <div className="mt-4 text-center py-6 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            No currencies enabled yet. Click "Add" to get started.
          </div>
        )}
      </div>

      {/* Add Country Modal */}
      {showCountryModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => {
                setShowCountryModal(false);
                setCountrySearch('');
              }}
            />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Add Country
                </h3>
                <button
                  onClick={() => {
                    setShowCountryModal(false);
                    setCountrySearch('');
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-4">
                <input
                  type="text"
                  placeholder="Search countries..."
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-transparent dark:bg-gray-700 dark:text-white mb-3"
                />
                <div className="max-h-64 overflow-y-auto">
                  {filteredCountries.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400 text-center">
                      {countrySearch ? `No countries matching "${countrySearch}"` : 'All countries added'}
                    </div>
                  ) : (
                    filteredCountries.slice(0, 50).map((country) => (
                      <button
                        key={country.id}
                        onClick={() => handleAddCountry(country.id)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between rounded-lg"
                      >
                        <span className="text-gray-900 dark:text-white">{country.name}</span>
                        <span className="text-gray-400 text-xs">{country.code}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Currency Modal */}
      {showCurrencyModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => {
                setShowCurrencyModal(false);
                setCurrencySearch('');
              }}
            />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Add Currency
                </h3>
                <button
                  onClick={() => {
                    setShowCurrencyModal(false);
                    setCurrencySearch('');
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-4">
                <input
                  type="text"
                  placeholder="Search currencies..."
                  value={currencySearch}
                  onChange={(e) => setCurrencySearch(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-transparent dark:bg-gray-700 dark:text-white mb-3"
                />
                <div className="max-h-64 overflow-y-auto">
                  {filteredCurrencies.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400 text-center">
                      {currencySearch ? `No currencies matching "${currencySearch}"` : 'All currencies added'}
                    </div>
                  ) : (
                    filteredCurrencies.slice(0, 50).map((currency) => (
                      <button
                        key={currency.id}
                        onClick={() => handleAddCurrency(currency.id)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between rounded-lg"
                      >
                        <span className="text-gray-900 dark:text-white">
                          <span className="font-medium">{currency.code}</span>
                          <span className="text-gray-500 ml-2">{currency.name}</span>
                        </span>
                        <span className="text-gray-400">{currency.symbol}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocalizationTab;
