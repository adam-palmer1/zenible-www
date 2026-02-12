import React, { useRef, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronDownIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import Dropdown from '../../ui/dropdown/Dropdown';
import {
  SERVICE_STATUS,
  SERVICE_STATUS_LABELS,
} from '../../../constants/crm';

interface ServicesFiltersBarProps {
  activeSubtab: string;
  onSubtabChange: (subtab: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  frequencyTypeFilter: string;
  onFrequencyTypeFilterChange: (value: string) => void;
  activeFilterCount?: number;
}

/**
 * ServicesFiltersBar - Subtab selector, search, and filters for Services tab
 */
const ServicesFiltersBar: React.FC<ServicesFiltersBarProps> = ({
  // Subtab
  activeSubtab,
  onSubtabChange,
  // Search
  searchQuery,
  onSearchChange,
  // Client Services filters
  statusFilter,
  onStatusFilterChange,
  frequencyTypeFilter,
  onFrequencyTypeFilterChange,
  // Filter counts
  activeFilterCount: _activeFilterCount = 0,
}) => {
  const [showStatusFilter, setShowStatusFilter] = React.useState(false);
  const statusFilterRef = useRef<HTMLDivElement>(null);

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: SERVICE_STATUS.ACTIVE, label: SERVICE_STATUS_LABELS[SERVICE_STATUS.ACTIVE] },
    { value: SERVICE_STATUS.PENDING, label: SERVICE_STATUS_LABELS[SERVICE_STATUS.PENDING] },
    { value: SERVICE_STATUS.COMPLETED, label: SERVICE_STATUS_LABELS[SERVICE_STATUS.COMPLETED] },
    { value: SERVICE_STATUS.INACTIVE, label: SERVICE_STATUS_LABELS[SERVICE_STATUS.INACTIVE] },
  ];

  const frequencyOptions = [
    { value: '', label: 'All Frequencies' },
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

  // Count only frequency filter for the funnel badge
  const frequencyFilterCount = frequencyTypeFilter ? 1 : 0;

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
          {/* Status Filter - Separate dropdown */}
          <div className="relative" ref={statusFilterRef}>
            <button
              onClick={() => setShowStatusFilter(!showStatusFilter)}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">Status</span>
              {statusFilter && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-zenible-primary rounded-full">
                  1
                </span>
              )}
              <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${showStatusFilter ? 'rotate-180' : ''}`} />
            </button>

            {/* Status Dropdown */}
            {showStatusFilter && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-3 space-y-1">
                  {statusOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="statusFilter"
                        checked={statusFilter === option.value}
                        onChange={() => {
                          onStatusFilterChange(option.value);
                          setShowStatusFilter(false);
                        }}
                        className="w-4 h-4 text-zenible-primary border-gray-300 focus:ring-zenible-primary"
                      />
                      <span className="text-sm text-gray-700">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Frequency Filter - Funnel icon dropdown */}
          <Dropdown
            trigger={
              <button className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                <FunnelIcon className="h-4 w-4 text-gray-600" />
                {frequencyFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-zenible-primary rounded-full">
                    {frequencyFilterCount}
                  </span>
                )}
                <ChevronDownIcon className="h-4 w-4 text-gray-400" />
              </button>
            }
            align="start"
            side="bottom"
          >
            <div className="p-4 min-w-[280px]">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Filters</h3>
              <div className="space-y-4">
                {/* Frequency Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Frequency</label>
                  <div className="space-y-1">
                    {frequencyOptions.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg transition-colors"
                      >
                        <input
                          type="radio"
                          name="frequencyFilter"
                          checked={frequencyTypeFilter === option.value}
                          onChange={() => onFrequencyTypeFilterChange(option.value)}
                          className="w-4 h-4 text-zenible-primary border-gray-300 focus:ring-zenible-primary"
                        />
                        <span className="text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Dropdown>
        </>
      )}
    </div>
  );
};

export default ServicesFiltersBar;
