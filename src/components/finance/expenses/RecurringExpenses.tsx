import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  MoreVertical,
  Loader2,
  Repeat,
} from 'lucide-react';
import { useNotification } from '../../../contexts/NotificationContext';
import { useCRMReferenceData } from '../../../contexts/CRMReferenceDataContext';
import { useCompanyAttributes } from '../../../hooks/crm/useCompanyAttributes';
import { formatCurrency } from '../../../utils/currency';
import { calculateNextBillingDate } from '../../../utils/recurringBilling';
import expensesAPI from '../../../services/api/finance/expenses';
import NewSidebar from '../../sidebar/NewSidebar';
import Modal from '../../ui/modal/Modal';
import ActionMenu from '../../shared/ActionMenu';

/**
 * Format recurring frequency for display
 */
const formatFrequency = (expense: any): string => {
  if (expense.recurring_type === 'custom') {
    const periodLabel = expense.custom_period === 'days' ? 'day' :
                        expense.custom_period === 'weeks' ? 'week' :
                        expense.custom_period === 'months' ? 'month' :
                        expense.custom_period === 'years' ? 'year' : expense.custom_period;
    const plural = expense.custom_every > 1 ? 's' : '';
    return `Every ${expense.custom_every} ${periodLabel}${plural}`;
  }
  return expense.recurring_type?.charAt(0).toUpperCase() + expense.recurring_type?.slice(1) || 'Unknown';
};

/**
 * Status badge component
 */
interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const styles: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.active}`}>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
};

/**
 * Get display name for vendor
 */
const getVendorName = (vendor: any): string | null => {
  if (!vendor) return null;
  if (vendor.business_name) return vendor.business_name;
  const firstName = vendor.first_name || '';
  const lastName = vendor.last_name || '';
  return `${firstName} ${lastName}`.trim() || null;
};

/**
 * Recurring expense row with actions dropdown
 */
interface RecurringExpenseRowProps {
  expense: any;
  onAction: (id: string, action: string) => void;
  actionLoading: string | null;
  onToggleMenu: (id: string) => void;
  isMenuOpen: boolean;
  numberFormat: any;
}

const RecurringExpenseRow: React.FC<RecurringExpenseRowProps> = ({ expense, onAction: _onAction, actionLoading, onToggleMenu, isMenuOpen: _isMenuOpen, numberFormat }) => {

  // Get currency code from expense
  const currencyCode = expense.currency?.code || 'USD';

  // Get primary display name: vendor > category > description > expense number
  const vendorName = getVendorName(expense.vendor);
  const categoryName = expense.expense_category?.name || expense.category?.name;
  const primaryName = vendorName || expense.description || categoryName || expense.expense_number;
  const secondaryInfo = vendorName ? (expense.expense_category?.name || expense.category?.name) : expense.expense_number;

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <td className="px-4 py-3">
        <div>
          <div className="font-medium design-text-primary">{primaryName}</div>
          <div className="text-sm design-text-secondary">{secondaryInfo}</div>
        </div>
      </td>
      <td className="px-4 py-3 design-text-primary">
        {formatCurrency(parseFloat(expense.amount), currencyCode, numberFormat)}
      </td>
      <td className="px-4 py-3 design-text-secondary">
        <div className="flex items-center gap-1.5">
          <Repeat className="h-4 w-4" />
          {formatFrequency(expense)}
        </div>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={expense.recurring_status} />
      </td>
      <td className="px-4 py-3 design-text-secondary">
        {expense.recurring_number === -1 ? (
          <span className="text-purple-600 dark:text-purple-400">Infinite</span>
        ) : (
          `${expense.recurring_number} times`
        )}
      </td>
      <td className="px-4 py-3 design-text-secondary">
        {expense.expense_date ? (
          (() => {
            const nextDate = calculateNextBillingDate(
              expense.expense_date,
              expense.recurring_type,
              expense.custom_every,
              expense.custom_period
            );
            return nextDate.toLocaleDateString();
          })()
        ) : '-'}
      </td>
      <td className="px-4 py-3">
        <button
          id={`recurring-expense-action-btn-${expense.id}`}
          onClick={() => onToggleMenu(expense.id)}
          disabled={actionLoading === expense.id}
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {actionLoading === expense.id ? (
            <Loader2 className="h-5 w-5 animate-spin design-text-secondary" />
          ) : (
            <MoreVertical className="h-5 w-5 design-text-secondary" />
          )}
        </button>
      </td>
    </tr>
  );
};

/**
 * Generated expenses modal
 */
interface GeneratedExpensesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string | null;
  templateDescription: string;
  numberFormat: any;
}

const GeneratedExpensesModal: React.FC<GeneratedExpensesModalProps> = ({ open, onOpenChange, templateId, templateDescription, numberFormat }) => {
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (open && templateId) {
      loadChildren();
    }
  }, [open, templateId]);

  const loadChildren = async () => {
    try {
      setLoading(true);
      const response = await expensesAPI.getRecurringChildren(templateId!);
      setChildren(response?.items || []);
    } catch (error: any) {
      console.error('Failed to load generated expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="2xl"
      title="Generated Expenses"
      description={`Expenses generated from: ${templateDescription || 'Unknown'}`}
    >
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin design-text-secondary" />
        </div>
      ) : children.length === 0 ? (
        <div className="text-center py-8 design-text-secondary">
          No expenses have been generated yet.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium design-text-secondary uppercase">#</th>
                  <th className="px-4 py-2 text-left text-xs font-medium design-text-secondary uppercase">Number</th>
                  <th className="px-4 py-2 text-left text-xs font-medium design-text-secondary uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium design-text-secondary uppercase">Amount</th>
                  <th className="px-4 py-2 text-left text-xs font-medium design-text-secondary uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {children.map((child: any, index: number) => (
                  <tr
                    key={child.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                    onClick={() => {
                      onOpenChange(false);
                      navigate(`/finance/expenses/${child.id}/edit`);
                    }}
                  >
                    <td className="px-4 py-2 text-sm design-text-secondary">
                      {child.recurrence_sequence_number || index + 1}
                    </td>
                    <td className="px-4 py-2 text-sm design-text-primary">
                      {child.expense_number}
                    </td>
                    <td className="px-4 py-2 text-sm design-text-secondary">
                      {child.expense_date ? new Date(child.expense_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-2 text-sm design-text-primary">
                      {formatCurrency(parseFloat(child.amount), child.currency?.code || 'USD', numberFormat)}
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={child.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm font-medium design-text-primary design-bg-secondary rounded-md hover:design-bg-tertiary"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

/**
 * RecurringExpenses page component
 */
const RecurringExpenses: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError, showConfirm } = useNotification();
  const { numberFormats } = useCRMReferenceData();
  const { getNumberFormat } = useCompanyAttributes();

  // Get number format from company settings
  const numberFormat = useMemo(() => {
    const formatId = getNumberFormat();
    if (formatId && numberFormats.length > 0) {
      return numberFormats.find((f: any) => f.id === formatId);
    }
    return null; // Will use default format
  }, [getNumberFormat, numberFormats]);

  const [allExpenses, setAllExpenses] = useState<any[]>([]); // All expenses for counts
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('active');

  // Modal state
  const [showChildrenModal, setShowChildrenModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  // Action menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Handle toggling action menu
  const handleToggleMenu = useCallback((expenseId: string) => {
    setOpenMenuId(prev => prev === expenseId ? null : expenseId);
  }, []);

  // Load all recurring expense templates (no status filter)
  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        pricing_type: 'recurring',
        generated_from_template: 'false', // Only templates, not generated children
      };
      const response = await expensesAPI.list(params);
      setAllExpenses(response?.items || []);
    } catch (error: any) {
      console.error('Failed to load recurring expenses:', error);
      showError('Failed to load recurring expenses');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  // Filter expenses client-side based on selected status
  const expenses = useMemo(() => {
    if (!statusFilter) return allExpenses; // "All" tab
    return allExpenses.filter((e: any) => e.recurring_status === statusFilter);
  }, [allExpenses, statusFilter]);

  // Handle actions on recurring expenses
  const handleAction = useCallback(async (expenseId: string, action: string) => {
    const expense = expenses.find((e: any) => e.id === expenseId);

    if (action === 'viewChildren') {
      setSelectedTemplate(expense);
      setShowChildrenModal(true);
      return;
    }

    if (action === 'cancel') {
      const confirmed = await showConfirm(
        'Cancel Recurring Expense',
        'Are you sure you want to cancel this recurring expense? This cannot be undone and no more expenses will be generated.'
      );
      if (!confirmed) return;
    }

    try {
      setActionLoading(expenseId);

      switch (action) {
        case 'generateNext': {
          const newExpense = await expensesAPI.generateNext(expenseId);
          showSuccess(`Generated expense ${newExpense.expense_number}`);
          break;
        }

        case 'pause':
          await expensesAPI.update(expenseId, { recurring_status: 'paused' });
          showSuccess('Recurring expense paused');
          break;

        case 'resume':
          await expensesAPI.update(expenseId, { recurring_status: 'active' });
          showSuccess('Recurring expense resumed');
          break;

        case 'cancel':
          await expensesAPI.update(expenseId, { recurring_status: 'cancelled' });
          showSuccess('Recurring expense cancelled');
          break;

        default:
          break;
      }

      // Reload list
      loadExpenses();
    } catch (error: any) {
      console.error(`Action ${action} failed:`, error);
      showError(error.message || `Failed to ${action} recurring expense`);
    } finally {
      setActionLoading(null);
    }
  }, [expenses, loadExpenses, showSuccess, showError, showConfirm]);

  // Status tabs
  const statusTabs = [
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: '', label: 'All' },
  ];

  // Count by status (use all expenses, not filtered)
  const statusCounts: Record<string, number> = useMemo(() => {
    return {
      active: allExpenses.filter((e: any) => e.recurring_status === 'active').length,
      paused: allExpenses.filter((e: any) => e.recurring_status === 'paused').length,
      cancelled: allExpenses.filter((e: any) => e.recurring_status === 'cancelled').length,
    };
  }, [allExpenses]);

  return (
    <div className="flex h-screen bg-[#f8f8f8] dark:bg-gray-900">
      {/* Sidebar */}
      <NewSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col transition-all duration-300" style={{ marginLeft: 'var(--sidebar-width, 280px)' }}>
        {/* Top Bar */}
        <div className="bg-white dark:bg-gray-800 border-b border-[#e5e5e5] dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/finance/expenses')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Back to expenses"
              >
                <ArrowLeft className="h-5 w-5 design-text-secondary" />
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-[#09090b] dark:text-white">
                  Recurring Expenses
                </h1>
                <p className="text-sm design-text-secondary">
                  Manage subscription and recurring expense templates
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/finance/expenses/new?recurring=true')}
              className="inline-flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-white bg-[#8e51ff] rounded-[10px] hover:bg-[#7c3aed] transition-colors"
            >
              <Plus className="h-5 w-5" />
              New Recurring Expense
            </button>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="bg-white dark:bg-gray-800 border-b border-[#e5e5e5] dark:border-gray-700 px-4">
          <div className="flex gap-1">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  statusFilter === tab.value
                    ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                    : 'border-transparent design-text-secondary hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
                {tab.value && statusCounts[tab.value] !== undefined && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700">
                    {statusCounts[tab.value]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-[#e5e5e5] dark:border-gray-700 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin design-text-secondary" />
              </div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-12">
                <Repeat className="mx-auto h-12 w-12 design-text-secondary mb-4" />
                <h3 className="text-lg font-medium design-text-primary mb-2">
                  No recurring expenses
                </h3>
                <p className="design-text-secondary mb-4">
                  {statusFilter
                    ? `No ${statusFilter} recurring expenses found.`
                    : 'Create your first recurring expense to track subscriptions and regular payments.'}
                </p>
                <button
                  onClick={() => navigate('/finance/expenses/new?recurring=true')}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                >
                  <Plus className="h-4 w-4" />
                  Create Recurring Expense
                </button>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium design-text-secondary uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium design-text-secondary uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium design-text-secondary uppercase tracking-wider">
                      Frequency
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium design-text-secondary uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium design-text-secondary uppercase tracking-wider">
                      Occurrences
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium design-text-secondary uppercase tracking-wider">
                      Next Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium design-text-secondary uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {expenses.map((expense: any) => (
                    <RecurringExpenseRow
                      key={expense.id}
                      expense={expense}
                      onAction={handleAction}
                      actionLoading={actionLoading}
                      onToggleMenu={handleToggleMenu}
                      isMenuOpen={openMenuId === expense.id}
                      numberFormat={numberFormat}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Generated Expenses Modal */}
      <GeneratedExpensesModal
        open={showChildrenModal}
        onOpenChange={setShowChildrenModal}
        templateId={selectedTemplate?.id}
        templateDescription={
          getVendorName(selectedTemplate?.vendor) ||
          selectedTemplate?.description ||
          selectedTemplate?.expense_category?.name ||
          selectedTemplate?.expense_number
        }
        numberFormat={numberFormat}
      />

      {/* Action Menu */}
      {openMenuId && (() => {
        const expense = allExpenses.find((e: any) => e.id === openMenuId);
        if (!expense) return null;
        return (
          <ActionMenu
            itemId={expense.id}
            onClose={() => setOpenMenuId(null)}
            buttonIdPrefix="recurring-expense-action-btn"
            actions={[
              { label: 'Edit Template', onClick: () => navigate(`/finance/expenses/${expense.id}/edit`) },
              { label: 'View Generated', onClick: () => handleAction(expense.id, 'viewChildren') },
              {
                label: 'Generate Next Now',
                onClick: () => handleAction(expense.id, 'generateNext'),
                condition: expense.recurring_status === 'active'
              },
              {
                label: 'Pause',
                onClick: () => handleAction(expense.id, 'pause'),
                condition: expense.recurring_status === 'active',
                variant: 'warning'
              },
              {
                label: 'Resume',
                onClick: () => handleAction(expense.id, 'resume'),
                condition: expense.recurring_status === 'paused',
                variant: 'success'
              },
              {
                label: 'Cancel Permanently',
                onClick: () => handleAction(expense.id, 'cancel'),
                condition: expense.recurring_status !== 'cancelled',
                variant: 'danger'
              },
            ]}
          />
        );
      })()}
    </div>
  );
};

export default RecurringExpenses;
