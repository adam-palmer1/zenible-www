import React, { useState, useRef } from 'react';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronDownIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
} from '@heroicons/react/24/outline';

/**
 * FilterBar - A reusable filter bar component
 *
 * Consolidates the duplicate filter patterns found in:
 * - CRMFiltersBar
 * - ClientsFiltersBar
 * - VendorsFiltersBar
 * - ProjectsFiltersBar
 *
 * @param {Object} props
 * @param {string} props.searchValue - Current search value
 * @param {Function} props.onSearchChange - Search change handler
 * @param {string} props.searchPlaceholder - Search placeholder text
 * @param {Array} props.filters - Array of filter configurations
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.compact - Use compact styling
 *
 * Filter types:
 * - toggle: { type: 'toggle', label, checked, onChange }
 * - dropdown: { type: 'dropdown', label, value, onChange, options: [{value, label}] }
 * - multi-select: { type: 'multi-select', label, selected, onChange, options: [{value, label}] }
 *
 * @example
 * <FilterBar
 *   searchValue={search}
 *   onSearchChange={setSearch}
 *   searchPlaceholder="Search clients..."
 *   filters={[
 *     { type: 'toggle', label: 'Show Hidden', checked: showHidden, onChange: setShowHidden },
 *     { type: 'dropdown', label: 'Status', value: status, onChange: setStatus, options: statusOptions },
 *   ]}
 * />
 */
const FilterBar = ({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters = [],
  className = '',
  compact = false,
  showFilterButton = true,
  children,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef(null);

  // Count active filters
  const activeFilterCount = filters.reduce((count, filter) => {
    if (filter.type === 'toggle' && filter.checked) return count + 1;
    if (filter.type === 'dropdown' && filter.value) return count + 1;
    if (filter.type === 'multi-select' && filter.selected?.length > 0) return count + filter.selected.length;
    return count;
  }, 0);

  // Toggle filters
  const toggleFilters = filters.filter(f => f.type === 'toggle');
  const dropdownFilters = filters.filter(f => f.type === 'dropdown' || f.type === 'multi-select');

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Search Input */}
      <div className={`relative ${compact ? 'w-48' : 'w-64'}`}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-8 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
        {searchValue && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 pr-2 flex items-center"
          >
            <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
          </button>
        )}
      </div>

      {/* Filter Button with Dropdown */}
      {showFilterButton && filters.length > 0 && (
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm bg-white dark:bg-gray-800"
          >
            <FunnelIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-purple-600 rounded-full">
                {activeFilterCount}
              </span>
            )}
            <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Filter Dropdown */}
          {showFilters && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowFilters(false)}
              />
              <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Filters</h3>

                  {/* Toggle Filters */}
                  {toggleFilters.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {toggleFilters.map((filter, index) => (
                        <label
                          key={filter.label || index}
                          className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={filter.checked}
                            onChange={(e) => filter.onChange(e.target.checked)}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{filter.label}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Dropdown Filters */}
                  {dropdownFilters.map((filter, index) => (
                    <div key={filter.label || index} className="mb-3">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        {filter.label}
                      </label>
                      {filter.type === 'dropdown' ? (
                        <select
                          value={filter.value || ''}
                          onChange={(e) => filter.onChange(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">All</option>
                          {filter.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        // Multi-select
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {filter.options?.map((opt) => (
                            <label
                              key={opt.value}
                              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1.5 rounded transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={filter.selected?.includes(opt.value)}
                                onChange={() => {
                                  const current = filter.selected || [];
                                  const newSelected = current.includes(opt.value)
                                    ? current.filter(v => v !== opt.value)
                                    : [...current, opt.value];
                                  filter.onChange(newSelected);
                                }}
                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Clear Filters */}
                  {activeFilterCount > 0 && (
                    <button
                      onClick={() => {
                        filters.forEach(filter => {
                          if (filter.type === 'toggle') filter.onChange(false);
                          if (filter.type === 'dropdown') filter.onChange('');
                          if (filter.type === 'multi-select') filter.onChange([]);
                        });
                      }}
                      className="w-full mt-2 px-3 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Additional children (custom buttons, etc.) */}
      {children}
    </div>
  );
};

export default FilterBar;

/**
 * SortButton - Companion component for sort controls
 */
export const SortButton = ({ sortOrder, onSortChange, options }) => {
  const [showSort, setShowSort] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowSort(!showSort)}
        className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm bg-white dark:bg-gray-800"
      >
        <ArrowsUpDownIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        <span className="text-gray-700 dark:text-gray-300">Sort</span>
        <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${showSort ? 'rotate-180' : ''}`} />
      </button>

      {showSort && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowSort(false)} />
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
            <div className="py-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSortChange(option.value);
                    setShowSort(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                    sortOrder === option.value
                      ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
