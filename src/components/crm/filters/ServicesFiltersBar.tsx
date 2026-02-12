import React, { useRef, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronDownIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import {
  SERVICE_STATUS,
  SERVICE_STATUS_LABELS,
} from '../../../constants/crm';

interface ServicesFiltersBarProps {
  activeSubtab: string;
  onSubtabChange: (subtab: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  // Multi-select status
  statusFilters: string[];
  onStatusToggle: (status: string) => void;
  onClearStatuses: () => void;
  // Multi-select frequency
  frequencyTypeFilters: string[];
  onFrequencyTypeToggle: (freq: string) => void;
  onClearFrequencyTypes: () => void;
  // Hidden/Lost toggles
  showHiddenClients: boolean;
  onShowHiddenClientsToggle: () => void;
  showHiddenContacts: boolean;
  onShowHiddenContactsToggle: () => void;
  showLostContacts: boolean;
  onShowLostContactsToggle: () => void;
  // Filter count
  activeFilterCount?: number;
}

/**
 * ServicesFiltersBar - Subtab selector, search, and filters for Services tab
 */
const ServicesFiltersBar: React.FC<ServicesFiltersBarProps> = ({
  activeSubtab,
  onSubtabChange,
  searchQuery,
  onSearchChange,
  statusFilters,
  onStatusToggle,
  onClearStatuses,
  frequencyTypeFilters,
  onFrequencyTypeToggle,
  onClearFrequencyTypes,
  showHiddenClients,
  onShowHiddenClientsToggle,
  showHiddenContacts,
  onShowHiddenContactsToggle,
  showLostContacts,
  onShowLostContactsToggle,
  activeFilterCount: _activeFilterCount = 0,
}) => {
  const [showStatusFilter, setShowStatusFilter] = React.useState(false);
  const statusFilterRef = useRef<HTMLDivElement>(null);

  const statusOptions = [
    { value: SERVICE_STATUS.ACTIVE, label: SERVICE_STATUS_LABELS[SERVICE_STATUS.ACTIVE] },
    { value: SERVICE_STATUS.PENDING, label: SERVICE_STATUS_LABELS[SERVICE_STATUS.PENDING] },
    { value: SERVICE_STATUS.COMPLETED, label: SERVICE_STATUS_LABELS[SERVICE_STATUS.COMPLETED] },
    { value: SERVICE_STATUS.INACTIVE, label: SERVICE_STATUS_LABELS[SERVICE_STATUS.INACTIVE] },
  ];

  const frequencyOptions = [
    { value: 'one_off', label: 'One-off' },
    { value: 'recurring', label: 'Recurring' },
  ];

  // Close status dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusFilterRef.current && !statusFilterRef.current.contains(event.target as Node)) {
        setShowStatusFilter(false);
      }
    };

    if (showStatusFilter) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showStatusFilter]);

  // Count filters for funnel badge (frequency + hidden/lost toggles)
  const funnelFilterCount =
    frequencyTypeFilters.length +
    (showHiddenClients ? 1 : 0) +
    (showHiddenContacts ? 1 : 0) +
    (showLostContacts ? 1 : 0);

  return (
    <div className="flex items-center gap-2">
      {/* Subtab Toggle */}
      <div className="flex items-center bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => onSubtabChange('default')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            activeSubtab === 'default'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Default Services
        </button>
        <button
          onClick={() => onSubtabChange('client')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            activeSubtab === 'client'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Client Services
        </button>
      </div>

      {/* Search - Show for both subtabs */}
      <div className="relative w-64">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder={activeSubtab === 'default' ? 'Search services...' : 'Search client services...'}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-8 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary text-sm"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 pr-2 flex items-center"
          >
            <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Client Services filters */}
      {activeSubtab === 'client' && (
        <>
          {/* Status Filter - Separate dropdown with checkboxes */}
          <div className="relative" ref={statusFilterRef}>
            <button
              onClick={() => setShowStatusFilter(!showStatusFilter)}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">Status</span>
              {statusFilters.length > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-zenible-primary rounded-full">
                  {statusFilters.length}
                </span>
              )}
              <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${showStatusFilter ? 'rotate-180' : ''}`} />
            </button>

            {/* Status Dropdown */}
            {showStatusFilter && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-3 space-y-2">
                  {statusOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={statusFilters.includes(option.value)}
                        onChange={() => onStatusToggle(option.value)}
                        className="h-4 w-4 rounded border-gray-300 text-zenible-primary focus:ring-zenible-primary"
                      />
                      <span className="text-sm text-gray-700">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Clear Status Filter */}
                {statusFilters.length > 0 && (
                  <div className="border-t border-gray-200 p-3">
                    <button
                      onClick={() => {
                        onClearStatuses();
                        setShowStatusFilter(false);
                      }}
                      className="w-full text-sm text-gray-600 hover:text-gray-800 flex items-center justify-center gap-2"
                    >
                      <XMarkIcon className="h-4 w-4" />
                      Clear Filter
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Filters dropdown (Frequency + Hidden/Lost) */}
          <div className="relative">
            <FilterDropdown
              funnelFilterCount={funnelFilterCount}
              frequencyOptions={frequencyOptions}
              frequencyTypeFilters={frequencyTypeFilters}
              onFrequencyTypeToggle={onFrequencyTypeToggle}
              onClearFrequencyTypes={onClearFrequencyTypes}
              showHiddenClients={showHiddenClients}
              onShowHiddenClientsToggle={onShowHiddenClientsToggle}
              showHiddenContacts={showHiddenContacts}
              onShowHiddenContactsToggle={onShowHiddenContactsToggle}
              showLostContacts={showLostContacts}
              onShowLostContactsToggle={onShowLostContactsToggle}
            />
          </div>
        </>
      )}
    </div>
  );
};

/** Funnel filter dropdown with frequency checkboxes + hidden/lost toggles */
function FilterDropdown({
  funnelFilterCount,
  frequencyOptions,
  frequencyTypeFilters,
  onFrequencyTypeToggle,
  onClearFrequencyTypes,
  showHiddenClients,
  onShowHiddenClientsToggle,
  showHiddenContacts,
  onShowHiddenContactsToggle,
  showLostContacts,
  onShowLostContactsToggle,
}: {
  funnelFilterCount: number;
  frequencyOptions: { value: string; label: string }[];
  frequencyTypeFilters: string[];
  onFrequencyTypeToggle: (freq: string) => void;
  onClearFrequencyTypes: () => void;
  showHiddenClients: boolean;
  onShowHiddenClientsToggle: () => void;
  showHiddenContacts: boolean;
  onShowHiddenContactsToggle: () => void;
  showLostContacts: boolean;
  onShowLostContactsToggle: () => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
      >
        <FunnelIcon className="h-4 w-4 text-gray-600" />
        {funnelFilterCount > 0 && (
          <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-zenible-primary rounded-full">
            {funnelFilterCount}
          </span>
        )}
        <ChevronDownIcon className="h-4 w-4 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-[300px] bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 space-y-5">
            {/* Frequency Type Filter - Checkboxes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Frequency</label>
                {frequencyTypeFilters.length > 0 && (
                  <button
                    onClick={onClearFrequencyTypes}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {frequencyOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={frequencyTypeFilters.includes(option.value)}
                      onChange={() => onFrequencyTypeToggle(option.value)}
                      className="h-4 w-4 rounded border-gray-300 text-zenible-primary focus:ring-zenible-primary"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200" />

            {/* Visibility Filters */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Show Additional</label>
              <div className="space-y-1">
                <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg transition-colors">
                  <input
                    type="checkbox"
                    checked={showHiddenClients}
                    onChange={onShowHiddenClientsToggle}
                    className="h-4 w-4 rounded border-gray-300 text-zenible-primary focus:ring-zenible-primary"
                  />
                  <span className="text-sm text-gray-700">Hidden Clients</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg transition-colors">
                  <input
                    type="checkbox"
                    checked={showHiddenContacts}
                    onChange={onShowHiddenContactsToggle}
                    className="h-4 w-4 rounded border-gray-300 text-zenible-primary focus:ring-zenible-primary"
                  />
                  <span className="text-sm text-gray-700">Hidden Contacts</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg transition-colors">
                  <input
                    type="checkbox"
                    checked={showLostContacts}
                    onChange={onShowLostContactsToggle}
                    className="h-4 w-4 rounded border-gray-300 text-zenible-primary focus:ring-zenible-primary"
                  />
                  <span className="text-sm text-gray-700">Lost Contacts</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServicesFiltersBar;
