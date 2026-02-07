import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Filter,
  Calendar,
  ChevronDown,
  X
} from 'lucide-react';
import { CREDIT_NOTE_STATUS, CREDIT_NOTE_STATUS_COLORS, CREDIT_NOTE_STATUS_LABELS } from '../../../constants/finance';
import { formatCurrency, getCurrencySymbol } from '../../../utils/currency';
import creditNotesAPI from '../../../services/api/finance/creditNotes';
import { useNotification } from '../../../contexts/NotificationContext';
import { useContacts } from '../../../hooks/crm/useContacts';
import { useCRMReferenceData } from '../../../contexts/CRMReferenceDataContext';
import { useCompanyAttributes } from '../../../hooks/crm/useCompanyAttributes';
import { applyNumberFormat } from '../../../utils/numberFormatUtils';
import NewSidebar from '../../sidebar/NewSidebar';
import KPICard from '../shared/KPICard';
import CreditNoteDetailModal from './CreditNoteDetailModal';
import { useModalState } from '../../../hooks/useModalState';

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

interface StatusBadgeProps {
  status: string;
}

const CreditNotesDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showError } = useNotification() as any;
  const { contacts: allClients, loading: clientsLoading } = useContacts({ is_client: true }) as any;
  const { numberFormats } = useCRMReferenceData() as any;
  const { getNumberFormat } = useCompanyAttributes() as any;

  // Number format from company settings
  const numberFormat = useMemo(() => {
    const formatId = getNumberFormat();
    if (formatId && numberFormats.length > 0) {
      return numberFormats.find((f: any) => f.id === formatId);
    }
    return null;
  }, [getNumberFormat, numberFormats]);

  // Helper to format numbers using company settings
  const formatNumber = (num: number): string => {
    return applyNumberFormat(num, numberFormat);
  };

  // State
  const [creditNotes, setCreditNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [selectedCreditNote, setSelectedCreditNote] = useState<any>(null);
  const detailModal = useModalState();

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [datePreset, setDatePreset] = useState('all');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Calculate date range from preset
  const getDateRangeFromPreset = (preset: string): { from: string | null; to: string | null } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const formatDateStr = (date: Date): string => {
      return date.toISOString().split('T')[0];
    };

    switch (preset) {
      case 'today': {
        return { from: formatDateStr(today), to: formatDateStr(today) };
      }
      case 'this_week': {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return { from: formatDateStr(startOfWeek), to: formatDateStr(endOfWeek) };
      }
      case 'this_month': {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return { from: formatDateStr(startOfMonth), to: formatDateStr(endOfMonth) };
      }
      case 'last_month': {
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        return { from: formatDateStr(startOfLastMonth), to: formatDateStr(endOfLastMonth) };
      }
      case 'this_quarter': {
        const quarter = Math.floor(today.getMonth() / 3);
        const startOfQuarter = new Date(today.getFullYear(), quarter * 3, 1);
        const endOfQuarter = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
        return { from: formatDateStr(startOfQuarter), to: formatDateStr(endOfQuarter) };
      }
      case 'this_year': {
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const endOfYear = new Date(today.getFullYear(), 11, 31);
        return { from: formatDateStr(startOfYear), to: formatDateStr(endOfYear) };
      }
      default:
        return { from: null, to: null };
    }
  };

  // Build API filters
  const buildFilters = (): Record<string, any> => {
    const filters: Record<string, any> = {
      page: currentPage,
      per_page: itemsPerPage,
      sort_by: 'created_at',
      sort_direction: 'desc'
    };

    // Add status filter
    if (filterStatus !== 'all') {
      filters.status = filterStatus;
    }

    // Add client filter
    if (selectedClientIds.length > 0) {
      filters.contact_id = selectedClientIds.join(',');
    }

    // Add date filters (backend expects start_date/end_date for issue_date)
    if (datePreset !== 'all') {
      let dateFrom: string | null = null;
      let dateTo: string | null = null;

      if (datePreset === 'custom') {
        dateFrom = customDateFrom || null;
        dateTo = customDateTo || null;
      } else {
        const range = getDateRangeFromPreset(datePreset);
        dateFrom = range.from;
        dateTo = range.to;
      }

      if (dateFrom) {
        filters.start_date = dateFrom;
      }
      if (dateTo) {
        filters.end_date = dateTo;
      }
    }

    // Add search query
    if (searchQuery) {
      filters.search = searchQuery;
    }

    return filters;
  };

  // Load credit notes
  const loadCreditNotes = async () => {
    try {
      setLoading(true);
      const filters = buildFilters();
      const response = await (creditNotesAPI as any).list(filters);
      setCreditNotes(response.items || []);
      setTotalItems(response.total || response.items?.length || 0);
    } catch (error) {
      console.error('Error loading credit notes:', error);
      showError('Failed to load credit notes');
    } finally {
      setLoading(false);
    }
  };

  // Load stats
  const loadStats = async () => {
    try {
      const data = await (creditNotesAPI as any).getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading credit note stats:', error);
    }
  };

  // Initial load
  useEffect(() => {
    loadStats();
  }, []);

  // Load credit notes when filters change
  useEffect(() => {
    loadCreditNotes();
  }, [currentPage, filterStatus, selectedClientIds, datePreset, customDateFrom, customDateTo, searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, selectedClientIds, datePreset, customDateFrom, customDateTo, searchQuery]);

  // Handle date filter change
  const handleDateFilterChange = (preset: string, closeDropdown: boolean = true) => {
    setDatePreset(preset);
    if (closeDropdown && preset !== 'custom') {
      setShowDateDropdown(false);
    }
  };

  // Handle custom date change
  const handleCustomDateChange = (from: string, to: string) => {
    setCustomDateFrom(from);
    setCustomDateTo(to);

    if (from && to) {
      setDatePreset('custom');
    }
  };

  // Clear date filter
  const clearDateFilter = () => {
    setDatePreset('all');
    setCustomDateFrom('');
    setCustomDateTo('');
    setShowDateDropdown(false);
  };

  // Handle client filter toggle
  const handleClientToggle = (clientId: string) => {
    setSelectedClientIds(prev => {
      const newSelection = prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId];
      return newSelection;
    });
  };

  // Clear client filter
  const clearClientFilter = () => {
    setSelectedClientIds([]);
  };

  // Filter clients by search query
  const filteredClients = useMemo(() => {
    if (!clientSearchQuery) return allClients;
    const query = clientSearchQuery.toLowerCase();
    return allClients.filter((client: any) =>
      client.first_name?.toLowerCase().includes(query) ||
      client.last_name?.toLowerCase().includes(query) ||
      client.business_name?.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query)
    );
  }, [allClients, clientSearchQuery]);

  // Get display name for selected clients
  const getSelectedClientsLabel = (): string | null => {
    if (selectedClientIds.length === 0) return null;
    if (selectedClientIds.length === 1) {
      const client = allClients.find((c: any) => c.id === selectedClientIds[0]);
      if (!client) return '1 client';
      return client.business_name || `${client.first_name} ${client.last_name}`;
    }
    return `${selectedClientIds.length} clients`;
  };

  // Get current date filter label
  const getDateFilterLabel = (): string => {
    if (datePreset === 'all') return 'All Time';
    if (datePreset === 'custom' && customDateFrom && customDateTo) {
      return `${customDateFrom} - ${customDateTo}`;
    }
    const preset = DATE_PRESETS.find(p => p.key === datePreset);
    return preset ? preset.label : 'All Time';
  };

  // Pagination
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateNew = () => {
    navigate('/finance/credit-notes/new');
  };

  const handleViewCreditNote = (creditNote: any) => {
    setSelectedCreditNote(creditNote);
    detailModal.open();
  };

  const handleCloseDetailModal = () => {
    detailModal.close();
    setSelectedCreditNote(null);
  };

  // Format date
  const formatDate = (dateString: string): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Status badge component
  const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${(CREDIT_NOTE_STATUS_COLORS as any)[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
        {(CREDIT_NOTE_STATUS_LABELS as any)[status] || status}
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
        {/* Top Bar - Fixed at top, matches Invoice design */}
        <div className="bg-white border-b border-[#e5e5e5] px-4 py-3 flex items-center justify-between min-h-[64px]">
          <h1 className="text-2xl font-semibold text-[#09090b]">
            Credit Notes
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center gap-2 px-3 py-2.5 text-base font-medium text-white bg-[#8e51ff] rounded-lg hover:bg-[#7c3aed] transition-colors"
            >
              <Plus className="h-5 w-5" />
              New Credit Note
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 space-y-6">
            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="Total Credits"
                value={stats ? formatCurrency(stats.total_credits || 0, 'USD') : '$0.00'}
                icon={FileText}
                iconColor="blue"
              />
              <KPICard
                title="Applied"
                value={stats ? formatCurrency(stats.applied_credits || 0, 'USD') : '$0.00'}
                icon={CheckCircle}
                iconColor="green"
              />
              <KPICard
                title="Remaining"
                value={stats ? formatCurrency(stats.remaining_credits || 0, 'USD') : '$0.00'}
                icon={Clock}
                iconColor="yellow"
              />
              <KPICard
                title="Draft"
                value={stats?.draft_count || 0}
                icon={XCircle}
                iconColor="red"
              />
            </div>

            {/* Credit Notes Section */}
            <div>
              {/* Section Header with Search and Filter */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#09090b]">Credit Notes</h2>
                <div className="flex items-center gap-2">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search"
                      value={searchQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
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
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCustomDateChange(e.target.value, customDateTo)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              />
                              <span className="text-gray-400">to</span>
                              <input
                                type="date"
                                value={customDateTo}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCustomDateChange(customDateFrom, e.target.value)}
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
                      <span>Issue Date:</span>
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
                      <span className="font-medium">{(CREDIT_NOTE_STATUS_LABELS as any)[filterStatus] || filterStatus}</span>
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
                                All Credit Notes
                              </button>
                              <button
                                onClick={() => setFilterStatus((CREDIT_NOTE_STATUS as any).DRAFT)}
                                className={`block w-full text-left px-3 py-2 text-sm rounded-md ${filterStatus === (CREDIT_NOTE_STATUS as any).DRAFT ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                              >
                                Draft
                              </button>
                              <button
                                onClick={() => setFilterStatus((CREDIT_NOTE_STATUS as any).ISSUED)}
                                className={`block w-full text-left px-3 py-2 text-sm rounded-md ${filterStatus === (CREDIT_NOTE_STATUS as any).ISSUED ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                              >
                                Issued
                              </button>
                              <button
                                onClick={() => setFilterStatus((CREDIT_NOTE_STATUS as any).APPLIED)}
                                className={`block w-full text-left px-3 py-2 text-sm rounded-md ${filterStatus === (CREDIT_NOTE_STATUS as any).APPLIED ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                              >
                                Applied
                              </button>
                              <button
                                onClick={() => setFilterStatus((CREDIT_NOTE_STATUS as any).VOID)}
                                className={`block w-full text-left px-3 py-2 text-sm rounded-md ${filterStatus === (CREDIT_NOTE_STATUS as any).VOID ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                              >
                                Void
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
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setClientSearchQuery(e.target.value)}
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
                                filteredClients.map((client: any) => (
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

              {/* Table */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="overflow-x-auto rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Credit Note
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Issue Date
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Remaining
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                            Loading credit notes...
                          </td>
                        </tr>
                      ) : creditNotes.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-lg font-medium text-gray-900">No credit notes found</p>
                            <p className="text-sm text-gray-500 mt-1">Create your first credit note to get started</p>
                            <button
                              onClick={handleCreateNew}
                              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-[#8e51ff] rounded-md hover:bg-[#7c3aed]"
                            >
                              <Plus className="h-4 w-4 inline mr-2" />
                              New Credit Note
                            </button>
                          </td>
                        </tr>
                      ) : (
                        creditNotes.map((creditNote: any) => (
                          <tr
                            key={creditNote.id}
                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => handleViewCreditNote(creditNote)}
                          >
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              #{creditNote.credit_note_number || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {creditNote.contact?.business_name ||
                               (creditNote.contact?.first_name && creditNote.contact?.last_name
                                 ? `${creditNote.contact.first_name} ${creditNote.contact.last_name}`
                                 : '-')}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {formatDate(creditNote.issue_date)}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {creditNote.currency?.symbol || getCurrencySymbol(creditNote.currency?.code)}{formatNumber(typeof creditNote.total === 'number' ? creditNote.total : parseFloat(creditNote.total || 0))}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {creditNote.remaining_amount > 0 ? (
                                <span className="text-blue-600 font-medium">
                                  {creditNote.currency?.symbol || getCurrencySymbol(creditNote.currency?.code)}{formatNumber(parseFloat(creditNote.remaining_amount || 0))}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <StatusBadge status={creditNote.status} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {!loading && creditNotes.length > 0 && totalPages > 1 && (
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
                            {Math.min(currentPage * itemsPerPage, totalItems)}
                          </span>
                          {' '}of{' '}
                          <span className="font-medium">{totalItems}</span>
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
          </div>
        </div>
      </div>

      {/* Credit Note Detail Modal */}
      <CreditNoteDetailModal
        isOpen={detailModal.isOpen}
        onClose={handleCloseDetailModal}
        creditNote={selectedCreditNote}
        onUpdate={() => {
          loadCreditNotes();
          loadStats();
        }}
      />
    </div>
  );
};

export default CreditNotesDashboard;
