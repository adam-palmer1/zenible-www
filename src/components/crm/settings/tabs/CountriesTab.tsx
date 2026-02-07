import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon, PlusIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useCountries } from '../../../../hooks/crm/useCountries';
import { useNotification } from '../../../../contexts/NotificationContext';

/**
 * Countries Tab - Manage company-enabled countries
 */
const CountriesTab: React.FC = () => {
  const {
    countries,
    companyCountries,
    defaultCountry,
    loading,
    addCountry,
    removeCountry,
    setDefaultCountry: setDefault,
  } = useCountries() as any;

  const { showSuccess, showError } = useNotification() as any;
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter available countries by search
  const filteredCountries = countries.filter(
    (c: any) =>
      !companyCountries.find((cc: any) => cc.country.id === c.id) &&
      (c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddCountry = async (countryId: string) => {
    const result = await addCountry(countryId);
    if (result.success) {
      showSuccess('Country added');
      setSearchTerm('');
      setShowDropdown(false);
    } else {
      showError(result.error || 'Failed to add country');
    }
  };

  const handleRemoveCountry = async (associationId: string) => {
    const result = await removeCountry(associationId);
    if (result.success) {
      showSuccess('Country removed');
    } else {
      showError(result.error || 'Failed to remove country');
    }
  };

  const handleSetDefault = async (associationId: string) => {
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
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Enabled Countries</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Countries available in contacts, addresses, and forms. Click a country to set it as default.
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {companyCountries.map((cc: any) => (
            <div
              key={cc.id}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer group ${
                cc.is_default
                  ? 'bg-zenible-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              onClick={() => !cc.is_default && handleSetDefault(cc.id)}
              title={cc.is_default ? 'Default country' : 'Click to set as default'}
            >
              {cc.is_default && <CheckIcon className="h-3.5 w-3.5" />}
              <span>{cc.country.name}</span>
              <span className="text-xs opacity-60">({cc.country.code})</span>
              <button
                onClick={(e) => { e.stopPropagation(); handleRemoveCountry(cc.id); }}
                className={`ml-1 p-0.5 rounded-full transition-colors ${cc.is_default ? 'hover:bg-white/20' : 'hover:bg-gray-300 dark:hover:bg-gray-500'}`}
                title="Remove country"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          <div className="relative" ref={dropdownRef}>
            {showDropdown ? (
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search countries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Escape') { setShowDropdown(false); setSearchTerm(''); } }}
                  autoFocus
                  className="w-48 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-zenible-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                  {filteredCountries.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                      {searchTerm ? `No countries matching "${searchTerm}"` : 'All countries added'}
                    </div>
                  ) : (
                    filteredCountries.slice(0, 20).map((country: any) => (
                      <button key={country.id} onClick={() => handleAddCountry(country.id)} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between">
                        <span className="text-gray-900 dark:text-white">{country.name}</span>
                        <span className="text-gray-400 text-xs">{country.code}</span>
                      </button>
                    ))
                  )}
                  {filteredCountries.length > 20 && (
                    <div className="px-4 py-2 text-xs text-gray-400 text-center border-t border-gray-200 dark:border-gray-700">Type to filter more countries...</div>
                  )}
                </div>
              </div>
            ) : (
              <button onClick={() => setShowDropdown(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-zenible-primary hover:text-zenible-primary transition-colors">
                <PlusIcon className="h-4 w-4" /><span>Add Country</span>
              </button>
            )}
          </div>
        </div>

        {companyCountries.length === 0 && (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            No countries enabled yet. Click "Add Country" to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default CountriesTab;
