import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  MoreVertical,
  FileText,
  DollarSign,
  Clock,
  AlertCircle,
  Trash2,
  Download,
  Repeat,
  Calendar,
  ChevronDown,
  X,
  Users,
  Check
} from 'lucide-react';
import { useInvoices } from '../../../contexts/InvoiceContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { useCRMReferenceData } from '../../../contexts/CRMReferenceDataContext';
import { useContacts } from '../../../hooks/crm/useContacts';
import { useCompanyAttributes } from '../../../hooks/crm/useCompanyAttributes';
import { INVOICE_STATUS, INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from '../../../constants/finance';
import { formatCurrency, getCurrencySymbol } from '../../../utils/currency';
import { applyNumberFormat } from '../../../utils/numberFormatUtils';
import { useInvoiceStats } from '../../../hooks/finance/useInvoiceStats';
import KPICard from '../shared/KPICard';
import SendInvoiceDialog from './SendInvoiceDialog';
import ConfirmationModal from '../../shared/ConfirmationModal';
import ActionMenu from '../../shared/ActionMenu';
import invoicesAPI from '../../../services/api/finance/invoices';

const InvoiceList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { invoices, loading, deleteInvoice, updateFilters, cloneInvoice } = useInvoices();

  // URL-based filters
  const parentInvoiceId = searchParams.get('parent_id');
  const { showSuccess, showError } = useNotification();
  const { contacts: allClients, loading: clientsLoading } = useContacts({ is_client: true });
  const { numberFormats } = useCRMReferenceData();
  const { getNumberFormat } = useCompanyAttributes();
  const stats = useInvoiceStats();

  // Number format from company settings
  const numberFormat = useMemo(() => {
    const formatId = getNumberFormat();
    if (formatId && numberFormats.length > 0) {
      return numberFormats.find(f => f.id === formatId);
    }
    return null;
  }, [getNumberFormat, numberFormats]);

  // Helper to format numbers using company settings
  const formatNumber = (num) => {
    return applyNumberFormat(num, numberFormat);
  };

  // Date filter presets
  const DATE_PRESETS = [
    { key: 'all', label: 'All Time' },
    { key: 'today', label: 'Today' },
    { key: 'this_week', label: 'This Week' },
    { key: 'this_month', label: 'This Month' },
    { key: 'last_month', label: 'Last Month' },
    { key: 'this_quarter', label: 'This Quarter' },
    { key: 'this_year', label: 'This Year' },
    { key: 'custom', label: 'Custom Range' },
  ];

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedClientIds, setSelectedClientIds] = useState([]);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [showRecurringOnly, setShowRecurringOnly] = useState(false);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [datePreset, setDatePreset] = useState('all');
  const [dateType, setDateType] = useState('issue'); // 'issue' or 'due'
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [invoiceToSend, setInvoiceToSend] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // 'bulk' or invoice object
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [parentTemplateInfo, setParentTemplateInfo] = useState(null);

  // Apply parent_id filter from URL params
  useEffect(() => {
    if (parentInvoiceId) {
      updateFilters({ parent_invoice_id: parentInvoiceId });
      // Load parent template info for display
      invoicesAPI.get(parentInvoiceId).then(setParentTemplateInfo).catch(() => {});
    } else {
      updateFilters({ parent_invoice_id: null });
      setParentTemplateInfo(null);
    }
  }, [parentInvoiceId, updateFilters]);

  // Clear parent filter
  const clearParentFilter = () => {
    setSearchParams({});
    setParentTemplateInfo(null);
  };

  // Calculate date range from preset
  const getDateRangeFromPreset = (preset) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const formatDate = (date) => {
      return date.toISOString().split('T')[0];
    };

    switch (preset) {
      case 'today': {
        return { from: formatDate(today), to: formatDate(today) };
      }
      case 'this_week': {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return { from: formatDate(startOfWeek), to: formatDate(endOfWeek) };
      }
      case 'this_month': {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return { from: formatDate(startOfMonth), to: formatDate(endOfMonth) };
      }
      case 'last_month': {
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        return { from: formatDate(startOfLastMonth), to: formatDate(endOfLastMonth) };
      }
      case 'this_quarter': {
        const quarter = Math.floor(today.getMonth() / 3);
        const startOfQuarter = new Date(today.getFullYear(), quarter * 3, 1);
        const endOfQuarter = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
        return { from: formatDate(startOfQuarter), to: formatDate(endOfQuarter) };
      }
      case 'this_year': {
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const endOfYear = new Date(today.getFullYear(), 11, 31);
        return { from: formatDate(startOfYear), to: formatDate(endOfYear) };
      }
      default:
        return { from: null, to: null };
    }
  };

  // Handle date type change (issue vs due) - doesn't close dropdown
  const handleDateTypeChange = (type) => {
    setDateType(type);

    // If there's an active date filter, re-apply it with the new type
    if (datePreset !== 'all') {
      let dateFrom = null;
      let dateTo = null;

      if (datePreset === 'custom') {
        dateFrom = customDateFrom || null;
        dateTo = customDateTo || null;
      } else {
        const range = getDateRangeFromPreset(datePreset);
        dateFrom = range.from;
        dateTo = range.to;
      }

      if (type === 'issue') {
        updateFilters({
          issue_date_from: dateFrom,
          issue_date_to: dateTo,
          due_date_from: null,
          due_date_to: null,
        });
      } else {
        updateFilters({
          issue_date_from: null,
          issue_date_to: null,
          due_date_from: dateFrom,
          due_date_to: dateTo,
        });
      }
    }
  };

  // Handle date filter change
  const handleDateFilterChange = (preset, closeDropdown = true) => {
    setDatePreset(preset);

    let dateFrom = null;
    let dateTo = null;

    if (preset === 'custom') {
      dateFrom = customDateFrom || null;
      dateTo = customDateTo || null;
    } else if (preset !== 'all') {
      const range = getDateRangeFromPreset(preset);
      dateFrom = range.from;
      dateTo = range.to;
    }

    // Update the context filters based on date type
    if (dateType === 'issue') {
      updateFilters({
        issue_date_from: dateFrom,
        issue_date_to: dateTo,
        due_date_from: null,
        due_date_to: null,
      });
    } else {
      updateFilters({
        issue_date_from: null,
        issue_date_to: null,
        due_date_from: dateFrom,
        due_date_to: dateTo,
      });
    }

    if (closeDropdown && preset !== 'custom') {
      setShowDateDropdown(false);
    }
  };

  // Handle custom date change
  const handleCustomDateChange = (from, to) => {
    setCustomDateFrom(from);
    setCustomDateTo(to);

    if (from && to) {
      setDatePreset('custom');

      // Update the context filters based on date type
      if (dateType === 'issue') {
        updateFilters({
          issue_date_from: from,
          issue_date_to: to,
          due_date_from: null,
          due_date_to: null,
        });
      } else {
        updateFilters({
          issue_date_from: null,
          issue_date_to: null,
          due_date_from: from,
          due_date_to: to,
        });
      }
    }
  };

  // Clear date filter
  const clearDateFilter = () => {
    setDatePreset('all');
    setCustomDateFrom('');
    setCustomDateTo('');
    updateFilters({
      issue_date_from: null,
      issue_date_to: null,
      due_date_from: null,
      due_date_to: null,
    });
    setShowDateDropdown(false);
  };

  // Handle client filter toggle
  const handleClientToggle = (clientId) => {
    setSelectedClientIds(prev => {
      const newSelection = prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId];

      // Update context filter with comma-separated IDs
      updateFilters({
        contact_ids: newSelection.length > 0 ? newSelection.join(',') : null,
      });

      return newSelection;
    });
  };

  // Clear client filter (with backend update)
  const clearClientFilter = () => {
    setSelectedClientIds([]);
    setClientSearchQuery('');
    updateFilters({ contact_ids: null });
  };

  // Clear client selection in dropdown (local only, no backend update)
  const handleClearClientSelection = () => {
    setSelectedClientIds([]);
    setClientSearchQuery('');
  };

  // Filter clients by search query
  const filteredClients = useMemo(() => {
    if (!clientSearchQuery) return allClients;
    const query = clientSearchQuery.toLowerCase();
    return allClients.filter(client =>
      client.first_name?.toLowerCase().includes(query) ||
      client.last_name?.toLowerCase().includes(query) ||
      client.business_name?.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query)
    );
  }, [allClients, clientSearchQuery]);

  // Get display name for selected clients
  const getSelectedClientsLabel = () => {
    if (selectedClientIds.length === 0) return null;
    if (selectedClientIds.length === 1) {
      const client = allClients.find(c => c.id === selectedClientIds[0]);
      if (!client) return '1 client';
      return client.business_name || `${client.first_name} ${client.last_name}`;
    }
    return `${selectedClientIds.length} clients`;
  };

  // Get client display name
  const getClientDisplayName = (client) => {
    if (!client) return 'Unknown';
    if (client.business_name) return client.business_name;
    const name = `${client.first_name || ''} ${client.last_name || ''}`.trim();
    return name || client.email || 'Unknown';
  };

  // Select all clients
  const handleSelectAllClients = () => {
    const allClientIds = allClients.map(c => c.id);
    setSelectedClientIds(allClientIds);
    updateFilters({ contact_ids: allClientIds.join(',') });
  };

  // Get current date filter label
  const getDateFilterLabel = () => {
    if (datePreset === 'all') return 'All Time';
    if (datePreset === 'custom' && customDateFrom && customDateTo) {
      return `${customDateFrom} - ${customDateTo}`;
    }
    const preset = DATE_PRESETS.find(p => p.key === datePreset);
    return preset ? preset.label : 'All Time';
  };

  // Filter and search invoices
  const filteredInvoices = useMemo(() => {
    let result = [...invoices];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(inv =>
        inv.invoice_number?.toLowerCase().includes(query) ||
        inv.contact?.business_name?.toLowerCase().includes(query) ||
        inv.contact?.first_name?.toLowerCase().includes(query) ||
        inv.contact?.last_name?.toLowerCase().includes(query) ||
        inv.contact?.email?.toLowerCase().includes(query) ||
        inv.total?.toString().includes(query)
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      result = result.filter(inv => inv.status === filterStatus);
    }

    // Apply recurring filter
    if (showRecurringOnly) {
      result = result.filter(inv => inv.pricing_type === 'recurring' || inv.is_recurring);
    }

    return result;
  }, [invoices, searchQuery, filterStatus, showRecurringOnly]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, datePreset, customDateFrom, customDateTo, selectedClientIds, showRecurringOnly]);

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredInvoices.slice(startIndex, endIndex);
  }, [filteredInvoices, currentPage, itemsPerPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedInvoices.map(inv => inv.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (invoiceId) => {
    setSelectedIds(prev =>
      prev.includes(invoiceId)
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  // Bulk actions
  const handleBulkDeleteClick = () => {
    setDeleteTarget('bulk');
    setShowDeleteConfirm(true);
  };

  const handleBulkDeleteConfirm = async () => {
    try {
      await Promise.all(selectedIds.map(id => deleteInvoice(id)));
      showSuccess(`${selectedIds.length} invoice(s) deleted successfully`);
      setSelectedIds([]);
    } catch (error) {
      showError('Failed to delete invoices');
    }
  };

  const handleBulkDownload = async () => {
    if (selectedIds.length === 0) return;

    setIsDownloading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const invoiceId of selectedIds) {
        try {
          const invoice = invoices.find(inv => inv.id === invoiceId);
          const blob = await invoicesAPI.downloadPDF(invoiceId);

          // Create download link
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `invoice-${invoice?.invoice_number || invoiceId}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          successCount++;
        } catch (err) {
          console.error(`Failed to download invoice ${invoiceId}:`, err);
          failCount++;
        }
      }

      if (successCount > 0) {
        showSuccess(`Downloaded ${successCount} invoice(s) successfully`);
      }
      if (failCount > 0) {
        showError(`Failed to download ${failCount} invoice(s)`);
      }

      setSelectedIds([]);
    } catch (error) {
      showError('Failed to download invoices');
    } finally {
      setIsDownloading(false);
    }
  };

  // Individual actions
  const handleEdit = (invoice) => {
    navigate(`/finance/invoices/${invoice.id}/edit`);
    setOpenActionMenuId(null);
  };

  const handleView = (invoice) => {
    navigate(`/finance/invoices/${invoice.id}`);
    setOpenActionMenuId(null);
  };

  const handleDeleteClick = (invoice) => {
    setDeleteTarget(invoice);
    setShowDeleteConfirm(true);
    setOpenActionMenuId(null);
  };

  const handleDeleteConfirm = async () => {
    if (deleteTarget === 'bulk') {
      await handleBulkDeleteConfirm();
    } else if (deleteTarget) {
      try {
        await deleteInvoice(deleteTarget.id);
        showSuccess('Invoice deleted successfully');
      } catch (error) {
        showError('Failed to delete invoice');
      }
    }
    setDeleteTarget(null);
  };

  const handleSend = (invoice) => {
    setInvoiceToSend(invoice);
    setShowSendDialog(true);
    setOpenActionMenuId(null);
  };

  const handleSendSuccess = () => {
    setShowSendDialog(false);
    setInvoiceToSend(null);
  };

  const handleDownloadPDF = async (invoice) => {
    setOpenActionMenuId(null);

    try {
      const blob = await invoicesAPI.downloadPDF(invoice.id);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice.invoice_number || invoice.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccess(`Downloaded invoice ${invoice.invoice_number}`);
    } catch (error) {
      showError('Failed to download PDF');
    }
  };

  const handleClone = async (invoice) => {
    setOpenActionMenuId(null);

    try {
      // Use context method to clone - this also adds to state immediately
      const clonedInvoice = await cloneInvoice(invoice.id);
      showSuccess(`Invoice cloned successfully. New invoice: ${clonedInvoice.invoice_number}`);
      // Navigate to edit the cloned invoice
      navigate(`/finance/invoices/${clonedInvoice.id}/edit`);
    } catch (error) {
      console.error('Failed to clone invoice:', error);
      showError(error.message || 'Failed to clone invoice');
    }
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${INVOICE_STATUS_COLORS[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
        {INVOICE_STATUS_LABELS[status] || status}
      </span>
    );
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Format converted total value for display
  const formatConvertedValue = (converted) => {
    if (!converted) return `${getCurrencySymbol('USD')}${formatNumber(0)}`;
    const symbol = converted.currency_symbol || getCurrencySymbol(converted.currency_code || 'USD');
    return `${symbol}${formatNumber(parseFloat(converted.total || 0))}`;
  };

  // Format currency breakdown for subtitle (e.g., "£123.23 + $456.78")
  // Shows breakdown when: multiple currencies OR converted currency differs from original
  const formatCurrencyBreakdown = (byCurrencyArray, convertedCurrency) => {
    if (!byCurrencyArray || byCurrencyArray.length === 0) return undefined;

    // Always show breakdown if converted currency is different from original currencies
    const hasConvertedDifference = convertedCurrency &&
      byCurrencyArray.length > 0 &&
      byCurrencyArray.some(item => item.currency_code !== convertedCurrency.currency_code);

    // Show breakdown if multiple currencies OR if converted currency differs
    if (byCurrencyArray.length <= 1 && !hasConvertedDifference) return undefined;

    return byCurrencyArray
      .map(item => `${item.currency_symbol}${formatNumber(parseFloat(item.total || 0))}`)
      .join(' + ');
  };

  // Fallback to single currency display if no converted value
  const getSingleCurrencyDisplay = (byCurrencyArray) => {
    if (!byCurrencyArray || byCurrencyArray.length === 0) {
      return `${getCurrencySymbol('USD')}${formatNumber(0)}`;
    }
    const item = byCurrencyArray[0];
    return `${item.currency_symbol}${formatNumber(parseFloat(item.total || 0))}`;
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Invoices"
          value={loading ? '...' : stats.total.toString()}
          subtitle={stats.overdueCount > 0 ? `${stats.overdueCount} overdue` : undefined}
          icon={FileText}
          iconColor="blue"
        />
        <KPICard
          title="Total Invoiced"
          value={loading ? '...' : (stats.convertedTotal
            ? formatConvertedValue(stats.convertedTotal)
            : getSingleCurrencyDisplay(stats.totalByCurrency))}
          subtitle={!loading ? formatCurrencyBreakdown(stats.totalByCurrency, stats.convertedTotal) : undefined}
          icon={DollarSign}
          iconColor="green"
        />
        <KPICard
          title="Outstanding"
          value={loading ? '...' : (stats.convertedOutstanding
            ? formatConvertedValue(stats.convertedOutstanding)
            : getSingleCurrencyDisplay(stats.outstandingByCurrencyArray))}
          subtitle={!loading ? formatCurrencyBreakdown(stats.outstandingByCurrencyArray, stats.convertedOutstanding) : undefined}
          icon={Clock}
          iconColor="yellow"
        />
        <KPICard
          title="Overdue"
          value={loading ? '...' : (stats.convertedOverdue
            ? formatConvertedValue(stats.convertedOverdue)
            : getSingleCurrencyDisplay(stats.overdueByCurrencyArray))}
          subtitle={!loading ? formatCurrencyBreakdown(stats.overdueByCurrencyArray, stats.convertedOverdue) : undefined}
          icon={AlertCircle}
          iconColor="red"
        />
      </div>

      {/* Invoices Section */}
      <div>
        {/* Section Header with Search and Filter */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#09090b]">Invoices</h2>
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-64"
              />
            </div>

            {/* Date Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDateDropdown(!showDateDropdown)}
                className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  datePreset !== 'all'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-300 text-gray-700'
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span className="max-w-[150px] truncate">{getDateFilterLabel()}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showDateDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showDateDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowDateDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-40">
                    <div className="p-3 border-b border-gray-200">
                      {/* Date Type Toggle */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm text-gray-600">Filter by:</span>
                        <div className="flex bg-gray-100 rounded-lg p-1">
                          <button
                            onClick={() => handleDateTypeChange('issue')}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                              dateType === 'issue'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            Issue Date
                          </button>
                          <button
                            onClick={() => handleDateTypeChange('due')}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                              dateType === 'due'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            Due Date
                          </button>
                        </div>
                      </div>

                      {/* Preset Options */}
                      <div className="grid grid-cols-2 gap-2">
                        {DATE_PRESETS.filter(p => p.key !== 'custom').map((preset) => (
                          <button
                            key={preset.key}
                            onClick={() => handleDateFilterChange(preset.key)}
                            className={`px-3 py-2 text-sm rounded-md transition-colors text-left ${
                              datePreset === preset.key
                                ? 'bg-purple-100 text-purple-700 font-medium'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Date Range */}
                    <div className="p-3 border-b border-gray-200">
                      <div className="text-sm font-medium text-gray-700 mb-2">Custom Range</div>
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={customDateFrom}
                          onChange={(e) => handleCustomDateChange(e.target.value, customDateTo)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <span className="text-gray-400">to</span>
                        <input
                          type="date"
                          value={customDateTo}
                          onChange={(e) => handleCustomDateChange(customDateFrom, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-3 flex items-center justify-between">
                      <button
                        onClick={clearDateFilter}
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        Clear Filter
                      </button>
                      <button
                        onClick={() => setShowDateDropdown(false)}
                        className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Clients Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowClientDropdown(!showClientDropdown)}
                className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  selectedClientIds.length > 0
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-300 text-gray-700'
                }`}
              >
                <Users className="h-4 w-4" />
                Clients
                {selectedClientIds.length > 0 && (
                  <span className="px-1.5 py-0.5 text-xs font-medium bg-purple-600 text-white rounded-full">
                    {selectedClientIds.length}
                  </span>
                )}
              </button>
              {showClientDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowClientDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-40">
                    {/* Search Input */}
                    <div className="p-3 border-b border-gray-200">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search clients..."
                          value={clientSearchQuery}
                          onChange={(e) => setClientSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Select All / Clear All */}
                    <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                      <button
                        onClick={() => {
                          const allClientIds = allClients.map(c => c.id);
                          setSelectedClientIds(allClientIds);
                        }}
                        className="text-xs font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1"
                      >
                        <Check className="h-3 w-3" />
                        Select All
                      </button>
                      <button
                        onClick={handleClearClientSelection}
                        className="text-xs font-medium text-gray-500 hover:text-gray-700 flex items-center gap-1"
                      >
                        <X className="h-3 w-3" />
                        Clear All
                      </button>
                    </div>

                    {/* Client List */}
                    <div className="max-h-64 overflow-y-auto p-2">
                      {clientsLoading ? (
                        <p className="text-sm text-gray-500 py-4 text-center">Loading clients...</p>
                      ) : filteredClients.length === 0 ? (
                        <p className="text-sm text-gray-500 py-4 text-center">
                          {allClients.length === 0 ? 'No clients found' : 'No matching clients'}
                        </p>
                      ) : (
                        filteredClients.map((client) => (
                          <label
                            key={client.id}
                            className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedClientIds.includes(client.id)}
                              onChange={() => {
                                setSelectedClientIds(prev =>
                                  prev.includes(client.id)
                                    ? prev.filter(id => id !== client.id)
                                    : [...prev, client.id]
                                );
                              }}
                              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            />
                            <span className="truncate flex-1">{getClientDisplayName(client)}</span>
                            {selectedClientIds.includes(client.id) && (
                              <Check className="h-4 w-4 text-purple-600 flex-shrink-0" />
                            )}
                          </label>
                        ))
                      )}
                    </div>

                    {/* Done button */}
                    <div className="p-3 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setShowClientDropdown(false);
                          setClientSearchQuery('');
                          // Apply the filter to backend
                          updateFilters({
                            contact_ids: selectedClientIds.length > 0 ? selectedClientIds.join(',') : null
                          });
                        }}
                        className="w-full px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Active Date Filter Tag */}
            {datePreset !== 'all' && (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm">
                <span className="capitalize">{dateType} Date:</span>
                <span className="font-medium">{getDateFilterLabel()}</span>
                <button
                  onClick={clearDateFilter}
                  className="ml-1 p-0.5 hover:bg-purple-200 rounded-full"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Active Status Filter Tag */}
            {filterStatus !== 'all' && (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm">
                <span>Status:</span>
                <span className="font-medium">{INVOICE_STATUS_LABELS[filterStatus] || filterStatus}</span>
                <button
                  onClick={() => setFilterStatus('all')}
                  className="ml-1 p-0.5 hover:bg-purple-200 rounded-full"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Active Recurring Filter Tag */}
            {showRecurringOnly && (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm">
                <Repeat className="h-3.5 w-3.5" />
                <span className="font-medium">Recurring Only</span>
                <button
                  onClick={() => setShowRecurringOnly(false)}
                  className="ml-1 p-0.5 hover:bg-purple-200 rounded-full"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Active Parent Template Filter Tag */}
            {parentInvoiceId && (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm">
                <Repeat className="h-3.5 w-3.5" />
                <span>Generated from:</span>
                <span className="font-medium">
                  {parentTemplateInfo?.invoice_number || 'Template'}
                </span>
                <button
                  onClick={clearParentFilter}
                  className="ml-1 p-0.5 hover:bg-purple-200 rounded-full"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  filterStatus !== 'all' || showRecurringOnly
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-300 text-gray-700'
                }`}
              >
                <Filter className="h-4 w-4" />
                Filter
                {(filterStatus !== 'all' || showRecurringOnly) && (
                  <span className="bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {(filterStatus !== 'all' ? 1 : 0) + (showRecurringOnly ? 1 : 0)}
                  </span>
                )}
              </button>
              {showFilterDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowFilterDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-40">
                    {/* Status Filter Section */}
                    <div className="p-3 border-b border-gray-200">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Status</div>
                      <div className="space-y-1">
                        <button
                          onClick={() => setFilterStatus('all')}
                          className={`block w-full text-left px-3 py-2 text-sm rounded-md ${filterStatus === 'all' ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          All Invoices
                        </button>
                        <button
                          onClick={() => setFilterStatus(INVOICE_STATUS.DRAFT)}
                          className={`block w-full text-left px-3 py-2 text-sm rounded-md ${filterStatus === INVOICE_STATUS.DRAFT ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          Draft
                        </button>
                        <button
                          onClick={() => setFilterStatus(INVOICE_STATUS.SENT)}
                          className={`block w-full text-left px-3 py-2 text-sm rounded-md ${filterStatus === INVOICE_STATUS.SENT ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          Sent
                        </button>
                        <button
                          onClick={() => setFilterStatus(INVOICE_STATUS.PAID)}
                          className={`block w-full text-left px-3 py-2 text-sm rounded-md ${filterStatus === INVOICE_STATUS.PAID ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          Paid
                        </button>
                        <button
                          onClick={() => setFilterStatus(INVOICE_STATUS.OVERDUE)}
                          className={`block w-full text-left px-3 py-2 text-sm rounded-md ${filterStatus === INVOICE_STATUS.OVERDUE ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          Overdue
                        </button>
                      </div>
                    </div>

                    {/* Recurring Filter Section */}
                    <div className="p-3 border-b border-gray-200">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Type</div>
                      <label className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showRecurringOnly}
                          onChange={(e) => setShowRecurringOnly(e.target.checked)}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <Repeat className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700">Show Recurring Only</span>
                      </label>
                    </div>

                    {/* Actions */}
                    <div className="p-3 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setFilterStatus('all');
                          setShowRecurringOnly(false);
                        }}
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        Clear All
                      </button>
                      <button
                        onClick={() => setShowFilterDropdown(false)}
                        className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <div className="mb-4 bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-purple-900">
              {selectedIds.length} invoice{selectedIds.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkDownload}
                disabled={isDownloading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-700 hover:bg-purple-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDownloading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-purple-700 border-t-transparent rounded-full animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download
                  </>
                )}
              </button>
              <button
                onClick={handleBulkDeleteClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 rounded-md transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="overflow-x-auto rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === paginatedInvoices.length && paginatedInvoices.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="w-12 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-12 text-center text-sm text-gray-500">
                      Loading invoices...
                    </td>
                  </tr>
                ) : paginatedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-12 text-center text-sm text-gray-500">
                      No invoices found
                    </td>
                  </tr>
                ) : (
                  paginatedInvoices.map((invoice) => {
                    return (
                      <tr
                        key={invoice.id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleView(invoice)}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(invoice.id)}
                            onChange={() => handleSelectOne(invoice.id)}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          #{invoice.invoice_number || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {invoice.contact?.business_name ||
                           (invoice.contact?.first_name && invoice.contact?.last_name
                             ? `${invoice.contact.first_name} ${invoice.contact.last_name}`
                             : '-')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(invoice.issue_date || invoice.invoice_date)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(invoice.due_date)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {invoice.currency?.symbol || getCurrencySymbol(invoice.currency?.code)}{formatNumber(typeof invoice.total === 'number' ? invoice.total : parseFloat(invoice.total || 0))}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex flex-wrap gap-1">
                            <StatusBadge status={invoice.status} />

                            {/* Recurring status badge */}
                            {(invoice.pricing_type === 'recurring' || invoice.is_recurring) && (
                              <span className={`px-2 py-1 text-xs font-medium rounded inline-flex items-center gap-1 ${
                                invoice.parent_invoice_id
                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                  : invoice.recurring_status === 'paused'
                                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                    : invoice.recurring_status === 'cancelled'
                                      ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              }`}>
                                {!invoice.parent_invoice_id && <Repeat className="h-3 w-3" />}
                                {invoice.parent_invoice_id
                                  ? 'Auto-Generated'
                                  : invoice.recurring_status === 'paused'
                                    ? 'Paused'
                                    : invoice.recurring_status === 'cancelled'
                                      ? 'Cancelled'
                                      : 'Active'}
                              </span>
                            )}

                            {/* Generated invoice badge */}
                            {invoice.generated_from_template && (
                              <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                Gen #{invoice.recurrence_sequence_number || 'N/A'}
                              </span>
                            )}

                            {/* Outstanding balance badge */}
                            {invoice.outstanding_balance && parseFloat(invoice.outstanding_balance) !== 0 && (
                              <span className={`px-2 py-1 text-xs font-medium rounded ${
                                parseFloat(invoice.outstanding_balance) > 0
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                  : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              }`}>
                                {parseFloat(invoice.outstanding_balance) > 0
                                  ? `${invoice.currency?.symbol || getCurrencySymbol(invoice.currency?.code)}${formatNumber(parseFloat(invoice.outstanding_balance))} Due`
                                  : `${invoice.currency?.symbol || getCurrencySymbol(invoice.currency?.code)}${formatNumber(Math.abs(parseFloat(invoice.outstanding_balance)))} Credit`
                                }
                              </span>
                            )}

                            {/* Auto-billing failed badge */}
                            {invoice.auto_billing_failed && (
                              <span className="px-2 py-1 text-xs font-medium rounded bg-red-600 text-white inline-flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Payment Failed
                              </span>
                            )}

                            {/* Auto-billing retry scheduled badge */}
                            {!invoice.auto_billing_failed && invoice.next_auto_billing_retry_at && (
                              <span className="px-2 py-1 text-xs font-medium rounded bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Retry Scheduled
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm" onClick={(e) => e.stopPropagation()}>
                          <div className="relative inline-block">
                            <button
                              id={`action-btn-${invoice.id}`}
                              onClick={() => setOpenActionMenuId(openActionMenuId === invoice.id ? null : invoice.id)}
                              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                            >
                              <MoreVertical className="h-4 w-4 text-gray-400" />
                            </button>
                            {openActionMenuId === invoice.id && (
                              <ActionMenu
                                itemId={invoice.id}
                                onClose={() => setOpenActionMenuId(null)}
                                actions={[
                                  { label: 'View', onClick: () => handleView(invoice) },
                                  { label: 'Edit', onClick: () => handleEdit(invoice) },
                                  { label: 'Send', onClick: () => handleSend(invoice) },
                                  { label: 'Download PDF', onClick: () => handleDownloadPDF(invoice) },
                                  { label: 'Clone', onClick: () => handleClone(invoice) },
                                  { label: 'Delete', onClick: () => handleDeleteClick(invoice), variant: 'danger' },
                                ]}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {!loading && paginatedInvoices.length > 0 && totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                {/* Mobile pagination */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                    {' '}to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, filteredInvoices.length)}
                    </span>
                    {' '}of{' '}
                    <span className="font-medium">{filteredInvoices.length}</span>
                    {' '}results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    {/* Previous button */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {/* Page numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === page
                                ? 'z-10 bg-purple-50 border-purple-500 text-purple-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <span
                            key={page}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                          >
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}

                    {/* Next button */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Send Invoice Dialog */}
      <SendInvoiceDialog
        isOpen={showSendDialog}
        onClose={() => setShowSendDialog(false)}
        invoice={invoiceToSend}
        contact={invoiceToSend?.contact}
        onSuccess={handleSendSuccess}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDeleteConfirm}
        title={deleteTarget === 'bulk'
          ? `Delete ${selectedIds.length} Invoice${selectedIds.length !== 1 ? 's' : ''}?`
          : 'Delete Invoice?'
        }
        message={deleteTarget === 'bulk'
          ? `Are you sure you want to delete ${selectedIds.length} selected invoice${selectedIds.length !== 1 ? 's' : ''}? This action cannot be undone.`
          : `Are you sure you want to delete invoice ${deleteTarget?.invoice_number || ''}? This action cannot be undone.`
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default InvoiceList;
