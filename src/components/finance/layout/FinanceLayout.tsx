import React from 'react';
import NewSidebar from '../../sidebar/NewSidebar';

interface FinanceLayoutProps {
  header?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * FinanceLayout - Wrapper component for finance pages
 *
 * Provides:
 * - Sidebar integration
 * - Consistent layout structure with header and content areas
 */
const FinanceLayout: React.FC<FinanceLayoutProps> = ({ header, children }) => {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <NewSidebar />

      {/* Main Content */}
      <div
        className="flex-1 flex flex-col transition-all duration-300"
        style={{ marginLeft: 'var(--sidebar-width, 280px)' }}
      >
        {/* Header Section */}
        {header && (
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            {header}
          </div>
        )}

        {/* Content Section with Scroll */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default FinanceLayout;
