import React from 'react';
import ExpertCard from './ExpertCard';
import { useUsageDashboardOptional } from '../../contexts/UsageDashboardContext';
import UsageLimitBadge from '../ui/UsageLimitBadge';

interface ExpertSidebarProps {
  characters: any[];
  loadingCharacters: boolean;
  darkMode: boolean;
}

export default function ExpertSidebar({ characters, loadingCharacters, darkMode }: ExpertSidebarProps) {
  const usageContext = useUsageDashboardOptional();
  const planName = usageContext?.planName || 'Free Plan';

  return (
    <div
      className={`h-full border-r border-solid flex flex-col ${
        darkMode
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-neutral-200'
      }`}
      style={{ width: '312px' }}
    >
      {/* Header */}
      <div
        className={`border-b border-solid flex items-center px-4 ${
          darkMode ? 'border-gray-700' : 'border-neutral-200'
        }`}
        style={{ height: '64px' }}
      >
        <div className="flex flex-col w-full">
          <p
            className={`font-['Inter'] font-semibold text-[16px] leading-[24px] ${
              darkMode ? 'text-gray-100' : 'text-zinc-950'
            }`}
          >
            Hue Supply
          </p>
          <div className="flex items-center gap-2">
            <p
              className={`font-['Inter'] font-normal text-[12px] leading-[20px] ${
                darkMode ? 'text-gray-400' : 'text-zinc-500'
              }`}
            >
              {planName}
            </p>
            {usageContext && (
              <UsageLimitBadge
                aiUsage
                variant="compact"
                darkMode={darkMode}
              />
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Expert Cards */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="flex flex-col gap-2">
          {loadingCharacters ? (
            <div className="flex items-center justify-center py-8">
              <p
                className={`font-['Inter'] text-[14px] ${
                  darkMode ? 'text-gray-400' : 'text-zinc-500'
                }`}
              >
                Loading experts...
              </p>
            </div>
          ) : characters.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p
                className={`font-['Inter'] text-[14px] ${
                  darkMode ? 'text-gray-400' : 'text-zinc-500'
                }`}
              >
                No experts available
              </p>
            </div>
          ) : (
            characters.map((character) => (
              <ExpertCard
                key={character.id}
                expert={character}
                darkMode={darkMode}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
