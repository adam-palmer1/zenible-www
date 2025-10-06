import React from 'react';
import { useLocation } from 'react-router-dom';
import SidebarHeader from './SidebarHeader';
import SidebarNavItem from './SidebarNavItem';
import SidebarNavItemWithSubmenu from './SidebarNavItemWithSubmenu';
import UserProfileSection from './UserProfileSection';

// Icons
import DashboardIcon from './icons/DashboardIcon';
import BusinessSchoolIcon from './icons/BusinessSchoolIcon';
import ContentCreatorIcon from './icons/ContentCreatorIcon';
import TrainingIcon from './icons/TrainingIcon';
import BoardroomIcon from './icons/BoardroomIcon';
import ProposalWizardIcon from './icons/ProposalWizardIcon';
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
      icon: BusinessSchoolIcon,
      label: 'Business School',
      path: '/business-school',
      hasChevron: true,
      isActive: location.pathname.startsWith('/business-school')
    },
    {
      icon: ContentCreatorIcon,
      label: 'Content Creator',
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
        },
        {
          label: 'Email Outreach',
          path: '/content-creator/email-outreach',
          isActive: location.pathname === '/content-creator/email-outreach'
        }
      ]
    },
    {
      icon: TrainingIcon,
      label: 'Training',
      path: '/training',
      hasChevron: true,
      isActive: location.pathname.startsWith('/training')
    },
    {
      icon: BoardroomIcon,
      label: 'The Boardroom',
      path: '/boardroom',
      isActive: location.pathname.startsWith('/boardroom')
    },
    {
      icon: ProposalWizardIcon,
      label: 'Proposal Wizard',
      path: '/proposal-wizard',
      isActive: location.pathname.startsWith('/proposal-wizard')
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