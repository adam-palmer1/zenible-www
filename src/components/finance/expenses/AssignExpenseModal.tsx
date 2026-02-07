import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Trash2,
  X,
  Loader2,
  Search,
  Check,
  AlertCircle,
  Calendar,
  Building2,
} from 'lucide-react';
import Modal from '../../ui/modal/Modal';
import { useNotification } from '../../../contexts/NotificationContext';
import { formatCurrency } from '../../../utils/currency';
import expensesAPI from '../../../services/api/finance/expenses';

/**
 * Entity type configuration for display
 * All entities use Zenible purple for consistent branding
 */
const ENTITY_CONFIG: Record<string, any> = {
  invoice: {
    label: 'Invoice',
    headerColor: 'from-[#f5f0ff] to-[#ede5ff] dark:from-purple-900/20 dark:to-purple-900/30',
    iconBg: 'from-[#8e51ff] to-[#7c3aed]',
    iconShadow: 'shadow-[#8e51ff]/25',
    accentColor: 'purple',
  },
  project: {
    label: 'Project',
    headerColor: 'from-[#f5f0ff] to-[#ede5ff] dark:from-purple-900/20 dark:to-purple-900/30',
    iconBg: 'from-[#8e51ff] to-[#7c3aed]',
    iconShadow: 'shadow-[#8e51ff]/25',
    accentColor: 'purple',
  },
  payment: {
    label: 'Payment',
    headerColor: 'from-[#f5f0ff] to-[#ede5ff] dark:from-purple-900/20 dark:to-purple-900/30',
    iconBg: 'from-[#8e51ff] to-[#7c3aed]',
    iconShadow: 'shadow-[#8e51ff]/25',
    accentColor: 'purple',
  },
  contact: {
    label: 'Client',
    headerColor: 'from-[#f5f0ff] to-[#ede5ff] dark:from-purple-900/20 dark:to-purple-900/30',
    iconBg: 'from-[#8e51ff] to-[#7c3aed]',
    iconShadow: 'shadow-[#8e51ff]/25',
    accentColor: 'purple',
  },
};

interface AssignExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: string;
  entityId: string;
  entityName: string;
  currency?: string;
  onUpdate?: () => void;
  numberFormat?: any;
}

