import React from 'react';

interface DateTab {
  id: string;
  label: string;
  active?: boolean;
}

const dateTabs: DateTab[] = [
  { id: 'today', label: 'Oct 17, 2024', active: true },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
];

interface PageHeaderProps {
  darkMode?: boolean;
}

export default function PageHeader({ darkMode }: PageHeaderProps) {
  return (
    <>
      {/* Page Title Section */}
      <div className={`h-[72px] flex items-center justify-between px-4 border-b ${
        darkMode
          ? 'bg-zenible-dark-sidebar border-zenible-dark-border'
          : 'bg-white border-neutral-200'
      }`}>
        <h1 className={`font-inter font-semibold text-2xl ${
          darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
        }`}>Dashboard</h1>
        <div className="flex items-center gap-2">
          <input
            type="date"
            className={`h-12 px-4 rounded-xl border font-inter text-sm outline-none focus:border-zenible-primary ${
              darkMode
                ? 'bg-zenible-dark-card border-zenible-dark-border text-zenible-dark-text'
                : 'bg-white border-neutral-200 text-zinc-950'
            }`}
            defaultValue="2024-11-06"
          />
          <button className="h-12 px-6 bg-zenible-primary text-white rounded-xl font-inter font-semibold text-sm hover:bg-purple-600 transition-colors">
            Download
          </button>
        </div>
      </div>

      {/* Date Tabs Section */}
      <div className={`h-[60px] flex items-center px-4 ${
        darkMode ? 'bg-zenible-dark-sidebar' : 'bg-white'
      }`}>
        <div className="flex items-center">
          {dateTabs.map((tab) => (
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
      </div>
    </>
  );
}
