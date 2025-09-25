import React from 'react';
import upworkIcon from '../../assets/icons/upwork.svg';
import linkedinIcon from '../../assets/icons/linkedin.svg';
import envelopeIcon from '../../assets/icons/envelope.svg';
import globeIcon from '../../assets/icons/globe.svg';

const platforms = [
  { id: 'upwork', label: 'Upwork', icon: upworkIcon },
  { id: 'linkedin', label: 'LinkedIn', icon: linkedinIcon },
  { id: 'email', label: 'Cold Email', icon: envelopeIcon },
  { id: 'others', label: 'Others', icon: globeIcon },
];

export default function PlatformSelector({ darkMode, selectedPlatform, setSelectedPlatform }) {
  return (
    <div className={`px-4 pt-4 pb-0 border-b ${
      darkMode ? 'bg-[#1a1a1a] border-[#333333]' : 'bg-white border-neutral-200'
    }`}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <h2 className={`font-inter font-semibold text-lg ${
          darkMode ? 'text-white' : 'text-zinc-950'
        }`}>Choose Your Platform</h2>

        <div className="flex flex-wrap gap-2">
          {platforms.map((platform) => (
            <button
              key={platform.id}
              onClick={() => setSelectedPlatform(platform.id)}
              className={`flex items-center gap-2 px-3 py-3 rounded-xl transition-all text-sm sm:text-base ${
                selectedPlatform === platform.id
                  ? 'bg-white border-[1.5px] border-[#a684ff] shadow-[0px_0px_0px_2.5px_#ddd6ff]'
                  : darkMode
                    ? 'bg-[#2d2d2d] border border-[#4a4a4a] hover:bg-[#3a3a3a]'
                    : 'bg-white border border-neutral-200 hover:bg-gray-50'
              }`}
            >
              <img src={platform.icon} alt="" className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
              <span className={`font-inter font-medium whitespace-nowrap ${
                darkMode && selectedPlatform !== platform.id
                  ? 'text-white'
                  : 'text-zinc-950'
              }`}>
                {platform.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}