import React, { useState, useEffect, useMemo } from 'react';
import { X, FileText, Receipt, CreditCard, FileMinus, Loader2, Settings2, ChevronDown, ChevronUp, Trash2, Plus, type LucideProps } from 'lucide-react';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import BillableHoursTab from './BillableHoursTab';
import { PROJECT_STATUS_LABELS, SERVICE_STATUS, SERVICE_STATUS_LABELS, type ProjectStatus, type ServiceStatus } from '../../constants/crm';
import GenericDropdown from './GenericDropdown';
import { formatCurrency } from '../../utils/currency';
import { useNotification } from '../../contexts/NotificationContext';
import projectsAPI from '../../services/api/crm/projects';
import ConfirmationModal from '../common/ConfirmationModal';
import AssignExpenseModal from '../finance/expenses/AssignExpenseModal';
import AssignFinanceItemModal from '../finance/allocations/AssignFinanceItemModal';

/** Nested finance entity shape (invoice, quote, credit note) */
interface FinanceEntityBase {
  status?: string;
  total?: number;
  issue_date?: string;
  currency?: { code?: string } | null;
  [key: string]: unknown;
}

interface InvoiceEntity extends FinanceEntityBase {
  invoice_number?: string;
}

interface QuoteEntity extends FinanceEntityBase {
  quote_number?: string;
}

interface PaymentEntity {
  payment_number?: string;
  payment_date?: string;
  amount?: number;
  status?: string;
  currency?: { code?: string } | null;
  [key: string]: unknown;
}

interface CreditNoteEntity extends FinanceEntityBase {
  credit_note_number?: string;
}

interface ExpenseEntity {
  expense_number?: string;
  expense_date?: string;
  amount?: number;
  status?: string;
  currency?: { code?: string } | null;
  [key: string]: unknown;
}

/** Allocation record as returned by the project detail API */
interface ProjectFinanceAllocation {
  id?: string;
  entity_id?: string;
  allocated_amount: string;
  percentage?: number;
  entity_number?: string;
  entity_total?: number;
  date?: string;
  invoice?: InvoiceEntity;
  quote?: QuoteEntity;
  payment?: PaymentEntity;
  credit_note?: CreditNoteEntity;
  expense?: ExpenseEntity;
  [key: string]: unknown;
}

/** Accumulator for finance totals */
interface FinanceTotals {
  count: number;
  total: number;
}

/** Contact info nested inside the project response */
interface ProjectContact {
  first_name?: string | null;
  last_name?: string | null;
  business_name?: string | null;
  currency_id?: string | null;
  currency?: { code?: string } | null;
}

/** Project data as returned by the detail API (extends generated schema with runtime fields) */
interface ProjectData {
  id: string;
  name: string;
  status: string;
  start_date?: string | null;
  end_date?: string | null;
  currency?: string | null;
  services_count?: number;
  default_hourly_rate?: string | null;
  default_currency_id?: string | null;
  default_currency?: { code?: string } | null;
  contact?: ProjectContact | null;
  contact_id?: string;
  invoice_allocations?: ProjectFinanceAllocation[];
  quote_allocations?: ProjectFinanceAllocation[];
  payment_allocations?: ProjectFinanceAllocation[];
  credit_note_allocations?: ProjectFinanceAllocation[];
  expense_allocations?: ProjectFinanceAllocation[];
  [key: string]: unknown;
}

/** Service assignment as returned by project services endpoint */
interface ProjectServiceAssignment {
  id: string;
  status?: string;
  assigned_at?: string;
  assignment_notes?: string | null;
  price?: string | number | null;
  contact_service?: {
    name?: string;
    price?: string | number | null;
    description?: string | null;
    status?: string | null;
    currency_id?: string | null;
    currency?: { code?: string } | null;
    frequency_type?: string | null;
    template_service?: {
      name?: string;
      description?: string | null;
    } | null;
  } | null;
  service?: {
    name?: string;
    rate?: string | number | null;
    description?: string | null;
  } | null;
  [key: string]: unknown;
}

interface ProjectDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectData | null;
  onUpdate?: () => void;
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'services', label: 'Services' },
  { id: 'billable_hours', label: 'Billable Hours' },
  { id: 'finance', label: 'Finance' },
];

