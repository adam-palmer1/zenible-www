import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus,
  Trash2,
  X,
  Loader2,
  FileText,
  FolderKanban,
  CreditCard,
  User,
  AlertCircle,
  Check,
  ChevronDown,
  Search,
} from 'lucide-react';
import Modal from '../../ui/modal/Modal';
import { useNotification } from '../../../contexts/NotificationContext';
import { useContacts } from '../../../hooks/crm/useContacts';
import { useProjects } from '../../../hooks/crm/useProjects';
import { formatCurrency } from '../../../utils/currency';
import expensesAPI from '../../../services/api/finance/expenses';
import invoicesAPI from '../../../services/api/finance/invoices';
import paymentsAPI from '../../../services/api/finance/payments';

const ENTITY_TYPES: Record<string, any> = {
  invoice: {
    label: 'Invoice',
    icon: FileText,
    color: 'blue',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-300 dark:border-blue-700',
  },
  project: {
    label: 'Project',
    icon: FolderKanban,
    color: 'green',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-600 dark:text-green-400',
    borderColor: 'border-green-300 dark:border-green-700',
  },
  payment: {
    label: 'Payment',
    icon: CreditCard,
    color: 'amber',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-300 dark:border-amber-700',
  },
  contact: {
    label: 'Client/Contact',
    icon: User,
    color: 'purple',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    textColor: 'text-purple-600 dark:text-purple-400',
    borderColor: 'border-purple-300 dark:border-purple-700',
  },
};

