import React from 'react';
import {
  Search,
  Filter,
  Trash2,
  Download,
  Repeat,
  Calendar,
  ChevronDown,
  X,
  Users,
  Check,
} from 'lucide-react';
import { INVOICE_STATUS, INVOICE_STATUS_LABELS, type InvoiceStatus } from '../../../constants/finance';

interface DatePreset {
  key: string;
  label: string;
}

interface InvoiceListFiltersProps {
  // Search
  searchQuery: string;
  onSearchChange: (value: string) => void;

  // Date filter
  showDateDropdown: boolean;
  onToggleDateDropdown: () => void;
  onCloseDateDropdown: () => void;
  datePreset: string;
  dateType: string;
  customDateFrom: string;
  customDateTo: string;
  onDateTypeChange: (type: string) => void;
  onDateFilterChange: (preset: string) => void;
  onCustomDateChange: (from: string, to: string) => void;
  onClearDateFilter: () => void;
  getDateFilterLabel: () => string;
  DATE_PRESETS: DatePreset[];

  // Client filter
  showClientDropdown: boolean;
  onToggleClientDropdown: () => void;
  onCloseClientDropdown: () => void;
  selectedClientIds: any[];
  clientSearchQuery: string;
  onClientSearchChange: (value: string) => void;
  filteredClients: any[];
  allClients: any[];
  clientsLoading: boolean;
  onClientToggle: (clientId: any) => void;
  onClearClientSelection: () => void;
  onApplyClientFilter: () => void;
  getClientDisplayName: (client: any) => string;

  // Status filter
  filterStatus: string;
  showFilterDropdown: boolean;
  onToggleFilterDropdown: () => void;
  onCloseFilterDropdown: () => void;
  updateFilters: (filters: any) => void;

  // Recurring filter
  showRecurringOnly: boolean;
  onSetShowRecurringOnly: (value: boolean) => void;

  // Parent template filter
  parentInvoiceId: string | null;
  parentTemplateInfo: any;
  onClearParentFilter: () => void;

  // Bulk actions
  selectedIds: any[];
  isDownloading: boolean;
  onBulkDownload: () => void;
  onBulkDeleteClick: () => void;
  onClearSelection: () => void;
}

