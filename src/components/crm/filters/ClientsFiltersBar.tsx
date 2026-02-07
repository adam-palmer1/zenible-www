import React, { useState } from 'react';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronDownIcon,
  FunnelIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import Dropdown from '../../ui/dropdown/Dropdown';

interface Column {
  key: string;
  label: string;
  locked?: boolean;
  description?: string;
}

interface ColumnCategory {
  label: string;
  columns: Column[];
}

interface ClientsFiltersBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  showHidden: boolean;
  onShowHiddenToggle: (value: boolean) => void;
  showPreferredCurrency: boolean;
  onPreferredCurrencyToggle: (value: boolean) => void;
  visibleColumns: Record<string, boolean>;
  availableColumns: Column[];
  columnsByCategory: Record<string, ColumnCategory>;
  onToggleColumn: (key: string) => void;
  showColumnSelector: boolean;
  setShowColumnSelector: (value: boolean) => void;
  columnSelectorRef: React.RefObject<HTMLDivElement>;
  fieldsLoading: boolean;
}

/**
 * ClientsFiltersBar - Search, filters, sort, and column selector for Clients tab
 * Matches the inline design of CRMFiltersBar
 */
const ClientsFiltersBar: React.FC<ClientsFiltersBarProps> = ({
  searchQuery,
  onSearchChange,
  showHidden,
  onShowHiddenToggle,
  showPreferredCurrency,
  onPreferredCurrencyToggle,
  visibleColumns,
  availableColumns,
  columnsByCategory,
  onToggleColumn,
  showColumnSelector,
  setShowColumnSelector,
  columnSelectorRef,
  fieldsLoading,
}) => {
  const [hoveredField, setHoveredField] = useState<string | null>(null);
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
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
              <input
                type="checkbox"
                checked={showPreferredCurrency}
                onChange={(e) => onPreferredCurrencyToggle(e.target.checked)}
                className="w-4 h-4 text-zenible-primary border-gray-300 rounded focus:ring-zenible-primary"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700">Show in preferred currency</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Convert all amounts to your company's default currency
                </div>
              </div>
            </label>
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
          <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[70vh] overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Show/Hide Columns</h3>

              {fieldsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-zenible-primary"></div>
                  <span className="ml-2 text-sm text-gray-500">Loading fields...</span>
                </div>
              ) : columnsByCategory && Object.keys(columnsByCategory).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(columnsByCategory).map(([category, { label: categoryLabel, columns }]) => (
                    <div key={category}>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        {categoryLabel}
                      </h4>
                      <div className="space-y-1">
                        {columns.map((column: any) => (
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
                              checked={visibleColumns[column.key] || false}
                              onChange={() => !column.locked && onToggleColumn(column.key)}
                              disabled={column.locked}
                              className="w-4 h-4 text-zenible-primary border-gray-300 rounded focus:ring-zenible-primary disabled:cursor-not-allowed flex-shrink-0"
                            />
                            <span className="text-sm text-gray-700 flex-1">{column.label}</span>
                            {column.description && (
                              <div className="relative flex-shrink-0">
                                <InformationCircleIcon
                                  className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help"
                                  onMouseEnter={() => setHoveredField(column.key)}
                                  onMouseLeave={() => setHoveredField(null)}
                                />
                                {hoveredField === column.key && (
                                  <div className="absolute right-0 bottom-full mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50">
                                    {column.description}
                                    <div className="absolute bottom-0 right-2 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                                  </div>
                                )}
                              </div>
                            )}
                            {column.locked && (
                              <span className="text-xs text-gray-400 flex-shrink-0">(Required)</span>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Fallback to flat list if no categories
                <div className="space-y-2">
                  {availableColumns.map((column: any) => (
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
                        checked={visibleColumns[column.key] || false}
                        onChange={() => !column.locked && onToggleColumn(column.key)}
                        disabled={column.locked}
                        className="w-4 h-4 text-zenible-primary border-gray-300 rounded focus:ring-zenible-primary disabled:cursor-not-allowed"
                      />
                      <span className="text-sm text-gray-700">{column.label}</span>
                      {column.locked && <span className="ml-auto text-xs text-gray-400">(Required)</span>}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientsFiltersBar;
