import React from 'react';

interface CompleteStepProps {
  darkMode: boolean;
}

export default function CompleteStep({ darkMode }: CompleteStepProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8">
      <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6">
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
          <path d="M20 6L9 17L4 12" stroke="#8e51ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
        You're All Set!
      </h3>

      <p className={`text-sm text-center max-w-md mx-auto mb-6 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
        Your company profile and settings have been saved. You can always update these in your settings.
      </p>

      <p className={`text-xs text-center ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
        Click "Get Started" to begin using Zenible
      </p>
    </div>
  );
}
