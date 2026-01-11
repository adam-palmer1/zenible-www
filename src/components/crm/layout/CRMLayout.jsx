import React, { useRef, useEffect } from 'react';
import NewSidebar from '../../sidebar/NewSidebar';

/**
 * CRMLayout - Wrapper component for CRM dashboard
 *
 * Provides:
 * - Sidebar integration
 * - Scroll container with ref for scroll preservation
 * - Consistent layout structure
 *
 * @param {React.ReactNode} header - Header content (tabs, filters, actions)
 * @param {React.ReactNode} children - Main content area
 * @param {number} refreshKey - Key that triggers scroll restoration
 * @param {Object} savedScrollPosition - Ref object for storing scroll position
 */
const CRMLayout = ({ header, children, refreshKey, savedScrollPosition }) => {
  const scrollContainerRef = useRef(null);

  // Restore scroll position after data updates
  useEffect(() => {
    if (savedScrollPosition?.current > 0 && scrollContainerRef.current) {
      // Use a small delay to ensure DOM has updated
      const timeoutId = setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = savedScrollPosition.current;
          savedScrollPosition.current = 0; // Reset after restoring
        }
      }, 50);

      return () => clearTimeout(timeoutId);
    }
  }, [refreshKey, savedScrollPosition]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <NewSidebar />

      {/* Main Content */}
      <div
        className="flex-1 flex flex-col transition-all duration-300"
        style={{ marginLeft: 'var(--sidebar-width, 280px)' }}
      >
        {/* Header Section */}
        {header}

        {/* Content Section with Scroll */}
        <div ref={scrollContainerRef} className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CRMLayout;
