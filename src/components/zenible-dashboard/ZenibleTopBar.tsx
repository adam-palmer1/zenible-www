import React from 'react';
import searchIcon from '../../assets/icons/search.svg';

interface Tab {
  id: string;
  label: string;
  active?: boolean;
}

const tabs: Tab[] = [
  { id: 'overview', label: 'Overview', active: true },
  { id: 'customers', label: 'Customers' },
  { id: 'products', label: 'Products' },
  { id: 'settings', label: 'Settings' },
];

interface ZenibleTopBarProps {
  darkMode?: boolean;
}

export default function ZenibleTopBar({ darkMode }: ZenibleTopBarProps) {
  return (
    <div className={`relative h-16 border-b ${
      darkMode
        ? 'bg-zenible-dark-sidebar border-zenible-dark-border'
        : 'bg-white border-neutral-200'
    }`}>
      <div className="flex items-center justify-between h-full px-4">
        {/* Tab Buttons */}
        <div className="flex items-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`h-9 px-3 py-2 rounded-lg font-inter font-semibold text-sm leading-[22px] transition-all ${
                tab.active
                  ? darkMode
                    ? 'bg-zenible-dark-card text-zenible-dark-text border border-zenible-dark-border'
                    : 'bg-white text-zinc-950 border border-neutral-200 shadow-sm'
                  : darkMode
                    ? 'text-zenible-dark-text-secondary hover:text-zenible-dark-text'
                    : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="flex items-center">
          <div className="relative w-[358px]">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-[10px] border-[1.5px] ${
              darkMode
                ? 'bg-zenible-dark-card border-zenible-dark-border'
                : 'bg-white border-neutral-200'
            }`}>
              <img src={searchIcon} alt="" className="w-4 h-4" />
              <input
                type="text"
                placeholder="Search"
                className={`flex-1 font-inter font-normal text-base outline-none ${
                  darkMode
                    ? 'bg-transparent text-zenible-dark-text-secondary placeholder:text-zenible-dark-text-secondary'
                    : 'bg-transparent text-zinc-400 placeholder:text-zinc-400'
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
