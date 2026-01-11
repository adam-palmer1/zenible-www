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
    id: 'user-management',
    label: 'User Management',
    path: '/admin/users',
    hasSubmenu: true,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    submenuItems: [
      {
        id: 'users',
        label: 'Users',
        path: '/admin/users',
      },
      {
        id: 'subscriptions',
        label: 'Subscriptions',
        path: '/admin/subscriptions',
      },
      {
        id: 'payments',
        label: 'Payments',
        path: '/admin/payments',
      },
    ],
  },
  {
    id: 'plan-management',
    label: 'Plan Management',
    path: '/admin/plans',
    hasSubmenu: true,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    submenuItems: [
      {
        id: 'plans',
        label: 'Plans',
        path: '/admin/plans',
      },
      {
        id: 'features',
        label: 'Features',
        path: '/admin/features',
      },
    ],
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
    id: 'character-management',
    label: 'Character Management',
    path: '/admin/ai-characters',
    hasSubmenu: true,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    submenuItems: [
      {
        id: 'ai-characters',
        label: 'AI Characters',
        path: '/admin/ai-characters',
      },
      {
        id: 'ai-models',
        label: 'AI Models',
        path: '/admin/ai-models',
      },
      {
        id: 'ai-tools',
        label: 'AI Tools',
        path: '/admin/ai-tools',
      },
      {
        id: 'tips',
        label: 'Tips',
        path: '/admin/tips',
      },
    ],
  },
  {
    id: 'conversation-management',
    label: 'Conversation Management',
    path: '/admin/conversations',
    hasSubmenu: true,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
      </svg>
    ),
    submenuItems: [
      {
        id: 'conversations',
        label: 'Conversations',
        path: '/admin/conversations',
      },
      {
        id: 'threads',
        label: 'Threads',
        path: '/admin/threads',
      },
    ],
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
  {
    id: 'event-management',
    label: 'Event Management',
    path: '/admin/events',
    hasSubmenu: true,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    submenuItems: [
      {
        id: 'events',
        label: 'Events',
        path: '/admin/events',
      },
      {
        id: 'hosts',
        label: 'Hosts',
        path: '/admin/hosts',
      },
    ],
  },
  {
    id: 'quiz-management',
    label: 'Quiz Management',
    path: '/admin/quizzes',
    hasSubmenu: true,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    submenuItems: [
      {
        id: 'quizzes',
        label: 'Quizzes',
        path: '/admin/quizzes',
      },
      {
        id: 'quiz-tags',
        label: 'Quiz Tags',
        path: '/admin/quiz-tags',
      },
    ],
  },
];

export default function AdminSidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
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

  const toggleSubmenu = (itemId) => {
    setExpandedMenus(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Auto-expand submenu if a child item is active
  React.useEffect(() => {
    const newExpandedMenus = {};
    navItems.forEach(item => {
      if (item.hasSubmenu && item.submenuItems) {
        const hasActiveChild = item.submenuItems.some(subItem => isActive(subItem.path));
        if (hasActiveChild) {
          newExpandedMenus[item.id] = true;
        }
      }
    });
    setExpandedMenus(prev => ({ ...prev, ...newExpandedMenus }));
  }, [location.pathname]);

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
          <div className="space-y-2">
            {navItems.map((item) => (
              <div key={item.id}>
                {/* Main Item */}
                <div className="px-4">
                  {item.hasSubmenu ? (
                    <button
                      onClick={() => toggleSubmenu(item.id)}
                      className={`
                        w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors duration-150 text-left group
                        ${isActive(item.path) && !expandedMenus[item.id]
                          ? 'bg-[#F5F3FF] border border-[#8B5CF6] text-[#09090B]'
                          : 'text-[#71717A] hover:bg-[#F9FAFB] hover:text-[#374151]'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 flex-shrink-0">
                          {React.cloneElement(item.icon, {
                            className: 'w-6 h-6 flex-shrink-0',
                            color: isActive(item.path) && !expandedMenus[item.id] ? '#8B5CF6' : '#71717A'
                          })}
                        </span>
                        <span className="text-sm font-medium">
                          {item.label}
                        </span>
                      </div>

                      {expandedMenus[item.id] ? (
                        <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </button>
                  ) : (
                    <Link
                      to={item.path}
                      className={`
                        w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors duration-150 text-left group
                        ${isActive(item.path)
                          ? 'bg-[#F5F3FF] border border-[#8B5CF6] text-[#09090B]'
                          : 'text-[#71717A] hover:bg-[#F9FAFB] hover:text-[#374151]'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 flex-shrink-0">
                          {React.cloneElement(item.icon, {
                            className: 'w-6 h-6 flex-shrink-0',
                            color: isActive(item.path) ? '#8B5CF6' : '#71717A'
                          })}
                        </span>
                        <span className="text-sm font-medium">
                          {item.label}
                        </span>
                      </div>
                    </Link>
                  )}
                </div>

                {/* Submenu Items */}
                {item.hasSubmenu && expandedMenus[item.id] && item.submenuItems && (
                  <div className="mt-2 space-y-2">
                    {item.submenuItems.map((subItem) => (
                      <div key={subItem.id} className="px-4">
                        <Link
                          to={subItem.path}
                          className={`
                            w-full flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors duration-150 text-left
                            ${isActive(subItem.path)
                              ? 'bg-[#F5F3FF] border border-[#8B5CF6] text-[#09090B]'
                              : 'text-[#71717A] hover:bg-[#F9FAFB] hover:text-[#374151]'
                            }
                          `}
                        >
                          <svg
                            className="w-6 h-6 flex-shrink-0"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle
                              cx="12"
                              cy="12"
                              r="3"
                              fill={isActive(subItem.path) ? '#8B5CF6' : '#71717A'}
                            />
                          </svg>
                          <span className="text-sm font-medium">
                            {subItem.label}
                          </span>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
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