import React from 'react';
import AppLayout from '../../layout/AppLayout';
import TransactionSummaryCards from './TransactionSummaryCards';
import TransactionCharts from './TransactionCharts';
import { ReportsSummaryProvider } from '../../../contexts/ReportsSummaryContext';
import CustomReportsView from './custom/CustomReportsView';

/**
 * Reports Dashboard
 * Consolidated page: KPI cards + charts at top, Custom Reports below
 */
const ReportsDashboard: React.FC = () => {
  return (
    <AppLayout pageTitle="Reports">
      {/* Top Bar */}
      <div className="bg-white border-b border-[#e5e5e5] px-4 py-3 flex items-center justify-between min-h-[64px]">
        <h1 className="text-xl md:text-2xl font-semibold text-[#09090b]">Reports</h1>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-auto">
        {/* Summary section (KPI cards + charts) */}
        <ReportsSummaryProvider>
          <div className="p-4 space-y-6">
            <TransactionSummaryCards />
            <TransactionCharts />
          </div>
        </ReportsSummaryProvider>

        {/* Custom Reports (has its own provider internally) */}
        <CustomReportsView />
      </div>
    </AppLayout>
  );
};

export default ReportsDashboard;
