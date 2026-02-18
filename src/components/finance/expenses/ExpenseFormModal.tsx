import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, Loader2 } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import ExpenseForm from './ExpenseForm';
import expensesAPI from '../../../services/api/finance/expenses';
import { ModalPortalContext } from '../../../contexts/ModalPortalContext';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseId?: string | null;
  onSuccess?: (result: any) => void;
}

const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({ isOpen, onClose, expenseId = null, onSuccess }) => {
  const [expense, setExpense] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);
  const portalContainerRef = useCallback((node: HTMLDivElement | null) => {
    setPortalContainer(node);
  }, []);

  useEffect(() => {
    const fetchExpense = async () => {
      if (!expenseId) {
        setExpense(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await expensesAPI.get(expenseId);
        setExpense(data);
      } catch (err: any) {
        console.error('Failed to fetch expense:', err);
        setError(err.message || 'Failed to load expense');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchExpense();
    } else {
      setExpense(null);
      setError(null);
    }
  }, [isOpen, expenseId]);

  const handleSuccess = (result: any) => {
    onClose();
    if (onSuccess) {
      onSuccess(result);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />

        <Dialog.Content
          className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-full max-w-[95vw] md:max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-lg shadow-xl focus:outline-none overflow-y-auto"
        >
          <ModalPortalContext.Provider value={portalContainer}>
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 z-10">
              <button
                onClick={onClose}
                className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-3 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Expenses
              </button>

              <div className="flex items-center justify-between">
                <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
                  {expenseId ? 'Edit Expense' : 'Create New Expense'}
                </Dialog.Title>

                <button
                  onClick={onClose}
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
              <Dialog.Description className="sr-only">
                {expenseId ? 'Edit expense details' : 'Create a new expense entry'}
              </Dialog.Description>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Loading expense...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <ExpenseForm
                  expense={expense}
                  onSuccess={handleSuccess}
                  isInModal={true}
                />
              )}
            </div>
          </ModalPortalContext.Provider>
        </Dialog.Content>

        <div
          ref={portalContainerRef}
          className="fixed inset-0 pointer-events-none overflow-visible z-[51]"
        />
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ExpenseFormModal;
