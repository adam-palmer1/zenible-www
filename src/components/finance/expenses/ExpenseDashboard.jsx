import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Upload, Receipt, DollarSign, Tag, AlertCircle } from 'lucide-react';
import { useExpenses } from '../../../contexts/ExpenseContext';
import { useCRMReferenceData } from '../../../contexts/CRMReferenceDataContext';
import { useCompanyAttributes } from '../../../hooks/crm/useCompanyAttributes';
import { applyNumberFormat } from '../../../utils/numberFormatUtils';
import ExpenseList from './ExpenseList';
import NewSidebar from '../../sidebar/NewSidebar';
import CSVImportModal from './CSVImportModal';
import CategoryManagementModal from './CategoryManagementModal';
import KPICard from '../shared/KPICard';

/**
 * Get a display label for the current date filter
 */
const getDateRangeLabel = (startDate, endDate) => {
  if (!startDate && !endDate) return 'All Time';

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Check for common presets
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 29);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  if (startDate === thirtyDaysAgoStr && endDate === todayStr) {
    return 'Last 30 Days';
  }

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  if (startDate === sevenDaysAgoStr && endDate === todayStr) {
    return 'Last 7 Days';
  }

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfMonthStr = startOfMonth.toISOString().split('T')[0];

  if (startDate === startOfMonthStr && endDate === todayStr) {
    return 'This Month';
  }

  if (startDate === todayStr && endDate === todayStr) {
    return 'Today';
  }

  // Custom range
  return 'Selected Period';
};

const ExpenseDashboard = () => {
  const navigate = useNavigate();
  const { expenses, stats, categories, loading, filters } = useExpenses();
  const { numberFormats } = useCRMReferenceData();
  const { getNumberFormat } = useCompanyAttributes();
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Get number format from company settings
  const numberFormat = useMemo(() => {
    const formatId = getNumberFormat();
    if (formatId && numberFormats.length > 0) {
      return numberFormats.find(f => f.id === formatId);
    }
    return null; // Will use default format
  }, [getNumberFormat, numberFormats]);

  // Get stats from API
  const convertedTotal = stats?.converted_total || null;
  const convertedOutstanding = stats?.converted_outstanding || null;
  const totalByCurrency = stats?.total_by_currency || [];
  const outstandingByCurrency = stats?.outstanding_by_currency || [];

  // Format breakdown string from API stats (only show if more than one currency)
  const totalBreakdown = useMemo(() => {
    if (totalByCurrency.length <= 1) return '';
    return totalByCurrency
      .map(({ currency_symbol, total }) => `${currency_symbol}${applyNumberFormat(parseFloat(total), numberFormat)}`)
      .join(' + ');
  }, [totalByCurrency, numberFormat]);

  // Format outstanding breakdown (only show if more than one currency)
  const outstandingBreakdown = useMemo(() => {
    if (outstandingByCurrency.length <= 1) return '';
    return outstandingByCurrency
      .map(({ currency_symbol, total }) => `${currency_symbol}${applyNumberFormat(parseFloat(total), numberFormat)}`)
      .join(' + ');
  }, [outstandingByCurrency, numberFormat]);

  // Get label for the current date filter
  const dateRangeLabel = getDateRangeLabel(filters.start_date, filters.end_date);

  const totalExpenses = stats?.total_count || expenses.length;
  const currencySymbol = convertedTotal?.currency_symbol || '$';
  const isLoading = loading;

  return (
    <div className="flex h-screen bg-[#f8f8f8] dark:bg-gray-900">
      {/* Sidebar */}
      <NewSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col transition-all duration-300" style={{ marginLeft: 'var(--sidebar-width, 280px)' }}>
        {/* Top Bar */}
        <div className="bg-white dark:bg-gray-800 border-b border-[#e5e5e5] dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-[#09090b] dark:text-white">
              Expenses
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowCategoryModal(true)}
                className="inline-flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-[#09090b] dark:text-white bg-white dark:bg-gray-800 border border-[#e5e5e5] dark:border-gray-600 rounded-[10px] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Tag className="h-5 w-5" />
                Manage categories
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-[#09090b] dark:text-white bg-white dark:bg-gray-800 border border-[#e5e5e5] dark:border-gray-600 rounded-[10px] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Upload className="h-5 w-5" />
                Import CSV
              </button>
              <button
                onClick={() => navigate('/finance/expenses/new')}
                className="inline-flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-white bg-[#8e51ff] rounded-[10px] hover:bg-[#7c3aed] transition-colors"
              >
                <Plus className="h-5 w-5" />
                New Expense
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
            <KPICard
              title="Expenses"
              value={isLoading ? '...' : totalExpenses.toString()}
              subtitle={dateRangeLabel}
              icon={Receipt}
              iconColor="blue"
            />
            <KPICard
              title={dateRangeLabel}
              value={isLoading ? '...' : (convertedTotal
                ? `${convertedTotal.currency_symbol}${applyNumberFormat(parseFloat(convertedTotal.total), numberFormat)}`
                : `${currencySymbol}0`)}
              subtitle={!isLoading && totalBreakdown ? totalBreakdown : undefined}
              icon={DollarSign}
              iconColor="purple"
            />
            <KPICard
              title="Outstanding"
              value={isLoading ? '...' : (convertedOutstanding
                ? `${convertedOutstanding.currency_symbol}${applyNumberFormat(parseFloat(convertedOutstanding.total), numberFormat)}`
                : `${currencySymbol}0`)}
              subtitle={!isLoading && outstandingBreakdown ? outstandingBreakdown : undefined}
              icon={AlertCircle}
              iconColor="orange"
            />
            <KPICard
              title="Categories"
              value={isLoading ? '...' : categories.length.toString()}
              icon={Tag}
              iconColor="green"
            />
          </div>

          {/* Expense List */}
          <ExpenseList />
        </div>
      </div>

      {/* CSV Import Modal */}
      <CSVImportModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
      />

      {/* Category Management Modal */}
      <CategoryManagementModal
        open={showCategoryModal}
        onOpenChange={setShowCategoryModal}
      />
    </div>
  );
};

export default ExpenseDashboard;
