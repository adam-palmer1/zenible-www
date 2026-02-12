import React from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { CompanyProfile, Country } from './types';

interface CompanyProfileStepProps {
  darkMode: boolean;
  companyProfile: CompanyProfile;
  setCompanyProfile: React.Dispatch<React.SetStateAction<CompanyProfile>>;
  countries: Country[];
  getSelectedCountryName: () => string;
  onOpenCountryModal: () => void;
}

export default function CompanyProfileStep({
  darkMode,
  companyProfile,
  setCompanyProfile,
  countries: _countries,
  getSelectedCountryName,
  onOpenCountryModal,
}: CompanyProfileStepProps) {
  return (
    <div className="p-6 space-y-6">
      <div className="text-center mb-6">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
          Company Profile
        </h3>
        <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
          Tell us about your business
        </p>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
              Company Name *
            </label>
            <input
              type="text"
              value={companyProfile.name}
              onChange={(e) => setCompanyProfile({ ...companyProfile, name: e.target.value })}
              placeholder="Enter company name"
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-zenible-primary`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
              Company Email
            </label>
            <input
              type="email"
              value={companyProfile.email}
              onChange={(e) => setCompanyProfile({ ...companyProfile, email: e.target.value })}
              placeholder="company@example.com"
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-zenible-primary`}
            />
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
            Street Address
          </label>
          <input
            type="text"
            value={companyProfile.address}
            onChange={(e) => setCompanyProfile({ ...companyProfile, address: e.target.value })}
            placeholder="Street address"
            className={`w-full px-4 py-3 rounded-lg border ${
              darkMode
                ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-zenible-primary`}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
              City
            </label>
            <input
              type="text"
              value={companyProfile.city}
              onChange={(e) => setCompanyProfile({ ...companyProfile, city: e.target.value })}
              placeholder="City"
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-zenible-primary`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
              State/Province
            </label>
            <input
              type="text"
              value={companyProfile.state}
              onChange={(e) => setCompanyProfile({ ...companyProfile, state: e.target.value })}
              placeholder="State"
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-zenible-primary`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
              Postal Code
            </label>
            <input
              type="text"
              value={companyProfile.postal_code}
              onChange={(e) => setCompanyProfile({ ...companyProfile, postal_code: e.target.value })}
              placeholder="12345"
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-zenible-primary`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
              Country
            </label>
            <button
              type="button"
              onClick={onOpenCountryModal}
              className={`w-full px-4 py-3 rounded-lg border text-left flex items-center justify-between ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                  : 'bg-white border-gray-300 text-gray-900'
              } hover:border-zenible-primary transition-colors`}
            >
              <span className={!companyProfile.country ? (darkMode ? 'text-gray-500' : 'text-gray-400') : ''}>
                {getSelectedCountryName() || 'Select country'}
              </span>
              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
