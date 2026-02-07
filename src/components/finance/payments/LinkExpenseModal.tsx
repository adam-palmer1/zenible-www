import React, { useState, useEffect } from 'react';
import { X, Link2, Loader2, Search, Receipt, AlertCircle } from 'lucide-react';
import { useNotification } from '../../../contexts/NotificationContext';
import { usePayments } from '../../../contexts/PaymentsContext';
import { formatCurrency } from '../../../utils/currency';
import { formatDate } from '../../../utils/dateUtils';
import expensesAPI from '../../../services/api/finance/expenses';

interface LinkExpenseModalProps {
  isOpen: boolean;
  onClose: (linked?: boolean) => void;
  payment: any;
}

const LinkExpenseModal: React.FC<LinkExpenseModalProps> = ({ isOpen, onClose, payment }) => {
  const { showSuccess, showError } = useNotification() as any;
  const { refresh } = usePayments() as any;

  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);

  // Fetch expenses when modal opens
  useEffect(() => {
    if (isOpen && payment) {
      fetchExpenses();
    }
  }, [isOpen, payment]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setExpenses([]);
      setSearchQuery('');
      setSelectedExpenseId(null);
    }
  }, [isOpen]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      // Fetch expenses without a payment_id (unlinked)
      const response = await (expensesAPI as any).list({
        per_page: 100,
        payment_id: 'null', // Fetch only unlinked expenses
      });

      const items = response.items || response.data || response;
      setExpenses(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      // If the filter doesn't work, try fetching all and filter client-side
      try {
        const response = await (expensesAPI as any).list({ per_page: 100 });
        const items = response.items || response.data || response;
        // Filter out expenses that already have a payment_id
        const unlinked = (Array.isArray(items) ? items : []).filter(
          (exp: any) => !exp.payment_id
        );
        setExpenses(unlinked);
      } catch (fallbackErr) {
        showError('Failed to load expenses');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !payment) return null;

  const getCurrencyCode = () => {
    return payment.currency?.code || payment.currency_code || 'USD';
  };

  const handleLink = async () => {
    if (!selectedExpenseId) {
      showError('Please select an expense to link');
      return;
    }

    try {
      setLinking(true);
      await (expensesAPI as any).update(selectedExpenseId, { payment_id: payment.id });
      showSuccess('Expense linked successfully');
      refresh();
      onClose(true); // Signal that an expense was successfully linked
    } catch (err: any) {
      showError(err.message || 'Failed to link expense');
    } finally {
      setLinking(false);
    }
  };

  // Filter expenses based on search query
  const filteredExpenses = expenses.filter((expense: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      expense.expense_number?.toLowerCase().includes(query) ||
      expense.description?.toLowerCase().includes(query) ||
      expense.vendor?.business_name?.toLowerCase().includes(query) ||
      expense.expense_category?.name?.toLowerCase().includes(query)
    );
  });


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={() => onClose()} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[85vh] flex flex-col dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#f5f0ff] rounded-lg dark:bg-purple-900/30">
              <Link2 className="h-5 w-5 text-zenible-primary dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Link Expense to Payment
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                #{payment.payment_number || payment.id?.toString().slice(-8)} -{' '}
                {formatCurrency(payment.amount, getCurrencyCode())}
              </p>
            </div>
          </div>
          <button
            onClick={() => onClose()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zenible-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-zenible-primary" />
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <AlertCircle className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">
                {searchQuery
                  ? 'No expenses match your search'
                  : 'No unlinked expenses available'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredExpenses.map((expense: any) => {
                const expenseCurrency =
                  expense.currency?.code || expense.currency_code || 'USD';
                return (
                  <label
                    key={expense.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedExpenseId === expense.id
                        ? 'border-zenible-primary bg-[#f5f0ff] dark:bg-purple-900/20 dark:border-purple-400'
                        : 'border-gray-200 hover:border-zenible-primary/50 dark:border-gray-700 dark:hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="expense"
                      value={expense.id}
                      checked={selectedExpenseId === expense.id}
                      onChange={() => setSelectedExpenseId(expense.id)}
                      className="h-4 w-4 text-zenible-primary focus:ring-zenible-primary border-gray-300"
                    />
                    <Receipt className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {expense.expense_number || 'No number'}
                        </span>
                        {expense.expense_category?.name && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-400">
                            {expense.expense_category.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {expense.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {expense.description}
                          </p>
                        )}
                        {expense.vendor?.business_name && (
                          <span className="text-xs text-gray-400">
                            &bull; {expense.vendor.business_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(expense.amount, expenseCurrency)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(expense.expense_date)}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => onClose()}
            disabled={linking}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleLink}
            disabled={linking || !selectedExpenseId}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-zenible-primary rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
          >
            {linking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Linking...
              </>
            ) : (
              <>
                <Link2 className="h-4 w-4" />
                Link Expense
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LinkExpenseModal;