interface SearchableDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: any[];
  placeholder: string;
  searchable?: boolean;
  icon?: any;
  disabled?: boolean;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder,
  searchable = false,
  icon: Icon,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt: any) => opt.value === value);

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    const query = searchQuery.toLowerCase();
    return options.filter((opt: any) => opt.label.toLowerCase().includes(query));
  }, [options, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-left transition-all ${
          isOpen ? 'ring-2 ring-purple-500 border-transparent' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 dark:hover:border-gray-500'}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {Icon && <Icon className="h-4 w-4 text-gray-400 flex-shrink-0" />}
          <span className={`truncate ${selectedOption ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
            {selectedOption?.label || placeholder}
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          {searchable && (
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                No options found
              </div>
            ) : (
              filteredOptions.map((option: any) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors ${
                    option.value === value
                      ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {option.icon && (
                    <span className={`flex-shrink-0 ${option.iconClass || ''}`}>
                      {option.icon}
                    </span>
                  )}
                  <span className="flex-1 truncate">{option.label}</span>
                  {option.value === value && (
                    <Check className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface ExpenseAllocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: any;
  onUpdate?: () => void;
}

const ExpenseAllocationModal: React.FC<ExpenseAllocationModalProps> = ({ open, onOpenChange, expense, onUpdate }) => {
  const { showSuccess, showError } = useNotification() as any;
  const { contacts: clients } = useContacts({ is_client: true }, 0, { skipInitialFetch: !open }) as any;
  const { projects } = useProjects() as any;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    if (open && expense) {
      loadData();
    }
  }, [open, expense?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allocationsRes, invoicesRes, paymentsRes] = await Promise.all([
        (expensesAPI as any).getAllocations(expense.id),
        (invoicesAPI as any).list({ per_page: 100 }).catch(() => ({ items: [] })),
        (paymentsAPI as any).list({ per_page: 100 }).catch(() => ({ items: [] })),
      ]);

      setAllocations((allocationsRes as any).allocations || []);
      setInvoices((invoicesRes as any).items || invoicesRes || []);
      setPayments((paymentsRes as any).items || paymentsRes || []);
    } catch (error) {
      console.error('Failed to load allocation data:', error);
      showError('Failed to load allocation data');
    } finally {
      setLoading(false);
    }
  };

  const totalPercentage = useMemo(() => {
    return allocations.reduce((sum: number, alloc: any) => sum + (parseFloat(alloc.percentage) || 0), 0);
  }, [allocations]);

  const remainingPercentage = 100 - totalPercentage;
  const isOverAllocated = totalPercentage > 100;

  const handleAddAllocation = () => {
    setAllocations([
      ...allocations,
      {
        id: `new-${Date.now()}`,
        entity_type: 'invoice',
        entity_id: '',
        percentage: Math.min(remainingPercentage, 100),
        isNew: true,
      },
    ]);
  };

  const handleUpdateAllocation = (index: number, updates: any) => {
    setAllocations((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };
      return updated;
    });
  };

  const handleRemoveAllocation = (index: number) => {
    setAllocations(allocations.filter((_: any, i: number) => i !== index));
  };

  const handleSave = async () => {
    const validAllocations = allocations.filter(
      (alloc: any) => alloc.entity_id && parseFloat(alloc.percentage) > 0
    );

    if (validAllocations.length === 0 && allocations.length > 0) {
      showError('Please select entities and set percentages for all allocations');
      return;
    }

    if (isOverAllocated) {
      showError('Total allocation cannot exceed 100%');
      return;
    }

    setSaving(true);
    try {
      await (expensesAPI as any).updateAllocations(
        expense.id,
        validAllocations.map(({ entity_type, entity_id, percentage }: any) => ({
          entity_type,
          entity_id,
          percentage: parseFloat(percentage),
        }))
      );
      showSuccess('Allocations saved successfully');
      onUpdate?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to save allocations:', error);
      showError(error.message || 'Failed to save allocations');
    } finally {
      setSaving(false);
    }
  };

  const getEntityOptions = (entityType: string) => {
    switch (entityType) {
      case 'invoice':
        return invoices.map((inv: any) => ({
          value: inv.id,
          label: `${inv.invoice_number || 'Draft'} - ${inv.contact?.business_name || inv.contact?.first_name || 'No client'}`,
        }));
      case 'project':
        return projects.map((proj: any) => ({
          value: proj.id,
          label: proj.name,
        }));
      case 'payment':
        return payments.map((pmt: any) => ({
          value: pmt.id,
          label: `${pmt.payment_number || pmt.id.slice(0, 8)} - ${formatCurrency(pmt.amount, pmt.currency?.code)}`,
        }));
      case 'contact':
        return clients.map((client: any) => ({
          value: client.id,
          label: client.business_name || `${client.first_name} ${client.last_name}`.trim() || client.email,
        }));
      default:
        return [];
    }
  };

  const entityTypeOptions = Object.entries(ENTITY_TYPES).map(([key, config]) => {
    const IconComp = config.icon;
    return {
      value: key,
      label: config.label,
      icon: <IconComp className={`h-4 w-4 ${config.textColor}`} />,
    };
  });

  const expenseAmount = parseFloat(expense?.amount) || 0;
  const currencyCode = expense?.currency?.code || 'USD';

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title=""
      size="2xl"
      showCloseButton={false}
    >
      <div className="-m-6 mb-0">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Allocate Expense
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {expense?.description || `Expense #${expense?.expense_number}`} &bull;{' '}
                {formatCurrency(expenseAmount, currencyCode)}
              </p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Total Allocated
                  </span>
                  <span
                    className={`text-sm font-bold ${
                      isOverAllocated
                        ? 'text-red-600'
                        : totalPercentage === 100
                        ? 'text-green-600'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {totalPercentage.toFixed(0)}% ({formatCurrency((expenseAmount * totalPercentage) / 100, currencyCode)})
                  </span>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isOverAllocated
                        ? 'bg-red-500'
                        : totalPercentage === 100
                        ? 'bg-green-500'
                        : 'bg-purple-500'
                    }`}
                    style={{ width: `${Math.min(totalPercentage, 100)}%` }}
                  />
                </div>
                {isOverAllocated && (
                  <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>Total allocation exceeds 100%</span>
                  </div>
                )}
              </div>

              <div className="space-y-3 mb-6">
                {allocations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                    <p className="text-sm">No allocations yet. Add one below.</p>
                  </div>
                ) : (
                  allocations.map((alloc: any, index: number) => {
                    const config = ENTITY_TYPES[alloc.entity_type];
                    const IconComp = config?.icon || FileText;
                    const options = getEntityOptions(alloc.entity_type);
                    const allocatedAmount = (expenseAmount * (parseFloat(alloc.percentage) || 0)) / 100;

                    return (
                      <div
                        key={alloc.id || index}
                        className={`p-4 border rounded-xl ${config?.borderColor || 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-800`}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${config?.bgColor}`}
                          >
                            <IconComp className={`h-5 w-5 ${config?.textColor}`} />
                          </div>

                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Type
                              </label>
                              <SearchableDropdown
                                value={alloc.entity_type}
                                onChange={(newType: string) => {
                                  handleUpdateAllocation(index, {
                                    entity_type: newType,
                                    entity_id: '',
                                  });
                                }}
                                options={entityTypeOptions}
                                placeholder="Select type..."
                                searchable={false}
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                {config?.label || 'Entity'}
                              </label>
                              <SearchableDropdown
                                value={alloc.entity_id}
                                onChange={(entityId: string) => handleUpdateAllocation(index, { entity_id: entityId })}
                                options={options}
                                placeholder={`Select ${config?.label?.toLowerCase()}...`}
                                searchable={true}
                                icon={config?.icon}
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Percentage
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="1"
                                  value={alloc.percentage}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    handleUpdateAllocation(index, { percentage: e.target.value })
                                  }
                                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                                <span className="text-sm text-gray-500 dark:text-gray-400">%</span>
                              </div>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                = {formatCurrency(allocatedAmount, currencyCode)}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleRemoveAllocation(index)}
                            className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <button
                onClick={handleAddAllocation}
                disabled={totalPercentage >= 100}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-purple-400 hover:text-purple-600 dark:hover:border-purple-500 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-center gap-2">
                  <Plus className="h-5 w-5" />
                  <span className="font-medium">Add Allocation</span>
                </div>
              </button>
            </>
          )}
        </div>

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
              disabled={saving || isOverAllocated}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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

export default ExpenseAllocationModal;
