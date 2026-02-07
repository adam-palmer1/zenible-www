import React from 'react';
import { XMarkIcon, PlusIcon, CheckIcon } from '@heroicons/react/24/outline';
import { CompanyCountry, CompanyCurrency } from './types';

interface LocalizationStepProps {
  darkMode: boolean;
  localizationError: string | null;
  companyCountries: CompanyCountry[];
  companyCurrencies: CompanyCurrency[];
  onSetDefaultCountry: (associationId: string) => void;
  onRemoveCountry: (associationId: string) => void;
  onOpenCountryModal: () => void;
  onSetDefaultCurrency: (associationId: string) => void;
  onRemoveCurrency: (associationId: string) => void;
  onOpenCurrencyModal: () => void;
}

export default function LocalizationStep({
  darkMode,
  localizationError,
  companyCountries,
  companyCurrencies,
  onSetDefaultCountry,
  onRemoveCountry,
  onOpenCountryModal,
  onSetDefaultCurrency,
  onRemoveCurrency,
  onOpenCurrencyModal,
}: LocalizationStepProps) {
  return (
    <div className="p-6 space-y-6">
      <div className="text-center mb-6">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
          Localization
        </h3>
        <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
          Select countries and currencies for your business
        </p>
      </div>

      {/* Localization Error Message */}
      {localizationError && (
        <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
          {localizationError}
        </div>
      )}

      <div className="space-y-6">
        {/* Countries Section */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
            Countries
          </label>
          <p className={`text-xs mb-3 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
            Available in contacts and addresses. Click to set as default.
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
                onClick={() => !cc.is_default && onSetDefaultCountry(cc.id)}
                title={cc.is_default ? 'Default country' : 'Click to set as default'}
              >
                {cc.is_default && <CheckIcon className="h-3.5 w-3.5" />}
                <span>{cc.country.name}</span>
                <span className="text-xs opacity-60">({cc.country.code})</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveCountry(cc.id);
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

            <button
              onClick={onOpenCountryModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-zenible-primary hover:text-zenible-primary transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Currencies Section */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
            Currencies
          </label>
          <p className={`text-xs mb-3 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
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
                onClick={() => !cc.is_default && onSetDefaultCurrency(cc.id)}
                title={cc.is_default ? 'Default currency' : 'Click to set as default'}
              >
                {cc.is_default && <CheckIcon className="h-3.5 w-3.5" />}
                <span className="font-semibold">{cc.currency.code}</span>
                <span className="opacity-60">{cc.currency.symbol}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveCurrency(cc.id);
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

            <button
              onClick={onOpenCurrencyModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-zenible-primary hover:text-zenible-primary transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
