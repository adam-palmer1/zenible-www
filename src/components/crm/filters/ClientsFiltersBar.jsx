import React, { useRef } from 'react';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronDownIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
} from '@heroicons/react/24/outline';
import Dropdown from '../../ui/dropdown/Dropdown';

/**
 * ClientsFiltersBar - Search, filters, sort, and column selector for Clients tab
 * Matches the inline design of CRMFiltersBar
 */
const ClientsFiltersBar = ({
  searchQuery,
  onSearchChange,
  showHidden,
  onShowHiddenToggle,
  sortOrder,
  onSortChange,
  visibleColumns,
  availableColumns,
  onToggleColumn,
  showColumnSelector,
  setShowColumnSelector,
  columnSelectorRef,
}) => {
  return (
    <div className="flex items-center gap-2">
      {/* Compact Search */}
      <div className="relative w-64">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search clients..."
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
              onChange={(e) => onShowHiddenToggle(e.target.checked)}
              className="w-4 h-4 text-zenible-primary border-gray-300 rounded focus:ring-zenible-primary"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-700">Show Hidden</div>
              <div className="text-xs text-gray-500 mt-0.5">
                Display clients that have been hidden from view
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
            {sortOrder !== 'newest' && (
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
                checked={sortOrder === 'newest'}
                onChange={() => onSortChange('newest')}
                className="w-4 h-4 text-zenible-primary border-gray-300 focus:ring-zenible-primary"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700">Newest First</div>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
              <input
                type="radio"
                name="sortOrder"
                checked={sortOrder === 'oldest'}
                onChange={() => onSortChange('oldest')}
                className="w-4 h-4 text-zenible-primary border-gray-300 focus:ring-zenible-primary"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700">Oldest First</div>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
              <input
                type="radio"
                name="sortOrder"
                checked={sortOrder === 'name'}
                onChange={() => onSortChange('name')}
                className="w-4 h-4 text-zenible-primary border-gray-300 focus:ring-zenible-primary"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700">Name (A-Z)</div>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
              <input
                type="radio"
                name="sortOrder"
                checked={sortOrder === 'services_high'}
                onChange={() => onSortChange('services_high')}
                className="w-4 h-4 text-zenible-primary border-gray-300 focus:ring-zenible-primary"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700">Services (High to Low)</div>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
              <input
                type="radio"
                name="sortOrder"
                checked={sortOrder === 'services_low'}
                onChange={() => onSortChange('services_low')}
                className="w-4 h-4 text-zenible-primary border-gray-300 focus:ring-zenible-primary"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700">Services (Low to High)</div>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
              <input
                type="radio"
                name="sortOrder"
                checked={sortOrder === 'value_high'}
                onChange={() => onSortChange('value_high')}
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
                checked={sortOrder === 'value_low'}
                onChange={() => onSortChange('value_low')}
                className="w-4 h-4 text-zenible-primary border-gray-300 focus:ring-zenible-primary"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700">Value (Low to High)</div>
              </div>
            </label>
          </div>
        </div>
      </Dropdown>

      {/* Column Selector */}
      <div className="relative" ref={columnSelectorRef}>
        <button
          onClick={() => setShowColumnSelector(!showColumnSelector)}
          className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="text-sm text-gray-700">Columns</span>
        </button>

        {showColumnSelector && (
          <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Show/Hide Columns</h3>
              <div className="space-y-2">
                {availableColumns.map((column) => (
                  <label
                    key={column.key}
                    className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                      column.locked
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns[column.key]}
                      onChange={() => !column.locked && onToggleColumn(column.key)}
                      disabled={column.locked}
                      className="w-4 h-4 text-zenible-primary border-gray-300 rounded focus:ring-zenible-primary disabled:cursor-not-allowed"
                    />
                    <span className="text-sm text-gray-700">{column.label}</span>
                    {column.locked && <span className="ml-auto text-xs text-gray-400">(Required)</span>}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientsFiltersBar;
