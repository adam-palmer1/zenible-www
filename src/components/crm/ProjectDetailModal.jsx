import React, { useState, useEffect, useMemo } from 'react';
import { X, FolderKanban, Calendar, User, Building2, FileText, Receipt, CreditCard, FileMinus, Loader2, Plus, Settings2, Clock } from 'lucide-react';
import BillableHoursTab from './BillableHoursTab';
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from '../../constants/crm';
import { formatCurrency } from '../../utils/currency';
import { useNotification } from '../../contexts/NotificationContext';
import projectsAPI from '../../services/api/crm/projects';

const TABS = [
  { id: 'overview', label: 'Overview', icon: FolderKanban },
  { id: 'services', label: 'Services', icon: Settings2 },
  { id: 'billable_hours', label: 'Billable Hours', icon: Clock },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'quotes', label: 'Quotes', icon: FileText },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'credit_notes', label: 'Credit Notes', icon: FileMinus },
  { id: 'expenses', label: 'Expenses', icon: Receipt },
];

const ProjectDetailModal = ({ isOpen, onClose, project: projectProp, onUpdate }) => {
  const { showError } = useNotification();
  const [project, setProject] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);

  // Fetch project details
  const fetchProjectDetails = async (showLoading = true) => {
    if (!projectProp?.id) return;

    try {
      if (showLoading) setLoadingDetails(true);
      const data = await projectsAPI.get(projectProp.id);
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
      const data = await projectsAPI.listServices(projectProp.id);
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
    return invoiceAllocations.reduce((acc, alloc) => ({
      count: acc.count + 1,
      total: acc.total + (parseFloat(alloc.allocated_amount) || 0)
    }), { count: 0, total: 0 });
  }, [invoiceAllocations]);

  const quoteTotals = useMemo(() => {
    return quoteAllocations.reduce((acc, alloc) => ({
      count: acc.count + 1,
      total: acc.total + (parseFloat(alloc.allocated_amount) || 0)
    }), { count: 0, total: 0 });
  }, [quoteAllocations]);

  const paymentTotals = useMemo(() => {
    return paymentAllocations.reduce((acc, alloc) => ({
      count: acc.count + 1,
      total: acc.total + (parseFloat(alloc.allocated_amount) || 0)
    }), { count: 0, total: 0 });
  }, [paymentAllocations]);

  const creditNoteTotals = useMemo(() => {
    return creditNoteAllocations.reduce((acc, alloc) => ({
      count: acc.count + 1,
      total: acc.total + (parseFloat(alloc.allocated_amount) || 0)
    }), { count: 0, total: 0 });
  }, [creditNoteAllocations]);

  const expenseTotals = useMemo(() => {
    return expenseAllocations.reduce((acc, alloc) => ({
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

  const formatDate = (dateString) => {
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
    <div className="space-y-6">
      {/* Project Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <User className="h-4 w-4" />
            Client
          </div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {getClientName()}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="h-4 w-4" />
            Start Date
          </div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {formatDate(project.start_date)}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="h-4 w-4" />
            End Date
          </div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {formatDate(project.end_date)}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Settings2 className="h-4 w-4" />
            Services
          </div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {project.services_count || services.length || 0} assigned
          </div>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <div className="space-y-1">
          <div className="text-sm text-gray-500 dark:text-gray-400">Description</div>
          <div className="text-sm text-gray-900 dark:text-white bg-gray-50 p-3 rounded-lg dark:bg-gray-900">
            {project.description}
          </div>
        </div>
      )}

      {/* Financial Summary */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Financial Summary</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <div className="text-xs text-blue-600 dark:text-blue-400">Invoices</div>
            <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">
              {formatCurrency(invoiceTotals.total, project.currency || 'USD')}
            </div>
            <div className="text-xs text-blue-500">{invoiceTotals.count} allocated</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <div className="text-xs text-green-600 dark:text-green-400">Payments</div>
            <div className="text-lg font-semibold text-green-700 dark:text-green-300">
              {formatCurrency(paymentTotals.total, project.currency || 'USD')}
            </div>
            <div className="text-xs text-green-500">{paymentTotals.count} allocated</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
            <div className="text-xs text-red-600 dark:text-red-400">Expenses</div>
            <div className="text-lg font-semibold text-red-700 dark:text-red-300">
              {formatCurrency(expenseTotals.total, project.currency || 'USD')}
            </div>
            <div className="text-xs text-red-500">{expenseTotals.count} allocated</div>
          </div>
        </div>
      </div>
    </div>
  );

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
        services.map((service, idx) => (
          <div
            key={service.id || idx}
            className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 p-3 rounded-lg"
          >
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {service.service?.name || service.name || 'Service'}
              </div>
              {service.service?.description && (
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {service.service.description}
                </div>
              )}
            </div>
            {service.service?.rate && (
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {formatCurrency(service.service.rate, project.currency || 'USD')}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  // Render Allocation List (generic for invoices, quotes, payments, credit notes, expenses)
  const renderAllocationList = (allocations, entityType, emptyIcon, emptyMessage) => {
    if (allocations.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {React.createElement(emptyIcon, { className: "h-8 w-8 mx-auto mb-2 opacity-50" })}
          <p>{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {allocations.map((alloc, idx) => {
          // Get display fields based on entity type
          let number = '';
          let date = '';
          let total = 0;
          let status = '';
          let currency = project.currency || 'USD';

          switch (entityType) {
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
              className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 p-3 rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {number}
                  </span>
                  {status && (
                    <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-400 capitalize">
                      {status}
                    </span>
                  )}
                </div>
                {date && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(date)}
                  </div>
                )}
              </div>
              <div className="text-right ml-3">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(allocatedAmount, currency)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {alloc.percentage}% of {formatCurrency(total, currency)}
                </div>
              </div>
            </div>
          );
        })}

        {/* Total Row */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Total Allocated ({allocations.length} items)
          </span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {formatCurrency(
              allocations.reduce((sum, a) => sum + (parseFloat(a.allocated_amount) || 0), 0),
              project.currency || 'USD'
            )}
          </span>
        </div>
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
      case 'invoices':
        return renderAllocationList(invoiceAllocations, 'invoice', FileText, 'No invoices allocated to this project');
      case 'quotes':
        return renderAllocationList(quoteAllocations, 'quote', FileText, 'No quotes allocated to this project');
      case 'payments':
        return renderAllocationList(paymentAllocations, 'payment', CreditCard, 'No payments allocated to this project');
      case 'credit_notes':
        return renderAllocationList(creditNoteAllocations, 'credit_note', FileMinus, 'No credit notes allocated to this project');
      case 'expenses':
        return renderAllocationList(expenseAllocations, 'expense', Receipt, 'No expenses allocated to this project');
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900/30">
              <FolderKanban className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {project.name}
              </h2>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PROJECT_STATUS_COLORS[project.status] || 'bg-gray-100 text-gray-700'}`}>
                {PROJECT_STATUS_LABELS[project.status] || project.status}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex overflow-x-auto px-4">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              // Get count for badge
              let count = 0;
              switch (tab.id) {
                case 'services': count = services.length; break;
                case 'billable_hours': count = project.billable_hours_count || 0; break;
                case 'invoices': count = invoiceAllocations.length; break;
                case 'quotes': count = quoteAllocations.length; break;
                case 'payments': count = paymentAllocations.length; break;
                case 'credit_notes': count = creditNoteAllocations.length; break;
                case 'expenses': count = expenseAllocations.length; break;
              }

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {count > 0 && tab.id !== 'overview' && (
                    <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                      isActive
                        ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {renderTabContent()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailModal;
