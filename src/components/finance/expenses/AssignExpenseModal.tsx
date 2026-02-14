import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import invoicesAPI from '../../../services/api/finance/invoices';
import { useCurrencyConversion } from '../../../hooks/crm/useCurrencyConversion';

/** Entity type configuration for display */
const ENTITY_CONFIG: Record<string, { label: string }> = {
  invoice: { label: 'Invoice' },
  project: { label: 'Project' },
  payment: { label: 'Payment' },
  contact: { label: 'Client' },
};

interface AssignExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: string;
  entityId: string;
  entityName: string;
  currency?: string;
  onUpdate?: () => void;
  numberFormat?: Record<string, unknown>;
  entityTotal?: number;
  entityCurrencyCode?: string;
  contactId?: string;
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
  entityTotal,
  entityCurrencyCode,
  contactId,
}) => {
  const { showSuccess, showError } = useNotification();
  const { convert } = useCurrencyConversion();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [assignedExpenses, setAssignedExpenses] = useState<any[]>([]);
  const [allExpenses, setAllExpenses] = useState<any[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [showAddSection, setShowAddSection] = useState(false);
  const [allocationCache, setAllocationCache] = useState<Record<string, any[]>>({});
  // Tracks converted amounts keyed by `${expenseId}-${percentage}` for invoice cap
  const [convertedAmounts, setConvertedAmounts] = useState<Record<string, number>>({});
  // Tracks expenses already allocated from other sources (not shown in this modal)
  const [otherAllocatedTotal, setOtherAllocatedTotal] = useState<number>(0);

  const isInvoice = entityType === 'invoice';
  const hasCapInfo = isInvoice && entityTotal !== undefined && entityCurrencyCode;
  const config = ENTITY_CONFIG[entityType] || ENTITY_CONFIG.invoice;

  // Load all expenses and existing assignments when modal opens
  useEffect(() => {
    if (open && entityId) {
      loadAllData();
    }
  }, [open, entityId]);

  const fetchExpenses = useCallback(async (search: string) => {
    setExpensesLoading(true);
    try {
      const params: Record<string, string> = { per_page: '50' };
      if (search) params.search = search;
      if (contactId) params.contact_id = contactId;
      const result = await expensesAPI.list(params) as { items?: unknown[] };
      setAllExpenses(result.items || []);
    } catch (error) {
      console.error('Failed to search expenses:', error);
    } finally {
      setExpensesLoading(false);
    }
  }, [contactId]);

  // Debounced server-side search
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchExpenses(searchQuery);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery, open, fetchExpenses]);

  const loadAllData = async () => {
    setLoading(true);
    setConvertedAmounts({});
    setOtherAllocatedTotal(0);
    try {
      const promises: Promise<any>[] = [
        fetchExpenses(''),
        loadAssignments(),
      ];
      // Fetch capacity info for invoices
      if (isInvoice) {
        promises.push(
          invoicesAPI.getExpenseAllocationCapacity(entityId).catch((err: unknown) => {
            console.error('Failed to load allocation capacity:', err);
            return null;
          })
        );
      }

      const results = await Promise.all(promises);

      // Set other-allocated total from capacity endpoint
      if (results[2]) {
        setOtherAllocatedTotal(parseFloat(results[2].allocated_expenses_total) || 0);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    try {
      const result = await expensesAPI.getExpensesByEntity(entityType, entityId);
      const expenses = result.items || [];

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

  // Convert expense amount to invoice currency when needed
  const convertToInvoiceCurrency = useCallback(async (
    expenseId: string,
    amount: number,
    expenseCurrency: string,
    percentage: number
  ) => {
    if (!entityCurrencyCode || expenseCurrency === entityCurrencyCode) return;
    const allocAmount = amount * (percentage / 100);
    const key = `${expenseId}-${percentage}`;
    try {
      const converted = await convert(allocAmount, expenseCurrency, entityCurrencyCode);
      setConvertedAmounts(prev => ({ ...prev, [key]: converted }));
    } catch {
      // Fallback: use original amount
      setConvertedAmounts(prev => ({ ...prev, [key]: allocAmount }));
    }
  }, [entityCurrencyCode, convert]);

  // Trigger conversions when assigned expenses change
  useEffect(() => {
    if (!hasCapInfo) return;
    assignedExpenses.forEach((item: any) => {
      const expCurrency = item.expense?.currency?.code || currency;
      if (expCurrency !== entityCurrencyCode) {
        const key = `${item.expense_id}-${item.percentage}`;
        if (convertedAmounts[key] === undefined) {
          convertToInvoiceCurrency(
            item.expense_id,
            parseFloat(item.expense?.amount) || 0,
            expCurrency,
            item.percentage
          );
        }
      }
    });
  }, [assignedExpenses, hasCapInfo, entityCurrencyCode, currency, convertedAmounts, convertToInvoiceCurrency]);

  // Calculate totals
  const totalAssigned = useMemo(() => {
    return assignedExpenses.reduce((sum: number, item: any) => {
      const amount = (parseFloat(item.expense?.amount) || 0) * (item.percentage / 100);
      return sum + amount;
    }, 0);
  }, [assignedExpenses]);

  // Calculate total assigned in invoice currency (for cap check)
  const totalAssignedInInvoiceCurrency = useMemo(() => {
    if (!hasCapInfo) return 0;
    return assignedExpenses.reduce((sum: number, item: any) => {
      const expCurrency = item.expense?.currency?.code || currency;
      const allocAmount = (parseFloat(item.expense?.amount) || 0) * (item.percentage / 100);
      if (expCurrency === entityCurrencyCode) {
        return sum + allocAmount;
      }
      // Use cached conversion or fall back to original amount
      const key = `${item.expense_id}-${item.percentage}`;
      return sum + (convertedAmounts[key] ?? allocAmount);
    }, 0);
  }, [assignedExpenses, hasCapInfo, entityCurrencyCode, currency, convertedAmounts]);

  const hasMixedCurrencies = useMemo(() => {
    if (!hasCapInfo) return false;
    return assignedExpenses.some(
      (item: any) => (item.expense?.currency?.code || currency) !== entityCurrencyCode
    );
  }, [assignedExpenses, hasCapInfo, entityCurrencyCode, currency]);

  const isOverAllocated = useMemo(() => {
    if (!hasCapInfo || entityTotal === undefined) return false;
    return totalAssignedInInvoiceCurrency > entityTotal + 0.01;
  }, [hasCapInfo, entityTotal, totalAssignedInInvoiceCurrency]);

  const remainingCapacity = useMemo(() => {
    if (!hasCapInfo || entityTotal === undefined) return 0;
    return Math.max(entityTotal - totalAssignedInInvoiceCurrency, 0);
  }, [hasCapInfo, entityTotal, totalAssignedInInvoiceCurrency]);

  // Filter available expenses (not already assigned)
  const availableExpenses = useMemo(() => {
    const assignedIds = new Set(assignedExpenses.map((a: any) => a.expense_id));
    return allExpenses.filter((exp: any) => !assignedIds.has(exp.id));
  }, [allExpenses, assignedExpenses]);

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
    // Client-side over-allocation check for invoices
    if (isOverAllocated) {
      showError(
        `Total allocated expenses exceed the invoice total of ${formatCurrency(entityTotal || 0, entityCurrencyCode || currency, numberFormat)}. Please reduce allocations.`
      );
      return;
    }

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

        return expensesAPI.updateAllocations(
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
        <div className="px-6 py-5 border-b border-[#e5e5e5] dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#fafafa] dark:bg-gray-700 border border-[#e5e5e5] dark:border-gray-600">
                <Receipt className="h-5 w-5 text-[#71717a] dark:text-gray-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#09090b] dark:text-white">
                  Assign Expenses
                </h2>
                <p className="text-sm text-[#71717a] dark:text-gray-400 mt-0.5">
                  {entityName}
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1 rounded transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading || expensesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#8e51ff]" />
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="mb-6 p-4 bg-[#fafafa] dark:bg-gray-900 border border-[#e5e5e5] dark:border-gray-700 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-[#71717a] dark:text-gray-400">
                      Total Assigned Expenses
                    </span>
                    <p className="text-lg font-semibold text-[#09090b] dark:text-white mt-1">
                      {formatCurrency(totalAssigned, currency, numberFormat)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-[#71717a] dark:text-gray-400">
                      Expenses
                    </span>
                    <p className="text-lg font-semibold text-[#09090b] dark:text-white mt-1">
                      {assignedExpenses.length}
                    </p>
                  </div>
                </div>

                {/* Invoice capacity info */}
                {hasCapInfo && entityTotal !== undefined && (
                  <div className="mt-4 pt-4 border-t border-[#e5e5e5] dark:border-gray-700">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <span className="text-xs text-[#71717a] dark:text-gray-400">
                          Invoice Total
                        </span>
                        <p className="text-sm font-semibold text-[#09090b] dark:text-white mt-0.5">
                          {formatCurrency(entityTotal, entityCurrencyCode || currency, numberFormat)}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-[#71717a] dark:text-gray-400">
                          Allocated{hasMixedCurrencies ? ` (${entityCurrencyCode})` : ''}
                        </span>
                        <p className={`text-sm font-semibold mt-0.5 ${
                          isOverAllocated
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-[#09090b] dark:text-white'
                        }`}>
                          {formatCurrency(totalAssignedInInvoiceCurrency, entityCurrencyCode || currency, numberFormat)}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-[#71717a] dark:text-gray-400">
                          Remaining
                        </span>
                        <p className={`text-sm font-semibold mt-0.5 ${
                          isOverAllocated
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                          {isOverAllocated
                            ? `-${formatCurrency(totalAssignedInInvoiceCurrency - entityTotal, entityCurrencyCode || currency, numberFormat)}`
                            : formatCurrency(remainingCapacity, entityCurrencyCode || currency, numberFormat)
                          }
                        </p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 h-1.5 bg-[#e5e5e5] dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOverAllocated
                            ? 'bg-red-500'
                            : totalAssignedInInvoiceCurrency / entityTotal > 0.9
                              ? 'bg-amber-500'
                              : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min((totalAssignedInInvoiceCurrency / entityTotal) * 100, 100)}%` }}
                      />
                    </div>

                    {isOverAllocated && (
                      <div className="mt-2 flex items-center gap-1.5 text-red-600 dark:text-red-400">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="text-xs font-medium">
                          Allocated expenses exceed invoice total
                        </span>
                      </div>
                    )}

                    {hasMixedCurrencies && !isOverAllocated && (
                      <p className="mt-2 text-xs text-[#71717a] dark:text-gray-500">
                        Amounts converted to {entityCurrencyCode} using approximate exchange rates
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Assigned Expenses List */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-[#09090b] dark:text-white mb-3">
                  Assigned Expenses
                </h3>

                {assignedExpenses.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-[#e5e5e5] dark:border-gray-700 rounded-lg">
                    <Receipt className="h-8 w-8 mx-auto mb-2 text-[#71717a]/30 dark:text-gray-600" />
                    <p className="text-sm text-[#71717a] dark:text-gray-400">
                      No expenses assigned to this {config.label.toLowerCase()} yet.
                    </p>
                    <p className="text-xs text-[#71717a] dark:text-gray-500 mt-1">
                      Click the button below to add expenses.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {assignedExpenses.map((item: any) => (
                      <div
                        key={item.expense_id}
                        className="flex items-center gap-4 p-3 bg-[#fafafa] dark:bg-gray-900 border border-[#e5e5e5] dark:border-gray-700 rounded-lg"
                      >
                        {/* Expense Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[#09090b] dark:text-white truncate">
                              {item.expense?.description || `Expense #${item.expense?.expense_number}`}
                            </span>
                            {item.isNew && (
                              <span className="px-1.5 py-0.5 text-xs font-medium bg-[#8e51ff]/10 text-[#8e51ff] dark:bg-purple-900/30 dark:text-purple-400 rounded">
                                New
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-[#71717a] dark:text-gray-400">
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
                          <div className="text-sm font-semibold text-[#09090b] dark:text-white">
                            {formatCurrency(item.expense?.amount, item.expense?.currency?.code || currency, numberFormat)}
                          </div>
                          <div className="text-xs text-[#71717a] dark:text-gray-400">
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
                              className="w-full px-2 py-1.5 text-sm text-center bg-white dark:bg-gray-900 border border-[#e5e5e5] dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#8e51ff] focus:border-transparent"
                            />
                            <span className="text-xs text-[#71717a] dark:text-gray-400">%</span>
                          </div>
                          <div className="text-xs text-[#71717a] dark:text-gray-500 text-center mt-1">
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
                          className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Expense Section */}
              {showAddSection ? (
                <div className="p-4 bg-[#fafafa] dark:bg-gray-900 rounded-lg border border-[#e5e5e5] dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-[#09090b] dark:text-white">Add Expense</h4>
                    <button
                      onClick={() => setShowAddSection(false)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Search */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#71717a]" />
                    <input
                      type="text"
                      placeholder="Search expenses..."
                      value={searchQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-[#e5e5e5] dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-[#8e51ff] focus:border-transparent"
                      autoFocus
                    />
                  </div>

                  {/* Available Expenses */}
                  <div className="max-h-48 overflow-y-auto">
                    {availableExpenses.length === 0 ? (
                      <p className="text-center py-4 text-[#71717a] dark:text-gray-400 text-sm">
                        {searchQuery ? 'No matching expenses found.' : 'No available expenses to assign.'}
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {availableExpenses.slice(0, 10).map((expense: any) => (
                          <button
                            key={expense.id}
                            onClick={() => handleAddExpense(expense)}
                            className="w-full flex items-center justify-between p-3 text-left bg-white dark:bg-gray-800 rounded-lg hover:bg-[#fafafa] dark:hover:bg-gray-700 transition-colors group"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-[#09090b] dark:text-white truncate">
                                {expense.description || `Expense #${expense.expense_number}`}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-[#71717a] dark:text-gray-400">
                                {expense.vendor?.name && <span>{expense.vendor.name}</span>}
                                <span>&middot;</span>
                                <span>{formatDate(expense.expense_date)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-[#09090b] dark:text-white">
                                {formatCurrency(expense.amount, expense.currency?.code || currency, numberFormat)}
                              </span>
                              <Plus className="h-4 w-4 text-[#71717a] group-hover:text-[#8e51ff]" />
                            </div>
                          </button>
                        ))}
                        {availableExpenses.length > 10 && (
                          <p className="text-center py-2 text-xs text-[#71717a] dark:text-gray-400">
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
                  className="w-full px-4 py-3 border border-dashed border-[#e5e5e5] dark:border-gray-600 rounded-lg text-[#71717a] dark:text-gray-400 hover:border-[#8e51ff] hover:text-[#8e51ff] dark:hover:border-purple-500 dark:hover:text-purple-400 transition-colors"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span className="text-sm font-medium">Add Expense</span>
                  </div>
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e5e5e5] dark:border-gray-700">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm font-medium text-[#71717a] dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || isOverAllocated}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#8e51ff] rounded-lg hover:bg-[#7c3aed] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Assignments'
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AssignExpenseModal;
