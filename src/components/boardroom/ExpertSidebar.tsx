import React from 'react';
import ExpertCard from './ExpertCard';
import { useUsageDashboardOptional } from '../../contexts/UsageDashboardContext';
import UsageLimitBadge from '../ui/UsageLimitBadge';
import { useMobile } from '../../hooks/useMobile';
import { X } from 'lucide-react';

interface ExpertSidebarProps {
  characters: any[];
  loadingCharacters: boolean;
  darkMode: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function ExpertSidebar({ characters, loadingCharacters, darkMode, isOpen = true, onClose }: ExpertSidebarProps) {
  const usageContext = useUsageDashboardOptional();
  const planName = usageContext?.planName || 'Free Plan';
  const isMobile = useMobile();

  // Don't render on mobile if not open
  if (isMobile && !isOpen) return null;

  const sidebarContent = (
    <div
      className={`h-full border-solid flex flex-col ${
        isMobile
          ? 'w-full'
          : 'w-[312px] border-r'
      } ${
        darkMode
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-neutral-200'
      }`}
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

        {/* Close button for mobile */}
        {isMobile && onClose && (
          <button
            onClick={onClose}
            className={`ml-2 p-1 rounded-lg transition-colors ${
              darkMode
                ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        )}
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

  // On mobile: render as full-screen overlay with backdrop
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
        {/* Sidebar overlay */}
        <div className="fixed inset-0 z-50">
          {sidebarContent}
        </div>
      </>
    );
  }

  // Desktop: normal sidebar panel
  return sidebarContent;
}
