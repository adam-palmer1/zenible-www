import React, { useState, useEffect } from 'react';
import {
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  PuzzlePieceIcon,
  Cog6ToothIcon,
  UserIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import UserProfileTab from './tabs/UserProfileTab';
import ProfileTab from './tabs/ProfileTab';
import CurrenciesTab from './tabs/CurrenciesTab';
import CountriesTab from './tabs/CountriesTab';
import IntegrationsTab from './tabs/IntegrationsTab';
import AdvancedTab from './tabs/AdvancedTab';
import BookingTab from './tabs/BookingTab';

/**
 * Company Settings Page
 * Main container with tabbed interface for all company settings
 */
const CompanySettings = () => {
  const [activeTab, setActiveTab] = useState('user-profile');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Prevent navigation if unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const tabs = [
    {
      id: 'user-profile',
      label: 'Profile',
      icon: UserIcon,
      component: UserProfileTab,
    },
    {
      id: 'company-profile',
      label: 'Company Profile',
      icon: BuildingOfficeIcon,
      component: ProfileTab,
    },
    {
      id: 'currencies',
      label: 'Currencies',
      icon: CurrencyDollarIcon,
      component: CurrenciesTab,
    },
    {
      id: 'countries',
      label: 'Countries',
      icon: GlobeAltIcon,
      component: CountriesTab,
    },
    {
      id: 'booking',
      label: 'Booking',
      icon: CalendarDaysIcon,
      component: BookingTab,
    },
    {
      id: 'integrations',
      label: 'Integrations',
      icon: PuzzlePieceIcon,
      component: IntegrationsTab,
    },
    {
      id: 'advanced',
      label: 'Advanced',
      icon: Cog6ToothIcon,
      component: AdvancedTab,
    },
  ];

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component;

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Company Settings
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Manage your company profile, currencies, and preferences
        </p>
      </div>

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            You have unsaved changes. Make sure to save before leaving this page.
          </p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${
                    isActive
                      ? 'border-zenible-primary text-zenible-primary dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {ActiveComponent && (
          <ActiveComponent
            onUnsavedChanges={setHasUnsavedChanges}
          />
        )}
      </div>
    </div>
  );
};

export default CompanySettings;
