import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Currency } from './types';

interface AddCurrencyModalProps {
  darkMode: boolean;
  filteredCurrencies: Currency[];
  currencySearch: string;
  setCurrencySearch: (value: string) => void;
  onAdd: (currencyId: string) => void;
  onClose: () => void;
}

export default function AddCurrencyModal({
  darkMode,
  filteredCurrencies,
  currencySearch,
  setCurrencySearch,
  onAdd,
  onClose,
}: AddCurrencyModalProps) {
  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={() => {
            onClose();
            setCurrencySearch('');
          }}
        />
        <div className={`relative rounded-xl shadow-xl w-full max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Add Currency
            </h3>
            <button
              onClick={() => {
                onClose();
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
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-transparent mb-3 ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
              }`}
            />
            <div className="max-h-64 overflow-y-auto">
              {filteredCurrencies.length === 0 ? (
                <div className={`px-4 py-6 text-sm text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {currencySearch ? `No currencies matching "${currencySearch}"` : 'All currencies added'}
                </div>
              ) : (
                filteredCurrencies.slice(0, 50).map((currency) => (
                  <button
                    key={currency.id}
                    onClick={() => onAdd(currency.id)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between rounded-lg ${
                      darkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-gray-900'
                    }`}
                  >
                    <span>
                      <span className="font-medium">{currency.code}</span>
                      <span className={`ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{currency.name}</span>
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
  );
}
