import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReceiptRefundIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useExpenses } from '../../../contexts/ExpenseContext';
import { formatCurrency } from '../../../utils/currency';

/**
 * Recent Expenses Widget for Dashboard
 * Shows the most recent expenses
 *
 * Settings:
 * - limit: Number of expenses to display (default: 5)
 */
const RecentExpensesWidget = ({ settings = {} }) => {
  const navigate = useNavigate();
  const { expenses, categories, loading, initialized, fetchExpenses } = useExpenses();
  const limit = settings.limit || 5;

  useEffect(() => {
    if (!initialized) {
      fetchExpenses();
    }
  }, [initialized, fetchExpenses]);

  // Get recent expenses
  const recentExpenses = expenses.slice(0, limit);

  // Get category by ID
  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Uncategorized';
  };

  const getCategoryColor = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.color || '#6b7280';
  };

  const handleViewAll = () => navigate('/finance/expenses');
  const handleExpenseClick = (id) => navigate(`/finance/expenses?expense=${id}`);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading && !initialized) {
    return (
      <div className="flex items-center justify-center h-[180px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8e51ff]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[180px]">
      {recentExpenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <ReceiptRefundIcon className="w-12 h-12 text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No expenses recorded</p>
          <button
            onClick={handleViewAll}
            className="mt-2 text-xs text-[#8e51ff] hover:text-[#7b3ff0]"
          >
            Add your first expense
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-2 flex-1 overflow-y-auto">
            {recentExpenses.map((expense) => (
              <button
                key={expense.id}
                onClick={() => handleExpenseClick(expense.id)}
                className="w-full text-left p-3 rounded-lg border border-gray-100 hover:border-[#8e51ff] hover:bg-purple-50/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getCategoryColor(expense.category_id) }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {expense.description || 'No description'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getCategoryName(expense.category_id)} • {formatDate(expense.expense_date)}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 ml-2">
                    {formatCurrency(expense.amount || 0, expense.currency || 'USD')}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100">
            <button
              onClick={handleViewAll}
              className="w-full text-sm text-[#8e51ff] hover:text-[#7b3ff0] font-medium flex items-center justify-center gap-1"
            >
              View all expenses
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default RecentExpensesWidget;
