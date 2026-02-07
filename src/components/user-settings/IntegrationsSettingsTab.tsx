import React from 'react';
import { usePreferences } from '../../contexts/PreferencesContext';
import IntegrationsTab from '../crm/settings/tabs/IntegrationsTab';

export default function IntegrationsSettingsTab() {
  const { darkMode } = usePreferences();

  return (
    <div className={`rounded-xl shadow-sm border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
      <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
        <h2 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
          Integrations
        </h2>
      </div>
      <div className="p-6">
        <IntegrationsTab />
      </div>
    </div>
  );
}
