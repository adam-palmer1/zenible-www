import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useCountries } from '../../../../hooks/crm/useCountries';
import { useNotification } from '../../../../contexts/NotificationContext';

/**
 * Countries Tab - Manage company-enabled countries
 */
const CountriesTab = () => {
  const {
    countries,
    companyCountries,
    defaultCountry,
    loading,
    addCountry,
    removeCountry,
    setDefaultCountry: setDefault,
  } = useCountries();

  const { showSuccess, showError } = useNotification();
  const [selectedCountry, setSelectedCountry] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter available countries by search
  const filteredCountries = countries.filter(
    (c) =>
      !companyCountries.find((cc) => cc.country.id === c.id) &&
      (c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddCountry = async () => {
    if (!selectedCountry) return;

    const result = await addCountry(selectedCountry);
    if (result.success) {
      showSuccess('Country added successfully');
      setSelectedCountry('');
      setSearchTerm('');
    } else {
      showError(result.error || 'Failed to add country');
    }
  };

  const handleRemoveCountry = async (associationId) => {
    const result = await removeCountry(associationId);
    if (result.success) {
      showSuccess('Country removed successfully');
    } else {
      showError(result.error || 'Failed to remove country');
    }
  };

  const handleSetDefault = async (associationId) => {
    const result = await setDefault(associationId);
    if (result.success) {
      showSuccess('Default country updated');
    } else {
      showError(result.error || 'Failed to set default country');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading countries...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enabled Countries */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Enabled Countries
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Countries that can be selected in contacts, addresses, and other fields. The default country is pre-selected in forms.
        </p>

        <div className="space-y-2">
          {companyCountries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No countries enabled yet. Add your first country below.
            </div>
          ) : (
            companyCountries.map((cc) => (
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
                      {cc.country.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Code: {cc.country.code}
                      {cc.country.telephone_code && ` • Phone: ${cc.country.telephone_code}`}
                      {cc.is_default && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveCountry(cc.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  title="Remove country"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Country */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Add Country
        </h3>

        {/* Search/Filter */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="Search countries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="flex gap-3">
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white max-h-48"
            size={filteredCountries.length > 0 ? Math.min(filteredCountries.length, 8) : 1}
          >
            <option value="">Select a country to add...</option>
            {filteredCountries.slice(0, 50).map((country) => (
              <option key={country.id} value={country.id}>
                {country.name} ({country.code})
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3">
          <button
            onClick={handleAddCountry}
            disabled={!selectedCountry}
            className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add Country
          </button>
        </div>

        {searchTerm && filteredCountries.length === 0 && (
          <p className="mt-3 text-sm text-gray-500">
            No countries found matching "{searchTerm}"
          </p>
        )}
      </div>
    </div>
  );
};

export default CountriesTab;
