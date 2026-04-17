import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import SidebarHeader from './SidebarHeader';
import SidebarNavItem from './SidebarNavItem';
import SidebarNavItemWithSubmenu from './SidebarNavItemWithSubmenu';
import UserProfileSection from './UserProfileSection';
import { useSidebar } from '../../contexts/SidebarContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

// Icons
import DashboardIcon from './icons/DashboardIcon';
import ContactsIcon from './icons/ContactsIcon';
import CalendarIcon from './icons/CalendarIcon';
import FinanceIcon from './icons/FinanceIcon';
import BoardroomIcon from './icons/BoardroomIcon';
import MeetingIntelligenceIcon from './icons/MeetingIntelligenceIcon';
import ProposalsIcon from './icons/ProposalsIcon';

interface SubmenuItem {
  label: string;
  path: string;
  isActive: boolean;
}

interface NavItem {
  icon: React.ComponentType<{ className?: string; color?: string }>;
  label: string;
  path: string;
  isActive: boolean;
  hasSubmenu?: boolean;
  hasChevron?: boolean;
  submenuItems?: SubmenuItem[];
  onClick?: () => void;
}

export default function Sidebar() {
  const location = useLocation();
  const { isCollapsed, toggleCollapse, isMobile, isMobileOpen, closeMobile } = useSidebar();
  const [isHovered, setIsHovered] = useState(false);

  // Lock body scroll when mobile drawer is open
  useBodyScrollLock(isMobile && isMobileOpen);

  const mainNavItems: NavItem[] = [
    {
      icon: DashboardIcon,
      label: 'Dashboard',
      path: '/dashboard',
      isActive: location.pathname === '/dashboard'
    },
    {
      icon: ContactsIcon,
      label: 'CRM',
      path: '/crm',
      hasSubmenu: true,
      isActive: location.pathname.startsWith('/crm') && !location.pathname.startsWith('/crm/meetings'),
      submenuItems: [
        {
          label: 'Contacts',
          path: '/crm',
          isActive: location.pathname === '/crm'
        },
        {
          label: 'Services',
          path: '/crm/services',
          isActive: location.pathname.startsWith('/crm/services')
        },
        {
          label: 'Projects',
          path: '/crm/projects',
          isActive: location.pathname.startsWith('/crm/projects')
        },
      ]
    },
    {
      icon: MeetingIntelligenceIcon,
      label: 'Meeting Intelligence',
      path: '/crm/meetings',
      isActive: location.pathname.startsWith('/crm/meetings')
    },
    {
      icon: CalendarIcon,
      label: 'Calendar',
      path: '/calendar',
      isActive: location.pathname.startsWith('/calendar')
    },
    {
      icon: FinanceIcon,
      label: 'Finance',
      path: '/finance',
      hasSubmenu: true,
      isActive: location.pathname.startsWith('/finance') && !location.pathname.startsWith('/finance/clients'),
      submenuItems: [
        {
          label: 'Invoices',
          path: '/finance/invoices',
          isActive: location.pathname.startsWith('/finance/invoices')
        },
        {
          label: 'Quotes',
          path: '/finance/quotes',
          isActive: location.pathname.startsWith('/finance/quotes')
        },
        {
          label: 'Credit Notes',
          path: '/finance/credit-notes',
          isActive: location.pathname.startsWith('/finance/credit-notes')
        },
        {
          label: 'Expenses',
          path: '/finance/expenses',
          isActive: location.pathname.startsWith('/finance/expenses')
        },
        {
          label: 'Payments',
          path: '/finance/payments',
          isActive: location.pathname.startsWith('/finance/payments')
        },
        {
          label: 'Reports',
          path: '/finance/reports',
          isActive: location.pathname.startsWith('/finance/reports')
        }
      ]
    },
    {
      icon: BoardroomIcon,
      label: 'The Boardroom',
      path: '/boardroom',
      isActive: location.pathname.startsWith('/boardroom')
    },
    {
      icon: ProposalsIcon,
      label: 'Profile & Outreach',
      path: '/content-creator',
      hasSubmenu: true,
      isActive: location.pathname.startsWith('/content-creator') || location.pathname.startsWith('/profile-positioning') || location.pathname.startsWith('/proposal-wizard'),
      submenuItems: [
        {
          label: 'Profile Analyzer',
          path: '/profile-positioning/profile-analyzer',
          isActive: location.pathname === '/profile-positioning/profile-analyzer'
        },
        {
          label: 'Headline Analyzer',
          path: '/profile-positioning/headline-analyzer',
          isActive: location.pathname === '/profile-positioning/headline-analyzer'
        },
        {
          label: 'Proposal Wizard',
          path: '/proposal-wizard',
          isActive: location.pathname.startsWith('/proposal-wizard')
        },
        {
          label: 'Viral Content',
          path: '/content-creator/viral-post-generator',
          isActive: location.pathname === '/content-creator/viral-post-generator'
        },
        {
          label: 'Hook Generator',
          path: '/content-creator/hook-generator',
          isActive: location.pathname === '/content-creator/hook-generator'
        }
      ]
    },
  ];

  const sidebarContent = (
    <div
      className={`flex flex-col h-full bg-white border-r border-[#E5E7EB] ${
        isMobile ? 'w-[280px]' : isCollapsed ? 'w-16' : 'w-[280px]'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <SidebarHeader
        isCollapsed={!isMobile && isCollapsed}
        onToggle={isMobile ? closeMobile : toggleCollapse}
        isMobile={isMobile}
      />

      {/* Navigation - Scrollable */}
      <nav className="flex-1 pt-2 pb-3 relative overflow-hidden">
        <div
          className="h-full overflow-y-auto"
          style={!isMobile ? {
            width: isHovered ? '100%' : 'calc(100% + 17px)',
            paddingRight: isHovered ? '0' : '17px',
            transition: 'width 0.2s ease, padding-right 0.2s ease'
          } : undefined}
        >
          <div className="space-y-2">
            {mainNavItems.map((item, index) => (
              item.hasSubmenu ? (
                <SidebarNavItemWithSubmenu
                  key={index}
                  icon={item.icon}
                  label={item.label}
                  path={item.path}
                  isActive={item.isActive}
                  submenuItems={item.submenuItems}
                  onClick={item.onClick}
                  isCollapsed={!isMobile && isCollapsed}
                />
              ) : (
                <SidebarNavItem
                  key={index}
                  icon={item.icon}
                  label={item.label}
                  path={item.path}
                  isActive={item.isActive}
                  hasChevron={item.hasChevron}
                  onClick={item.onClick}
                  isCollapsed={!isMobile && isCollapsed}
                />
              )
            ))}
          </div>
        </div>
      </nav>

      {/* User Profile Section */}
      <UserProfileSection isCollapsed={false} />
    </div>
  );

  // Mobile: render as drawer with backdrop
  if (isMobile) {
    if (!isMobileOpen) return null;

    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={closeMobile}
          aria-hidden="true"
        />
        {/* Drawer */}
        <div className="fixed left-0 top-0 h-full z-50 animate-slide-in-left">
          {sidebarContent}
        </div>
      </>
    );
  }

  // Desktop: fixed sidebar
  return (
    <div
      className={`sidebar-container fixed left-0 top-0 h-screen bg-white border-r border-[#E5E7EB] flex flex-col transition-all duration-300 ease-in-out z-40 ${
        isCollapsed ? 'w-16' : 'w-[280px]'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <SidebarHeader isCollapsed={isCollapsed} onToggle={toggleCollapse} isMobile={false} />

      {/* Navigation - Scrollable */}
      <nav className="flex-1 pt-2 pb-3 relative overflow-hidden">
        <div
          className="h-full overflow-y-auto"
          style={{
            width: isHovered ? '100%' : 'calc(100% + 17px)',
            paddingRight: isHovered ? '0' : '17px',
            transition: 'width 0.2s ease, padding-right 0.2s ease'
          }}
        >
          <div className="space-y-2">
            {mainNavItems.map((item, index) => (
              item.hasSubmenu ? (
                <SidebarNavItemWithSubmenu
                  key={index}
                  icon={item.icon}
                  label={item.label}
                  path={item.path}
                  isActive={item.isActive}
                  submenuItems={item.submenuItems}
                  onClick={item.onClick}
                  isCollapsed={isCollapsed}
                />
              ) : (
                <SidebarNavItem
                  key={index}
                  icon={item.icon}
                  label={item.label}
                  path={item.path}
                  isActive={item.isActive}
                  hasChevron={item.hasChevron}
                  onClick={item.onClick}
                  isCollapsed={isCollapsed}
                />
              )
            ))}
          </div>
        </div>
      </nav>

      {/* User Profile Section */}
      <UserProfileSection isCollapsed={isCollapsed} />
    </div>
  );
}
