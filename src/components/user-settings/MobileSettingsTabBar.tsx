import React, { useRef, useEffect } from 'react';
import { usePreferences } from '../../contexts/PreferencesContext';
import {
  UserIcon,
  CreditCardIcon,
  PaintBrushIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  PuzzlePieceIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

interface MobileSettingsTabBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCompanyAdmin: boolean;
}

const allTabs = [
  { id: 'profile', label: 'Profile', icon: UserIcon },
  { id: 'subscription', label: 'Subscription', icon: CreditCardIcon },
  { id: 'customization', label: 'AI Intelligence', icon: PaintBrushIcon },
  { id: 'booking', label: 'Call Booking', icon: CalendarDaysIcon },
  { id: 'company', label: 'Company', icon: BuildingOfficeIcon },
  { id: 'localization', label: 'Localization', icon: GlobeAltIcon },
  { id: 'email-templates', label: 'Email', icon: EnvelopeIcon },
  { id: 'integrations', label: 'Integrations', icon: PuzzlePieceIcon },
  { id: 'users', label: 'Users', icon: UsersIcon, adminOnly: true },
  { id: 'advanced', label: 'Advanced', icon: Cog6ToothIcon },
];

const MobileSettingsTabBar: React.FC<MobileSettingsTabBarProps> = ({
  activeTab,
  setActiveTab,
  isCompanyAdmin,
}) => {
  const { darkMode } = usePreferences();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  const tabs = allTabs.filter((t) => !t.adminOnly || isCompanyAdmin);

  // Scroll active tab into view
  useEffect(() => {
    activeRef.current?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [activeTab]);

  return (
    <div
      ref={scrollRef}
      className={`flex gap-1 px-4 py-2 overflow-x-auto scrollbar-hide border-b lg:hidden ${
        darkMode ? 'bg-zenible-dark-sidebar border-zenible-dark-border' : 'bg-white border-gray-200'
      }`}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            ref={isActive ? activeRef : undefined}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              isActive
                ? darkMode
                  ? 'bg-zenible-dark-tab-bg border border-zenible-primary text-white'
                  : 'bg-zenible-tab-bg border border-zenible-primary text-zinc-950'
                : darkMode
                  ? 'text-zenible-dark-text-secondary hover:bg-zenible-dark-card'
                  : 'text-zinc-500 hover:bg-gray-50'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-zenible-primary' : ''}`} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default MobileSettingsTabBar;
