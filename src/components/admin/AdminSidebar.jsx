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
    id: 'onboarding-questions',
    label: 'Onboarding Questions',
    path: '/admin/onboarding-questions',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
    id: 'conversations',
    label: 'Conversations',
    path: '/admin/conversations',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
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

export default function AdminSidebar() {
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
    <div className="w-[280px] h-full bg-[#FAFBFC] border-r border-[#E5E7EB] flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#8B5CF6] rounded-lg flex items-center justify-center">
            <img src={brandIcon} alt="" className="w-[19.2px] h-[19.2px]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[#111827] text-sm font-semibold leading-5">
              Zenible
            </span>
            <span className="text-[#6B7280] text-xs leading-4">
              Admin Panel
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 flex flex-col">
        <div className="flex-1">
          <div className="space-y-1">
            {navItems.map((item) => (
              <div key={item.id} className="px-4">
                <Link
                  to={item.path}
                  className={`
                    w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors duration-150 text-left group
                    ${isActive(item.path)
                      ? 'bg-[#F3F0FF] text-[#8B5CF6]'
                      : 'text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#374151]'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 flex-shrink-0">
                      {React.cloneElement(item.icon, {
                        className: 'w-5 h-5 flex-shrink-0',
                        color: isActive(item.path) ? '#8B5CF6' : 'currentColor'
                      })}
                    </span>
                    <span className={`text-sm font-medium ${isActive(item.path) ? 'font-semibold' : ''}`}>
                      {item.label}
                    </span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="pb-4">
          <div className="space-y-1">
            <div className="px-4">
              <Link
                to="/dashboard"
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors duration-150 text-left group text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#374151]"
              >
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 flex-shrink-0"
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
                  <span className="text-sm font-medium">
                    Back to App
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* User Profile Section */}
      <div className="px-4 pb-6 relative" ref={dropdownRef}>
        <button
          onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[#F9FAFB] transition-colors duration-150 group"
        >
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user?.full_name || 'Admin User'}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#8B5CF6] flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">
                    {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'A'}
                  </span>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex flex-col text-left">
              <span className="text-[#111827] text-sm font-semibold leading-5 truncate max-w-[140px]">
                {user?.full_name || 'Admin User'}
              </span>
              <span className="text-[#6B7280] text-xs leading-4 truncate max-w-[140px]">
                Admin
              </span>
            </div>
          </div>

          <svg
            className={`w-4 h-4 flex-shrink-0 text-[#6B7280] transition-transform duration-200 ${
              showProfileDropdown ? 'rotate-90' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {showProfileDropdown && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border border-[#E5E7EB] rounded-lg shadow-lg py-2 z-50 min-w-max">
            <Link
              to="/settings"
              onClick={() => setShowProfileDropdown(false)}
              className="w-full text-left px-4 py-2 text-sm text-[#374151] hover:bg-[#F9FAFB] transition-colors block"
            >
              Settings
            </Link>
            <div className="border-t border-[#E5E7EB] my-1"></div>
            <button
              onClick={() => {
                setShowProfileDropdown(false);
                logout();
              }}
              className="w-full text-left px-4 py-2 text-sm text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}