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
 */
const ENTITY_CONFIG = {
  invoice: {
    label: 'Invoice',
    headerColor: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
    iconBg: 'from-blue-500 to-indigo-600',
    iconShadow: 'shadow-blue-500/25',
    accentColor: 'blue',
  },
  project: {
    label: 'Project',
    headerColor: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
    iconBg: 'from-green-500 to-emerald-600',
    iconShadow: 'shadow-green-500/25',
    accentColor: 'green',
  },
  payment: {
    label: 'Payment',
    headerColor: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
    iconBg: 'from-amber-500 to-orange-600',
    iconShadow: 'shadow-amber-500/25',
    accentColor: 'amber',
  },
  contact: {
    label: 'Client',
    headerColor: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
    iconBg: 'from-purple-500 to-pink-600',
    iconShadow: 'shadow-purple-500/25',
    accentColor: 'purple',
  },
};

/**
 * AssignExpenseModal Component
 *
 * A reusable modal for assigning expenses to an entity (invoice, project, payment, or contact).
 * Use this component from invoices, projects, payments, or contacts views to manage
 * which expenses are allocated to that entity.
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the modal is open
 * @param {Function} props.onOpenChange - Handler for modal open state changes
 * @param {string} props.entityType - Type of entity: 'invoice' | 'project' | 'payment' | 'contact'
 * @param {string} props.entityId - The ID of the entity to assign expenses to
 * @param {string} props.entityName - Display name of the entity (e.g., "Invoice #INV-001")
 * @param {string} props.currency - Currency code for display (defaults to 'USD')
 * @param {Function} props.onUpdate - Callback when assignments are updated
 * @param {string} props.numberFormat - Number format for currency display
 *
 * @example
 * // Usage in InvoiceDetails.jsx:
 * <AssignExpenseModal
 *   open={showExpensesModal}
 *   onOpenChange={setShowExpensesModal}
 *   entityType="invoice"
 *   entityId={invoice.id}
 *   entityName={`Invoice #${invoice.invoice_number}`}
 *   currency={invoice.currency?.code}
 *   onUpdate={() => refreshInvoice()}
 * />
 *
 * @example
 * // Usage in ProjectDetails.jsx:
 * <AssignExpenseModal
 *   open={showExpensesModal}
 *   onOpenChange={setShowExpensesModal}
 *   entityType="project"
 *   entityId={project.id}
 *   entityName={project.name}
 *   onUpdate={() => refreshProject()}
 * />
 */
