import React, { useState } from 'react';
import OnboardingModal from '../OnboardingModal';
import { usePreferences } from '../../contexts/PreferencesContext';
import mainIcon from '../../assets/icons/dashboard/icon.svg';

interface PersonalizeAIBannerProps {
  darkMode?: boolean;
}

export default function PersonalizeAIBanner({ darkMode = false }: PersonalizeAIBannerProps) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { getPreference } = usePreferences();

  // Check if user has completed onboarding
  const onboardingStatus = getPreference('onboarding_status');

  // Don't show the banner if onboarding is complete
  if (onboardingStatus === 'complete') {
    return null;
  }

  return (
    <>
      <div className="w-full">
        <div className={`border rounded-xl p-4 ${
          darkMode
            ? 'bg-violet-950/30 border-violet-700/50'
            : 'bg-violet-50 border-[#c4b4ff]'
        }`}>
          <div className="flex gap-4 items-center">
            <div className={`p-2 rounded-lg shrink-0 ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <img alt="" className="w-6 h-6" src={mainIcon} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-lg ${
                darkMode ? 'text-white' : 'text-zinc-950'
              }`}>
                Personalize Your Business Intelligence Feature
              </p>
              <p className={`text-xs ${
                darkMode ? 'text-gray-400' : 'text-zinc-500'
              }`}>
                Complete your professional profile so that Zenible can provide the most relevant and tailored feedback.
              </p>
            </div>
            <button
              onClick={() => setShowOnboarding(true)}
              className="bg-[#8e51ff] px-4 py-2.5 rounded-lg shrink-0 hover:bg-[#7b3ff0] transition-colors"
            >
              <span className="font-medium text-white">
                Setup Profile
              </span>
            </button>
          </div>
        </div>
      </div>

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </>
  );
}
