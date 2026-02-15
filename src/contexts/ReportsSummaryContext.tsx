import { createContext, useContext, type ReactNode } from 'react';
import { useReportsSummary, type UseReportsSummaryReturn } from '../hooks/finance/useReportsSummary';

const ReportsSummaryContext = createContext<UseReportsSummaryReturn | null>(null);

export const ReportsSummaryProvider = ({ children }: { children: ReactNode }) => {
  const value = useReportsSummary();
  return (
    <ReportsSummaryContext.Provider value={value}>
      {children}
    </ReportsSummaryContext.Provider>
  );
};

export const useReportsSummaryContext = () => {
  const context = useContext(ReportsSummaryContext);
  if (!context) {
    throw new Error('useReportsSummaryContext must be used within a ReportsSummaryProvider');
  }
  return context;
};
