import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  MoreVertical,
  Play,
  Pause,
  ChevronLeft,
  Repeat,
  FileText,
  Loader2,
} from 'lucide-react';
import { useNotification } from '../../../contexts/NotificationContext';
import { formatCurrency } from '../../../utils/currency';
import invoicesAPI from '../../../services/api/finance/invoices';
import NewSidebar from '../../sidebar/NewSidebar';
import KPICard from '../shared/KPICard';
import ActionMenu from '../../shared/ActionMenu';

// Recurring status configuration
const RECURRING_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  CANCELLED: 'cancelled',
};

const RECURRING_STATUS_LABELS = {
  active: 'Active',
  paused: 'Paused',
  cancelled: 'Cancelled',
};

const RECURRING_STATUS_COLORS = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  paused: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const RECURRING_TYPE_LABELS = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
  custom: 'Custom',
};

const RecurringInvoices = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  // State
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Fetch recurring templates
  useEffect(() => {
    fetchTemplates();
  }, [filterStatus]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params = {
        pricing_type: 'recurring',
        is_parent_only: true,
      };
      if (filterStatus !== 'all') {
        params.recurring_status = filterStatus;
      }
      const response = await invoicesAPI.list(params);
      setTemplates(response.items || response || []);
    } catch (error) {
      console.error('Failed to fetch recurring templates:', error);
      showError('Failed to load recurring invoices');
    } finally {
      setLoading(false);
    }
  };

  // Filter templates by search
  const filteredTemplates = useMemo(() => {
    if (!searchQuery) return templates;
    const query = searchQuery.toLowerCase();
    return templates.filter(t =>
      t.invoice_number?.toLowerCase().includes(query) ||
      t.contact?.business_name?.toLowerCase().includes(query) ||
      t.contact?.first_name?.toLowerCase().includes(query) ||
      t.contact?.last_name?.toLowerCase().includes(query)
    );
  }, [templates, searchQuery]);

  // Calculate stats
  const stats = useMemo(() => {
    const active = templates.filter(t => t.recurring_status === 'active').length;
    const paused = templates.filter(t => t.recurring_status === 'paused').length;
    const totalValue = templates.reduce((sum, t) => sum + parseFloat(t.total || 0), 0);
    return { total: templates.length, active, paused, totalValue };
  }, [templates]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Get frequency label
  const getFrequencyLabel = (invoice) => {
    if (invoice.recurring_type === 'custom' && invoice.custom_every && invoice.custom_period) {
      return `Every ${invoice.custom_every} ${invoice.custom_period}`;
    }
    return RECURRING_TYPE_LABELS[invoice.recurring_type] || invoice.recurring_type;
  };

  // Get progress string
  const getProgress = (invoice) => {
    // Count child invoices generated (would need additional data)
    const limit = invoice.recurring_number;
    if (limit === -1) return 'Ongoing';
    return `0 of ${limit}`;
  };

  // Handlers
  const handleGenerateNext = async (invoice) => {
    try {
      setActionLoading(invoice.id);
      const newInvoice = await invoicesAPI.generateNext(invoice.id);
      showSuccess(`Generated invoice #${newInvoice.invoice_number}`);
      fetchTemplates();
    } catch (error) {
      showError(error.message || 'Failed to generate invoice');
    } finally {
      setActionLoading(null);
      setOpenActionMenuId(null);
    }
  };

  const handlePause = async (invoice) => {
    try {
      setActionLoading(invoice.id);
      await invoicesAPI.update(invoice.id, { recurring_status: 'paused' });
      showSuccess('Recurring invoice paused');
      fetchTemplates();
    } catch (error) {
      showError(error.message || 'Failed to pause recurring invoice');
    } finally {
      setActionLoading(null);
      setOpenActionMenuId(null);
    }
  };

  const handleResume = async (invoice) => {
    try {
      setActionLoading(invoice.id);
      await invoicesAPI.update(invoice.id, { recurring_status: 'active' });
      showSuccess('Recurring invoice resumed');
      fetchTemplates();
    } catch (error) {
      showError(error.message || 'Failed to resume recurring invoice');
    } finally {
      setActionLoading(null);
      setOpenActionMenuId(null);
    }
  };

  const handleCancel = async (invoice) => {
    if (!window.confirm('Are you sure you want to cancel this recurring invoice? This cannot be undone.')) {
      return;
    }
    try {
      setActionLoading(invoice.id);
      await invoicesAPI.update(invoice.id, { recurring_status: 'cancelled' });
      showSuccess('Recurring invoice cancelled');
      fetchTemplates();
    } catch (error) {
      showError(error.message || 'Failed to cancel recurring invoice');
    } finally {
      setActionLoading(null);
      setOpenActionMenuId(null);
    }
  };

  const handleView = (invoice) => {
    navigate(`/finance/invoices/${invoice.id}`);
    setOpenActionMenuId(null);
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${RECURRING_STATUS_COLORS[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
        {RECURRING_STATUS_LABELS[status] || status}
      </span>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <NewSidebar />

      {/* Main Content */}
      <div
        className="flex-1 flex flex-col transition-all duration-300"
        style={{ marginLeft: 'var(--sidebar-width, 280px)' }}
      >
        {/* Top Bar */}
        <div className="bg-white dark:bg-gray-800 border-b border-[#e5e5e5] dark:border-gray-700 px-4 py-3 flex items-center justify-between min-h-[64px]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/finance/invoices')}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
            <h1 className="text-2xl font-semibold text-[#09090b] dark:text-white">
              Recurring Invoices
            </h1>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <KPICard
              title="Total Templates"
              value={stats.total.toString()}
              icon={Repeat}
              iconColor="blue"
            />
            <KPICard
              title="Active"
              value={stats.active.toString()}
              icon={Play}
              iconColor="green"
            />
            <KPICard
              title="Paused"
              value={stats.paused.toString()}
              icon={Pause}
              iconColor="yellow"
            />
            <KPICard
              title="Total Value"
              value={formatCurrency(stats.totalValue, 'USD')}
              icon={FileText}
              iconColor="purple"
            />
          </div>

          {/* Search and Filter */}
          <div className="flex items-center justify-end gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border-[1.5px] border-[#e5e5e5] dark:border-gray-600 rounded-[10px] text-sm text-[#09090b] dark:text-white placeholder-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-[250px]"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="inline-flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-gray-800 border-[1.5px] border-[#e5e5e5] dark:border-gray-600 rounded-xl text-sm font-normal text-[#09090b] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <Filter className="h-4 w-4 text-[#71717a]" />
                Filter
              </button>
              {showFilterDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-[#e5e5e5] dark:border-gray-600 z-10">
                  <div className="py-1">
                    <button
                      onClick={() => { setFilterStatus('all'); setShowFilterDropdown(false); }}
                      className={`block w-full text-left px-4 py-2 text-sm ${filterStatus === 'all' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'} hover:bg-gray-50 dark:hover:bg-gray-700`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => { setFilterStatus(RECURRING_STATUS.ACTIVE); setShowFilterDropdown(false); }}
                      className={`block w-full text-left px-4 py-2 text-sm ${filterStatus === RECURRING_STATUS.ACTIVE ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'} hover:bg-gray-50 dark:hover:bg-gray-700`}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => { setFilterStatus(RECURRING_STATUS.PAUSED); setShowFilterDropdown(false); }}
                      className={`block w-full text-left px-4 py-2 text-sm ${filterStatus === RECURRING_STATUS.PAUSED ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'} hover:bg-gray-50 dark:hover:bg-gray-700`}
                    >
                      Paused
                    </button>
                    <button
                      onClick={() => { setFilterStatus(RECURRING_STATUS.CANCELLED); setShowFilterDropdown(false); }}
                      className={`block w-full text-left px-4 py-2 text-sm ${filterStatus === RECURRING_STATUS.CANCELLED ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'} hover:bg-gray-50 dark:hover:bg-gray-700`}
                    >
                      Cancelled
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-gray-800 border border-[#e5e5e5] dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#e5e5e5] dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Invoice #
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Contact
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Frequency
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Progress
                    </th>
                    <th scope="col" className="w-12 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-[#e5e5e5] dark:divide-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                        Loading recurring invoices...
                      </td>
                    </tr>
                  ) : filteredTemplates.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                        No recurring invoices found
                      </td>
                    </tr>
                  ) : (
                    filteredTemplates.map((invoice) => (
                      <tr
                        key={invoice.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                        onClick={() => handleView(invoice)}
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          #{invoice.invoice_number || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {invoice.contact?.business_name ||
                           (invoice.contact?.first_name && invoice.contact?.last_name
                             ? `${invoice.contact.first_name} ${invoice.contact.last_name}`
                             : '-')}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(invoice.total, invoice.currency?.code || 'USD')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {getFrequencyLabel(invoice)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <StatusBadge status={invoice.recurring_status} />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {getProgress(invoice)}
                        </td>
                        <td className="px-4 py-3 text-sm relative" onClick={(e) => e.stopPropagation()}>
                          <div className="relative">
                            <button
                              id={`recurring-invoice-action-btn-${invoice.id}`}
                              onClick={() => setOpenActionMenuId(openActionMenuId === invoice.id ? null : invoice.id)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                              disabled={actionLoading === invoice.id}
                            >
                              {actionLoading === invoice.id ? (
                                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                              ) : (
                                <MoreVertical className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                            {openActionMenuId === invoice.id && (
                              <ActionMenu
                                itemId={invoice.id}
                                onClose={() => setOpenActionMenuId(null)}
                                buttonIdPrefix="recurring-invoice-action-btn"
                                actions={[
                                  { label: 'View Details', onClick: () => handleView(invoice) },
                                  {
                                    label: 'Generate Next Invoice',
                                    onClick: () => handleGenerateNext(invoice),
                                    condition: invoice.recurring_status === 'active'
                                  },
                                  {
                                    label: 'Pause Recurring',
                                    onClick: () => handlePause(invoice),
                                    condition: invoice.recurring_status === 'active',
                                    variant: 'warning'
                                  },
                                  {
                                    label: 'Resume Recurring',
                                    onClick: () => handleResume(invoice),
                                    condition: invoice.recurring_status === 'paused',
                                    variant: 'success'
                                  },
                                  {
                                    label: 'Cancel Recurring',
                                    onClick: () => handleCancel(invoice),
                                    condition: invoice.recurring_status !== 'cancelled',
                                    variant: 'danger'
                                  },
                                ]}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecurringInvoices;
