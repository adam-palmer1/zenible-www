import React, { useRef, useEffect } from 'react';
import AppLayout from '../../layout/AppLayout';

interface CRMLayoutProps {
  header: React.ReactNode;
  children: React.ReactNode;
  refreshKey: number;
  savedScrollPosition: React.MutableRefObject<number>;
}

/**
 * CRMLayout - Wrapper component for CRM dashboard
 *
 * Provides:
 * - Sidebar integration via AppLayout
 * - Scroll container with ref for scroll preservation
 * - Consistent layout structure
 */
const CRMLayout: React.FC<CRMLayoutProps> = ({ header, children, refreshKey, savedScrollPosition }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Restore scroll position after data updates
  useEffect(() => {
    if (savedScrollPosition?.current > 0 && scrollContainerRef.current) {
      const timeoutId = setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = savedScrollPosition.current;
          savedScrollPosition.current = 0;
        }
      }, 50);

      return () => clearTimeout(timeoutId);
    }
  }, [refreshKey, savedScrollPosition]);

  return (
    <AppLayout header={header} pageTitle="CRM" rawContent>
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6">
        {children}
      </div>
    </AppLayout>
  );
};

export default CRMLayout;
