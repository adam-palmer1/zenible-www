import React from 'react';
import AppLayout from '../../layout/AppLayout';
import TransactionSummaryCards from './TransactionSummaryCards';
import TransactionCharts from './TransactionCharts';
import TransactionFilters from './TransactionFilters';
import TransactionList from './TransactionList';
import ExportButton from './ExportButton';

/**
 * Reports Dashboard
 * Main page for unified financial reporting
 *
 * Structure:
 * - Top Bar (64px height): "Reports" title + Export button
 * - Scrollable Content: KPI cards, Charts, Filters, Transaction table
 */
const ReportsDashboard: React.FC = () => {
  return (
    <AppLayout pageTitle="Reports">
      {/* Top Bar */}
      <div className="bg-white border-b border-[#e5e5e5] px-4 py-3 flex items-center justify-between min-h-[64px]">
        <h1 className="text-xl md:text-2xl font-semibold text-[#09090b]">Reports</h1>
        <ExportButton />
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-6">
          {/* KPI Summary Cards */}
          <TransactionSummaryCards />

          {/* Charts Section */}
          <TransactionCharts />

          {/* Filters */}
          <TransactionFilters />

          {/* Transaction List */}
          <TransactionList />
        </div>
      </div>
    </AppLayout>
  );
};

export default ReportsDashboard;
