import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import projectsAPI from '../../../services/api/crm/projects';

/**
 * Entity type configuration
 */
const ENTITY_CONFIG: Record<string, any> = {
  invoice: {
    label: 'Invoice',
    pluralLabel: 'Invoices',
    icon: FileText,
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
    api: creditNotesAPI,
    listMethod: 'list',
    getAllocationsMethod: 'getAllocations',
    updateAllocationsMethod: 'updateAllocations',
    numberField: 'credit_note_number',
    dateField: 'issue_date',
    amountField: 'total',
  },
};

interface ProjectServiceAssignment {
  id: string;
  contact_service_id?: string;
  contact_service?: {
    template_service?: { name?: string } | null;
    name?: string;
    price?: string | number | null;
  } | null;
  [key: string]: unknown;
}

interface AssignFinanceItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: string;
  projectId: string;
  projectName: string;
  currency?: string;
  onUpdate?: () => void;
  projectServices?: ProjectServiceAssignment[];
  contactId?: string;
  existingEntityIds?: string[];
}

const AssignFinanceItemModal: React.FC<AssignFinanceItemModalProps> = ({
  open,
  onOpenChange,
  entityType,
  projectId,
  projectName,
  currency = 'USD',
  onUpdate,
  projectServices,
  contactId,
  existingEntityIds,
}) => {
  const { showSuccess, showError } = useNotification();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [assignedItems, setAssignedItems] = useState<any[]>([]); // { item_id, percentage, item, existingAllocations }
  const [allItems, setAllItems] = useState<any[]>([]);
  const [showAddSection, setShowAddSection] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Service allocation step (shown after saving invoice allocations)
  const [showServiceStep, setShowServiceStep] = useState(false);
  const [serviceLinks, setServiceLinks] = useState<Record<string, string>>({}); // invoice_id -> assignment_id
  const [savingServiceLinks, setSavingServiceLinks] = useState(false);
  const [newlyAddedInvoices, setNewlyAddedInvoices] = useState<any[]>([]);

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
    return allItems.filter((item: any) => !assignedIds.has(item.id));
  }, [allItems, assignedItems, config]);

  // Load all items and existing allocations when modal opens
  useEffect(() => {
    if (open && projectId && config) {
      setShowServiceStep(false);
      setServiceLinks({});
      setNewlyAddedInvoices([]);
      loadAllData();
    }
  }, [open, projectId, entityType]);

  const fetchItems = useCallback(async (search: string): Promise<any[]> => {
    if (!config) return [];
    setItemsLoading(true);
    try {
      const params: Record<string, string> = { per_page: '50' };
      if (search) params.search = search;
      if (contactId) params.contact_id = contactId;
      const result = await config.api[config.listMethod](params);
      const items = result.items || result || [];
      setAllItems(items);
      return items;
    } catch (error) {
      console.error('Failed to search items:', error);
      return [];
    } finally {
      setItemsLoading(false);
    }
  }, [config, contactId]);

  // Debounced server-side search
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchItems(searchQuery);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery, open, fetchItems]);

  // Early return AFTER all hooks
  if (!config) {
    return null;
  }

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Fetch items filtered by contact
      const items = await fetchItems('');

      // Use existingEntityIds from project detail to identify pre-assigned items
      // This avoids N+1 queries (fetching allocations for every single item)
      const preAssignedIds = new Set(existingEntityIds || []);
      const preAssignedItems = preAssignedIds.size > 0
        ? items.filter((item: any) => preAssignedIds.has(item.id))
        : [];

      // Only fetch per-item allocations for pre-assigned items (typically 0-5, not 50+)
      const assignments: any[] = [];
      for (const item of preAssignedItems) {
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
      // Track which items are newly added
      const newItems = assignedItems.filter((a: any) => a.isNew);

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

      // For invoices: if project has services and there are new invoices, show service prompt
      if (entityType === 'invoice' && projectServices && projectServices.length > 0 && newItems.length > 0) {
        setNewlyAddedInvoices(newItems);
        setShowServiceStep(true);
      } else {
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Failed to save allocations:', error);
      showError(error.message || `Failed to save ${config.label.toLowerCase()} allocations`);
    } finally {
      setSaving(false);
    }
  };

  // Handle saving service invoice links
  const handleSaveServiceLinks = async () => {
    const linksToCreate = Object.entries(serviceLinks).filter(([, assignmentId]) => assignmentId);
    if (linksToCreate.length === 0) {
      onOpenChange(false);
      return;
    }

    setSavingServiceLinks(true);
    try {
      const promises = linksToCreate.map(([invoiceId, assignmentId]) => {
        const invoice = newlyAddedInvoices.find((a: any) => a.item_id === invoiceId);
        const amount = invoice ? (parseFloat(invoice.item?.[config.amountField]) || 0) * (invoice.percentage / 100) : 0;
        return projectsAPI.createServiceInvoiceLink(projectId, assignmentId, {
          invoice_id: invoiceId,
          amount,
        });
      });
      await Promise.all(promises);
      showSuccess('Service links created');
    } catch (err: any) {
      console.error('Failed to create service links:', err);
      showError(err.message || 'Failed to link invoices to services');
    } finally {
      setSavingServiceLinks(false);
      setShowServiceStep(false);
      setServiceLinks({});
      setNewlyAddedInvoices([]);
      onOpenChange(false);
    }
  };

  // Skip service allocation step
  const handleSkipServiceStep = () => {
    setShowServiceStep(false);
    setServiceLinks({});
    setNewlyAddedInvoices([]);
    onOpenChange(false);
  };

  // Helper to get service name from assignment
  const getServiceNameFromAssignment = (svc: ProjectServiceAssignment): string => {
    return svc.contact_service?.template_service?.name || svc.contact_service?.name || 'Service';
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
        <div className="px-6 py-5 border-b border-[#e5e5e5] dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#fafafa] dark:bg-gray-700 border border-[#e5e5e5] dark:border-gray-600">
                <IconComponent className="h-5 w-5 text-[#71717a] dark:text-gray-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#09090b] dark:text-white">
                  Allocate {config.pluralLabel}
                </h2>
                <p className="text-sm text-[#71717a] dark:text-gray-400 mt-0.5">
                  {projectName}
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

        {/* Service Allocation Step */}
        {showServiceStep && (
          <div className="p-6">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[#09090b] dark:text-white">Link Invoices to Services</h3>
              <p className="text-xs text-[#71717a] dark:text-gray-400 mt-1">
                Optionally link each invoice to a project service.
              </p>
            </div>

            <div className="space-y-2 mb-6">
              {newlyAddedInvoices.map((assignment: any) => {
                const item = assignment.item;
                const itemNumber = item[config.numberField] || `#${item.id?.slice(0, 8)}`;
                const itemAmount = (parseFloat(item[config.amountField]) || 0) * (assignment.percentage / 100);
                const itemCurrency = item.currency?.code || currency;

                return (
                  <div
                    key={assignment.item_id}
                    className="flex items-center gap-4 p-3 bg-[#fafafa] dark:bg-gray-900 border border-[#e5e5e5] dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-[#09090b] dark:text-white">{itemNumber}</span>
                      <span className="text-xs text-[#71717a] dark:text-gray-400 ml-2">
                        {formatCurrency(itemAmount, itemCurrency)}
                      </span>
                    </div>
                    <select
                      value={serviceLinks[assignment.item_id] || ''}
                      onChange={(e) => setServiceLinks(prev => ({ ...prev, [assignment.item_id]: e.target.value }))}
                      className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-[#e5e5e5] dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#8e51ff] focus:border-transparent"
                    >
                      <option value="">No service</option>
                      {projectServices?.map((svc) => (
                        <option key={svc.id} value={svc.id}>
                          {getServiceNameFromAssignment(svc)}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleSkipServiceStep}
                className="px-4 py-2 text-sm font-medium text-[#71717a] dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleSaveServiceLinks}
                disabled={savingServiceLinks}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#8e51ff] rounded-lg hover:bg-[#7c3aed] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingServiceLinks ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Linking...
                  </>
                ) : (
                  'Allocate'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {!showServiceStep && (<><div className="p-6">
          {loading ? (
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
                      Total Allocated
                    </span>
                    <p className="text-lg font-semibold text-[#09090b] dark:text-white mt-1">
                      {formatCurrency(totalAssigned, currency)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-[#71717a] dark:text-gray-400">
                      {config.pluralLabel}
                    </span>
                    <p className="text-lg font-semibold text-[#09090b] dark:text-white mt-1">
                      {assignedItems.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Assigned Items List */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-[#09090b] dark:text-white mb-3">
                  Allocated {config.pluralLabel}
                </h3>

                {assignedItems.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-[#e5e5e5] dark:border-gray-700 rounded-lg">
                    <IconComponent className="h-8 w-8 mx-auto mb-2 text-[#71717a]/30 dark:text-gray-600" />
                    <p className="text-sm text-[#71717a] dark:text-gray-400">
                      No {config.pluralLabel.toLowerCase()} allocated to this project yet.
                    </p>
                    <p className="text-xs text-[#71717a] dark:text-gray-500 mt-1">
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
                          className="flex items-center gap-4 p-3 bg-[#fafafa] dark:bg-gray-900 border border-[#e5e5e5] dark:border-gray-700 rounded-lg"
                        >
                          {/* Item Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-[#09090b] dark:text-white truncate">
                                {itemNumber}
                              </span>
                              {assignment.isNew && (
                                <span className="px-1.5 py-0.5 text-xs font-medium bg-[#8e51ff]/10 text-[#8e51ff] dark:bg-purple-900/30 dark:text-purple-400 rounded">
                                  New
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-[#71717a] dark:text-gray-400">
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
                            <div className="text-sm font-semibold text-[#09090b] dark:text-white">
                              {formatCurrency(itemAmount, itemCurrency)}
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
                                value={assignment.percentage}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdatePercentage(assignment.item_id, e.target.value)}
                                className="w-full px-2 py-1.5 text-sm text-center bg-white dark:bg-gray-900 border border-[#e5e5e5] dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#8e51ff] focus:border-transparent"
                              />
                              <span className="text-xs text-[#71717a] dark:text-gray-400">%</span>
                            </div>
                            <div className="text-xs text-[#71717a] dark:text-gray-500 text-center mt-1">
                              {formatCurrency(
                                itemAmount * (assignment.percentage / 100),
                                itemCurrency
                              )}
                            </div>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => handleRemoveItem(assignment.item_id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add Item Section */}
              {showAddSection ? (
                <div className="p-4 bg-[#fafafa] dark:bg-gray-900 rounded-lg border border-[#e5e5e5] dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-[#09090b] dark:text-white">Add {config.label}</h4>
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
                      placeholder={`Search ${config.pluralLabel.toLowerCase()}...`}
                      value={searchQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-[#e5e5e5] dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-[#8e51ff] focus:border-transparent"
                      autoFocus
                    />
                  </div>

                  {/* Available Items */}
                  <div className="max-h-48 overflow-y-auto">
                    {itemsLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                      </div>
                    ) : availableItems.length === 0 ? (
                      <p className="text-center py-4 text-[#71717a] dark:text-gray-400 text-sm">
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
                              className="w-full flex items-center justify-between p-3 text-left bg-white dark:bg-gray-800 rounded-lg hover:bg-[#fafafa] dark:hover:bg-gray-700 transition-colors group"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-[#09090b] dark:text-white truncate">
                                  {itemNumber}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-[#71717a] dark:text-gray-400">
                                  <span>{getContactName(item)}</span>
                                  {itemDate && (
                                    <>
                                      <span>&middot;</span>
                                      <span>{formatDate(itemDate)}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-[#09090b] dark:text-white">
                                  {formatCurrency(itemAmount, itemCurrency)}
                                </span>
                                <Plus className="h-4 w-4 text-[#71717a] group-hover:text-[#8e51ff]" />
                              </div>
                            </button>
                          );
                        })}
                        {availableItems.length > 10 && (
                          <p className="text-center py-2 text-xs text-[#71717a] dark:text-gray-400">
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
                  className="w-full px-4 py-3 border border-dashed border-[#e5e5e5] dark:border-gray-600 rounded-lg text-[#71717a] dark:text-gray-400 hover:border-[#8e51ff] hover:text-[#8e51ff] dark:hover:border-purple-500 dark:hover:text-purple-400 transition-colors"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span className="text-sm font-medium">Add {config.label}</span>
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
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#8e51ff] rounded-lg hover:bg-[#7c3aed] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Allocations'
              )}
            </button>
          </div>
        </div></>)}
      </div>
    </Modal>
  );
};

export default AssignFinanceItemModal;
