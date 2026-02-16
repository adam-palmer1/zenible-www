import { createContext, useContext, type ReactNode } from 'react';
import { useReportsSummary, type UseReportsSummaryReturn, type ReportsSummaryParams } from '../hooks/finance/useReportsSummary';

const ReportsSummaryContext = createContext<UseReportsSummaryReturn | null>(null);

export const ReportsSummaryProvider = ({ children, filterParams }: { children: ReactNode; filterParams?: ReportsSummaryParams }) => {
  const value = useReportsSummary(filterParams);
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
