import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  X,
  Loader2,
  Search,
  Check,
  Calendar,
  CreditCard,
  FileMinus,
} from 'lucide-react';
import Modal from '../../ui/modal/Modal';
import { useNotification } from '../../../contexts/NotificationContext';
import { formatCurrency } from '../../../utils/currency';
import invoicesAPI from '../../../services/api/finance/invoices';
import quotesAPI from '../../../services/api/finance/quotes';
import paymentsAPI from '../../../services/api/finance/payments';
import creditNotesAPI from '../../../services/api/finance/creditNotes';

/**
 * Entity type configuration
 */
const ENTITY_CONFIG: Record<string, any> = {
  invoice: {
    label: 'Invoice',
    pluralLabel: 'Invoices',
    icon: FileText,
    color: '#00a6f4',
    headerColor: 'from-[#e0f2fe] to-[#bae6fd]',
    iconBg: 'from-[#00a6f4] to-[#0284c7]',
    api: invoicesAPI,
    listMethod: 'list',
    getAllocationsMethod: 'getAllocations',
    updateAllocationsMethod: 'updateAllocations',
    numberField: 'invoice_number',
    dateField: 'issue_date',
    amountField: 'total',
  },
  quote: {
    label: 'Quote',
    pluralLabel: 'Quotes',
    icon: FileText,
    color: '#8b5cf6',
    headerColor: 'from-[#f5f0ff] to-[#ede5ff]',
    iconBg: 'from-[#8b5cf6] to-[#7c3aed]',
    api: quotesAPI,
    listMethod: 'list',
    getAllocationsMethod: 'getAllocations',
    updateAllocationsMethod: 'updateAllocations',
    numberField: 'quote_number',
    dateField: 'issue_date',
    amountField: 'total',
  },
  payment: {
    label: 'Payment',
    pluralLabel: 'Payments',
    icon: CreditCard,
    color: '#00a63e',
    headerColor: 'from-[#dcfce7] to-[#bbf7d0]',
    iconBg: 'from-[#00a63e] to-[#16a34a]',
    api: paymentsAPI,
    listMethod: 'list',
    getAllocationsMethod: 'getProjectAllocations',
    updateAllocationsMethod: 'updateProjectAllocations',
    numberField: 'payment_number',
    dateField: 'payment_date',
    amountField: 'amount',
  },
  credit_note: {
    label: 'Credit Note',
    pluralLabel: 'Credit Notes',
    icon: FileMinus,
    color: '#f97316',
    headerColor: 'from-[#ffedd5] to-[#fed7aa]',
    iconBg: 'from-[#f97316] to-[#ea580c]',
    api: creditNotesAPI,
    listMethod: 'list',
    getAllocationsMethod: 'getAllocations',
    updateAllocationsMethod: 'updateAllocations',
    numberField: 'credit_note_number',
    dateField: 'issue_date',
    amountField: 'total',
  },
};

interface AssignFinanceItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: string;
  projectId: string;
  projectName: string;
  currency?: string;
  onUpdate?: () => void;
}

