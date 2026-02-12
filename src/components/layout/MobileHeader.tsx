import React from 'react';
import { useSidebar } from '../../contexts/SidebarContext';
import brandIcon from '../../assets/icons/brand-icon.svg';

interface MobileHeaderProps {
  title?: string;
}

/**
 * Sticky top bar visible only on mobile (<lg).
 * Contains hamburger menu button + brand icon + optional page title.
 */
const MobileHeader: React.FC<MobileHeaderProps> = ({ title }) => {
  const { openMobile } = useSidebar();

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 bg-white border-b border-[#E5E7EB] px-4 py-3 lg:hidden">
      {/* Hamburger */}
      <button
        onClick={openMobile}
        className="flex items-center justify-center w-11 h-11 rounded-md hover:bg-gray-100 transition-colors"
        aria-label="Open menu"
      >
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Brand icon */}
      <div className="w-7 h-7 rounded-lg bg-[#8B5CF6] flex items-center justify-center p-1">
        <img src={brandIcon} alt="Zenible" className="w-4 h-4" />
      </div>

      {/* Page title */}
      {title && (
        <span className="text-sm font-semibold text-[#111827] truncate">
          {title}
        </span>
      )}
    </header>
  );
};

export default MobileHeader;
