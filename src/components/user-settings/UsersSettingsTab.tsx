import React from 'react';
import { usePreferences } from '../../contexts/PreferencesContext';
import UsersPermissionsTab from '../crm/settings/tabs/UsersPermissionsTab';

interface UsersSettingsTabProps {
  isCompanyAdmin: boolean;
}

export default function UsersSettingsTab({ isCompanyAdmin }: UsersSettingsTabProps) {
  const { darkMode } = usePreferences();

  if (!isCompanyAdmin) {
    return (
      <div className={`rounded-xl shadow-sm border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
        <div className="p-8 text-center">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${darkMode ? 'bg-red-900/20' : 'bg-red-50'}`}>
            <svg className={`w-8 h-8 ${darkMode ? 'text-red-400' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
            Access Denied
          </h3>
          <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
            You need company admin permissions to access Users & Permissions settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl shadow-sm border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
      <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
        <h2 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
          Users & Permissions
        </h2>
      </div>
      <div className="p-6">
        <UsersPermissionsTab />
      </div>
    </div>
  );
}
