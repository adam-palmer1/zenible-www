import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit, Trash2, Download, Search, Filter, History, Repeat } from 'lucide-react';
import { useExpenses } from '../../../contexts/ExpenseContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { formatCurrency } from '../../../utils/currency';
import expensesAPI from '../../../services/api/finance/expenses';
import ExpenseHistoryModal from './ExpenseHistoryModal';
import BulkActionBar from './BulkActionBar';
import BulkUpdateModal from './BulkUpdateModal';

const ExpenseList = () => {
  const navigate = useNavigate();
  const {
    expenses,
    loading,
    categories,
    filters,
    pagination,
    sortBy,
    sortOrder,
    selectedExpenseIds,
    bulkActionLoading,
    updateFilters,
    updateSort,
    setPagination,
    deleteExpense,
    bulkDeleteExpenses,
    bulkUpdateExpenses,
    toggleExpenseSelection,
    selectAllExpenses,
    clearSelection,
  } = useExpenses();
  const { showSuccess, showError, showConfirm } = useNotification();

  const [showHistory, setShowHistory] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState(null);
  const [selectedExpenseName, setSelectedExpenseName] = useState('');
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleViewHistory = (expense) => {
    setSelectedExpenseId(expense.id);
    setSelectedExpenseName(expense.description || `Expense #${expense.expense_number}`);
    setShowHistory(true);
  };

  const handleSelectAll = () => {
    if (selectedExpenseIds.length === expenses.length) {
      clearSelection();
    } else {
      selectAllExpenses();
    }
  };

  const handleBulkDelete = async () => {
    const confirmed = await showConfirm(
      'Delete Expenses',
      `Are you sure you want to delete ${selectedExpenseIds.length} expense${selectedExpenseIds.length > 1 ? 's' : ''}?`
    );
    if (confirmed) {
      try {
        await bulkDeleteExpenses(selectedExpenseIds);
        clearSelection();
        showSuccess(`${selectedExpenseIds.length} expense${selectedExpenseIds.length > 1 ? 's' : ''} deleted successfully`);
      } catch (error) {
        showError(error.message || 'Failed to delete expenses');
      }
    }
  };

  const handleBulkUpdateCategory = () => {
    setShowBulkUpdateModal(true);
  };

  const handleBulkUpdateConfirm = async (updates) => {
    try {
      await bulkUpdateExpenses(selectedExpenseIds, updates);
      showSuccess(`${selectedExpenseIds.length} expense${selectedExpenseIds.length > 1 ? 's' : ''} updated successfully`);
      setShowBulkUpdateModal(false);
    } catch (error) {
      showError(error.message || 'Failed to update expenses');
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);

      // Build export params with current filters
      const exportParams = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          exportParams[key] = value;
        }
      });

      // Call API to get CSV blob
      const blob = await expensesAPI.exportCSV(exportParams);

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0];
      link.download = `expenses_${date}.csv`;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup
      URL.revokeObjectURL(url);

      showSuccess('Expenses exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      showError(error.message || 'Failed to export expenses');
    } finally {
      setExporting(false);
    }
  };

  const handleSort = (field) => {
    const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    updateSort(field, newOrder);
  };

  const handleSearch = (e) => {
    updateFilters({ search: e.target.value });
  };

  const handleCategoryFilter = (categoryId) => {
    updateFilters({ category_id: categoryId || null });
  };

  const handleDelete = async (expense) => {
    const confirmed = await showConfirm('Delete Expense', `Are you sure you want to delete this expense?`);
    if (confirmed) {
      try {
        await deleteExpense(expense.id);
        showSuccess('Expense deleted successfully');
      } catch (error) {
        showError(error.message || 'Failed to delete expense');
      }
    }
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="space-y-4">
      <div className="design-bg-primary rounded-lg shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 design-text-secondary" />
            <input type="text" value={filters.search || ''} onChange={handleSearch} placeholder="Search expenses..." className="w-full pl-10 pr-3 py-2 design-input rounded-md" />
          </div>
          <div className="w-full md:w-48">
            <select value={filters.category_id || ''} onChange={(e) => handleCategoryFilter(e.target.value)} className="w-full px-3 py-2 design-input rounded-md">
              <option value="">All Categories</option>
              {(categories || []).map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={exporting || expenses.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      <div className="design-bg-primary rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y design-divide">
            <thead className="design-bg-secondary">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={expenses.length > 0 && selectedExpenseIds.length === expenses.length}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                </th>
                <th onClick={() => handleSort('expense_date')} className="px-6 py-3 text-left text-xs font-medium design-text-secondary uppercase tracking-wider cursor-pointer hover:design-text-primary">
                  Date <SortIcon field="expense_date" />
                </th>
                <th onClick={() => handleSort('description')} className="px-6 py-3 text-left text-xs font-medium design-text-secondary uppercase tracking-wider cursor-pointer hover:design-text-primary">
                  Description <SortIcon field="description" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium design-text-secondary uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium design-text-secondary uppercase tracking-wider">
                  Vendor
                </th>
                <th onClick={() => handleSort('amount')} className="px-6 py-3 text-left text-xs font-medium design-text-secondary uppercase tracking-wider cursor-pointer hover:design-text-primary">
                  Amount <SortIcon field="amount" />
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium design-text-secondary uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="design-bg-primary divide-y design-divide">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-zenible-primary"></div>
                    <p className="mt-2 text-sm design-text-secondary">Loading expenses...</p>
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <p className="text-sm design-text-secondary">No expenses found</p>
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="hover:design-bg-secondary transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedExpenseIds.includes(expense.id)}
                        onChange={() => toggleExpenseSelection(expense.id)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm design-text-primary">
                        {new Date(expense.expense_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="text-sm design-text-primary">{expense.description || 'N/A'}</div>
                        {(expense.pricing_type === 'fixed' && expense.recurring_type) && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                            <Repeat className="h-3 w-3 mr-1" />
                            Recurring
                          </span>
                        )}
                        {expense.recurring_status && expense.recurring_status !== 'active' && (
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            expense.recurring_status === 'paused'
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                          }`}>
                            {expense.recurring_status}
                          </span>
                        )}
                      </div>
                      {expense.reference_number && (
                        <div className="text-xs design-text-secondary">Ref: {expense.reference_number}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm design-text-primary">{expense.expense_category?.name || 'Uncategorized'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm design-text-primary">
                        {expense.vendor?.business_name ||
                         (expense.vendor?.first_name && expense.vendor?.last_name
                           ? `${expense.vendor.first_name} ${expense.vendor.last_name}`
                           : 'N/A')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium design-text-primary">
                        {formatCurrency(expense.amount, expense.currency?.code || 'USD')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleViewHistory(expense)} className="design-text-secondary hover:design-text-primary" title="View History">
                          <History className="h-4 w-4" />
                        </button>
                        <button onClick={() => navigate(`/finance/expenses/${expense.id}/edit`)} className="design-text-secondary hover:design-text-primary" title="Edit">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(expense)} className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.total > 0 && (
          <div className="design-bg-secondary px-6 py-4 flex items-center justify-between border-t design-border">
            <div className="text-sm design-text-secondary">
              Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} expenses
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })} disabled={pagination.page === 1} className="px-3 py-1 text-sm design-text-primary design-bg-tertiary rounded-md hover:design-bg-quaternary disabled:opacity-50">
                Previous
              </button>
              <button onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })} disabled={pagination.page * pagination.limit >= pagination.total} className="px-3 py-1 text-sm design-text-primary design-bg-tertiary rounded-md hover:design-bg-quaternary disabled:opacity-50">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <ExpenseHistoryModal
        open={showHistory}
        onOpenChange={setShowHistory}
        expenseId={selectedExpenseId}
        expenseName={selectedExpenseName}
      />

      <BulkActionBar
        selectedCount={selectedExpenseIds.length}
        onBulkDelete={handleBulkDelete}
        onBulkUpdateCategory={handleBulkUpdateCategory}
        onClearSelection={clearSelection}
        loading={bulkActionLoading}
      />

      <BulkUpdateModal
        open={showBulkUpdateModal}
        onOpenChange={setShowBulkUpdateModal}
        selectedCount={selectedExpenseIds.length}
        categories={categories}
        onConfirm={handleBulkUpdateConfirm}
        loading={bulkActionLoading}
      />
    </div>
  );
};

export default ExpenseList;
