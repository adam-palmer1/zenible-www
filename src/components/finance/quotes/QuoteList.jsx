import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  MoreVertical,
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  Trash2,
  Download,
  Calendar,
  ChevronDown,
  X,
  TrendingUp
} from 'lucide-react';
import { useQuotes } from '../../../contexts/QuoteContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { useCRMReferenceData } from '../../../contexts/CRMReferenceDataContext';
import { useContacts } from '../../../hooks/crm/useContacts';
import { useCompanyAttributes } from '../../../hooks/crm/useCompanyAttributes';
import { QUOTE_STATUS, QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS } from '../../../constants/finance';
import { formatCurrency, getCurrencySymbol } from '../../../utils/currency';
import { applyNumberFormat } from '../../../utils/numberFormatUtils';
import KPICard from '../shared/KPICard';
import SendQuoteModal from './SendQuoteModal';
import ConvertToInvoiceModal from './ConvertToInvoiceModal';
import ConfirmationModal from '../../shared/ConfirmationModal';
import quotesAPI from '../../../services/api/finance/quotes';

// Action Menu Component - uses portal to escape overflow containers
const ActionMenu = ({ quote, onClose, onView, onEdit, onSend, onDownload, onClone, onConvert, onDelete }) => {
  const menuRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    // Get the button position to place the menu
    const button = document.getElementById(`action-btn-${quote.id}`);
    if (button) {
      const rect = button.getBoundingClientRect();
      const menuWidth = 192; // w-48 = 12rem = 192px

      // Position below the button, aligned to the right
      setPosition({
        top: rect.bottom + 4,
        left: Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 16),
      });
    }
  }, [quote.id]);

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998]"
        onClick={onClose}
      />
      {/* Menu */}
      <div
        ref={menuRef}
        className="fixed w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-[9999]"
        style={{ top: position.top, left: position.left }}
      >
        <div className="py-1">
          <button
            onClick={onView}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            View
          </button>
          <button
            onClick={onEdit}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Edit
          </button>
          <button
            onClick={onSend}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Send
          </button>
          <button
            onClick={onDownload}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Download PDF
          </button>
          <button
            onClick={onClone}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Clone
          </button>
          {quote.status === QUOTE_STATUS.ACCEPTED && (
            <button
              onClick={onConvert}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Convert to Invoice
            </button>
          )}
          <button
            onClick={onDelete}
            className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>
    </>,
    document.body
  );
};

