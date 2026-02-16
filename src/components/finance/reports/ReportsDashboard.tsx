import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import AppLayout from '../../layout/AppLayout';
import TransactionSummaryCards from './TransactionSummaryCards';
import TransactionCharts from './TransactionCharts';
import { ReportsSummaryProvider } from '../../../contexts/ReportsSummaryContext';
import type { ReportsSummaryParams } from '../../../hooks/finance/useReportsSummary';
import ReportsTransactionTable from './ReportsTransactionTable';
import CustomReportsView from './custom/CustomReportsView';
import DatePickerCalendar from '../../shared/DatePickerCalendar';
import { formatLocalDate } from '../../../utils/dateUtils';
import { useContacts } from '../../../hooks/crm/useContacts';
import { usePreferences } from '../../../contexts/PreferencesContext';
import {
  Search,
  Calendar,
  ChevronDown,
  Users,
  X,
  Filter,
} from 'lucide-react';

type Tab = 'overview' | 'custom';

const tabs: { value: Tab; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'custom', label: 'Custom Reports' },
];

/* ── Date helpers ─────────────────────────────────────────────── */

const getDateDaysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatLocalDate(date);
};

const getToday = (): string => formatLocalDate(new Date());

const getStartOfWeek = (): string => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return formatLocalDate(d);
};

const getStartOfMonth = (): string => {
  const d = new Date();
  d.setDate(1);
  return formatLocalDate(d);
};

const getStartOfLastMonth = (): string => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1, 1);
  return formatLocalDate(d);
};

const getEndOfLastMonth = (): string => {
  const d = new Date();
  d.setDate(0);
  return formatLocalDate(d);
};

const getStartOfQuarter = (): string => {
  const d = new Date();
  const q = Math.floor(d.getMonth() / 3) * 3;
  d.setMonth(q, 1);
  return formatLocalDate(d);
};

const getStartOfYear = (): string => {
  const d = new Date();
  d.setMonth(0, 1);
  return formatLocalDate(d);
};

interface DatePreset {
  key: string;
  label: string;
  getRange: () => { start: string; end: string } | null; // null = all time
}

const DATE_PRESETS: DatePreset[] = [
  { key: 'all', label: 'All Time', getRange: () => null },
  { key: 'last30', label: 'Last 30 Days', getRange: () => ({ start: getDateDaysAgo(30), end: getToday() }) },
  { key: 'today', label: 'Today', getRange: () => ({ start: getToday(), end: getToday() }) },
  { key: 'this_week', label: 'This Week', getRange: () => ({ start: getStartOfWeek(), end: getToday() }) },
  { key: 'this_month', label: 'This Month', getRange: () => ({ start: getStartOfMonth(), end: getToday() }) },
  { key: 'last_month', label: 'Last Month', getRange: () => ({ start: getStartOfLastMonth(), end: getEndOfLastMonth() }) },
  { key: 'this_quarter', label: 'This Quarter', getRange: () => ({ start: getStartOfQuarter(), end: getToday() }) },
  { key: 'this_year', label: 'This Year', getRange: () => ({ start: getStartOfYear(), end: getToday() }) },
];

const TRANSACTION_TYPES = [
  { key: 'invoice', label: 'Invoice' },
  { key: 'quote', label: 'Quote' },
  { key: 'expense', label: 'Expense' },
  { key: 'credit_note', label: 'Credit Note' },
  { key: 'payment', label: 'Payment' },
];

/**
 * Reports Dashboard
 * Two tabs: Overview (KPI cards + charts) and Custom Reports (builder/saved reports)
 */
const ReportsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const { getPreference, updatePreference, initialized: prefsInitialized } = usePreferences();

  /* ── Filter state (initialised from preferences) ──────────── */
  const [searchQuery, setSearchQuery] = useState('');
  const [datePreset, setDatePreset] = useState(() =>
    (getPreference('reports_date_preset', 'last30') as string)
  );
  const [customDateFrom, setCustomDateFrom] = useState(() =>
    (getPreference('reports_custom_date_from', '') as string)
  );
  const [customDateTo, setCustomDateTo] = useState(() =>
    (getPreference('reports_custom_date_to', '') as string)
  );
  const [selectedClientId, setSelectedClientId] = useState<string | null>(() =>
    (getPreference('reports_client_id', null) as string | null)
  );
  const [selectedTransactionTypes, setSelectedTransactionTypes] = useState<string[]>(() =>
    (getPreference('reports_transaction_types', []) as string[])
  );

  /* ── Sync preferences when prefs finish loading ─────────── */
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  useEffect(() => {
    if (prefsInitialized && !prefsLoaded) {
      setPrefsLoaded(true);
      setDatePreset(getPreference('reports_date_preset', 'last30') as string);
      setCustomDateFrom(getPreference('reports_custom_date_from', '') as string);
      setCustomDateTo(getPreference('reports_custom_date_to', '') as string);
      setSelectedClientId(getPreference('reports_client_id', null) as string | null);
      setSelectedTransactionTypes(getPreference('reports_transaction_types', []) as string[]);
    }
  }, [prefsInitialized, prefsLoaded, getPreference]);

  /* ── Dropdown visibility ──────────────────────────────────── */
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  /* ── Dropdown positioning ─────────────────────────────────── */
  const dateButtonRef = useRef<HTMLButtonElement>(null);
  const clientButtonRef = useRef<HTMLButtonElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const [dateDropdownPos, setDateDropdownPos] = useState({ top: 0, right: 0 });
  const [clientDropdownPos, setClientDropdownPos] = useState({ top: 0, right: 0 });
  const [filterDropdownPos, setFilterDropdownPos] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (showDateDropdown && dateButtonRef.current) {
      const rect = dateButtonRef.current.getBoundingClientRect();
      setDateDropdownPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
  }, [showDateDropdown]);

  useEffect(() => {
    if (showClientDropdown && clientButtonRef.current) {
      const rect = clientButtonRef.current.getBoundingClientRect();
      setClientDropdownPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
  }, [showClientDropdown]);

  useEffect(() => {
    if (showFilterDropdown && filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      setFilterDropdownPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
  }, [showFilterDropdown]);

  /* ── Clients data ─────────────────────────────────────────── */
  const { contacts: allClients, loading: clientsLoading } = useContacts({ is_client: true });
  const [clientSearchQuery, setClientSearchQuery] = useState('');

  const filteredClients = useMemo(() => {
    if (!clientSearchQuery) return allClients;
    const q = clientSearchQuery.toLowerCase();
    return allClients.filter((c: any) => {
      const name = c.company_name || `${c.first_name || ''} ${c.last_name || ''}`.trim();
      return name.toLowerCase().includes(q);
    });
  }, [allClients, clientSearchQuery]);

  const getClientDisplayName = useCallback((client: any): string => {
    return client.company_name || `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Unnamed';
  }, []);

  /* ── Date preset logic ────────────────────────────────────── */
  const dateRange = useMemo(() => {
    if (datePreset === 'custom') {
      return customDateFrom && customDateTo ? { start: customDateFrom, end: customDateTo } : null;
    }
    const preset = DATE_PRESETS.find((p) => p.key === datePreset);
    return preset ? preset.getRange() : null;
  }, [datePreset, customDateFrom, customDateTo]);

  const getDateFilterLabel = useCallback((): string => {
    if (datePreset === 'custom' && customDateFrom && customDateTo) {
      return `${customDateFrom} – ${customDateTo}`;
    }
    const preset = DATE_PRESETS.find((p) => p.key === datePreset);
    return preset?.label || 'All Time';
  }, [datePreset, customDateFrom, customDateTo]);

  const handleDatePresetChange = useCallback((key: string) => {
    setDatePreset(key);
    updatePreference('reports_date_preset', key, 'finance');
    if (key !== 'custom') {
      setCustomDateFrom('');
      setCustomDateTo('');
      updatePreference('reports_custom_date_from', '', 'finance');
      updatePreference('reports_custom_date_to', '', 'finance');
    }
    setShowDateDropdown(false);
  }, [updatePreference]);

  const handleCustomDateChange = useCallback((from: string, to: string) => {
    setCustomDateFrom(from);
    setCustomDateTo(to);
    setDatePreset('custom');
    updatePreference('reports_date_preset', 'custom', 'finance');
    updatePreference('reports_custom_date_from', from, 'finance');
    updatePreference('reports_custom_date_to', to, 'finance');
  }, [updatePreference]);

  const handleClearDateFilter = useCallback(() => {
    setDatePreset('last30');
    setCustomDateFrom('');
    setCustomDateTo('');
    updatePreference('reports_date_preset', 'last30', 'finance');
    updatePreference('reports_custom_date_from', '', 'finance');
    updatePreference('reports_custom_date_to', '', 'finance');
  }, [updatePreference]);

  /* ── Transaction type toggle ──────────────────────────────── */
  const handleTransactionTypeToggle = useCallback((type: string) => {
    setSelectedTransactionTypes((prev) => {
      const next = prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type];
      updatePreference('reports_transaction_types', next, 'finance');
      return next;
    });
  }, [updatePreference]);

  /* ── Build summary params from filter state ───────────────── */
  const summaryParams = useMemo((): ReportsSummaryParams => {
    const params: ReportsSummaryParams = {};

    if (dateRange) {
      params.start_date = dateRange.start;
      params.end_date = dateRange.end;
    }

    if (selectedClientId) {
      params.contact_id = selectedClientId;
    }

    if (selectedTransactionTypes.length > 0) {
      params.transaction_types = selectedTransactionTypes;
    }

    return params;
  }, [dateRange, selectedClientId, selectedTransactionTypes]);

  return (
    <AppLayout pageTitle="Reports">
      {/* Top Bar */}
      <div className="bg-white border-b border-[#e5e5e5]">
        <div className="px-4 py-3 flex items-center justify-between min-h-[64px]">
          <h1 className="text-xl md:text-2xl font-semibold text-[#09090b]">Reports</h1>
        </div>
        <div className="px-4">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.value
                    ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'overview' && (
          <ReportsSummaryProvider filterParams={summaryParams}>
            <div className="p-4 space-y-6">
              {/* ── Filter Bar ──────────────────────────────────── */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#09090b]">Overview</h2>
                <div className="flex items-center gap-2">
                  {/* Search Input (visual placeholder – backend ignores search on summary) */}
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

                  {/* ── Date Filter ────────────────────────────── */}
                  <div className="relative">
                    <button
                      ref={dateButtonRef}
                      onClick={() => setShowDateDropdown((v) => !v)}
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

                    {showDateDropdown && createPortal(
                      <>
                        <div
                          className="fixed inset-0"
                          style={{ zIndex: 9998 }}
                          onClick={() => setShowDateDropdown(false)}
                        />
                        <div
                          style={{ position: 'fixed', top: dateDropdownPos.top, right: dateDropdownPos.right, width: 320, zIndex: 9999 }}
                          className="bg-white rounded-lg shadow-lg border border-gray-200"
                        >
                          {/* Preset Options */}
                          <div className="p-3 border-b border-gray-200">
                            <div className="grid grid-cols-2 gap-2">
                              {DATE_PRESETS.map((preset) => (
                                <button
                                  key={preset.key}
                                  onClick={() => handleDatePresetChange(preset.key)}
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
                              <DatePickerCalendar
                                value={customDateFrom}
                                onChange={(date) => handleCustomDateChange(date, customDateTo)}
                                className="flex-1"
                              />
                              <span className="text-gray-400">to</span>
                              <DatePickerCalendar
                                value={customDateTo}
                                onChange={(date) => handleCustomDateChange(customDateFrom, date)}
                                className="flex-1"
                              />
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="p-3 flex items-center justify-between">
                            <button
                              onClick={handleClearDateFilter}
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
                      </>,
                      document.body
                    )}
                  </div>

                  {/* ── Clients Filter ─────────────────────────── */}
                  <div className="relative">
                    <button
                      ref={clientButtonRef}
                      onClick={() => setShowClientDropdown((v) => !v)}
                      className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        selectedClientId
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-300 text-gray-700'
                      }`}
                    >
                      <Users className="h-4 w-4" />
                      Clients
                      {selectedClientId && (
                        <span className="px-1.5 py-0.5 text-xs font-medium bg-purple-600 text-white rounded-full">
                          1
                        </span>
                      )}
                    </button>

                    {showClientDropdown && createPortal(
                      <>
                        <div
                          className="fixed inset-0"
                          style={{ zIndex: 9998 }}
                          onClick={() => setShowClientDropdown(false)}
                        />
                        <div
                          style={{ position: 'fixed', top: clientDropdownPos.top, right: clientDropdownPos.right, width: 320, zIndex: 9999 }}
                          className="bg-white rounded-lg shadow-lg border border-gray-200"
                        >
                          {/* Search */}
                          <div className="p-3 border-b border-gray-200">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <input
                                type="text"
                                placeholder="Search clients..."
                                value={clientSearchQuery}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setClientSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                autoFocus
                              />
                            </div>
                          </div>

                          {/* Clear selection */}
                          {selectedClientId && (
                            <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-end">
                              <button
                                onClick={() => { setSelectedClientId(null); updatePreference('reports_client_id', null, 'finance'); }}
                                className="text-xs font-medium text-gray-500 hover:text-gray-700 flex items-center gap-1"
                              >
                                <X className="h-3 w-3" />
                                Clear
                              </button>
                            </div>
                          )}

                          {/* Client List */}
                          <div className="max-h-64 overflow-y-auto p-2">
                            {clientsLoading ? (
                              <p className="text-sm text-gray-500 py-4 text-center">Loading clients...</p>
                            ) : filteredClients.length === 0 ? (
                              <p className="text-sm text-gray-500 py-4 text-center">
                                {allClients.length === 0 ? 'No clients found' : 'No matching clients'}
                              </p>
                            ) : (
                              filteredClients.map((client: any) => (
                                <button
                                  key={client.id}
                                  onClick={() => { const next = selectedClientId === client.id ? null : client.id; setSelectedClientId(next); updatePreference('reports_client_id', next, 'finance'); }}
                                  className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer w-full text-left"
                                >
                                  <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                    selectedClientId === client.id
                                      ? 'border-purple-600 bg-purple-600'
                                      : 'border-gray-300'
                                  }`}>
                                    {selectedClientId === client.id && (
                                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                                    )}
                                  </div>
                                  <span className="truncate flex-1">{getClientDisplayName(client)}</span>
                                </button>
                              ))
                            )}
                          </div>

                          {/* Done button */}
                          <div className="p-3 border-t border-gray-200">
                            <button
                              onClick={() => setShowClientDropdown(false)}
                              className="w-full px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      </>,
                      document.body
                    )}
                  </div>

                  {/* ── Transaction Type Filter ────────────────── */}
                  <div className="relative">
                    <button
                      ref={filterButtonRef}
                      onClick={() => setShowFilterDropdown((v) => !v)}
                      className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        selectedTransactionTypes.length > 0
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-300 text-gray-700'
                      }`}
                    >
                      <Filter className="h-4 w-4" />
                      Filter
                      {selectedTransactionTypes.length > 0 && (
                        <span className="bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {selectedTransactionTypes.length}
                        </span>
                      )}
                    </button>

                    {showFilterDropdown && createPortal(
                      <>
                        <div
                          className="fixed inset-0"
                          style={{ zIndex: 9998 }}
                          onClick={() => setShowFilterDropdown(false)}
                        />
                        <div
                          style={{ position: 'fixed', top: filterDropdownPos.top, right: filterDropdownPos.right, width: 288, zIndex: 9999 }}
                          className="bg-white rounded-lg shadow-lg border border-gray-200"
                        >
                          <div className="p-3 border-b border-gray-200">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Transaction Types</div>
                            <div className="space-y-1">
                              {TRANSACTION_TYPES.map((tt) => (
                                <label
                                  key={tt.key}
                                  className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedTransactionTypes.includes(tt.key)}
                                    onChange={() => handleTransactionTypeToggle(tt.key)}
                                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                  />
                                  <span className="text-sm text-gray-700">{tt.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="p-3 flex items-center justify-between">
                            <button
                              onClick={() => { setSelectedTransactionTypes([]); updatePreference('reports_transaction_types', [], 'finance'); }}
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
                      </>,
                      document.body
                    )}
                  </div>
                </div>
              </div>

              {/* ── KPI Cards + Charts ──────────────────────────── */}
              <TransactionSummaryCards />
              <TransactionCharts />

              {/* ── Transactions Table ──────────────────────────── */}
              <ReportsTransactionTable filterParams={summaryParams} />
            </div>
          </ReportsSummaryProvider>
        )}

        {activeTab === 'custom' && (
          <CustomReportsView />
        )}
      </div>
    </AppLayout>
  );
};

export default ReportsDashboard;
