import React, { useState, useRef } from 'react';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronDownIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
} from '@heroicons/react/24/outline';
import Dropdown from '../../ui/dropdown/Dropdown';

interface CRMFiltersBarProps {
  filters: any;
  updateFilters: (filters: any) => void;
  allStatuses: any[];
  selectedStatuses: string[];
  handleStatusToggle: (statusId: string) => void;
  handleClearStatuses: () => void;
  showHidden: boolean;
  handleShowHiddenToggle: (show: boolean) => void;
  sortOrder: string | null;
  handleSortOrderChange: (order: string | null) => void;
  activeFilterCount: number;
  clearAllFilters: () => void;
  inline?: boolean;
}

const CRMFiltersBar: React.FC<CRMFiltersBarProps> = ({
  filters,
  updateFilters,
  allStatuses,
  selectedStatuses,
  handleStatusToggle,
  handleClearStatuses,
  showHidden,
  handleShowHiddenToggle,
  sortOrder,
  handleSortOrderChange,
  activeFilterCount,
  clearAllFilters,
  inline = false,
}) => {
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const statusFilterRef = useRef<HTMLDivElement>(null);

  // Inline mode - render compact controls in a row
  if (inline) {
    return (
      <div className="flex items-center gap-2">
        {/* Compact Search */}
        <div className="relative w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            value={filters.search || ''}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="w-full pl-9 pr-8 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary text-sm"
          />
          {filters.search && (
            <button
              onClick={() => updateFilters({ search: '' })}
              className="absolute inset-y-0 right-0 pr-2 flex items-center"
            >
              <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Status Filter Dropdown */}
        <div className="relative" ref={statusFilterRef}>
          <button
            onClick={() => setShowStatusFilter(!showStatusFilter)}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm bg-white"
          >
            <span className="text-gray-700">
              Status {selectedStatuses.length > 0 && `(${selectedStatuses.length})`}
            </span>
            <ChevronDownIcon className="h-4 w-4 text-gray-400" />
          </button>

          {showStatusFilter && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowStatusFilter(false)}
              />
              <div className="absolute mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-y-auto z-50">
                <div className="p-2">
                  <div className="flex items-center justify-between px-2 py-1.5 mb-1">
                    <span className="text-xs font-semibold text-gray-600 uppercase">
                      Select Statuses
                    </span>
                    {selectedStatuses.length > 0 && (
                      <button
                        onClick={handleClearStatuses}
                        className="text-xs text-zenible-primary hover:text-purple-600"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {allStatuses.map((status: any) => {
                    const displayName = status.friendly_name || status.name;
                    return (
                      <label
                        key={status.id}
                        className="flex items-center gap-2 px-2 py-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStatuses.includes(status.id)}
                          onChange={() => handleStatusToggle(status.id)}
                          className="w-4 h-4 text-zenible-primary border-gray-300 rounded focus:ring-zenible-primary"
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: status.color || '#6B7280' }}
                          />
                          <span className="text-sm text-gray-700">{displayName}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Filters Dropdown */}
        <Dropdown
          trigger={
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
              <FunnelIcon className="h-4 w-4 text-gray-600" />
              {showHidden && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-zenible-primary rounded-full">
                  1
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
            <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
              <input
                type="checkbox"
                checked={showHidden}
                onChange={(e) => handleShowHiddenToggle(e.target.checked)}
                className="w-4 h-4 text-zenible-primary border-gray-300 rounded focus:ring-zenible-primary"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700">Show Hidden</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Display contacts that have been hidden from view
                </div>
              </div>
            </label>
          </div>
        </Dropdown>

        {/* Sort Dropdown */}
        <Dropdown
          trigger={
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
              <ArrowsUpDownIcon className="h-4 w-4 text-gray-600" />
              {sortOrder && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-zenible-primary rounded-full">
                  1
                </span>
              )}
              <ChevronDownIcon className="h-4 w-4 text-gray-400" />
            </button>
          }
          align="start"
          side="bottom"
        >
          <div className="p-4 min-w-[280px]">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Sort</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                <input
                  type="radio"
                  name="sortOrder"
                  checked={sortOrder === null}
                  onChange={() => handleSortOrderChange(null)}
                  className="w-4 h-4 text-zenible-primary border-gray-300 focus:ring-zenible-primary"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700">Default</div>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                <input
                  type="radio"
                  name="sortOrder"
                  checked={sortOrder === 'high_to_low'}
                  onChange={() => handleSortOrderChange('high_to_low')}
                  className="w-4 h-4 text-zenible-primary border-gray-300 focus:ring-zenible-primary"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700">Value (High to Low)</div>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                <input
                  type="radio"
                  name="sortOrder"
                  checked={sortOrder === 'low_to_high'}
                  onChange={() => handleSortOrderChange('low_to_high')}
                  className="w-4 h-4 text-zenible-primary border-gray-300 focus:ring-zenible-primary"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700">Value (Low to High)</div>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                <input
                  type="radio"
                  name="sortOrder"
                  checked={sortOrder === 'follow_up_date'}
                  onChange={() => handleSortOrderChange('follow_up_date')}
                  className="w-4 h-4 text-zenible-primary border-gray-300 focus:ring-zenible-primary"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700">Follow Up Date</div>
                </div>
              </label>
            </div>
          </div>
        </Dropdown>
      </div>
    );
  }

  // Original mode - full width with active filter tags
  return (
    <div className="mt-4 space-y-3">
      {/* Search Bar with Icon */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search by name, email, business..."
          value={filters.search || ''}
          onChange={(e) => updateFilters({ search: e.target.value })}
          className="w-full pl-10 pr-4 py-2.5 border border-design-border-input rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary text-sm"
        />
        {filters.search && (
          <button
            onClick={() => updateFilters({ search: '' })}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Filters Row - Status, Filters, and Sort buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Status Filter Dropdown */}
        <div className="relative" ref={statusFilterRef}>
          <button
            onClick={() => setShowStatusFilter(!showStatusFilter)}
            className="flex items-center gap-2 px-4 py-2 border border-design-border-input rounded-lg hover:bg-gray-50 transition-colors text-sm bg-white"
          >
            <span className="text-gray-700">
              Status {selectedStatuses.length > 0 && `(${selectedStatuses.length})`}
            </span>
            <ChevronDownIcon className="h-4 w-4 text-gray-400" />
          </button>

          {showStatusFilter && (
            <div className="absolute mt-2 w-64 bg-white rounded-lg shadow-lg border border-design-border-light max-h-80 overflow-y-auto z-50">
              <div className="p-2">
                <div className="flex items-center justify-between px-2 py-1.5 mb-1">
                  <span className="text-xs font-semibold text-gray-600 uppercase">
                    Select Statuses
                  </span>
                  {selectedStatuses.length > 0 && (
                    <button
                      onClick={handleClearStatuses}
                      className="text-xs text-zenible-primary hover:text-purple-600"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {allStatuses.map((status: any) => {
                  const displayName = status.friendly_name || status.name;

                  return (
                    <label
                      key={status.id}
                      className="flex items-center gap-2 px-2 py-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes(status.id)}
                        onChange={() => handleStatusToggle(status.id)}
                        className="w-4 h-4 text-zenible-primary border-gray-300 rounded focus:ring-zenible-primary"
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: status.color || '#6B7280' }}
                        />
                        <span className="text-sm text-gray-700">{displayName}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Filters Dropdown - Using new Dropdown component */}
        <Dropdown
          trigger={
            <button className="flex items-center gap-2 px-3 py-2 bg-design-page-bg rounded-lg border border-design-border-light hover:bg-gray-100 transition-colors">
              <FunnelIcon className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filters</span>
              {showHidden && (
                <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-brand-purple rounded-full">
                  1
                </span>
              )}
              <ChevronDownIcon className="h-4 w-4 text-gray-400" />
            </button>
          }
          align="start"
          side="bottom"
        >
          <div className="p-4 min-w-[280px]">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
              Filters
            </h3>

            {/* Show Hidden Checkbox */}
            <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
              <input
                type="checkbox"
                checked={showHidden}
                onChange={(e) => handleShowHiddenToggle(e.target.checked)}
                className="w-4 h-4 text-zenible-primary border-gray-300 rounded focus:ring-zenible-primary"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700">Show Hidden</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Display contacts that have been hidden from view
                </div>
              </div>
            </label>
          </div>
        </Dropdown>

        {/* Sort Dropdown - Using new Dropdown component */}
        <Dropdown
          trigger={
            <button className="flex items-center gap-2 px-3 py-2 bg-design-page-bg rounded-lg border border-design-border-light hover:bg-gray-100 transition-colors">
              <ArrowsUpDownIcon className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Sort</span>
              {sortOrder && (
                <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-brand-purple rounded-full">
                  1
                </span>
              )}
              <ChevronDownIcon className="h-4 w-4 text-gray-400" />
            </button>
          }
          align="start"
          side="bottom"
        >
          <div className="p-4 min-w-[280px]">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
              Sort
            </h3>

            {/* Sort Options */}
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                <input
                  type="radio"
                  name="sortOrder"
                  checked={sortOrder === null}
                  onChange={() => handleSortOrderChange(null)}
                  className="w-4 h-4 text-zenible-primary border-gray-300 focus:ring-zenible-primary"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700">Default Order</div>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                <input
                  type="radio"
                  name="sortOrder"
                  checked={sortOrder === 'high_to_low'}
                  onChange={() => handleSortOrderChange('high_to_low')}
                  className="w-4 h-4 text-zenible-primary border-gray-300 focus:ring-zenible-primary"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700">
                    Value (High to Low)
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Sort by total value descending
                  </div>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                <input
                  type="radio"
                  name="sortOrder"
                  checked={sortOrder === 'low_to_high'}
                  onChange={() => handleSortOrderChange('low_to_high')}
                  className="w-4 h-4 text-zenible-primary border-gray-300 focus:ring-zenible-primary"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700">
                    Value (Low to High)
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Sort by total value ascending
                  </div>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                <input
                  type="radio"
                  name="sortOrder"
                  checked={sortOrder === 'follow_up_date'}
                  onChange={() => handleSortOrderChange('follow_up_date')}
                  className="w-4 h-4 text-zenible-primary border-gray-300 focus:ring-zenible-primary"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700">Follow Up Date</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Sort by appointment date (soonest first)
                  </div>
                </div>
              </label>
            </div>
          </div>
        </Dropdown>

        {/* Clear All Filters Button */}
        {(activeFilterCount > 0 || sortOrder) && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
          >
            <XMarkIcon className="h-4 w-4" />
            Clear All ({activeFilterCount + (sortOrder ? 1 : 0)})
          </button>
        )}
      </div>

      {/* Active Filter Tags */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {filters.search && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              Search: "{filters.search}"
              <button
                onClick={() => updateFilters({ search: '' })}
                className="hover:bg-blue-200 rounded-full p-0.5"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedStatuses.length > 0 && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
              {selectedStatuses.length} Status{selectedStatuses.length > 1 ? 'es' : ''}
              <button
                onClick={handleClearStatuses}
                className="hover:bg-purple-200 rounded-full p-0.5"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          )}
          {showHidden && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
              Show Hidden
              <button
                onClick={() => handleShowHiddenToggle(false)}
                className="hover:bg-gray-200 rounded-full p-0.5"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          )}
          {sortOrder && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">
              Sort:{' '}
              {sortOrder === 'high_to_low'
                ? 'Value (High to Low)'
                : sortOrder === 'low_to_high'
                ? 'Value (Low to High)'
                : sortOrder === 'follow_up_date'
                ? 'Follow Up Date'
                : ''}
              <button
                onClick={() => handleSortOrderChange(null)}
                className="hover:bg-indigo-200 rounded-full p-0.5"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default CRMFiltersBar;
