import React from 'react';
import NewSidebar from '../sidebar/NewSidebar';
import MobileHeader from './MobileHeader';

interface AppLayoutProps {
  /** Optional header element rendered between mobile header and content */
  header?: React.ReactNode;
  children: React.ReactNode;
  /** Page title shown in MobileHeader */
  pageTitle?: string;
  /** Extra className on the main content wrapper */
  className?: string;
  /** If true, no overflow handling on inner content (caller manages scroll) */
  rawContent?: boolean;
}

/**
 * Shared page layout that handles sidebar + responsive margins.
 *
 * Desktop (lg+): fixed sidebar with margin-left on content.
 * Mobile (<lg): full-width content with sticky MobileHeader + drawer sidebar.
 */
const AppLayout: React.FC<AppLayoutProps> = ({
  header,
  children,
  pageTitle,
  className = '',
  rawContent = false,
}) => {
  return (
    <div className="min-h-screen-safe bg-gray-50 dark:bg-gray-900">
      {/* Sidebar (fixed on desktop, drawer on mobile) */}
      <NewSidebar />

      {/* Main content area */}
      <div
        className={`min-h-screen-safe flex flex-col transition-all duration-300 ${className}`}
        style={{ marginLeft: 'var(--sidebar-width, 0px)' }}
      >
        {/* Mobile header (hidden on lg+) */}
        <MobileHeader title={pageTitle} />

        {/* Optional page header */}
        {header && (
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            {header}
          </div>
        )}

        {/* Page content */}
        {rawContent ? (
          children
        ) : (
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppLayout;