const AssignExpenseModal: React.FC<AssignExpenseModalProps> = ({
  open,
  onOpenChange,
  entityType,
  entityId,
  entityName,
  currency = 'USD',
  onUpdate,
  numberFormat,
}) => {
  const { showSuccess, showError } = useNotification() as any;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [assignedExpenses, setAssignedExpenses] = useState<any[]>([]);
  const [allExpenses, setAllExpenses] = useState<any[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [showAddSection, setShowAddSection] = useState(false);
  const [allocationCache, setAllocationCache] = useState<Record<string, any[]>>({});

  const config = ENTITY_CONFIG[entityType] || ENTITY_CONFIG.invoice;

  // Load all expenses and existing assignments when modal opens
  useEffect(() => {
    if (open && entityId) {
      loadAllData();
    }
  }, [open, entityId]);

  const loadAllData = async () => {
    setLoading(true);
    setExpensesLoading(true);
    try {
      // Fetch all expenses and assignments in parallel
      const [expensesResult] = await Promise.all([
        (expensesAPI as any).list({ per_page: 500 }),
        loadAssignments(),
      ]);
      setAllExpenses((expensesResult as any).items || expensesResult || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setExpensesLoading(false);
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    try {
      const result = await (expensesAPI as any).getExpensesByEntity(entityType, entityId);
      const expenses = (result as any).items || result || [];

      const assignments: any[] = [];
      const newCache: Record<string, any[]> = {};

      expenses.forEach((expense: any) => {
        const allocations = expense.allocations || [];
        newCache[expense.id] = allocations;

        const allocation = allocations.find(
          (a: any) => a.entity_type === entityType && a.entity_id === entityId
        );
        if (allocation) {
          assignments.push({
            expense_id: expense.id,
            percentage: parseFloat(allocation.percentage) || 100,
            expense,
          });
        }
      });

      setAllocationCache(newCache);
      setAssignedExpenses(assignments);
    } catch (error) {
      console.error('Failed to load assignments:', error);
      showError('Failed to load expense assignments');
    }
  };

  // Calculate totals
  const totalAssigned = useMemo(() => {
    return assignedExpenses.reduce((sum: number, item: any) => {
      const amount = (parseFloat(item.expense?.amount) || 0) * (item.percentage / 100);
      return sum + amount;
    }, 0);
  }, [assignedExpenses]);

  // Filter available expenses (not already assigned)
  const availableExpenses = useMemo(() => {
    const assignedIds = new Set(assignedExpenses.map((a: any) => a.expense_id));
    let filtered = allExpenses.filter((exp: any) => !assignedIds.has(exp.id));

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (exp: any) =>
          exp.description?.toLowerCase().includes(query) ||
          exp.expense_number?.toLowerCase().includes(query) ||
          exp.vendor?.name?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allExpenses, assignedExpenses, searchQuery]);

  const handleAddExpense = (expense: any) => {
    setAssignedExpenses([
      ...assignedExpenses,
      {
        expense_id: expense.id,
        percentage: 100,
        expense,
        isNew: true,
      },
    ]);
    setSearchQuery('');
    setShowAddSection(false);
  };

  const handleUpdatePercentage = (expenseId: string, percentage: string) => {
    setAssignedExpenses(
      assignedExpenses.map((item: any) =>
        item.expense_id === expenseId
          ? { ...item, percentage: Math.min(100, Math.max(0, parseFloat(percentage) || 0)) }
          : item
      )
    );
  };

  const handleRemoveExpense = (expenseId: string) => {
    setAssignedExpenses(assignedExpenses.filter((item: any) => item.expense_id !== expenseId));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatePromises = assignedExpenses.map((assignment: any) => {
        let allocations = [...(allocationCache[assignment.expense_id] || [])];

        const existingIndex = allocations.findIndex(
          (a: any) => a.entity_type === entityType && a.entity_id === entityId
        );

        if (existingIndex >= 0) {
          allocations[existingIndex] = {
            ...allocations[existingIndex],
            percentage: assignment.percentage,
          };
        } else {
          allocations.push({
            entity_type: entityType,
            entity_id: entityId,
            percentage: assignment.percentage,
          });
        }

        return (expensesAPI as any).updateAllocations(
          assignment.expense_id,
          allocations.map(({ entity_type, entity_id, percentage }: any) => ({
            entity_type,
            entity_id,
            percentage: parseFloat(percentage),
          }))
        );
      });

      await Promise.all(updatePromises);

      showSuccess('Expense assignments saved successfully');
      onUpdate?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to save assignments:', error);
      showError(error.message || 'Failed to save expense assignments');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title=""
      size="2xl"
      showCloseButton={false}
    >
      <div className="-m-6 mb-0">
        {/* Header */}
        <div className={`px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r ${config.headerColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${config.iconBg} shadow-lg ${config.iconShadow}`}>
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Assign Expenses
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {entityName}
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading || expensesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-zenible-primary" />
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Total Assigned Expenses
                    </span>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {formatCurrency(totalAssigned, currency, numberFormat)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Expenses
                    </span>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {assignedExpenses.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Assigned Expenses List */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Assigned Expenses
                </h3>

                {assignedExpenses.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                    <Receipt className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No expenses assigned to this {config.label.toLowerCase()} yet.
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      Click the button below to add expenses.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {assignedExpenses.map((item: any) => (
                      <div
                        key={item.expense_id}
                        className="flex items-center gap-4 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                      >
                        {/* Expense Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white truncate">
                              {item.expense?.description || `Expense #${item.expense?.expense_number}`}
                            </span>
                            {item.isNew && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                                New
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {item.expense?.vendor?.name && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {item.expense.vendor.name}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(item.expense?.expense_date)}
                            </span>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="text-right">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {formatCurrency(item.expense?.amount, item.expense?.currency?.code || currency, numberFormat)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Full amount
                          </div>
                        </div>

                        {/* Percentage Input */}
                        <div className="w-24">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.percentage}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdatePercentage(item.expense_id, e.target.value)}
                              className="w-full px-2 py-1.5 text-sm text-center bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-transparent"
                            />
                            <span className="text-sm text-gray-500 dark:text-gray-400">%</span>
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1">
                            {formatCurrency(
                              (parseFloat(item.expense?.amount) || 0) * (item.percentage / 100),
                              item.expense?.currency?.code || currency,
                              numberFormat
                            )}
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemoveExpense(item.expense_id)}
                          className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Expense Section */}
              {showAddSection ? (
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 dark:text-white">Add Expense</h4>
                    <button
                      onClick={() => setShowAddSection(false)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Search */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search expenses..."
                      value={searchQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-zenible-primary focus:border-transparent"
                      autoFocus
                    />
                  </div>

                  {/* Available Expenses */}
                  <div className="max-h-48 overflow-y-auto">
                    {availableExpenses.length === 0 ? (
                      <p className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                        {searchQuery ? 'No matching expenses found.' : 'No available expenses to assign.'}
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {availableExpenses.slice(0, 10).map((expense: any) => (
                          <button
                            key={expense.id}
                            onClick={() => handleAddExpense(expense)}
                            className="w-full flex items-center justify-between p-3 text-left bg-white dark:bg-gray-800 rounded-lg hover:bg-[#f5f0ff] dark:hover:bg-purple-900/20 transition-colors group"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-gray-900 dark:text-white truncate">
                                {expense.description || `Expense #${expense.expense_number}`}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                {expense.vendor?.name && <span>{expense.vendor.name}</span>}
                                <span>&bull;</span>
                                <span>{formatDate(expense.expense_date)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {formatCurrency(expense.amount, expense.currency?.code || currency, numberFormat)}
                              </span>
                              <Plus className="h-4 w-4 text-gray-400 group-hover:text-zenible-primary dark:group-hover:text-purple-400" />
                            </div>
                          </button>
                        ))}
                        {availableExpenses.length > 10 && (
                          <p className="text-center py-2 text-sm text-gray-500 dark:text-gray-400">
                            Showing 10 of {availableExpenses.length} expenses. Use search to narrow results.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddSection(true)}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-zenible-primary hover:text-zenible-primary dark:hover:border-purple-500 dark:hover:text-purple-400 hover:bg-[#f5f0ff] dark:hover:bg-purple-900/10 transition-all"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Plus className="h-5 w-5" />
                    <span className="font-medium">Add Expense</span>
                  </div>
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-zenible-primary rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Save Assignments
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AssignExpenseModal;
