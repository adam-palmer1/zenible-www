import React from 'react';
import { usePreferences } from '../../contexts/PreferencesContext';

export default function PlatformContentOptions({
  platformFocus,
  setPlatformFocus,
  disabled = false
}) {
  const { darkMode } = usePreferences();

  const platforms = ['LinkedIn', 'Twitter', 'Facebook'];

  const handlePlatformToggle = (platform) => {
    if (disabled || platform.toLowerCase() !== 'linkedin') return;
    setPlatformFocus(platform.toLowerCase());
  };

  return (
    <div
      className={`rounded-xl border p-4 ${
        darkMode
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-neutral-200'
      }`}
    >
      <div className="mb-2">
        <h3
          className={`text-lg font-semibold ${
            darkMode ? 'text-gray-100' : 'text-zinc-950'
          }`}
        >
          Platform Focus
        </h3>
      </div>

      <div className="flex gap-2">
        {platforms.map((platform) => {
          const isLinkedIn = platform.toLowerCase() === 'linkedin';
          const isActive = platformFocus === platform.toLowerCase();

          return (
            <button
              key={platform}
              onClick={() => handlePlatformToggle(platform)}
              disabled={disabled || !isLinkedIn}
              className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
                isActive && isLinkedIn
                  ? darkMode
                    ? 'bg-white text-zinc-950 border-neutral-200'
                    : 'bg-white text-zinc-950 border-neutral-200'
                  : !isLinkedIn
                  ? darkMode
                    ? 'bg-gray-700 text-gray-500 border-gray-600 opacity-50 cursor-not-allowed'
                    : 'bg-white text-zinc-400 border-neutral-200 opacity-50 cursor-not-allowed'
                  : darkMode
                  ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                  : 'bg-white text-zinc-950 border-neutral-200 hover:bg-gray-50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {platform}
            </button>
          );
        })}
      </div>
    </div>
  );
}
