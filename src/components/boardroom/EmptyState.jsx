import React from 'react';
import profileIcon from '../../assets/icons/boardroom/profile-2user.svg';

export default function EmptyState({ darkMode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 w-full h-full">
      {/* Icon */}
      <div
        className={`flex items-center justify-center rounded-full border ${
          darkMode
            ? 'bg-violet-900/20 border-violet-700'
            : 'bg-violet-50 border-[#ddd6ff]'
        }`}
        style={{
          width: '56px',
          height: '56px',
          borderWidth: '1.167px'
        }}
      >
        <img
          src={profileIcon}
          alt="Profile icon"
          className="w-6 h-6"
        />
      </div>

      {/* Text Content */}
      <div className="flex flex-col items-center gap-0.5 px-4">
        <h2
          className={`font-['Inter'] font-semibold text-[18px] leading-[26px] text-nowrap ${
            darkMode ? 'text-gray-100' : 'text-zinc-950'
          }`}
        >
          Your Boardroom Awaits
        </h2>
        <p
          className={`font-['Inter'] font-normal text-[14px] leading-[22px] text-center ${
            darkMode ? 'text-gray-400' : 'text-zinc-500'
          }`}
        >
          Drag AI experts from the sidebar to assemble your perfect advisory team.{' '}
          <br />
          Each expert brings unique insights to help craft winning proposals.
        </p>
      </div>
    </div>
  );
}
