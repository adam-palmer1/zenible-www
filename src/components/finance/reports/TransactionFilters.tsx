import React, { useState, useRef, useEffect } from 'react';
import { Search, Calendar, ChevronDown, X, Filter } from 'lucide-react';
import { useReports } from '../../../contexts/ReportsContext';
import {
  TRANSACTION_TYPES,
  UNIFIED_STATUSES,
  DATE_PRESETS,
} from '../../../hooks/finance/useReportFilters';

/**
 * Transaction type options with labels
 */
const TRANSACTION_TYPE_OPTIONS = [
  { value: 'invoice', label: 'Invoices' },
  { value: 'quote', label: 'Quotes' },
  { value: 'expense', label: 'Expenses' },
  { value: 'credit_note', label: 'Credit Notes' },
  { value: 'payment', label: 'Payments' },
];

/**
 * Unified status options with labels and colors
 */
const UNIFIED_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  { value: 'refunded', label: 'Refunded', color: 'bg-purple-100 text-purple-800' },
];

/**
 * Date range preset options
 */
const DATE_PRESET_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'thisWeek', label: 'This Week' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'last30Days', label: 'Last 30 Days' },
  { value: 'thisQuarter', label: 'This Quarter' },
  { value: 'thisYear', label: 'This Year' },
  { value: 'last90Days', label: 'Last 90 Days' },
  { value: 'allTime', label: 'All Time' },
  { value: 'custom', label: 'Custom Range' },
];

interface MultiSelectDropdownProps {
  label: string;
  options: { value: string; label: string }[];
  value?: string[];
  onChange: (values: string[] | undefined) => void;
  placeholder: string;
}

/**
 * Multi-select dropdown component
 */
const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({ label, options, value = [], onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue.length > 0 ? newValue : undefined);
  };

  const selectedLabels = options
    .filter((opt) => value.includes(opt.value))
    .map((opt) => opt.label)
    .join(', ');

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      >
        <span className={value.length > 0 ? 'text-[#09090b]' : 'text-[#71717a]'}>
          {value.length > 0 ? selectedLabels : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={value.includes(option.value)}
                onChange={() => toggleOption(option.value)}
                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-[#09090b]">{option.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onPresetSelect: (preset: string) => void;
  onCustomChange: (updates: any) => void;
}

/**
 * Date range picker with presets
 */
const DateRangePicker: React.FC<DateRangePickerProps> = ({ startDate, endDate, onPresetSelect, onCustomChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePresetClick = (presetValue: string) => {
    if (presetValue === 'custom') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      onPresetSelect(presetValue);
      setIsOpen(false);
    }
  };

  const formatDateLabel = (): string => {
    if (!startDate && !endDate) return 'All Time';
    if (startDate && endDate) {
      const start = new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const end = new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${start} - ${end}`;
    }
    return 'Select dates';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-[#09090b]">{formatDateLabel()}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-2">
            {DATE_PRESET_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handlePresetClick(option.value)}
                className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 ${
                  option.value === 'custom' && showCustom ? 'bg-purple-50 text-purple-700' : 'text-[#09090b]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {showCustom && (
            <div className="border-t border-gray-200 p-3 space-y-2">
              <div>
                <label className="block text-xs text-[#71717a] mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => onCustomChange({ start_date: e.target.value })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-[#71717a] mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => onCustomChange({ end_date: e.target.value })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Transaction Filters Component
 */
const TransactionFilters: React.FC = () => {
  const { filters, updateFilters, updateSearch, applyDatePreset, resetFilters } = useReports() as any;
  const [localSearch, setLocalSearch] = useState(filters.search || '');

  // Sync local search with filters
  useEffect(() => {
    setLocalSearch(filters.search || '');
  }, [filters.search]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearch(value);
    updateSearch(value);
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    updateFilters({ search: undefined });
  };

  const hasActiveFilters =
    (filters.transaction_types && filters.transaction_types.length > 0) ||
    (filters.unified_statuses && filters.unified_statuses.length > 0) ||
    filters.contact_id ||
    filters.min_amount !== undefined ||
    filters.max_amount !== undefined ||
    filters.search;

  return (
    <div className="bg-white border border-[#e5e5e5] rounded-xl p-4 space-y-4">
      {/* First row: Date range, Types, Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <DateRangePicker
          startDate={filters.start_date}
          endDate={filters.end_date}
          onPresetSelect={applyDatePreset}
          onCustomChange={updateFilters}
        />

        <MultiSelectDropdown
          label="Transaction Types"
          options={TRANSACTION_TYPE_OPTIONS}
          value={filters.transaction_types || []}
          onChange={(types) => updateFilters({ transaction_types: types })}
          placeholder="All Types"
        />

        <MultiSelectDropdown
          label="Status"
          options={UNIFIED_STATUS_OPTIONS}
          value={filters.unified_statuses || []}
          onChange={(statuses) => updateFilters({ unified_statuses: statuses })}
          placeholder="All Statuses"
        />

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={localSearch}
            onChange={handleSearchChange}
            placeholder="Search..."
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          {localSearch && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Second row: Amount range + Reset button */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#71717a]">Amount:</span>
          <input
            type="number"
            value={filters.min_amount ?? ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateFilters({
                min_amount: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
            placeholder="Min"
            className="w-24 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <span className="text-[#71717a]">-</span>
          <input
            type="number"
            value={filters.max_amount ?? ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateFilters({
                max_amount: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
            placeholder="Max"
            className="w-24 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-[#71717a] hover:text-[#09090b] hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
};

export default TransactionFilters;