const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({ isOpen, onClose, project: projectProp, onUpdate: _onUpdate }) => {
  const { showError, showSuccess } = useNotification();
  useEscapeKey(onClose, isOpen);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [services, setServices] = useState<ProjectServiceAssignment[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [expandedServices, setExpandedServices] = useState<Record<string, boolean>>({});
  const [updatingServiceId, setUpdatingServiceId] = useState<string | null>(null);
  const [detachConfirm, setDetachConfirm] = useState<{ isOpen: boolean; service: ProjectServiceAssignment | null }>({ isOpen: false, service: null });
  const [updatingProjectStatus, setUpdatingProjectStatus] = useState(false);

  // Finance allocation modals
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [financeModal, setFinanceModal] = useState<{ open: boolean; type: string | null }>({ open: false, type: null });
  const [deleteAllocConfirm, setDeleteAllocConfirm] = useState<{ isOpen: boolean; allocationId: string | null; entityType: string | null; label: string }>({ isOpen: false, allocationId: null, entityType: null, label: '' });
  const [deletingAlloc, setDeletingAlloc] = useState(false);

  // Fetch project details
  const fetchProjectDetails = async (showLoading = true) => {
    if (!projectProp?.id) return;

    try {
      if (showLoading) setLoadingDetails(true);
      const data = await projectsAPI.get(projectProp.id) as ProjectData;
      setProject(data);
    } catch (err) {
      console.error('Error fetching project details:', err);
      setProject(projectProp);
    } finally {
      if (showLoading) setLoadingDetails(false);
    }
  };

  // Fetch services for the project
  const fetchServices = async () => {
    if (!projectProp?.id) return;

    try {
      setLoadingServices(true);
      const data = await projectsAPI.listServices(projectProp.id) as { items?: ProjectServiceAssignment[] } | ProjectServiceAssignment[];
      const items = Array.isArray(data) ? data : (data.items || []);
      // Map status from nested contact_service to top-level for display
      const mapped = items.map((s: ProjectServiceAssignment) => ({
        ...s,
        status: s.status || s.contact_service?.status || undefined,
      }));
      setServices(mapped);
    } catch (err) {
      console.error('Error fetching project services:', err);
      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  };

  // Handle project status change
  const handleProjectStatusChange = async (newStatus: string) => {
    if (!project?.id || newStatus === project.status) return;

    try {
      setUpdatingProjectStatus(true);
      await projectsAPI.update(project.id, { status: newStatus });
      setProject(prev => prev ? { ...prev, status: newStatus } : prev);
      showSuccess(`Project status updated to ${PROJECT_STATUS_LABELS[newStatus as ProjectStatus]}`);
      _onUpdate?.();
    } catch (err: unknown) {
      console.error('Error updating project status:', err);
      showError((err instanceof Error ? err.message : null) || 'Failed to update project status');
    } finally {
      setUpdatingProjectStatus(false);
    }
  };

  // Extract allocated entities from project data (safe for null project)
  const invoiceAllocations = project?.invoice_allocations || [];
  const quoteAllocations = project?.quote_allocations || [];
  const paymentAllocations = project?.payment_allocations || [];
  const creditNoteAllocations = project?.credit_note_allocations || [];
  const expenseAllocations = project?.expense_allocations || [];

  // Calculate totals for financial tabs - hooks must be called before any returns
  const invoiceTotals = useMemo(() => {
    return invoiceAllocations.reduce((acc: FinanceTotals, alloc: ProjectFinanceAllocation) => ({
      count: acc.count + 1,
      total: acc.total + (parseFloat(alloc.allocated_amount) || 0)
    }), { count: 0, total: 0 });
  }, [invoiceAllocations]);

  const quoteTotals = useMemo(() => {
    return quoteAllocations.reduce((acc: FinanceTotals, alloc: ProjectFinanceAllocation) => ({
      count: acc.count + 1,
      total: acc.total + (parseFloat(alloc.allocated_amount) || 0)
    }), { count: 0, total: 0 });
  }, [quoteAllocations]);

  const paymentTotals = useMemo(() => {
    return paymentAllocations.reduce((acc: FinanceTotals, alloc: ProjectFinanceAllocation) => ({
      count: acc.count + 1,
      total: acc.total + (parseFloat(alloc.allocated_amount) || 0)
    }), { count: 0, total: 0 });
  }, [paymentAllocations]);

  const creditNoteTotals = useMemo(() => {
    return creditNoteAllocations.reduce((acc: FinanceTotals, alloc: ProjectFinanceAllocation) => ({
      count: acc.count + 1,
      total: acc.total + (parseFloat(alloc.allocated_amount) || 0)
    }), { count: 0, total: 0 });
  }, [creditNoteAllocations]);

  const expenseTotals = useMemo(() => {
    return expenseAllocations.reduce((acc: FinanceTotals, alloc: ProjectFinanceAllocation) => ({
      count: acc.count + 1,
      total: acc.total + (parseFloat(alloc.allocated_amount) || 0)
    }), { count: 0, total: 0 });
  }, [expenseAllocations]);

  const serviceTotals = useMemo(() => {
    return services.reduce((acc, s) => {
      const price = parseFloat(String(s.contact_service?.price ?? s.price ?? 0)) || 0;
      const freq = s.contact_service?.frequency_type || 'one_off';
      if (freq === 'recurring') {
        acc.recurring += price;
        acc.recurringCount += 1;
      } else {
        acc.oneOff += price;
        acc.oneOffCount += 1;
      }
      acc.total += price;
      return acc;
    }, { total: 0, oneOff: 0, recurring: 0, oneOffCount: 0, recurringCount: 0 });
  }, [services]);

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen && projectProp?.id) {
      fetchProjectDetails(true);
      fetchServices();
      setActiveTab('overview');
    } else if (!isOpen) {
      setProject(null);
      setServices([]);
    }
  }, [isOpen, projectProp?.id]);


  // Early returns AFTER all hooks
  if (!isOpen || !projectProp) return null;

  // Show loading state while fetching details
  if (loadingDetails || !project) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl p-4 md:p-8 dark:bg-gray-800">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Helper to get client display name
  const getClientName = () => {
    if (project.contact) {
      const { first_name, last_name, business_name } = project.contact;
      if (business_name) return business_name;
      if (first_name || last_name) return `${first_name || ''} ${last_name || ''}`.trim();
    }
    return 'No Client';
  };

  // Render Overview Tab
  const renderOverviewTab = () => (
    <div className="space-y-4">
      {/* Client & Services Row */}
      <div className="flex gap-4">
        <div className="flex-1 bg-[#fafafa] dark:bg-gray-900 border border-[#e5e5e5] dark:border-gray-700 rounded-xl p-4">
          <p className="text-sm text-[#71717a] dark:text-gray-400 leading-[22px]">Client</p>
          <p className="text-lg font-semibold text-[#09090b] dark:text-white leading-[26px]">
            {getClientName()}
          </p>
        </div>
        <div className="flex-1 bg-[#fafafa] dark:bg-gray-900 border border-[#e5e5e5] dark:border-gray-700 rounded-xl p-4">
          <p className="text-sm text-[#71717a] dark:text-gray-400 leading-[22px]">Services</p>
          <p className="text-lg font-semibold text-[#09090b] dark:text-white leading-[26px]">
            {project.services_count || services.length || 0} assigned
          </p>
        </div>
      </div>

      {/* Date Row with Divider */}
      <div className="bg-[#fafafa] dark:bg-gray-900 border border-[#e5e5e5] dark:border-gray-700 rounded-xl p-4 flex items-center gap-4 md:gap-6">
        <div className="flex-1">
          <p className="text-sm text-[#71717a] dark:text-gray-400 leading-[22px]">Start Date</p>
          <p className="text-lg font-semibold text-[#09090b] dark:text-white leading-[26px]">
            {formatDate(project.start_date ?? '')}
          </p>
        </div>
        <div className="w-px h-[52px] bg-[#e5e5e5] dark:bg-gray-700" />
        <div className="flex-1">
          <p className="text-sm text-[#71717a] dark:text-gray-400 leading-[22px]">End Date</p>
          <p className="text-lg font-semibold text-[#09090b] dark:text-white leading-[26px]">
            {formatDate(project.end_date ?? '')}
          </p>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="pt-4">
        <h4 className="text-lg font-semibold text-[#09090b] dark:text-white leading-[26px] mb-3.5">
          Financial Summary
        </h4>
        <div className="flex gap-3.5">
          {/* Services Card */}
          <div className="flex-1 bg-white dark:bg-gray-800 border border-[#8b5cf6] rounded-xl p-4">
            <p className="text-sm text-[#8b5cf6] leading-[22px]">Services</p>
            <div className="mt-2 space-y-1">
              <p className="text-lg font-semibold text-[#09090b] dark:text-white leading-[26px]">
                {formatCurrency(serviceTotals.total, project.currency || 'USD')}
              </p>
              <div className="flex items-center gap-2 text-xs text-[#71717a] dark:text-gray-400">
                <span>{formatCurrency(serviceTotals.oneOff, project.currency || 'USD')} one-off</span>
                <span>&middot;</span>
                <span>{formatCurrency(serviceTotals.recurring, project.currency || 'USD')} recurring</span>
              </div>
            </div>
          </div>
          {/* Invoice Card */}
          <div className="flex-1 bg-white dark:bg-gray-800 border border-[#00a6f4] rounded-xl p-4">
            <p className="text-sm text-[#00a6f4] leading-[22px]">Invoice</p>
            <div className="mt-2 space-y-1">
              <p className="text-lg font-semibold text-[#09090b] dark:text-white leading-[26px]">
                {formatCurrency(invoiceTotals.total, project.currency || 'USD')}
              </p>
              <p className="text-sm text-[#71717a] dark:text-gray-400 leading-[22px]">
                {invoiceTotals.count} allocated
              </p>
            </div>
          </div>
          {/* Payments Card */}
          <div className="flex-1 bg-white dark:bg-gray-800 border border-[#00a63e] rounded-xl p-4">
            <p className="text-sm text-[#00a63e] leading-[22px]">Payments</p>
            <div className="mt-2 space-y-1">
              <p className="text-lg font-semibold text-[#09090b] dark:text-white leading-[26px]">
                {formatCurrency(paymentTotals.total, project.currency || 'USD')}
              </p>
              <p className="text-sm text-[#71717a] dark:text-gray-400 leading-[22px]">
                {paymentTotals.count} allocated
              </p>
            </div>
          </div>
          {/* Expenses Card */}
          <div className="flex-1 bg-white dark:bg-gray-800 border border-[#fb2c36] rounded-xl p-4">
            <p className="text-sm text-[#fb2c36] leading-[22px]">Expenses</p>
            <div className="mt-2 space-y-1">
              <p className="text-lg font-semibold text-[#09090b] dark:text-white leading-[26px]">
                {formatCurrency(expenseTotals.total, project.currency || 'USD')}
              </p>
              <p className="text-sm text-[#71717a] dark:text-gray-400 leading-[22px]">
                {expenseTotals.count} allocated
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Helper to get service name from various possible sources
  const getServiceName = (service: Partial<ProjectServiceAssignment>) => {
    // Try template_service name first
    if (service.contact_service?.template_service?.name) {
      return service.contact_service.template_service.name;
    }
    // Try contact_service name
    if (service.contact_service?.name) {
      return service.contact_service.name;
    }
    // Try direct service reference (legacy structure)
    if (service.service?.name) {
      return service.service.name;
    }
    // Fallback
    return 'Service';
  };

  // Helper to get service price
  const getServicePrice = (service: Partial<ProjectServiceAssignment>) => {
    return service.contact_service?.price || service.service?.rate || service.price || null;
  };

  // Helper to get service description
  const getServiceDescription = (service: Partial<ProjectServiceAssignment>) => {
    return service.contact_service?.template_service?.description ||
           service.contact_service?.description ||
           service.service?.description ||
           null;
  };

  // Toggle service expansion
  const toggleServiceExpand = (serviceId: string) => {
    setExpandedServices(prev => ({
      ...prev,
      [serviceId]: !prev[serviceId]
    }));
  };

  // Change service status
  const handleChangeServiceStatus = async (service: ProjectServiceAssignment, newStatus: string) => {
    if (!project?.id || !service?.id) return;

    try {
      setUpdatingServiceId(service.id);

      await projectsAPI.updateServiceAssignment(project.id, service.id, {
        status: newStatus
      });

      // Update local state
      setServices(prev => prev.map(s =>
        s.id === service.id ? { ...s, status: newStatus } : s
      ));

      showSuccess(`Service status updated to ${SERVICE_STATUS_LABELS[newStatus as ServiceStatus]}`);
    } catch (err: unknown) {
      console.error('Error updating service status:', err);
      showError((err instanceof Error ? err.message : null) || 'Failed to update service status');
    } finally {
      setUpdatingServiceId(null);
    }
  };

  // Handle detach service
  const handleDetachService = async () => {
    const service = detachConfirm.service;
    if (!project?.id || !service?.id) return;

    try {
      setUpdatingServiceId(service.id);
      await projectsAPI.unassignService(project.id, service.id);

      // Remove from local state
      setServices(prev => prev.filter(s => s.id !== service.id));

      showSuccess('Service detached from project');
      // Modal closes automatically via ConfirmationModal's onConfirm handler
    } catch (err: unknown) {
      console.error('Error detaching service:', err);
      showError((err instanceof Error ? err.message : null) || 'Failed to detach service');
    } finally {
      setUpdatingServiceId(null);
      setDetachConfirm({ isOpen: false, service: null });
    }
  };

  // Render Services Tab
  const renderServicesTab = () => (
    <div className="space-y-3">
      {loadingServices ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Settings2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No services assigned to this project</p>
        </div>
      ) : (
        services.map((service, idx) => {
          const serviceName = getServiceName(service);
          const servicePrice = getServicePrice(service);
          const serviceDescription = getServiceDescription(service);
          const assignedDate = service.assigned_at ? formatDate(service.assigned_at) : null;
          const isExpanded = expandedServices[service.id];
          const isUpdating = updatingServiceId === service.id;

          const isInactiveStatus = service.status === SERVICE_STATUS.INACTIVE;

          return (
            <div
              key={service.id || idx}
              className={`bg-[#fafafa] dark:bg-gray-900 border rounded-xl overflow-hidden transition-colors ${
                isInactiveStatus
                  ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800'
                  : 'border-[#e5e5e5] dark:border-gray-700'
              }`}
            >
              {/* Header - Always Visible */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
                onClick={() => toggleServiceExpand(service.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button className="p-0.5 text-[#71717a] dark:text-gray-400">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-semibold ${
                      isInactiveStatus
                        ? 'text-[#71717a] dark:text-gray-400'
                        : 'text-[#09090b] dark:text-white'
                    }`}>
                      {serviceName}
                    </span>
                  </div>
                </div>
                {servicePrice && (
                  <div className={`text-sm font-semibold ml-4 ${
                    isInactiveStatus
                      ? 'text-[#71717a] dark:text-gray-400'
                      : 'text-[#09090b] dark:text-white'
                  }`}>
                    {formatCurrency(servicePrice, project.currency || 'USD')}
                  </div>
                )}
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-0 border-t border-[#e5e5e5] dark:border-gray-700">
                  <div className="pt-4 space-y-4">
                    {/* Service Details */}
                    <div className="grid grid-cols-2 gap-4">
                      {serviceDescription && (
                        <div className="col-span-2">
                          <p className="text-xs text-[#71717a] dark:text-gray-500 mb-1">Description</p>
                          <p className="text-sm text-[#09090b] dark:text-white">{serviceDescription}</p>
                        </div>
                      )}

                      {assignedDate && (
                        <div>
                          <p className="text-xs text-[#71717a] dark:text-gray-500 mb-1">Assigned Date</p>
                          <p className="text-sm text-[#09090b] dark:text-white">{assignedDate}</p>
                        </div>
                      )}

                      {service.assignment_notes && (
                        <div className="col-span-2">
                          <p className="text-xs text-[#71717a] dark:text-gray-500 mb-1">Notes</p>
                          <p className="text-sm text-[#09090b] dark:text-white italic">{service.assignment_notes}</p>
                        </div>
                      )}

                      {service.contact_service?.currency_id && (
                        <div>
                          <p className="text-xs text-[#71717a] dark:text-gray-500 mb-1">Currency</p>
                          <p className="text-sm text-[#09090b] dark:text-white">
                            {service.contact_service?.currency?.code || 'USD'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#e5e5e5] dark:border-gray-700">
                      {/* Status Dropdown */}
                      <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <GenericDropdown
                          value={service.status || SERVICE_STATUS.ACTIVE}
                          onChange={(newStatus: string) => handleChangeServiceStatus(service, newStatus)}
                          options={Object.entries(SERVICE_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
                          disabled={isUpdating}
                          className="w-[140px]"
                        />
                      </div>

                      {/* Detach Button */}
                      <button
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          setDetachConfirm({ isOpen: true, service });
                        }}
                        disabled={isUpdating}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Detach</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  // Handle opening finance allocation modal
  const openFinanceModal = (type: string) => {
    if (type === 'expense') {
      setShowExpenseModal(true);
    } else {
      setFinanceModal({ open: true, type });
    }
  };

  // Refresh project data after allocation changes
  const handleAllocationUpdate = () => {
    fetchProjectDetails(false);
  };

  // Handle deleting an allocation from the finance tab
  const handleDeleteAllocation = async () => {
    if (!project?.id || !deleteAllocConfirm.allocationId || !deleteAllocConfirm.entityType) return;

    try {
      setDeletingAlloc(true);
      if (deleteAllocConfirm.entityType === 'expense') {
        await projectsAPI.deleteExpenseAllocation(project.id, deleteAllocConfirm.allocationId);
      } else {
        await projectsAPI.deleteAllocation(project.id, deleteAllocConfirm.allocationId);
      }
      showSuccess('Allocation removed');
      fetchProjectDetails(false);
    } catch (err: unknown) {
      console.error('Error deleting allocation:', err);
      showError((err instanceof Error ? err.message : null) || 'Failed to remove allocation');
    } finally {
      setDeletingAlloc(false);
      setDeleteAllocConfirm({ isOpen: false, allocationId: null, entityType: null, label: '' });
    }
  };

  // Render Finance Tab (combined view of all financial allocations)
  const renderFinanceTab = () => {
    const sections = [
      {
        id: 'invoices',
        label: 'Invoices',
        allocations: invoiceAllocations,
        totals: invoiceTotals,
        entityType: 'invoice',
        color: '#00a6f4',
        emptyIcon: FileText,
        emptyMessage: 'No invoices allocated'
      },
      {
        id: 'payments',
        label: 'Payments',
        allocations: paymentAllocations,
        totals: paymentTotals,
        entityType: 'payment',
        color: '#00a63e',
        emptyIcon: CreditCard,
        emptyMessage: 'No payments allocated'
      },
      {
        id: 'quotes',
        label: 'Quotes',
        allocations: quoteAllocations,
        totals: quoteTotals,
        entityType: 'quote',
        color: '#8b5cf6',
        emptyIcon: FileText,
        emptyMessage: 'No quotes allocated'
      },
      {
        id: 'expenses',
        label: 'Expenses',
        allocations: expenseAllocations,
        totals: expenseTotals,
        entityType: 'expense',
        color: '#fb2c36',
        emptyIcon: Receipt,
        emptyMessage: 'No expenses allocated'
      },
      {
        id: 'credit_notes',
        label: 'Credit Notes',
        allocations: creditNoteAllocations,
        totals: creditNoteTotals,
        entityType: 'credit_note',
        color: '#f97316',
        emptyIcon: FileMinus,
        emptyMessage: 'No credit notes allocated'
      },
    ];

    return (
      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.id}>
            {/* Section Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h4
                  className="text-sm font-semibold"
                  style={{ color: section.color }}
                >
                  {section.label}
                </h4>
                {section.allocations.length > 0 && (
                  <span className="text-xs text-[#71717a] dark:text-gray-400">
                    ({section.totals.count})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {section.allocations.length > 0 && (
                  <span className="text-sm font-semibold text-[#09090b] dark:text-white">
                    {formatCurrency(section.totals.total, project.currency || 'USD')}
                  </span>
                )}
                <button
                  onClick={() => openFinanceModal(section.entityType)}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                  style={{ color: section.color }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </button>
              </div>
            </div>

            {/* Allocations List */}
            {section.allocations.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-[#e5e5e5] dark:border-gray-700 rounded-lg">
                {React.createElement(section.emptyIcon, {
                  className: "h-6 w-6 mx-auto mb-2 opacity-30",
                  style: { color: section.color }
                } as LucideProps)}
                <p className="text-xs text-[#71717a] dark:text-gray-400">{section.emptyMessage}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {section.allocations.map((alloc: ProjectFinanceAllocation, idx: number) => {
                  let number = '';
                  let date = '';
                  let total = 0;
                  let status = '';
                  let currency = project.currency || 'USD';

                  switch (section.entityType) {
                    case 'invoice':
                      number = alloc.invoice?.invoice_number || alloc.entity_number || `#${idx + 1}`;
                      date = alloc.invoice?.issue_date || alloc.date || '';
                      total = alloc.invoice?.total || alloc.entity_total || 0;
                      status = alloc.invoice?.status || '';
                      currency = alloc.invoice?.currency?.code || currency;
                      break;
                    case 'quote':
                      number = alloc.quote?.quote_number || alloc.entity_number || `#${idx + 1}`;
                      date = alloc.quote?.issue_date || alloc.date || '';
                      total = alloc.quote?.total || alloc.entity_total || 0;
                      status = alloc.quote?.status || '';
                      currency = alloc.quote?.currency?.code || currency;
                      break;
                    case 'payment':
                      number = alloc.payment?.payment_number || alloc.entity_number || `#${idx + 1}`;
                      date = alloc.payment?.payment_date || alloc.date || '';
                      total = alloc.payment?.amount || alloc.entity_total || 0;
                      status = alloc.payment?.status || '';
                      currency = alloc.payment?.currency?.code || currency;
                      break;
                    case 'credit_note':
                      number = alloc.credit_note?.credit_note_number || alloc.entity_number || `#${idx + 1}`;
                      date = alloc.credit_note?.issue_date || alloc.date || '';
                      total = alloc.credit_note?.total || alloc.entity_total || 0;
                      status = alloc.credit_note?.status || '';
                      currency = alloc.credit_note?.currency?.code || currency;
                      break;
                    case 'expense':
                      number = alloc.expense?.expense_number || alloc.entity_number || `#${idx + 1}`;
                      date = alloc.expense?.expense_date || alloc.date || '';
                      total = alloc.expense?.amount || alloc.entity_total || 0;
                      status = alloc.expense?.status || '';
                      currency = alloc.expense?.currency?.code || currency;
                      break;
                  }

                  const allocatedAmount = parseFloat(alloc.allocated_amount) || (total * (alloc.percentage || 100) / 100);

                  return (
                    <div
                      key={alloc.id || idx}
                      className="flex items-center justify-between bg-[#fafafa] dark:bg-gray-900 border border-[#e5e5e5] dark:border-gray-700 p-3 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[#09090b] dark:text-white">
                            {number}
                          </span>
                          {status && (
                            <span className="text-xs px-2 py-0.5 bg-[#e5e5e5] dark:bg-gray-700 rounded text-[#71717a] dark:text-gray-400 capitalize">
                              {status}
                            </span>
                          )}
                        </div>
                        {date && (
                          <div className="text-xs text-[#71717a] dark:text-gray-400 mt-0.5">
                            {formatDate(date)}
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-3">
                        <div className="text-sm font-semibold text-[#09090b] dark:text-white">
                          {formatCurrency(allocatedAmount, currency)}
                        </div>
                        <div className="text-xs text-[#71717a] dark:text-gray-400">
                          {alloc.percentage}% of {formatCurrency(total, currency)}
                        </div>
                      </div>
                      <button
                        onClick={() => setDeleteAllocConfirm({
                          isOpen: true,
                          allocationId: alloc.id || null,
                          entityType: section.entityType,
                          label: number
                        })}
                        className="ml-2 p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Remove allocation"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'services':
        return renderServicesTab();
      case 'billable_hours':
        return (
          <BillableHoursTab
            projectId={project.id}
            defaultRate={project.default_hourly_rate}
            defaultCurrencyId={project.default_currency_id ?? ''}
            currency={project.default_currency?.code || project.currency || 'USD'}
            contactCurrencyId={project.contact?.currency_id}
            contactCurrencyCode={project.contact?.currency?.code}
          />
        );
      case 'finance':
        return renderFinanceTab();
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] border border-[#e5e5e5] max-w-[650px] w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col dark:bg-gray-800 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-[#09090b] dark:text-white leading-[26px]">
              {project.name}
            </h2>
            <GenericDropdown
              value={project.status}
              onChange={(newStatus: string) => handleProjectStatusChange(newStatus)}
              options={Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
              disabled={updatingProjectStatus}
              className="w-[140px]"
            />
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors dark:hover:bg-gray-700"
          >
            <X className="h-[18px] w-[18px] text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 pb-4 shrink-0">
          <div className="flex bg-white dark:bg-gray-800 border border-[#e5e5e5] dark:border-gray-700 rounded-lg overflow-hidden">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-white dark:bg-gray-700 text-[#09090b] dark:text-white border border-[#e5e5e5] dark:border-gray-600 rounded-lg shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]'
                      : 'text-[#71717a] dark:text-gray-400 hover:text-[#09090b] dark:hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-4 pb-4">
          {renderTabContent()}
        </div>
      </div>

      {/* Detach Service Confirmation Modal */}
      <ConfirmationModal
        isOpen={detachConfirm.isOpen}
        onClose={() => setDetachConfirm({ isOpen: false, service: null })}
        onConfirm={handleDetachService}
        title="Detach Service"
        message={`Are you sure you want to detach "${getServiceName(detachConfirm.service || {})}" from this project? This action cannot be undone.`}
        confirmText="Detach"
        cancelText="Cancel"
        confirmColor="red"
      />

      {/* Delete Allocation Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteAllocConfirm.isOpen}
        onClose={() => setDeleteAllocConfirm({ isOpen: false, allocationId: null, entityType: null, label: '' })}
        onConfirm={handleDeleteAllocation}
        title="Remove Allocation"
        message={`Are you sure you want to remove the allocation for "${deleteAllocConfirm.label}"? This will unlink it from the project.`}
        confirmText={deletingAlloc ? 'Removing...' : 'Remove'}
        cancelText="Cancel"
        confirmColor="red"
      />

      {/* Expense Allocation Modal */}
      <AssignExpenseModal
        open={showExpenseModal}
        onOpenChange={setShowExpenseModal}
        entityType="project"
        entityId={project.id}
        entityName={project.name}
        currency={project.currency || 'USD'}
        onUpdate={handleAllocationUpdate}
        contactId={project.contact_id}
      />

      {/* Finance Item Allocation Modal (Invoice, Quote, Payment, Credit Note) */}
      <AssignFinanceItemModal
        open={financeModal.open}
        onOpenChange={(open: boolean) => setFinanceModal({ open, type: open ? financeModal.type : null })}
        entityType={financeModal.type ?? ''}
        projectId={project.id}
        projectName={project.name}
        currency={project.currency || 'USD'}
        onUpdate={handleAllocationUpdate}
        projectServices={financeModal.type === 'invoice' ? services : undefined}
        contactId={project.contact_id}
        existingEntityIds={
          financeModal.type === 'invoice' ? invoiceAllocations.map(a => a.entity_id).filter(Boolean) as string[] :
          financeModal.type === 'quote' ? quoteAllocations.map(a => a.entity_id).filter(Boolean) as string[] :
          financeModal.type === 'payment' ? paymentAllocations.map(a => a.entity_id).filter(Boolean) as string[] :
          financeModal.type === 'credit_note' ? creditNoteAllocations.map(a => a.entity_id).filter(Boolean) as string[] :
          []
        }
      />

    </div>
  );
};

export default ProjectDetailModal;
