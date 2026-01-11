import React from 'react';
import { useNavigate } from 'react-router-dom';
import brandIcon from '../assets/icons/brand-icon.svg';
import settingsIcon from '../assets/icons/settings.svg';
import { usePreferences } from '../contexts/PreferencesContext';
import {
  UserIcon,
  CreditCardIcon,
  BanknotesIcon,
  PaintBrushIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  PuzzlePieceIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

export default function SettingsSidebar({ activeTab, setActiveTab }) {
  const { darkMode, toggleDarkMode } = usePreferences();
  const navigate = useNavigate();

  const accountSettings = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'subscription', label: 'Subscription', icon: CreditCardIcon },
    { id: 'payments', label: 'Payments', icon: BanknotesIcon },
    { id: 'customization', label: 'Customization', icon: PaintBrushIcon },
  ];

  const companySettings = [
    { id: 'company', label: 'Company Profile', icon: BuildingOfficeIcon },
    { id: 'currencies', label: 'Currencies', icon: CurrencyDollarIcon },
    { id: 'countries', label: 'Countries', icon: GlobeAltIcon },
    { id: 'integrations', label: 'Integrations', icon: PuzzlePieceIcon },
    { id: 'advanced', label: 'Advanced', icon: Cog6ToothIcon },
  ];

  return (
    <div className={`relative h-screen w-[280px] flex flex-col border-r ${
      darkMode
        ? 'bg-zenible-dark-sidebar border-zenible-dark-border'
        : 'bg-white border-neutral-200'
    }`}>
      {/* Brand Logo Section - Clickable to go back to dashboard */}
      <div className={`relative shrink-0 w-full border-b ${
        darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'
      }`}>
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex gap-3 items-center hover:opacity-80 transition-opacity"
          >
            <div className="bg-zenible-primary flex items-center justify-center p-[6px] rounded-lg size-8">
              <img src={brandIcon} alt="" className="w-[19.2px] h-[19.2px]" />
            </div>
            <div className="flex flex-col">
              <p className={`font-inter font-semibold text-sm leading-[22px] ${
                darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
              }`}>Zenible</p>
              <p className={`font-inter font-normal text-[10px] leading-[14px] ${
                darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'
              }`}>Settings</p>
            </div>
          </button>
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-zenible-dark-card' : 'hover:bg-gray-100'
            }`}
            title="Toggle theme"
          >
            {darkMode ? (
              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Section */}
      <div className="flex-1 overflow-y-auto">
        {/* Account Settings Section */}
        <div className="p-4">
          <p className={`font-inter font-medium text-xs leading-5 mb-2 ${
            darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
          }`}>Account Settings</p>
          <div className="flex flex-col gap-1">
            {accountSettings.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors ${
                    isActive
                      ? darkMode
                        ? 'bg-zenible-dark-tab-bg border border-zenible-primary'
                        : 'bg-zenible-tab-bg border border-zenible-primary'
                      : darkMode
                        ? 'hover:bg-zenible-dark-card'
                        : 'hover:bg-gray-50'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive
                        ? 'text-zenible-primary'
                        : darkMode
                          ? 'text-zenible-dark-text-secondary'
                          : 'text-zinc-500'
                    }`}
                  />
                  <span className={`font-inter font-medium text-sm ${
                    isActive
                      ? darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
                      : darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'
                  }`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Separator */}
        <div className={`mx-4 h-px ${
          darkMode ? 'bg-zenible-dark-border' : 'bg-zenible-stroke'
        }`} />

        {/* Company Settings Section */}
        <div className="p-4">
          <p className={`font-inter font-medium text-xs leading-5 mb-2 ${
            darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
          }`}>Company Settings</p>
          <div className="flex flex-col gap-1">
            {companySettings.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors ${
                    isActive
                      ? darkMode
                        ? 'bg-zenible-dark-tab-bg border border-zenible-primary'
                        : 'bg-zenible-tab-bg border border-zenible-primary'
                      : darkMode
                        ? 'hover:bg-zenible-dark-card'
                        : 'hover:bg-gray-50'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive
                        ? 'text-zenible-primary'
                        : darkMode
                          ? 'text-zenible-dark-text-secondary'
                          : 'text-zinc-500'
                    }`}
                  />
                  <span className={`font-inter font-medium text-sm ${
                    isActive
                      ? darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
                      : darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'
                  }`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
