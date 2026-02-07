import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, FileText, Receipt, CreditCard, FileMinus, Loader2, Settings2, ChevronDown, ChevronUp, Trash2, Plus } from 'lucide-react';
import BillableHoursTab from './BillableHoursTab';
import { PROJECT_STATUS_LABELS, SERVICE_STATUS, SERVICE_STATUS_LABELS, SERVICE_STATUS_COLORS } from '../../constants/crm';
import { formatCurrency } from '../../utils/currency';
import { useNotification } from '../../contexts/NotificationContext';
import projectsAPI from '../../services/api/crm/projects';
import ConfirmationModal from '../common/ConfirmationModal';
import AssignExpenseModal from '../finance/expenses/AssignExpenseModal';
import AssignFinanceItemModal from '../finance/allocations/AssignFinanceItemModal';

interface ProjectDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
  onUpdate?: () => void;
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'services', label: 'Services' },
  { id: 'billable_hours', label: 'Billable Hours' },
  { id: 'finance', label: 'Finance' },
];

const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({ isOpen, onClose, project: projectProp, onUpdate }) => {
  const { showError, showSuccess } = useNotification() as any;
  const [project, setProject] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [services, setServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [expandedServices, setExpandedServices] = useState<Record<string, boolean>>({});
  const [updatingServiceId, setUpdatingServiceId] = useState<string | null>(null);
  const [detachConfirm, setDetachConfirm] = useState<{ isOpen: boolean; service: any }>({ isOpen: false, service: null });
  const [statusDropdown, setStatusDropdown] = useState<{ isOpen: boolean; serviceId: string | null }>({ isOpen: false, serviceId: null });
  const statusButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Finance allocation modals
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [financeModal, setFinanceModal] = useState<{ open: boolean; type: string | null }>({ open: false, type: null });

  // Fetch project details
  const fetchProjectDetails = async (showLoading = true) => {
    if (!projectProp?.id) return;

    try {
      if (showLoading) setLoadingDetails(true);
      const data = await (projectsAPI as any).get(projectProp.id);
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
      const data = await (projectsAPI as any).listServices(projectProp.id);
      setServices(data.items || data || []);
    } catch (err) {
      console.error('Error fetching project services:', err);
      setServices([]);
    } finally {
      setLoadingServices(false);
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
    return invoiceAllocations.reduce((acc: any, alloc: any) => ({
      count: acc.count + 1,
      total: acc.total + (parseFloat(alloc.allocated_amount) || 0)
    }), { count: 0, total: 0 });
  }, [invoiceAllocations]);

  const quoteTotals = useMemo(() => {
    return quoteAllocations.reduce((acc: any, alloc: any) => ({
      count: acc.count + 1,
      total: acc.total + (parseFloat(alloc.allocated_amount) || 0)
    }), { count: 0, total: 0 });
  }, [quoteAllocations]);

  const paymentTotals = useMemo(() => {
    return paymentAllocations.reduce((acc: any, alloc: any) => ({
      count: acc.count + 1,
      total: acc.total + (parseFloat(alloc.allocated_amount) || 0)
    }), { count: 0, total: 0 });
  }, [paymentAllocations]);

  const creditNoteTotals = useMemo(() => {
    return creditNoteAllocations.reduce((acc: any, alloc: any) => ({
      count: acc.count + 1,
      total: acc.total + (parseFloat(alloc.allocated_amount) || 0)
    }), { count: 0, total: 0 });
  }, [creditNoteAllocations]);

  const expenseTotals = useMemo(() => {
    return expenseAllocations.reduce((acc: any, alloc: any) => ({
      count: acc.count + 1,
      total: acc.total + (parseFloat(alloc.allocated_amount) || 0)
    }), { count: 0, total: 0 });
  }, [expenseAllocations]);

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

  // Close status dropdown when clicking outside
  useEffect(() => {
    if (!statusDropdown.isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const buttonRef = statusButtonRefs.current[statusDropdown.serviceId!];
      if (buttonRef && !buttonRef.contains(e.target as Node)) {
        setStatusDropdown({ isOpen: false, serviceId: null });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [statusDropdown.isOpen, statusDropdown.serviceId]);

  // Early returns AFTER all hooks
  if (!isOpen || !projectProp) return null;

  // Show loading state while fetching details
  if (loadingDetails || !project) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl p-8 dark:bg-gray-800">
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
      <div className="bg-[#fafafa] dark:bg-gray-900 border border-[#e5e5e5] dark:border-gray-700 rounded-xl p-4 flex items-center gap-6">
        <div className="flex-1">
          <p className="text-sm text-[#71717a] dark:text-gray-400 leading-[22px]">Start Date</p>
          <p className="text-lg font-semibold text-[#09090b] dark:text-white leading-[26px]">
            {formatDate(project.start_date)}
          </p>
        </div>
        <div className="w-px h-[52px] bg-[#e5e5e5] dark:bg-gray-700" />
        <div className="flex-1">
          <p className="text-sm text-[#71717a] dark:text-gray-400 leading-[22px]">End Date</p>
          <p className="text-lg font-semibold text-[#09090b] dark:text-white leading-[26px]">
            {formatDate(project.end_date)}
          </p>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="pt-4">
        <h4 className="text-lg font-semibold text-[#09090b] dark:text-white leading-[26px] mb-3.5">
          Financial Summary
        </h4>
        <div className="flex gap-3.5">
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
  const getServiceName = (service: any) => {
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
  const getServicePrice = (service: any) => {
    return service.contact_service?.price || service.service?.rate || service.price || null;
  };

  // Helper to get service description
  const getServiceDescription = (service: any) => {
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
  const handleChangeServiceStatus = async (service: any, newStatus: string) => {
    if (!project?.id || !service?.id) return;

    try {
      setUpdatingServiceId(service.id);
      setStatusDropdown({ isOpen: false, serviceId: null });

      await (projectsAPI as any).updateServiceAssignment(project.id, service.id, {
        status: newStatus
      });

      // Update local state
      setServices(prev => prev.map(s =>
        s.id === service.id ? { ...s, status: newStatus } : s
      ));

      showSuccess(`Service status updated to ${(SERVICE_STATUS_LABELS as any)[newStatus]}`);
    } catch (err: any) {
      console.error('Error updating service status:', err);
      showError(err.message || 'Failed to update service status');
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
      await (projectsAPI as any).unassignService(project.id, service.id);

      // Remove from local state
      setServices(prev => prev.filter(s => s.id !== service.id));

      showSuccess('Service detached from project');
      // Modal closes automatically via ConfirmationModal's onConfirm handler
    } catch (err: any) {
      console.error('Error detaching service:', err);
      showError(err.message || 'Failed to detach service');
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

          const isActiveStatus = service.status === (SERVICE_STATUS as any).ACTIVE;
          const isInactiveStatus = service.status === (SERVICE_STATUS as any).INACTIVE;

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
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${
                        isInactiveStatus
                          ? 'text-[#71717a] dark:text-gray-400'
                          : 'text-[#09090b] dark:text-white'
                      }`}>
                        {serviceName}
                      </span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${(SERVICE_STATUS_COLORS as any)[service.status] || (SERVICE_STATUS_COLORS as any)[(SERVICE_STATUS as any).ACTIVE]}`}>
                        {(SERVICE_STATUS_LABELS as any)[service.status] || 'Active'}
                      </span>
                    </div>
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
                      <div className="relative">
                        <button
                          ref={(el) => { statusButtonRefs.current[service.id] = el; }}
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            setStatusDropdown(prev => ({
                              isOpen: prev.serviceId === service.id ? !prev.isOpen : true,
                              serviceId: service.id
                            }));
                          }}
                          disabled={isUpdating}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-[#e5e5e5] dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                          {isUpdating ? (
                            <Loader2 className="h-4 w-4 animate-spin text-[#71717a]" />
                          ) : (
                            <>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${(SERVICE_STATUS_COLORS as any)[service.status] || (SERVICE_STATUS_COLORS as any)[(SERVICE_STATUS as any).ACTIVE]}`}>
                                {(SERVICE_STATUS_LABELS as any)[service.status] || 'Active'}
                              </span>
                              <ChevronDown className="h-4 w-4 text-[#71717a]" />
                            </>
                          )}
                        </button>

                        {/* Status Dropdown Menu */}
                        {statusDropdown.isOpen && statusDropdown.serviceId === service.id && (
                          <div className="absolute left-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 border border-[#e5e5e5] dark:border-gray-600 rounded-lg shadow-lg z-50">
                            {Object.entries(SERVICE_STATUS as any).map(([key, value]) => (
                              <button
                                key={value as string}
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  handleChangeServiceStatus(service, value as string);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg flex items-center justify-between ${
                                  service.status === value ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                                }`}
                              >
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${(SERVICE_STATUS_COLORS as any)[value as string]}`}>
                                  {(SERVICE_STATUS_LABELS as any)[value as string]}
                                </span>
                                {service.status === value && (
                                  <span className="text-purple-600 dark:text-purple-400">&#10003;</span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
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
                } as any)}
                <p className="text-xs text-[#71717a] dark:text-gray-400">{section.emptyMessage}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {section.allocations.map((alloc: any, idx: number) => {
                  let number = '';
                  let date = '';
                  let total = 0;
                  let status = '';
                  let currency = project.currency || 'USD';

                  switch (section.entityType) {
                    case 'invoice':
                      number = alloc.invoice?.invoice_number || alloc.entity_number || `#${idx + 1}`;
                      date = alloc.invoice?.issue_date || alloc.date;
                      total = alloc.invoice?.total || alloc.entity_total || 0;
                      status = alloc.invoice?.status;
                      currency = alloc.invoice?.currency?.code || currency;
                      break;
                    case 'quote':
                      number = alloc.quote?.quote_number || alloc.entity_number || `#${idx + 1}`;
                      date = alloc.quote?.issue_date || alloc.date;
                      total = alloc.quote?.total || alloc.entity_total || 0;
                      status = alloc.quote?.status;
                      currency = alloc.quote?.currency?.code || currency;
                      break;
                    case 'payment':
                      number = alloc.payment?.payment_number || alloc.entity_number || `#${idx + 1}`;
                      date = alloc.payment?.payment_date || alloc.date;
                      total = alloc.payment?.amount || alloc.entity_total || 0;
                      status = alloc.payment?.status;
                      currency = alloc.payment?.currency?.code || currency;
                      break;
                    case 'credit_note':
                      number = alloc.credit_note?.credit_note_number || alloc.entity_number || `#${idx + 1}`;
                      date = alloc.credit_note?.issue_date || alloc.date;
                      total = alloc.credit_note?.total || alloc.entity_total || 0;
                      status = alloc.credit_note?.status;
                      currency = alloc.credit_note?.currency?.code || currency;
                      break;
                    case 'expense':
                      number = alloc.expense?.expense_number || alloc.entity_number || `#${idx + 1}`;
                      date = alloc.expense?.expense_date || alloc.date;
                      total = alloc.expense?.amount || alloc.entity_total || 0;
                      status = alloc.expense?.status;
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
            defaultCurrencyId={project.default_currency_id}
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
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-[#09090b] dark:text-white leading-[26px]">
              {project.name}
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 h-6 bg-[#e5e5e5] dark:bg-gray-700 rounded-md text-xs font-normal text-[#09090b] dark:text-gray-300">
              {(PROJECT_STATUS_LABELS as any)[project.status] || project.status}
            </span>
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

      {/* Expense Allocation Modal */}
      {React.createElement(AssignExpenseModal as any, {
        open: showExpenseModal,
        onOpenChange: setShowExpenseModal,
        entityType: "project",
        entityId: project.id,
        entityName: project.name,
        currency: project.currency || 'USD',
        onUpdate: handleAllocationUpdate,
      })}

      {/* Finance Item Allocation Modal (Invoice, Quote, Payment, Credit Note) */}
      <AssignFinanceItemModal
        open={financeModal.open}
        onOpenChange={(open: boolean) => setFinanceModal({ open, type: open ? financeModal.type : null })}
        entityType={financeModal.type}
        projectId={project.id}
        projectName={project.name}
        currency={project.currency || 'USD'}
        onUpdate={handleAllocationUpdate}
      />
    </div>
  );
};

export default ProjectDetailModal;
