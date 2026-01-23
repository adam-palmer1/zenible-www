import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import SidebarHeader from './SidebarHeader';
import SidebarNavItem from './SidebarNavItem';
import SidebarNavItemWithSubmenu from './SidebarNavItemWithSubmenu';
import UserProfileSection from './UserProfileSection';

// Icons
import DashboardIcon from './icons/DashboardIcon';
import CRMIcon from './icons/CRMIcon';
import ContactsIcon from './icons/ContactsIcon';
import CalendarIcon from './icons/CalendarIcon';
import FinanceIcon from './icons/FinanceIcon';
import FreelancerAcademyIcon from './icons/FreelancerAcademyIcon';
import ProfilePositioningIcon from './icons/ProfilePositioningIcon';
import ContentOutreachIcon from './icons/ContentOutreachIcon';
import BoardroomIcon from './icons/BoardroomIcon';
import ProposalWizardIcon from './icons/ProposalWizardIcon';
import ProposalsIcon from './icons/ProposalsIcon';
import SettingsIcon from './icons/SettingsIcon';

export default function NewSidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Update CSS custom property for main content margin
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-width',
      isCollapsed ? '64px' : '280px'
    );
  }, [isCollapsed]);

  const mainNavItems = [
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
      isActive: location.pathname.startsWith('/crm')
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
      icon: ProfilePositioningIcon,
      label: 'Profile & Positioning',
      path: '/profile-positioning',
      hasSubmenu: true,
      isActive: location.pathname.startsWith('/profile-positioning'),
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
      icon: ContentOutreachIcon,
      label: 'Content & Outreach',
      path: '/content-creator',
      hasSubmenu: true,
      isActive: location.pathname.startsWith('/content-creator'),
      submenuItems: [
        {
          label: 'Viral Post Generator',
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
    {
      icon: ProposalsIcon,
      label: 'Proposals',
      path: '/proposals',
      hasSubmenu: true,
      isActive: location.pathname.startsWith('/proposals') || location.pathname.startsWith('/proposal-wizard'),
      submenuItems: [
        {
          label: 'Proposal Wizard',
          path: '/proposal-wizard',
          isActive: location.pathname.startsWith('/proposal-wizard')
        },
        {
          label: 'Winning Templates',
          path: '/proposals/winning-templates',
          isActive: location.pathname === '/proposals/winning-templates'
        }
      ]
    },
    {
      icon: FreelancerAcademyIcon,
      label: 'Training',
      path: '/freelancer-academy',
      hasSubmenu: true,
      isActive: location.pathname.startsWith('/freelancer-academy'),
      submenuItems: [
        {
          label: 'Quizzes',
          path: '/freelancer-academy/quizzes',
          isActive: location.pathname === '/freelancer-academy/quizzes'
        },
        {
          label: 'Live Q&A',
          path: '/freelancer-academy/live-qa',
          isActive: location.pathname === '/freelancer-academy/live-qa'
        },
        {
          label: 'The Library',
          path: '/freelancer-academy/the-library',
          isActive: location.pathname === '/freelancer-academy/the-library'
        }
      ]
    },
    {
      icon: SettingsIcon,
      label: 'Settings',
      path: '/settings',
      isActive: location.pathname.startsWith('/settings')
    }
  ];

  return (
    <div
      className={`sidebar-container fixed left-0 top-0 h-screen bg-white border-r border-[#E5E7EB] flex flex-col transition-all duration-300 ease-in-out z-40 ${
        isCollapsed ? 'w-16' : 'w-[280px]'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <SidebarHeader isCollapsed={isCollapsed} onToggle={toggleSidebar} />

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
      <UserProfileSection />
    </div>
  );
}