const InvoiceListFilters: React.FC<InvoiceListFiltersProps> = ({
  searchQuery,
  onSearchChange,
  showDateDropdown,
  onToggleDateDropdown,
  onCloseDateDropdown,
  datePreset,
  dateType,
  customDateFrom,
  customDateTo,
  onDateTypeChange,
  onDateFilterChange,
  onCustomDateChange,
  onClearDateFilter,
  getDateFilterLabel,
  DATE_PRESETS,
  showClientDropdown,
  onToggleClientDropdown,
  onCloseClientDropdown,
  selectedClientIds,
  clientSearchQuery,
  onClientSearchChange,
  filteredClients,
  allClients,
  clientsLoading,
  onClientToggle,
  onClearClientSelection,
  onApplyClientFilter,
  getClientDisplayName,
  filterStatus,
  showFilterDropdown,
  onToggleFilterDropdown,
  onCloseFilterDropdown,
  updateFilters,
  showRecurringOnly,
  onSetShowRecurringOnly,
  parentInvoiceId,
  parentTemplateInfo,
  onClearParentFilter,
  selectedIds,
  isDownloading,
  onBulkDownload,
  onBulkDeleteClick,
  onClearSelection,
}) => {
  return (
    <>
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-64"
            />
          </div>

          {/* Date Filter Dropdown */}
          <div className="relative">
            <button
              onClick={onToggleDateDropdown}
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
                  onClick={onCloseDateDropdown}
                />
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-40">
                  <div className="p-3 border-b border-gray-200">
                    {/* Date Type Toggle */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm text-gray-600">Filter by:</span>
                      <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                          onClick={() => onDateTypeChange('issue')}
                          className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                            dateType === 'issue'
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Issue Date
                        </button>
                        <button
                          onClick={() => onDateTypeChange('due')}
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
                          onClick={() => onDateFilterChange(preset.key)}
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
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onCustomDateChange(e.target.value, customDateTo)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <span className="text-gray-400">to</span>
                      <input
                        type="date"
                        value={customDateTo}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onCustomDateChange(customDateFrom, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-3 flex items-center justify-between">
                    <button
                      onClick={onClearDateFilter}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      Clear Filter
                    </button>
                    <button
                      onClick={onCloseDateDropdown}
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
              onClick={onToggleClientDropdown}
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
                  onClick={onCloseClientDropdown}
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
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onClientSearchChange(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Select All / Clear All */}
                  <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                    <button
                      onClick={() => {
                        const allClientIds = allClients.map((c: any) => c.id);
                        onClientToggle(allClientIds);
                      }}
                      className="text-xs font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1"
                    >
                      <Check className="h-3 w-3" />
                      Select All
                    </button>
                    <button
                      onClick={onClearClientSelection}
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
                      filteredClients.map((client: any) => (
                        <label
                          key={client.id}
                          className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedClientIds.includes(client.id)}
                            onChange={() => onClientToggle(client.id)}
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
                      onClick={onApplyClientFilter}
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
                onClick={onClearDateFilter}
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
              <span className="font-medium">
                {filterStatus === 'outstanding'
                  ? 'Outstanding'
                  : filterStatus === 'overdue'
                    ? 'Overdue'
                    : INVOICE_STATUS_LABELS[filterStatus as InvoiceStatus] || filterStatus}
              </span>
              <button
                onClick={() => updateFilters({ status: null, outstanding_only: null, overdue_only: null })}
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
                onClick={() => onSetShowRecurringOnly(false)}
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
                onClick={onClearParentFilter}
                className="ml-1 p-0.5 hover:bg-purple-200 rounded-full"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={onToggleFilterDropdown}
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
                  onClick={onCloseFilterDropdown}
                />
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-40">
                  {/* Status Filter Section */}
                  <div className="p-3 border-b border-gray-200">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Status</div>
                    <div className="space-y-1">
                      <button
                        onClick={() => updateFilters({ status: null, outstanding_only: null, overdue_only: null })}
                        className={`block w-full text-left px-3 py-2 text-sm rounded-md ${filterStatus === 'all' ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        All Invoices
                      </button>
                      <button
                        onClick={() => updateFilters({ outstanding_only: true, overdue_only: null, status: null })}
                        className={`block w-full text-left px-3 py-2 text-sm rounded-md ${filterStatus === 'outstanding' ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        Outstanding
                      </button>
                      <button
                        onClick={() => updateFilters({ overdue_only: true, outstanding_only: null, status: null })}
                        className={`block w-full text-left px-3 py-2 text-sm rounded-md ${filterStatus === 'overdue' ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        Overdue
                      </button>
                      <button
                        onClick={() => updateFilters({ status: INVOICE_STATUS.DRAFT, outstanding_only: null, overdue_only: null })}
                        className={`block w-full text-left px-3 py-2 text-sm rounded-md ${filterStatus === INVOICE_STATUS.DRAFT ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        Draft
                      </button>
                      <button
                        onClick={() => updateFilters({ status: INVOICE_STATUS.SENT, outstanding_only: null, overdue_only: null })}
                        className={`block w-full text-left px-3 py-2 text-sm rounded-md ${filterStatus === INVOICE_STATUS.SENT ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        Sent
                      </button>
                      <button
                        onClick={() => updateFilters({ status: INVOICE_STATUS.PAID, outstanding_only: null, overdue_only: null })}
                        className={`block w-full text-left px-3 py-2 text-sm rounded-md ${filterStatus === INVOICE_STATUS.PAID ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        Paid
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
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSetShowRecurringOnly(e.target.checked)}
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
                        updateFilters({ status: null, outstanding_only: null, overdue_only: null });
                        onSetShowRecurringOnly(false);
                      }}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={onCloseFilterDropdown}
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
              onClick={onBulkDownload}
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
              onClick={onBulkDeleteClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 rounded-md transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
            <button
              onClick={onClearSelection}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default InvoiceListFilters;
