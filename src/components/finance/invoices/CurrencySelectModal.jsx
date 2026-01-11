import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Check } from 'lucide-react';

/**
 * Currency Select Dropdown
 * Appears as a dropdown next to the trigger element
 */
const CurrencySelectModal = ({ isOpen, onClose, currencies, selectedCurrencyId, onSelect, loading, triggerRef }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  // Filter currencies based on search
  const filteredCurrencies = useMemo(() => {
    if (!searchQuery) return currencies;
    const query = searchQuery.toLowerCase();
    return currencies.filter(cc => {
      const code = cc.currency.code.toLowerCase();
      const name = cc.currency.name.toLowerCase();
      return code.includes(query) || name.includes(query);
    });
  }, [currencies, searchQuery]);

  const handleSelect = (currencyId) => {
    onSelect(currencyId);
    setSearchQuery('');
    onClose();
  };

  const getCurrencyDisplay = (cc) => {
    return `${cc.currency.code} - ${cc.currency.name}`;
  };

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        triggerRef?.current &&
        !triggerRef.current.contains(event.target)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, triggerRef]);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      style={{ maxWidth: '400px' }}
    >
      {/* Search */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search currencies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            autoFocus
          />
        </div>
      </div>

      {/* Currency List */}
      <div className="max-h-64 overflow-y-auto">
        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Loading currencies...
          </div>
        ) : filteredCurrencies.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            {searchQuery ? 'No currencies found' : 'No currencies available'}
          </div>
        ) : (
          <div className="py-1">
            {filteredCurrencies.map((cc) => (
              <button
                key={cc.currency.id}
                onClick={() => handleSelect(cc.currency.id)}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between transition-colors ${
                  cc.currency.id === selectedCurrencyId ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                }`}
              >
                <span className="text-gray-900 dark:text-white">
                  {getCurrencyDisplay(cc)}
                </span>
                {cc.currency.id === selectedCurrencyId && (
                  <Check className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrencySelectModal;
