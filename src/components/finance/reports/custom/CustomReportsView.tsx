import React from 'react';
import { CustomReportsProvider, useCustomReports } from '@/contexts/CustomReportsContext';
import SavedReportsList from './SavedReportsList';
import ReportBuilder from './ReportBuilder';
import ReportResults from './ReportResults';

const CustomReportsContent: React.FC = () => {
  const { mode } = useCustomReports();

  switch (mode) {
    case 'list':
      return <SavedReportsList />;
    case 'build':
      return <ReportBuilder />;
    case 'results':
      return <ReportResults />;
    default:
      return <SavedReportsList />;
  }
};

const CustomReportsView: React.FC = () => {
  return (
    <CustomReportsProvider>
      <CustomReportsContent />
    </CustomReportsProvider>
  );
};

export default CustomReportsView;