const QuoteList = () => {
  const navigate = useNavigate();
  const { quotes, loading, deleteQuote, updateFilters, cloneQuote, stats, statsLoading } = useQuotes();
  const { showSuccess, showError } = useNotification();
  const { contacts: allClients, loading: clientsLoading } = useContacts({ is_client: true });
  const { numberFormats } = useCRMReferenceData();
  const { getNumberFormat } = useCompanyAttributes();

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

  // Calculate stats from quotes if API stats not available
  const calculatedStats = useMemo(() => {
    const total = stats?.total_count ?? quotes.length;
    const totalValue = stats?.total_value ?? quotes.reduce((sum, q) => sum + (q.total || 0), 0);
    const acceptedValue = stats?.accepted_value ?? quotes.filter(q => q.status === QUOTE_STATUS.ACCEPTED).reduce((sum, q) => sum + (q.total || 0), 0);
    const pendingValue = stats?.pending_value ?? quotes.filter(q => q.status === QUOTE_STATUS.SENT).reduce((sum, q) => sum + (q.total || 0), 0);
    const acceptedCount = stats?.accepted_count ?? quotes.filter(q => q.status === QUOTE_STATUS.ACCEPTED).length;
    const rejectedCount = stats?.rejected_count ?? quotes.filter(q => q.status === QUOTE_STATUS.REJECTED).length;
    const acceptanceRate = stats?.acceptance_rate ?? (
      (acceptedCount + rejectedCount) > 0
        ? Math.round((acceptedCount / (acceptedCount + rejectedCount)) * 100)
        : 0
    );

    return { total, totalValue, acceptedValue, pendingValue, acceptanceRate };
  }, [quotes, stats]);

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
  const [selectedIds, setSelectedIds] = useState([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [datePreset, setDatePreset] = useState('all');
  const [dateType, setDateType] = useState('issue'); // 'issue' or 'valid'
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [quoteToSend, setQuoteToSend] = useState(null);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [quoteToConvert, setQuoteToConvert] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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

    updateFilters({
      from_date: dateFrom,
      to_date: dateTo,
    });

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
      updateFilters({
        from_date: from,
        to_date: to,
      });
    }
  };

  // Clear date filter
  const clearDateFilter = () => {
    setDatePreset('all');
    setCustomDateFrom('');
    setCustomDateTo('');
    updateFilters({
      from_date: null,
      to_date: null,
    });
    setShowDateDropdown(false);
  };

  // Handle client filter toggle
  const handleClientToggle = (clientId) => {
    setSelectedClientIds(prev => {
      const newSelection = prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId];

      updateFilters({
        contact_id: newSelection.length === 1 ? newSelection[0] : null,
      });

      return newSelection;
    });
  };

  // Clear client filter
  const clearClientFilter = () => {
    setSelectedClientIds([]);
    updateFilters({ contact_id: null });
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

  // Get current date filter label
  const getDateFilterLabel = () => {
    if (datePreset === 'all') return 'All Time';
    if (datePreset === 'custom' && customDateFrom && customDateTo) {
      return `${customDateFrom} - ${customDateTo}`;
    }
    const preset = DATE_PRESETS.find(p => p.key === datePreset);
    return preset ? preset.label : 'All Time';
  };

  // Filter and search quotes
  const filteredQuotes = useMemo(() => {
    let result = [...quotes];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(q =>
        q.quote_number?.toLowerCase().includes(query) ||
        q.contact?.business_name?.toLowerCase().includes(query) ||
        q.contact?.first_name?.toLowerCase().includes(query) ||
        q.contact?.last_name?.toLowerCase().includes(query) ||
        q.contact?.email?.toLowerCase().includes(query) ||
        q.total?.toString().includes(query)
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      result = result.filter(q => q.status === filterStatus);
    }

    return result;
  }, [quotes, searchQuery, filterStatus]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, datePreset, customDateFrom, customDateTo, selectedClientIds]);

  // Pagination
  const totalPages = Math.ceil(filteredQuotes.length / itemsPerPage);
  const paginatedQuotes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredQuotes.slice(startIndex, endIndex);
  }, [filteredQuotes, currentPage, itemsPerPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedQuotes.map(q => q.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (quoteId) => {
    setSelectedIds(prev =>
      prev.includes(quoteId)
        ? prev.filter(id => id !== quoteId)
        : [...prev, quoteId]
    );
  };

  // Bulk actions
  const handleBulkDeleteClick = () => {
    setDeleteTarget('bulk');
    setShowDeleteConfirm(true);
  };

  const handleBulkDeleteConfirm = async () => {
    try {
      await Promise.all(selectedIds.map(id => deleteQuote(id)));
      showSuccess(`${selectedIds.length} quote(s) deleted successfully`);
      setSelectedIds([]);
    } catch (error) {
      showError('Failed to delete quotes');
    }
  };

  const handleBulkDownload = async () => {
    if (selectedIds.length === 0) return;

    setIsDownloading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const quoteId of selectedIds) {
        try {
          const quote = quotes.find(q => q.id === quoteId);
          const blob = await quotesAPI.downloadPDF(quoteId);

          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `quote-${quote?.quote_number || quoteId}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          successCount++;
        } catch (err) {
          console.error(`Failed to download quote ${quoteId}:`, err);
          failCount++;
        }
      }

      if (successCount > 0) {
        showSuccess(`Downloaded ${successCount} quote(s) successfully`);
      }
      if (failCount > 0) {
        showError(`Failed to download ${failCount} quote(s)`);
      }

      setSelectedIds([]);
    } catch (error) {
      showError('Failed to download quotes');
    } finally {
      setIsDownloading(false);
    }
  };

  // Individual actions
  const handleEdit = (quote) => {
    navigate(`/finance/quotes/${quote.id}/edit`);
    setOpenActionMenuId(null);
  };

  const handleView = (quote) => {
    navigate(`/finance/quotes/${quote.id}`);
    setOpenActionMenuId(null);
  };

  const handleDeleteClick = (quote) => {
    setDeleteTarget(quote);
    setShowDeleteConfirm(true);
    setOpenActionMenuId(null);
  };

  const handleDeleteConfirm = async () => {
    if (deleteTarget === 'bulk') {
      await handleBulkDeleteConfirm();
    } else if (deleteTarget) {
      try {
        await deleteQuote(deleteTarget.id);
        showSuccess('Quote deleted successfully');
      } catch (error) {
        showError('Failed to delete quote');
      }
    }
    setDeleteTarget(null);
  };

  const handleSend = (quote) => {
    setQuoteToSend(quote);
    setShowSendModal(true);
    setOpenActionMenuId(null);
  };

  const handleSendSuccess = () => {
    setShowSendModal(false);
    setQuoteToSend(null);
  };

  const handleConvert = (quote) => {
    setQuoteToConvert(quote);
    setShowConvertModal(true);
    setOpenActionMenuId(null);
  };

  const handleDownloadPDF = async (quote) => {
    setOpenActionMenuId(null);

    try {
      const blob = await quotesAPI.downloadPDF(quote.id);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quote-${quote.quote_number || quote.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccess(`Downloaded quote ${quote.quote_number}`);
    } catch (error) {
      showError('Failed to download PDF');
    }
  };

  const handleClone = async (quote) => {
    setOpenActionMenuId(null);

    try {
      const clonedQuote = await cloneQuote(quote.id);
      showSuccess(`Quote cloned successfully. New quote: ${clonedQuote.quote_number}`);
      navigate(`/finance/quotes/${clonedQuote.id}/edit`);
    } catch (error) {
      console.error('Failed to clone quote:', error);
      showError(error.message || 'Failed to clone quote');
    }
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${QUOTE_STATUS_COLORS[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
        {QUOTE_STATUS_LABELS[status] || status}
      </span>
    );
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Quotes"
          value={statsLoading ? '...' : calculatedStats.total}
          icon={FileText}
          iconColor="blue"
        />
        <KPICard
          title="Total Value"
          value={statsLoading ? '...' : `${getCurrencySymbol('USD')}${formatNumber(calculatedStats.totalValue)}`}
          icon={DollarSign}
          iconColor="purple"
        />
        <KPICard
          title="Pending Value"
          value={statsLoading ? '...' : `${getCurrencySymbol('USD')}${formatNumber(calculatedStats.pendingValue)}`}
          icon={Clock}
          iconColor="yellow"
        />
        <KPICard
          title="Acceptance Rate"
          value={statsLoading ? '...' : `${calculatedStats.acceptanceRate}%`}
          icon={TrendingUp}
          iconColor="green"
        />
      </div>

      {/* Quotes Section */}
      <div>
        {/* Section Header with Search and Filter */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#09090b]">Quotes</h2>
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

            {/* Active Date Filter Tag */}
            {datePreset !== 'all' && (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm">
                <span>Date:</span>
                <span className="font-medium">{getDateFilterLabel()}</span>
                <button
                  onClick={clearDateFilter}
                  className="ml-1 p-0.5 hover:bg-purple-200 rounded-full"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Active Client Filter Tag */}
            {selectedClientIds.length > 0 && (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm">
                <span>Client:</span>
                <span className="font-medium max-w-[150px] truncate">{getSelectedClientsLabel()}</span>
                <button
                  onClick={clearClientFilter}
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
                <span className="font-medium">{QUOTE_STATUS_LABELS[filterStatus] || filterStatus}</span>
                <button
                  onClick={() => setFilterStatus('all')}
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
                  filterStatus !== 'all' || selectedClientIds.length > 0
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-300 text-gray-700'
                }`}
              >
                <Filter className="h-4 w-4" />
                Filter
                {(filterStatus !== 'all' || selectedClientIds.length > 0) && (
                  <span className="bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {(filterStatus !== 'all' ? 1 : 0) + (selectedClientIds.length > 0 ? 1 : 0)}
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
                          All Quotes
                        </button>
                        <button
                          onClick={() => setFilterStatus(QUOTE_STATUS.DRAFT)}
                          className={`block w-full text-left px-3 py-2 text-sm rounded-md ${filterStatus === QUOTE_STATUS.DRAFT ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          Draft
                        </button>
                        <button
                          onClick={() => setFilterStatus(QUOTE_STATUS.SENT)}
                          className={`block w-full text-left px-3 py-2 text-sm rounded-md ${filterStatus === QUOTE_STATUS.SENT ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          Sent
                        </button>
                        <button
                          onClick={() => setFilterStatus(QUOTE_STATUS.ACCEPTED)}
                          className={`block w-full text-left px-3 py-2 text-sm rounded-md ${filterStatus === QUOTE_STATUS.ACCEPTED ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          Accepted
                        </button>
                        <button
                          onClick={() => setFilterStatus(QUOTE_STATUS.REJECTED)}
                          className={`block w-full text-left px-3 py-2 text-sm rounded-md ${filterStatus === QUOTE_STATUS.REJECTED ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          Rejected
                        </button>
                        <button
                          onClick={() => setFilterStatus(QUOTE_STATUS.EXPIRED)}
                          className={`block w-full text-left px-3 py-2 text-sm rounded-md ${filterStatus === QUOTE_STATUS.EXPIRED ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          Expired
                        </button>
                      </div>
                    </div>

                    {/* Client Filter Section */}
                    <div className="p-3 border-b border-gray-200">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Client</div>

                      {/* Client Search */}
                      <div className="relative mb-2">
                        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search clients..."
                          value={clientSearchQuery}
                          onChange={(e) => setClientSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>

                      {/* Client List with Checkboxes */}
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {clientsLoading ? (
                          <div className="text-center py-4 text-sm text-gray-500">Loading clients...</div>
                        ) : filteredClients.length === 0 ? (
                          <div className="text-center py-4 text-sm text-gray-500">No clients found</div>
                        ) : (
                          filteredClients.map(client => (
                            <label
                              key={client.id}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedClientIds.includes(client.id)}
                                onChange={() => handleClientToggle(client.id)}
                                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-700 truncate">
                                {client.business_name || `${client.first_name} ${client.last_name}`}
                              </span>
                            </label>
                          ))
                        )}
                      </div>

                      {/* Clear client selection */}
                      {selectedClientIds.length > 0 && (
                        <button
                          onClick={clearClientFilter}
                          className="mt-2 text-xs text-purple-600 hover:text-purple-700"
                        >
                          Clear client selection
                        </button>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="p-3 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setFilterStatus('all');
                          clearClientFilter();
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
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedIds.length} quote{selectedIds.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkDownload}
                disabled={isDownloading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDownloading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
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
                      checked={selectedIds.length === paginatedQuotes.length && paginatedQuotes.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quote
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valid Until
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
                      Loading quotes...
                    </td>
                  </tr>
                ) : paginatedQuotes.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-12 text-center text-sm text-gray-500">
                      No quotes found
                    </td>
                  </tr>
                ) : (
                  paginatedQuotes.map((quote) => (
                    <tr
                      key={quote.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleView(quote)}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(quote.id)}
                          onChange={() => handleSelectOne(quote.id)}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        #{quote.quote_number || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {quote.contact?.business_name ||
                         (quote.contact?.first_name && quote.contact?.last_name
                           ? `${quote.contact.first_name} ${quote.contact.last_name}`
                           : '-')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(quote.issue_date || quote.quote_date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(quote.valid_until)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {quote.currency?.symbol || getCurrencySymbol(quote.currency?.code)}{formatNumber(typeof quote.total === 'number' ? quote.total : parseFloat(quote.total || 0))}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <StatusBadge status={quote.status} />
                      </td>
                      <td className="px-4 py-3 text-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block">
                          <button
                            id={`action-btn-${quote.id}`}
                            onClick={() => setOpenActionMenuId(openActionMenuId === quote.id ? null : quote.id)}
                            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                          >
                            <MoreVertical className="h-4 w-4 text-gray-400" />
                          </button>
                          {openActionMenuId === quote.id && (
                            <ActionMenu
                              quote={quote}
                              onClose={() => setOpenActionMenuId(null)}
                              onView={() => handleView(quote)}
                              onEdit={() => handleEdit(quote)}
                              onSend={() => handleSend(quote)}
                              onDownload={() => handleDownloadPDF(quote)}
                              onClone={() => handleClone(quote)}
                              onConvert={() => handleConvert(quote)}
                              onDelete={() => handleDeleteClick(quote)}
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

          {/* Pagination Controls */}
          {!loading && paginatedQuotes.length > 0 && totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
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
                      {Math.min(currentPage * itemsPerPage, filteredQuotes.length)}
                    </span>
                    {' '}of{' '}
                    <span className="font-medium">{filteredQuotes.length}</span>
                    {' '}results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
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

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
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

      {/* Send Quote Modal */}
      <SendQuoteModal
        isOpen={showSendModal}
        onClose={() => {
          setShowSendModal(false);
          setQuoteToSend(null);
        }}
        quote={quoteToSend}
        onSuccess={handleSendSuccess}
      />

      {/* Convert to Invoice Modal */}
      <ConvertToInvoiceModal
        isOpen={showConvertModal}
        onClose={() => {
          setShowConvertModal(false);
          setQuoteToConvert(null);
        }}
        quote={quoteToConvert}
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
          ? `Delete ${selectedIds.length} Quote${selectedIds.length !== 1 ? 's' : ''}?`
          : 'Delete Quote?'
        }
        message={deleteTarget === 'bulk'
          ? `Are you sure you want to delete ${selectedIds.length} selected quote${selectedIds.length !== 1 ? 's' : ''}? This action cannot be undone.`
          : `Are you sure you want to delete quote ${deleteTarget?.quote_number || ''}? This action cannot be undone.`
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default QuoteList;
