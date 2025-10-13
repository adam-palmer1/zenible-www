import React from 'react';
import { useLocation } from 'react-router-dom';
import SidebarHeader from './SidebarHeader';
import SidebarNavItem from './SidebarNavItem';
import SidebarNavItemWithSubmenu from './SidebarNavItemWithSubmenu';
import UserProfileSection from './UserProfileSection';

// Icons
import DashboardIcon from './icons/DashboardIcon';
import FreelancerAcademyIcon from './icons/FreelancerAcademyIcon';
import ProfilePositioningIcon from './icons/ProfilePositioningIcon';
import ContentOutreachIcon from './icons/ContentOutreachIcon';
import BoardroomIcon from './icons/BoardroomIcon';
import ProposalWizardIcon from './icons/ProposalWizardIcon';
import ProposalsIcon from './icons/ProposalsIcon';
import SupportIcon from './icons/SupportIcon';
import UpgradeIcon from './icons/UpgradeIcon';

export default function NewSidebar() {
  const location = useLocation();

  const mainNavItems = [
    {
      icon: DashboardIcon,
      label: 'Dashboard',
      path: '/dashboard',
      isActive: location.pathname === '/dashboard'
    },
    {
      icon: FreelancerAcademyIcon,
      label: 'Freelancer Academy',
      path: '/freelancer-academy',
      hasSubmenu: true,
      isActive: location.pathname.startsWith('/freelancer-academy'),
      submenuItems: [
        {
          label: 'Foundations',
          path: '/freelancer-academy/foundations',
          isActive: location.pathname === '/freelancer-academy/foundations'
        },
        {
          label: 'Growth',
          path: '/freelancer-academy/growth',
          isActive: location.pathname === '/freelancer-academy/growth'
        },
        {
          label: 'Advanced',
          path: '/freelancer-academy/advanced',
          isActive: location.pathname === '/freelancer-academy/advanced'
        },
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
          label: 'Headline & Bio Optimizer',
          path: '/profile-positioning/headline-bio-optimizer',
          isActive: location.pathname === '/profile-positioning/headline-bio-optimizer'
        }
      ]
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
      icon: BoardroomIcon,
      label: 'The Boardroom',
      path: '/boardroom',
      isActive: location.pathname.startsWith('/boardroom')
    }
  ];

  const bottomNavItems = [
    {
      icon: SupportIcon,
      label: 'Support',
      onClick: () => {
        // Handle support - could open a modal or external link
        window.open('mailto:support@zenible.com', '_blank');
      }
    },
    {
      icon: UpgradeIcon,
      label: 'Upgrade plan',
      path: '/pricing'
    }
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-[280px] bg-white border-r border-[#E5E7EB] flex flex-col">
      {/* Header */}
      <SidebarHeader />

      {/* Main Navigation */}
      <nav className="flex-1 flex flex-col">
        <div className="flex-1 pt-2 pb-3">
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
                />
              )
            ))}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="border-t border-[#E5E7EB] bg-white py-4">
          <div className="space-y-2">
            {bottomNavItems.map((item, index) => (
              <SidebarNavItem
                key={`bottom-${index}`}
                icon={item.icon}
                label={item.label}
                path={item.path}
                onClick={item.onClick}
              />
            ))}
          </div>
        </div>
      </nav>

      {/* User Profile Section */}
      <UserProfileSection />
    </div>
  );
}