import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import brandIcon from '../../assets/icons/brand-icon.svg';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/admin',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: 'users',
    label: 'Users',
    path: '/admin/users',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    id: 'plans',
    label: 'Plans',
    path: '/admin/plans',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    id: 'features',
    label: 'Features',
    path: '/admin/features',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
  },
  {
    id: 'subscriptions',
    label: 'Subscriptions',
    path: '/admin/subscriptions',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    id: 'payments',
    label: 'Payments',
    path: '/admin/payments',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'ai-characters',
    label: 'AI Characters',
    path: '/admin/ai-characters',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'ai-models',
    label: 'AI Models',
    path: '/admin/ai-models',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    ),
  },
  {
    id: 'threads',
    label: 'Threads',
    path: '/admin/threads',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    id: 'audit',
    label: 'Audit Logs',
    path: '/admin/audit-logs',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

export default function AdminSidebar({ darkMode, toggleDarkMode }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const isActive = (path) => {
    if (path === '/admin' && location.pathname === '/admin') {
      return true;
    }
    if (path !== '/admin' && location.pathname.startsWith(path)) {
      return true;
    }
    return false;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      className={`relative h-full w-[280px] flex flex-col border-r ${
        darkMode
          ? 'bg-zenible-dark-sidebar border-zenible-dark-border'
          : 'bg-white border-neutral-200'
      }`}
    >
      {/* Brand Logo Section */}
      <div
        className={`relative shrink-0 w-full border-b ${
          darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'
        }`}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex gap-3 items-center">
            <div className="bg-zenible-primary flex items-center justify-center p-[6px] rounded-lg size-8">
              <img src={brandIcon} alt="" className="w-[19.2px] h-[19.2px]" />
            </div>
            <div className="flex flex-col">
              <p
                className={`font-inter font-semibold text-sm leading-[22px] ${
                  darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
                }`}
              >
                Zenible Admin
              </p>
              <p
                className={`font-inter font-normal text-[10px] leading-[14px] ${
                  darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'
                }`}
              >
                Administration Panel
              </p>
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
                <path
                  fillRule="evenodd"
                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                  clipRule="evenodd"
                />
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
          <p
            className={`font-inter font-medium text-xs leading-5 mb-2 ${
              darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
            }`}
          >
            Admin Menu
          </p>
          <div className="flex flex-col">
            {navItems.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors ${
                  isActive(item.path)
                    ? darkMode
                      ? 'bg-zenible-dark-tab-bg border border-zenible-primary'
                      : 'bg-zenible-tab-bg border border-zenible-primary'
                    : darkMode
                    ? 'hover:bg-zenible-dark-card'
                    : 'hover:bg-gray-50'
                }`}
              >
                <span
                  className={`${
                    isActive(item.path)
                      ? 'text-zenible-primary'
                      : darkMode
                      ? 'text-zenible-dark-text-secondary'
                      : 'text-zinc-500'
                  }`}
                >
                  {item.icon}
                </span>
                <span
                  className={`font-inter font-medium text-base ${
                    isActive(item.path)
                      ? darkMode
                        ? 'text-zenible-dark-text'
                        : 'text-zinc-950'
                      : darkMode
                      ? 'text-zenible-dark-text-secondary'
                      : 'text-zinc-500'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className={`mx-4 h-px ${darkMode ? 'bg-zenible-dark-border' : 'bg-zenible-stroke'}`} />
        <div className="p-4">
          <p
            className={`font-inter font-medium text-xs leading-5 mb-2 ${
              darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
            }`}
          >
            Quick Actions
          </p>
          <div className="flex flex-col">
            <Link
              to="/"
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors ${
                darkMode ? 'hover:bg-zenible-dark-card' : 'hover:bg-gray-50'
              }`}
            >
              <svg
                className={`w-6 h-6 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span
                className={`font-inter font-medium text-base ${
                  darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'
                }`}
              >
                Back to App
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div
        className={`border-t p-4 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}
      >
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-zenible-dark-card' : 'hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold">
                {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'A'}
              </div>
              <div className="flex flex-col text-left">
                <p
                  className={`font-inter font-medium text-base leading-6 ${
                    darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
                  }`}
                >
                  {user?.full_name || 'Admin User'}
                </p>
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
                <Link
                  to="/admin/settings"
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
                </Link>
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