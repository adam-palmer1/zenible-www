import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus,
  Trash2,
  X,
  Loader2,
  FolderKanban,
  AlertCircle,
  Check,
  ChevronDown,
  Search,
  Divide,
} from 'lucide-react';
import Modal from '../../ui/modal/Modal';
import { useNotification } from '../../../contexts/NotificationContext';
import { useProjects } from '../../../hooks/crm/useProjects';
import { formatCurrency } from '../../../utils/currency';
import invoicesAPI from '../../../services/api/finance/invoices';
import quotesAPI from '../../../services/api/finance/quotes';
import paymentsAPI from '../../../services/api/finance/payments';
import creditNotesAPI from '../../../services/api/finance/creditNotes';

/**
 * Color palette for project allocations
 */
const PROJECT_COLORS = [
  { bg: 'bg-emerald-500', border: 'border-emerald-300 dark:border-emerald-700', light: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
  { bg: 'bg-blue-500', border: 'border-blue-300 dark:border-blue-700', light: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  { bg: 'bg-purple-500', border: 'border-purple-300 dark:border-purple-700', light: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
  { bg: 'bg-amber-500', border: 'border-amber-300 dark:border-amber-700', light: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
  { bg: 'bg-rose-500', border: 'border-rose-300 dark:border-rose-700', light: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400' },
];

/**
 * Entity type labels
 */
const ENTITY_TYPE_LABELS: Record<string, string> = {
  invoice: 'Invoice',
  quote: 'Quote',
  payment: 'Payment',
  credit_note: 'Credit Note',
};

/**
 * Get the appropriate API based on entity type
 */
const getAPI = (entityType: string): any => {
  switch (entityType) {
    case 'invoice':
      return invoicesAPI;
    case 'quote':
      return quotesAPI;
    case 'payment':
      return paymentsAPI;
    case 'credit_note':
      return creditNotesAPI;
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
};

interface ProjectDropdownProps {
  value: string;
  onChange: (projectId: string) => void;
  projects: any[];
  excludeIds?: string[];
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Searchable Project Dropdown
 */
const ProjectDropdown: React.FC<ProjectDropdownProps> = ({
  value,
  onChange,
  projects,
  excludeIds = [],
  placeholder = 'Select project...',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedProject = projects.find((p: any) => p.id === value);

  const filteredProjects = useMemo(() => {
    const available = projects.filter((p: any) => !excludeIds.includes(p.id) || p.id === value);
    if (!searchQuery) return available;
    const query = searchQuery.toLowerCase();
    return available.filter((p: any) => p.name.toLowerCase().includes(query));
  }, [projects, excludeIds, value, searchQuery]);

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
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (projectId: string) => {
    onChange(projectId);
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
          isOpen ? 'ring-2 ring-emerald-500 border-transparent' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 dark:hover:border-gray-500'}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <FolderKanban className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className={`truncate ${selectedProject ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
            {selectedProject?.name || placeholder}
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredProjects.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                No projects found
              </div>
            ) : (
              filteredProjects.map((project: any) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => handleSelect(project.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors ${
                    project.id === value
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <FolderKanban className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="flex-1 truncate">{project.name}</span>
                  {project.id === value && (
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
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

interface ProjectAllocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: string;
  entityId: string;
  entityName: string;
  entityAmount: number | string;
  currency?: string;
  currentAllocations?: any[];
  onUpdate?: () => void;
}

/**
 * ProjectAllocationModal Component
 *
 * Allocate an entity (invoice/quote/payment/credit note) to one or more projects
 */
const ProjectAllocationModal: React.FC<ProjectAllocationModalProps> = ({
  open,
  onOpenChange,
  entityType,
  entityId,
  entityName,
  entityAmount,
  currency = 'GBP',
  currentAllocations = [],
  onUpdate,
}) => {
  const { showSuccess, showError } = useNotification();
  const { projects, loading: projectsLoading } = useProjects();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allocations, setAllocations] = useState<any[]>([]);

  // Load allocations when modal opens
  useEffect(() => {
    if (open && entityId) {
      loadAllocations();
    }
  }, [open, entityId]);

  const loadAllocations = async () => {
    setLoading(true);
    try {
      // If currentAllocations provided, use them
      if (currentAllocations && currentAllocations.length > 0) {
        setAllocations(
          currentAllocations.map((alloc: any) => ({
            id: alloc.id || `existing-${alloc.project_id}`,
            project_id: alloc.project_id,
            project_name: alloc.project_name,
            percentage: alloc.percentage,
          }))
        );
      } else {
        // Otherwise fetch from API
        const api = getAPI(entityType);
        const methodName = entityType === 'payment' ? 'getProjectAllocations' : 'getAllocations';
        const response = await api[methodName](entityId);
        setAllocations(
          (response.allocations || []).map((alloc: any) => ({
            id: alloc.id || `existing-${alloc.project_id}`,
            project_id: alloc.project_id,
            project_name: alloc.project_name,
            percentage: alloc.percentage,
          }))
        );
      }
    } catch (error) {
      console.error('Failed to load allocations:', error);
      // Start with empty allocations if fetch fails
      setAllocations([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalPercentage = useMemo(() => {
    return allocations.reduce((sum: number, alloc: any) => sum + (parseFloat(alloc.percentage) || 0), 0);
  }, [allocations]);

  const remainingPercentage = 100 - totalPercentage;
  const isOverAllocated = totalPercentage > 100;

  // Get already selected project IDs
  const selectedProjectIds = useMemo(() => {
    return allocations.map((a: any) => a.project_id).filter(Boolean);
  }, [allocations]);

  // Add new allocation row
  const handleAddAllocation = () => {
    setAllocations([
      ...allocations,
      {
        id: `new-${Date.now()}`,
        project_id: '',
        project_name: '',
        percentage: Math.min(Math.max(remainingPercentage, 0), 100),
      },
    ]);
  };

  // Update allocation
  const handleUpdateAllocation = (index: number, updates: Record<string, any>) => {
    setAllocations((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };

      // If project changed, update the name
      if (updates.project_id) {
        const project = projects.find((p: any) => p.id === updates.project_id);
        updated[index].project_name = project?.name || '';
      }

      return updated;
    });
  };

  // Remove allocation
  const handleRemoveAllocation = (index: number) => {
    setAllocations(allocations.filter((_: any, i: number) => i !== index));
  };

  // Split evenly among selected projects
  const handleSplitEvenly = () => {
    if (allocations.length === 0) return;
    const validAllocations = allocations.filter((a: any) => a.project_id);
    if (validAllocations.length === 0) return;

    const evenPercentage = Math.floor(100 / validAllocations.length);
    const remainder = 100 - evenPercentage * validAllocations.length;

    setAllocations((prev) =>
      prev.map((alloc: any, index: number) => {
        if (!alloc.project_id) return alloc;
        // Give remainder to first allocation
        const isFirstValid = prev.slice(0, index + 1).filter((a: any) => a.project_id).length === 1;
        return {
          ...alloc,
          percentage: evenPercentage + (isFirstValid ? remainder : 0),
        };
      })
    );
  };

  // Save allocations
  const handleSave = async () => {
    const validAllocations = allocations.filter(
      (alloc: any) => alloc.project_id && parseFloat(alloc.percentage) > 0
    );

    if (validAllocations.length === 0 && allocations.length > 0) {
      showError('Please select projects and set percentages for all allocations');
      return;
    }

    if (isOverAllocated) {
      showError('Total allocation cannot exceed 100%');
      return;
    }

    setSaving(true);
    try {
      const api = getAPI(entityType);
      const methodName = entityType === 'payment' ? 'updateProjectAllocations' : 'updateAllocations';
      await api[methodName](
        entityId,
        validAllocations.map(({ project_id, percentage }: any) => ({
          project_id,
          percentage: parseFloat(percentage),
        }))
      );
      showSuccess('Project allocations saved successfully');
      onUpdate?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to save allocations:', error);
      showError(error.message || 'Failed to save project allocations');
    } finally {
      setSaving(false);
    }
  };

  const amount = parseFloat(entityAmount as string) || 0;

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
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Allocate to Projects
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {entityName} • {formatCurrency(amount, currency)}
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

        {/* Content */}
        <div className="p-6">
          {loading || projectsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {/* Summary Bar */}
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
                    {totalPercentage.toFixed(0)}% ({formatCurrency((amount * totalPercentage) / 100, currency)})
                  </span>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  {allocations.map((alloc: any, index: number) => (
                    <div
                      key={alloc.id || index}
                      className={`h-full inline-block ${PROJECT_COLORS[index % PROJECT_COLORS.length].bg} transition-all duration-300`}
                      style={{ width: `${Math.min(parseFloat(alloc.percentage) || 0, 100 - allocations.slice(0, index).reduce((sum: number, a: any) => sum + (parseFloat(a.percentage) || 0), 0))}%` }}
                    />
                  ))}
                </div>
                {isOverAllocated && (
                  <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>Total allocation exceeds 100%</span>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              {allocations.length > 1 && (
                <div className="mb-4 flex gap-2">
                  <button
                    onClick={handleSplitEvenly}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Divide className="h-3.5 w-3.5" />
                    Split Evenly
                  </button>
                </div>
              )}

              {/* Allocations List */}
              <div className="space-y-3 mb-6">
                {allocations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                    <FolderKanban className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No project allocations yet</p>
                    <p className="text-xs mt-1">Click "Add Project" to allocate this {ENTITY_TYPE_LABELS[entityType]?.toLowerCase()} to a project</p>
                  </div>
                ) : (
                  allocations.map((alloc: any, index: number) => {
                    const colorScheme = PROJECT_COLORS[index % PROJECT_COLORS.length];
                    const allocatedAmount = (amount * (parseFloat(alloc.percentage) || 0)) / 100;

                    return (
                      <div
                        key={alloc.id || index}
                        className={`p-4 border rounded-xl ${colorScheme.border} bg-white dark:bg-gray-800`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Project Icon */}
                          <div
                            className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${colorScheme.light}`}
                          >
                            <FolderKanban className={`h-5 w-5 ${colorScheme.text}`} />
                          </div>

                          {/* Form Fields */}
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Project Selector */}
                            <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Project
                              </label>
                              <ProjectDropdown
                                value={alloc.project_id}
                                onChange={(projectId: string) => handleUpdateAllocation(index, { project_id: projectId })}
                                projects={projects}
                                excludeIds={selectedProjectIds}
                                placeholder="Select project..."
                              />
                            </div>

                            {/* Percentage */}
                            <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Percentage
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0.01"
                                  max="100"
                                  step="0.01"
                                  value={alloc.percentage}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    handleUpdateAllocation(index, { percentage: e.target.value })
                                  }
                                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                                <span className="text-sm text-gray-500 dark:text-gray-400">%</span>
                              </div>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                = {formatCurrency(allocatedAmount, currency)}
                              </p>
                            </div>
                          </div>

                          {/* Remove Button */}
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

              {/* Add Button */}
              <button
                onClick={handleAddAllocation}
                disabled={totalPercentage >= 100}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-emerald-400 hover:text-emerald-600 dark:hover:border-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-center gap-2">
                  <Plus className="h-5 w-5" />
                  <span className="font-medium">Add Project</span>
                </div>
              </button>
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
              disabled={saving || isOverAllocated}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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

export default ProjectAllocationModal;