const AssignFinanceItemModal: React.FC<AssignFinanceItemModalProps> = ({
  open,
  onOpenChange,
  entityType,
  projectId,
  projectName,
  currency = 'USD',
  onUpdate,
}) => {
  const { showSuccess, showError } = useNotification();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [assignedItems, setAssignedItems] = useState<any[]>([]); // { item_id, percentage, item, existingAllocations }
  const [allItems, setAllItems] = useState<any[]>([]);
  const [showAddSection, setShowAddSection] = useState(false);

  // Get config - use a fallback for when entityType is null/undefined
  const config = ENTITY_CONFIG[entityType] || null;
  const IconComponent = config?.icon || FileText;

  // Calculate totals
  const totalAssigned = useMemo(() => {
    if (!config) return 0;
    return assignedItems.reduce((sum: number, item: any) => {
      const amount = (parseFloat(item.item?.[config.amountField]) || 0) * (item.percentage / 100);
      return sum + amount;
    }, 0);
  }, [assignedItems, config]);

  // Filter available items (not already assigned)
  const availableItems = useMemo(() => {
    if (!config) return [];
    const assignedIds = new Set(assignedItems.map((a: any) => a.item_id));
    let filtered = allItems.filter((item: any) => !assignedIds.has(item.id));

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item: any) => {
        const number = item[config.numberField]?.toLowerCase() || '';
        const contactName = item.contact?.business_name?.toLowerCase() ||
          `${item.contact?.first_name || ''} ${item.contact?.last_name || ''}`.toLowerCase();
        return number.includes(query) || contactName.includes(query);
      });
    }

    return filtered;
  }, [allItems, assignedItems, searchQuery, config]);

  // Load all items and existing allocations when modal opens
  useEffect(() => {
    if (open && projectId && config) {
      loadAllData();
    }
  }, [open, projectId, entityType]);

  // Early return AFTER all hooks
  if (!config) {
    return null;
  }

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Fetch all items
      const itemsResult = await config.api[config.listMethod]({ per_page: 500, limit: 500 });
      const items = itemsResult.items || itemsResult || [];
      setAllItems(items);

      // Find items already allocated to this project
      const assignments: any[] = [];
      for (const item of items) {
        try {
          const allocResult = await config.api[config.getAllocationsMethod](item.id);
          const allocations = allocResult.allocations || [];
          const projectAlloc = allocations.find((a: any) => a.project_id === projectId);
          if (projectAlloc) {
            assignments.push({
              item_id: item.id,
              percentage: parseFloat(projectAlloc.percentage) || 100,
              item,
              existingAllocations: allocations,
            });
          }
        } catch (err) {
          // Item might not have allocations endpoint or other error
          console.debug(`Could not fetch allocations for ${entityType} ${item.id}:`, err);
        }
      }
      setAssignedItems(assignments);
    } catch (error) {
      console.error('Failed to load data:', error);
      showError(`Failed to load ${config.pluralLabel.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  // Add item to assignments
  const handleAddItem = async (item: any) => {
    // Fetch existing allocations for this item
    let existingAllocations: any[] = [];
    try {
      const allocResult = await config.api[config.getAllocationsMethod](item.id);
      existingAllocations = allocResult.allocations || [];
    } catch (err) {
      console.debug('Could not fetch allocations:', err);
    }

    setAssignedItems([
      ...assignedItems,
      {
        item_id: item.id,
        percentage: 100,
        item,
        existingAllocations,
        isNew: true,
      },
    ]);
    setSearchQuery('');
    setShowAddSection(false);
  };

  // Update percentage for an assignment
  const handleUpdatePercentage = (itemId: string, percentage: string) => {
    setAssignedItems(
      assignedItems.map((item: any) =>
        item.item_id === itemId
          ? { ...item, percentage: Math.min(100, Math.max(0, parseFloat(percentage) || 0)) }
          : item
      )
    );
  };

  // Remove item from assignments
  const handleRemoveItem = (itemId: string) => {
    setAssignedItems(assignedItems.filter((item: any) => item.item_id !== itemId));
  };

  // Save all assignments
  const handleSave = async () => {
    setSaving(true);
    try {
      // For each assigned item, update its allocations to include this project
      const updatePromises = assignedItems.map((assignment: any) => {
        // Start with existing allocations (excluding this project)
        let allocations = (assignment.existingAllocations || [])
          .filter((a: any) => a.project_id !== projectId)
          .map((a: any) => ({ project_id: a.project_id, percentage: parseFloat(a.percentage) }));

        // Add/update allocation for this project
        allocations.push({
          project_id: projectId,
          percentage: assignment.percentage,
        });

        return config.api[config.updateAllocationsMethod](assignment.item_id, allocations);
      });

      await Promise.all(updatePromises);

      showSuccess(`${config.label} allocations saved successfully`);
      onUpdate?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to save allocations:', error);
      showError(error.message || `Failed to save ${config.label.toLowerCase()} allocations`);
    } finally {
      setSaving(false);
    }
  };

  // Format date for display
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get contact name
  const getContactName = (item: any): string => {
    if (!item.contact) return '-';
    return item.contact.business_name ||
      `${item.contact.first_name || ''} ${item.contact.last_name || ''}`.trim() ||
      '-';
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
        <div className={`px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r ${config.headerColor} dark:from-gray-800 dark:to-gray-800`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${config.iconBg} shadow-lg`}>
                <IconComponent className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Allocate {config.pluralLabel}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {projectName}
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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: config.color }} />
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Total Allocated
                    </span>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {formatCurrency(totalAssigned, currency)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {config.pluralLabel}
                    </span>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {assignedItems.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Assigned Items List */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Allocated {config.pluralLabel}
                </h3>

                {assignedItems.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                    <IconComponent className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No {config.pluralLabel.toLowerCase()} allocated to this project yet.
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      Click the button below to add {config.pluralLabel.toLowerCase()}.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {assignedItems.map((assignment: any) => {
                      const item = assignment.item;
                      const itemNumber = item[config.numberField] || `#${item.id.slice(0, 8)}`;
                      const itemDate = item[config.dateField];
                      const itemAmount = item[config.amountField] || 0;
                      const itemCurrency = item.currency?.code || currency;

                      return (
                        <div
                          key={assignment.item_id}
                          className="flex items-center gap-4 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                        >
                          {/* Item Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white truncate">
                                {itemNumber}
                              </span>
                              {assignment.isNew && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                                  New
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                              <span>{getContactName(item)}</span>
                              {itemDate && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(itemDate)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Amount */}
                          <div className="text-right">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {formatCurrency(itemAmount, itemCurrency)}
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
                                value={assignment.percentage}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdatePercentage(assignment.item_id, e.target.value)}
                                className="w-full px-2 py-1.5 text-sm text-center bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              />
                              <span className="text-sm text-gray-500 dark:text-gray-400">%</span>
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1">
                              {formatCurrency(
                                itemAmount * (assignment.percentage / 100),
                                itemCurrency
                              )}
                            </div>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => handleRemoveItem(assignment.item_id)}
                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add Item Section */}
              {showAddSection ? (
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 dark:text-white">Add {config.label}</h4>
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
                      placeholder={`Search ${config.pluralLabel.toLowerCase()}...`}
                      value={searchQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      autoFocus
                    />
                  </div>

                  {/* Available Items */}
                  <div className="max-h-48 overflow-y-auto">
                    {availableItems.length === 0 ? (
                      <p className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                        {searchQuery ? `No matching ${config.pluralLabel.toLowerCase()} found.` : `No available ${config.pluralLabel.toLowerCase()} to allocate.`}
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {availableItems.slice(0, 10).map((item: any) => {
                          const itemNumber = item[config.numberField] || `#${item.id.slice(0, 8)}`;
                          const itemDate = item[config.dateField];
                          const itemAmount = item[config.amountField] || 0;
                          const itemCurrency = item.currency?.code || currency;

                          return (
                            <button
                              key={item.id}
                              onClick={() => handleAddItem(item)}
                              className="w-full flex items-center justify-between p-3 text-left bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-gray-900 dark:text-white truncate">
                                  {itemNumber}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                  <span>{getContactName(item)}</span>
                                  {itemDate && (
                                    <>
                                      <span>•</span>
                                      <span>{formatDate(itemDate)}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {formatCurrency(itemAmount, itemCurrency)}
                                </span>
                                <Plus className="h-4 w-4 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
                              </div>
                            </button>
                          );
                        })}
                        {availableItems.length > 10 && (
                          <p className="text-center py-2 text-sm text-gray-500 dark:text-gray-400">
                            Showing 10 of {availableItems.length} {config.pluralLabel.toLowerCase()}. Use search to narrow results.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddSection(true)}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-purple-500 hover:text-purple-600 dark:hover:border-purple-500 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Plus className="h-5 w-5" />
                    <span className="font-medium">Add {config.label}</span>
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
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#8e51ff] rounded-lg hover:bg-[#7c3aed] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Save Allocations
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AssignFinanceItemModal;
