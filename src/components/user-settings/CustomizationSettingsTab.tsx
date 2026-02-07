import React from 'react';
import { usePreferences } from '../../contexts/PreferencesContext';
import CustomizationQuestions from '../CustomizationQuestions';

export default function CustomizationSettingsTab() {
  const { darkMode } = usePreferences();

  return (
    <div className="space-y-6">
      <div className={`rounded-xl shadow-sm border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
            AI Intelligence
          </h2>
          <p className={`text-sm mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
            Help Zenible to personalize all content that it creates for you, ensuring that
            feedback and guidance are always relevant to your experience and background.
          </p>
          <p className={`text-sm mt-2 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
            Answer questions with as much detail as possible, leaving them empty if not relevant to
            your situation.
          </p>
        </div>

        <div className="p-6">
          <CustomizationQuestions
            mode="settings"
            showProgress={false}
            autoSave={false}
          />
        </div>
      </div>
    </div>
  );
}
