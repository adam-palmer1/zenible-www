import React from 'react';
import { sparkleIcon, buildingIcon, globeIcon, settingsIcon } from './constants';

interface WelcomeStepProps {
  darkMode: boolean;
  onRemindLater: () => void;
}

export default function WelcomeStep({ darkMode, onRemindLater }: WelcomeStepProps) {
  return (
    <div className="flex flex-col items-center p-8 space-y-6">
      <div className="w-14 h-14 bg-zenible-tab-bg rounded-full flex items-center justify-center">
        <img src={sparkleIcon} alt="Sparkle" className="w-7 h-7" />
      </div>

      <div className="text-center max-w-md space-y-2">
        <h3 className={`text-xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
          Welcome to Zenible
        </h3>
        <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
          Let's get you set up! We'll collect some basic information about your business to personalize your experience.
        </p>
      </div>

      <div className="flex gap-4 w-full max-w-lg">
        <div className={`flex-1 p-6 rounded-xl border text-center space-y-4 ${
          darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'
        }`}>
          <img src={buildingIcon} alt="Company" className="w-6 h-6 mx-auto" />
          <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
            Company Profile
          </p>
        </div>

        <div className={`flex-1 p-6 rounded-xl border text-center space-y-4 ${
          darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'
        }`}>
          <img src={globeIcon} alt="Localization" className="w-6 h-6 mx-auto" />
          <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
            Localization
          </p>
        </div>

        <div className={`flex-1 p-6 rounded-xl border text-center space-y-4 ${
          darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'
        }`}>
          <img src={settingsIcon} alt="Regional" className="w-6 h-6 mx-auto" />
          <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
            Regional Settings
          </p>
        </div>
      </div>

      <p className={`text-xs text-center ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
        This will only take a couple of minutes
      </p>

      <button
        onClick={onRemindLater}
        className={`text-xs text-center underline hover:no-underline transition-all ${
          darkMode ? 'text-zenible-dark-text-secondary hover:text-zenible-dark-text' : 'text-zinc-500 hover:text-zinc-700'
        }`}
      >
        Remind me later
      </button>
    </div>
  );
}
