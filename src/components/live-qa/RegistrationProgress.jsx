import React from 'react';
import profileIcon from '../../assets/icons/live-qa/profile-2user-icon.svg';
import progressDot from '../../assets/icons/live-qa/progress-dot.svg';

export default function RegistrationProgress({ current, max, darkMode }) {
  const percentage = Math.round((current / max) * 100);

  return (
    <div
      className={`border border-solid rounded-lg w-full ${
        darkMode ? 'border-gray-700' : 'border-neutral-200'
      }`}
    >
      <div className="flex flex-col gap-2 p-2">
        {/* Header with icon, text, and percentage */}
        <div className="flex gap-2 items-start">
          {/* Icon */}
          <div
            className={`flex items-center justify-center p-1 rounded shrink-0 ${
              darkMode ? 'bg-violet-900/30' : 'bg-violet-50'
            }`}
            style={{ width: '22px', height: '22px' }}
          >
            <img
              src={profileIcon}
              alt="Participants"
              className="w-2 h-2"
            />
          </div>

          {/* Text */}
          <p
            className={`flex-1 font-['Inter'] font-normal text-[14px] leading-[22px] ${
              darkMode ? 'text-gray-100' : 'text-zinc-950'
            }`}
          >
            {current}/{max} registered
          </p>

          {/* Percentage */}
          <p className="font-['Inter'] font-normal text-[14px] leading-[22px] text-[#8e51ff]">
            {percentage}%
          </p>
        </div>

        {/* Progress Bar */}
        <div
          className={`h-2.5 rounded-full overflow-hidden ${
            darkMode ? 'bg-gray-700' : 'bg-neutral-50'
          }`}
        >
          <div
            className="h-full bg-[#8e51ff] rounded-full flex items-center justify-end p-0.5 transition-all duration-300"
            style={{ width: `${percentage}%` }}
          >
            {percentage > 10 && (
              <img
                src={progressDot}
                alt=""
                className="w-1.5 h-1.5"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
