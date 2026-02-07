import React from 'react';
import NewSidebar from '../../sidebar/NewSidebar';
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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <NewSidebar />

      {/* Main Content */}
      <div
        className="flex-1 flex flex-col transition-all duration-300"
        style={{ marginLeft: 'var(--sidebar-width, 280px)' }}
      >
        {/* Top Bar */}
        <div className="bg-white border-b border-[#e5e5e5] px-4 py-3 flex items-center justify-between min-h-[64px]">
          <h1 className="text-2xl font-semibold text-[#09090b]">Reports</h1>
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
      </div>
    </div>
  );
};

export default ReportsDashboard;
