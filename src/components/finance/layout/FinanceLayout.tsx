import React from 'react';
import AppLayout from '../../layout/AppLayout';

interface FinanceLayoutProps {
  header?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * FinanceLayout - Wrapper component for finance pages
 *
 * Provides:
 * - Sidebar integration via AppLayout
 * - Consistent layout structure with header and content areas
 */
const FinanceLayout: React.FC<FinanceLayoutProps> = ({ header, children }) => {
  return (
    <AppLayout header={header} pageTitle="Finance">
      {children}
    </AppLayout>
  );
};

export default FinanceLayout;
