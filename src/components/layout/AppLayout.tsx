import React from 'react';
import Sidebar from '../sidebar/Sidebar';
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
      {/* Skip link — visible only when focused. Lets keyboard users bypass the sidebar. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[1000] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-zenible-primary focus:text-white focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Sidebar (fixed on desktop, drawer on mobile) */}
      <Sidebar />

      {/* Main content area */}
      <div
        className={`min-h-screen-safe h-screen-safe flex flex-col transition-all duration-300 ${className}`}
        style={{ marginLeft: 'var(--sidebar-width, 0px)' }}
      >
        {/* Mobile header (hidden on lg+) */}
        <MobileHeader title={pageTitle} />

        {/* Optional page header */}
        {header && (
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            {header}
          </header>
        )}

        {/* Page content */}
        {rawContent ? (
          <main id="main-content" className="flex-1 min-h-0 flex flex-col">
            {children}
          </main>
        ) : (
          <main id="main-content" className="flex-1 overflow-auto">
            {children}
          </main>
        )}
      </div>
    </div>
  );
};

export default AppLayout;