const AssignExpenseModal = ({
  open,
  onOpenChange,
  entityType,
  entityId,
  entityName,
  currency = 'USD',
  onUpdate,
  numberFormat,
}) => {
  const { showSuccess, showError } = useNotification();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [assignedExpenses, setAssignedExpenses] = useState([]); // { expense_id, percentage, expense }
  const [allExpenses, setAllExpenses] = useState([]); // All expenses fetched from API
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [showAddSection, setShowAddSection] = useState(false);
  const [allocationCache, setAllocationCache] = useState({}); // Cache of expense allocations { [expenseId]: allocations[] }

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
        expensesAPI.list({ per_page: 500 }), // Get a large list of expenses
        loadAssignments(),
      ]);
      setAllExpenses(expensesResult.items || expensesResult || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setExpensesLoading(false);
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    try {
      // Get expenses allocated to this entity (allocations included in response)
      const result = await expensesAPI.getExpensesByEntity(entityType, entityId);
      const expenses = result.items || result || [];

      // Build assignments using included allocation data (no N+1 calls needed)
      const assignments = [];
      const newCache = {};

      expenses.forEach((expense) => {
        // Allocations are included in the expense response
        const allocations = expense.allocations || [];

        // Cache the full allocations for this expense (used in handleSave)
        newCache[expense.id] = allocations;

        // Find the allocation for this entity
        const allocation = allocations.find(
          (a) => a.entity_type === entityType && a.entity_id === entityId
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
    return assignedExpenses.reduce((sum, item) => {
      const amount = (parseFloat(item.expense?.amount) || 0) * (item.percentage / 100);
      return sum + amount;
    }, 0);
  }, [assignedExpenses]);

  // Filter available expenses (not already assigned)
  const availableExpenses = useMemo(() => {
    const assignedIds = new Set(assignedExpenses.map((a) => a.expense_id));
    let filtered = allExpenses.filter((exp) => !assignedIds.has(exp.id));

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (exp) =>
          exp.description?.toLowerCase().includes(query) ||
          exp.expense_number?.toLowerCase().includes(query) ||
          exp.vendor?.name?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allExpenses, assignedExpenses, searchQuery]);

  // Add expense to assignments
  const handleAddExpense = (expense) => {
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

  // Update percentage for an assignment
  const handleUpdatePercentage = (expenseId, percentage) => {
    setAssignedExpenses(
      assignedExpenses.map((item) =>
        item.expense_id === expenseId
          ? { ...item, percentage: Math.min(100, Math.max(0, parseFloat(percentage) || 0)) }
          : item
      )
    );
  };

  // Remove expense from assignments
  const handleRemoveExpense = (expenseId) => {
    setAssignedExpenses(assignedExpenses.filter((item) => item.expense_id !== expenseId));
  };

  // Save all assignments
  const handleSave = async () => {
    setSaving(true);
    try {
      // Build all update operations using cached allocation data (no re-fetching)
      const updatePromises = assignedExpenses.map((assignment) => {
        // Use cached allocations, or empty array for new assignments
        let allocations = [...(allocationCache[assignment.expense_id] || [])];

        // Find or create allocation for this entity
        const existingIndex = allocations.findIndex(
          (a) => a.entity_type === entityType && a.entity_id === entityId
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

        // Return the update promise
        return expensesAPI.updateAllocations(
          assignment.expense_id,
          allocations.map(({ entity_type, entity_id, percentage }) => ({
            entity_type,
            entity_id,
            percentage: parseFloat(percentage),
          }))
        );
      });

      // Execute all updates in parallel
      await Promise.all(updatePromises);

      showSuccess('Expense assignments saved successfully');
      onUpdate?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save assignments:', error);
      showError(error.message || 'Failed to save expense assignments');
    } finally {
      setSaving(false);
    }
  };

  // Format date for display
  const formatDate = (dateStr) => {
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
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
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
                    {assignedExpenses.map((item) => (
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
                              onChange={(e) => handleUpdatePercentage(item.expense_id, e.target.value)}
                              className="w-full px-2 py-1.5 text-sm text-center bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                        {availableExpenses.slice(0, 10).map((expense) => (
                          <button
                            key={expense.id}
                            onClick={() => handleAddExpense(expense)}
                            className="w-full flex items-center justify-between p-3 text-left bg-white dark:bg-gray-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors group"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-gray-900 dark:text-white truncate">
                                {expense.description || `Expense #${expense.expense_number}`}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                {expense.vendor?.name && <span>{expense.vendor.name}</span>}
                                <span>•</span>
                                <span>{formatDate(expense.expense_date)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {formatCurrency(expense.amount, expense.currency?.code || currency, numberFormat)}
                              </span>
                              <Plus className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
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
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-indigo-400 hover:text-indigo-600 dark:hover:border-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all"
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
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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

/**
 * COMPONENT DOCUMENTATION
 * =======================
 *
 * AssignExpenseModal is a reusable component for assigning expenses to any entity type
 * (invoice, project, payment, or contact/client).
 *
 * FEATURES:
 * ---------
 * 1. Shows all expenses currently assigned to the entity
 * 2. Allows adding new expenses from the full expense list
 * 3. Supports percentage-based allocation (0-100%)
 * 4. Auto-calculates allocated amount based on percentage
 * 5. Search functionality to find expenses quickly
 * 6. Styled consistently with the entity type's color scheme
 *
 * PROPS:
 * ------
 * - open (boolean, required): Controls modal visibility
 * - onOpenChange (function, required): Callback when modal should open/close
 * - entityType (string, required): One of 'invoice' | 'project' | 'payment' | 'contact'
 * - entityId (string, required): The UUID of the entity
 * - entityName (string, required): Display name for the header
 * - currency (string, optional): Currency code for amounts (default: 'USD')
 * - onUpdate (function, optional): Called after successful save
 * - numberFormat (string, optional): Number format for currency display
 *
 * USAGE EXAMPLES:
 * ---------------
 *
 * 1. In an Invoice Details page:
 *
 *    import AssignExpenseModal from '../finance/expenses/AssignExpenseModal';
 *
 *    const InvoiceDetails = ({ invoice }) => {
 *      const [showExpenses, setShowExpenses] = useState(false);
 *
 *      return (
 *        <>
 *          <button onClick={() => setShowExpenses(true)}>
 *            Assign Expenses
 *          </button>
 *
 *          <AssignExpenseModal
 *            open={showExpenses}
 *            onOpenChange={setShowExpenses}
 *            entityType="invoice"
 *            entityId={invoice.id}
 *            entityName={`Invoice #${invoice.invoice_number}`}
 *            currency={invoice.currency?.code}
 *            onUpdate={() => refetchInvoice()}
 *          />
 *        </>
 *      );
 *    };
 *
 * 2. In a Project Details page:
 *
 *    <AssignExpenseModal
 *      open={showExpenses}
 *      onOpenChange={setShowExpenses}
 *      entityType="project"
 *      entityId={project.id}
 *      entityName={project.name}
 *      onUpdate={() => refetchProject()}
 *    />
 *
 * 3. In a Contact/Client Details page:
 *
 *    <AssignExpenseModal
 *      open={showExpenses}
 *      onOpenChange={setShowExpenses}
 *      entityType="contact"
 *      entityId={contact.id}
 *      entityName={contact.business_name || `${contact.first_name} ${contact.last_name}`}
 *      onUpdate={() => refetchContact()}
 *    />
 *
 * 4. In a Payment Details page:
 *
 *    <AssignExpenseModal
 *      open={showExpenses}
 *      onOpenChange={setShowExpenses}
 *      entityType="payment"
 *      entityId={payment.id}
 *      entityName={`Payment #${payment.payment_number}`}
 *      currency={payment.currency?.code}
 *      onUpdate={() => refetchPayment()}
 *    />
 *
 * API INTEGRATION:
 * ----------------
 * The component uses the following API endpoints:
 *
 * - GET /crm/expenses/?allocated_to_type={type}&allocated_to_id={id}
 *   Fetches expenses allocated to the entity
 *
 * - GET /crm/expenses/{expense_id}/allocations
 *   Fetches all allocations for an expense
 *
 * - PUT /crm/expenses/{expense_id}/allocations
 *   Updates allocations for an expense
 *
 * CONTEXT DEPENDENCIES:
 * ---------------------
 * - NotificationContext: For showing success/error messages
 *
 * Note: This component fetches expenses directly from the API, so it does NOT
 * require ExpenseProvider to be in the component tree. This allows it to be
 * used from any page (invoices, projects, payments, contacts) without needing
 * to wrap those pages in ExpenseProvider.
 *
 * STYLING:
 * --------
 * The modal automatically adapts its color scheme based on the entity type:
 * - Invoice: Blue/Indigo gradient
 * - Project: Green/Emerald gradient
 * - Payment: Amber/Orange gradient
 * - Contact: Purple/Pink gradient
 */
