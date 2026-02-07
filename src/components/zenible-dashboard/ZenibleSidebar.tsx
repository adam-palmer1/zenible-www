import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import brandIcon from '../../assets/icons/brand-icon.svg';
import playgroundIcon from '../../assets/icons/playground.svg';
import { useAuth } from '../../contexts/AuthContext';
import historyIcon from '../../assets/icons/history.svg';
import starIcon from '../../assets/icons/star.svg';
import settingsIcon from '../../assets/icons/settings.svg';
import modelsIcon from '../../assets/icons/models.svg';
import documentationIcon from '../../assets/icons/documentation.svg';
import brushIcon from '../../assets/icons/brush.svg';
import graphIcon from '../../assets/icons/graph.svg';
import mapIcon from '../../assets/icons/map.svg';
import moreIcon from '../../assets/icons/more.svg';
import chevronDown from '../../assets/icons/chevron-down.svg';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  active?: boolean;
  hasDropdown?: boolean;
}

const navItems: NavItem[] = [
  { id: 'playground', label: 'Playground', icon: playgroundIcon, active: true, hasDropdown: true },
  { id: 'history', label: 'History', icon: historyIcon },
  { id: 'starred', label: 'Starred', icon: starIcon },
  { id: 'settings', label: 'Settings', icon: settingsIcon },
  { id: 'models', label: 'Models', icon: modelsIcon, hasDropdown: true },
  { id: 'documentation', label: 'Documentation', icon: documentationIcon, hasDropdown: true },
  { id: 'settings2', label: 'Settings', icon: settingsIcon, hasDropdown: true },
];

interface PlatformItem {
  id: string;
  label: string;
  icon: string;
}

const platformItems: PlatformItem[] = [
  { id: 'design', label: 'Design Engineering', icon: brushIcon },
  { id: 'sales', label: 'Sales & Marketing', icon: graphIcon },
  { id: 'travel', label: 'Travel', icon: mapIcon },
  { id: 'more', label: 'More', icon: moreIcon },
];

interface ZenibleSidebarProps {
  darkMode?: boolean;
  toggleDarkMode?: () => void;
}

export default function ZenibleSidebar({ darkMode, toggleDarkMode }: ZenibleSidebarProps) {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative h-full w-[280px] flex flex-col border-r ${
      darkMode
        ? 'bg-zenible-dark-sidebar border-zenible-dark-border'
        : 'bg-white border-neutral-200'
    }`}>
      {/* Brand Logo Section */}
      <div className={`relative shrink-0 w-full border-b ${
        darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'
      }`}>
        <div className="flex items-center justify-between p-4">
          <div className="flex gap-3 items-center">
            <div className="bg-zenible-primary flex items-center justify-center p-[6px] rounded-lg size-8">
              <img src={brandIcon} alt="" className="w-[19.2px] h-[19.2px]" />
            </div>
            <div className="flex flex-col">
              <p className={`font-inter font-semibold text-sm leading-[22px] ${
                darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
              }`}>Zenible</p>
              <p className={`font-inter font-normal text-[10px] leading-[14px] ${
                darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'
              }`}>Free Plan</p>
            </div>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-zenible-dark-card' : 'hover:bg-gray-100'
            }`}
            title="Toggle theme"
          >
            {darkMode ? (
              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Section */}
      <div className="flex-1">
        <div className="p-4">
          <p className={`font-inter font-medium text-xs leading-5 mb-2 ${
            darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
          }`}>Platform</p>
          <div className="flex flex-col">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors ${
                  item.active
                    ? darkMode
                      ? 'bg-zenible-dark-tab-bg border border-zenible-primary'
                      : 'bg-zenible-tab-bg border border-zenible-primary'
                    : darkMode
                      ? 'hover:bg-zenible-dark-card'
                      : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <img
                    src={item.icon}
                    alt=""
                    className={`w-6 h-6 ${!item.active ? 'opacity-60' : ''}`}
                  />
                  <span className={`font-inter font-medium text-base ${
                    item.active
                      ? darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
                      : darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'
                  }`}>
                    {item.label}
                  </span>
                </div>
                {item.hasDropdown && (
                  <img src={chevronDown} alt="" className="w-4 h-4" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Separator */}
        <div className={`mx-4 h-px ${
          darkMode ? 'bg-zenible-dark-border' : 'bg-zenible-stroke'
        }`} />

        {/* Platform Section */}
        <div className="p-4">
          <p className={`font-inter font-medium text-xs leading-5 mb-2 ${
            darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
          }`}>Platform</p>
          <div className="flex flex-col">
            {platformItems.map((item) => (
              <button
                key={item.id}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors ${
                  darkMode ? 'hover:bg-zenible-dark-card' : 'hover:bg-gray-50'
                }`}
              >
                <img src={item.icon} alt="" className="w-6 h-6 opacity-60" />
                <span className={`font-inter font-medium text-base ${
                  darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'
                }`}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div className={`border-t p-4 ${
        darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'
      }`}>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-zenible-dark-card' : 'hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold">
                {user?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
              <div className="flex flex-col text-left">
                <p className={`font-inter font-medium text-base leading-6 ${
                  darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
                }`}>{user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.first_name || user?.email || 'User'}</p>
              </div>
            </div>
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileDropdown && (
            <div
              className={`absolute bottom-full left-0 right-0 mb-2 rounded-lg shadow-lg border ${
                darkMode
                  ? 'bg-zenible-dark-card border-zenible-dark-border'
                  : 'bg-white border-neutral-200'
              }`}
            >
              <div className="py-1">
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setShowProfileDropdown(false)}
                    className={`flex items-center gap-2 px-4 py-2.5 transition-colors ${
                      darkMode
                        ? 'text-zenible-dark-text hover:bg-zenible-dark-bg'
                        : 'text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                      />
                    </svg>
                    <span className="font-medium">Admin Settings</span>
                  </Link>
                )}
                <button
                  onClick={() => {
                    setShowProfileDropdown(false);
                    navigate('/settings');
                  }}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 transition-colors ${
                    darkMode
                      ? 'text-zenible-dark-text hover:bg-zenible-dark-bg'
                      : 'text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="font-medium">Settings</span>
                </button>
                <button
                  onClick={() => {
                    setShowProfileDropdown(false);
                    logout();
                  }}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 transition-colors ${
                    darkMode
                      ? 'text-zenible-dark-text hover:bg-zenible-dark-bg'
                      : 'text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
