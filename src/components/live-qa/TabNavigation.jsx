import React from 'react';

const TABS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'live', label: 'Live' },
  { id: 'recorded', label: 'Recorded' },
  { id: 'my-events', label: 'My Events' },
  { id: 'schedule', label: 'Schedule 1:1', disabled: true }
];

export default function TabNavigation({ activeTab, onTabChange, darkMode }) {
  return (
    <div
      className={`border border-solid rounded-lg flex gap-0.5 items-center ${
        darkMode
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-neutral-200'
      }`}
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => !tab.disabled && onTabChange(tab.id)}
          disabled={tab.disabled}
          className={`flex items-center justify-center px-3 py-2 rounded-lg h-9 transition-colors ${
            tab.disabled
              ? 'bg-transparent text-gray-400 cursor-not-allowed opacity-60'
              : activeTab === tab.id
              ? darkMode
                ? 'bg-violet-600 text-white'
                : 'bg-white border border-neutral-200 text-zinc-950'
              : darkMode
              ? 'bg-transparent text-gray-400 hover:text-gray-200'
              : 'bg-transparent text-zinc-500 hover:text-zinc-950'
          }`}
        >
          <span className="font-['Inter'] font-semibold text-[14px] leading-[22px] whitespace-nowrap">
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
}
