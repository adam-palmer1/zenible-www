import React from 'react';
import { usePreferences } from '../../contexts/PreferencesContext';
import EmailTemplates from '../settings/EmailTemplates';

export default function EmailTemplatesSettingsTab() {
  const { darkMode } = usePreferences();

  return (
    <div className={`rounded-xl shadow-sm border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
      <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
        <h2 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
          Email Templates
        </h2>
      </div>
      <div className="p-6">
        <EmailTemplates />
      </div>
    </div>
  );
}
