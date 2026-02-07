import React, { useState, useEffect } from 'react';

interface VisibleColumns {
  name: boolean;
  category: boolean;
  model: boolean;
  status: boolean;
  actions: boolean;
}

interface BackendProvider {
  value: string;
  label: string;
  description: string;
}

interface CharacterFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  categories: any[];
  providerFilter: string;
  onProviderChange: (value: string) => void;
  backendProviders: BackendProvider[];
  statusFilter: string;
  onStatusChange: (value: string) => void;
  visibleColumns: VisibleColumns;
  onColumnsChange: (columns: VisibleColumns) => void;
  onCreateCategory: () => void;
  onManagePlatforms: () => void;
  onCreateCharacter: () => void;
  darkMode: boolean;
}

const availableColumns = [
  { key: 'name', label: 'Name' },
  { key: 'category', label: 'Category' },
  { key: 'model', label: 'Model' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions' }
];

export default function CharacterFilters({
  search,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  categories,
  providerFilter,
  onProviderChange,
  backendProviders,
  statusFilter,
  onStatusChange,
  visibleColumns,
  onColumnsChange,
  onCreateCategory,
  onManagePlatforms,
  onCreateCharacter,
  darkMode
}: CharacterFiltersProps) {
  const [showFieldSelector, setShowFieldSelector] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showFieldSelector && !target.closest('.field-selector-container')) {
        setShowFieldSelector(false);
      }
      if (showCategoryDropdown && !target.closest('.category-dropdown-container')) {
        setShowCategoryDropdown(false);
      }
      if (showProviderDropdown && !target.closest('.provider-dropdown-container')) {
        setShowProviderDropdown(false);
      }
      if (showStatusDropdown && !target.closest('.status-dropdown-container')) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFieldSelector, showCategoryDropdown, showProviderDropdown, showStatusDropdown]);

  const toggleColumnVisibility = (columnKey: keyof VisibleColumns) => {
    onColumnsChange({
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey]
    });
  };

  return (
    <div className={`p-4 border-b ${
      darkMode
        ? 'bg-zenible-dark-bg border-zenible-dark-border'
        : 'bg-gray-50 border-neutral-200'
    }`}>
      {/* First row - Search bar */}
      <div className="flex flex-wrap gap-3 mb-3">
        <input
          type="text"
          placeholder="Search characters..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`px-3 py-1.5 rounded-lg border flex-1 min-w-[200px] ${
            darkMode
              ? 'bg-zenible-dark-card border-zenible-dark-border text-zenible-dark-text'
              : 'bg-white border-neutral-300 text-gray-900'
          }`}
        />
      </div>

      {/* Second row - Filter and action buttons */}
      <div className="flex flex-wrap gap-2">
        {/* Categories Filter */}
        <div className="relative category-dropdown-container">
          <button
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              darkMode
                ? 'bg-zenible-dark-card hover:bg-zenible-dark-tab-bg text-zenible-dark-text border border-zenible-dark-border'
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-neutral-300'
            }`}
          >
            <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Categories {categoryFilter && '•'}
          </button>

          {showCategoryDropdown && (
            <div className={`absolute top-full left-0 mt-2 w-56 rounded-lg shadow-lg border z-50 ${
              darkMode
                ? 'bg-zenible-dark-card border-zenible-dark-border'
                : 'bg-white border-gray-200'
            }`}>
              <div className="p-4">
                <h3 className={`text-sm font-medium mb-3 ${
                  darkMode ? 'text-zenible-dark-text' : 'text-gray-900'
                }`}>
                  Filter by Category
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={categoryFilter === ''}
                      onChange={() => onCategoryChange('')}
                      className="mr-2"
                    />
                    <span className={`text-sm ${
                      darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
                    }`}>
                      All Categories
                    </span>
                  </label>
                  {Array.isArray(categories) && categories.map(category => (
                    <label key={category.id} className="flex items-center">
                      <input
                        type="radio"
                        checked={categoryFilter === category.id}
                        onChange={() => onCategoryChange(category.id)}
                        className="mr-2"
                      />
                      <span className={`text-sm ${
                        darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
                      }`}>
                        {category.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Providers Filter */}
        <div className="relative provider-dropdown-container">
          <button
            onClick={() => setShowProviderDropdown(!showProviderDropdown)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              darkMode
                ? 'bg-zenible-dark-card hover:bg-zenible-dark-tab-bg text-zenible-dark-text border border-zenible-dark-border'
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-neutral-300'
            }`}
          >
            <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Providers {providerFilter && '•'}
          </button>

          {showProviderDropdown && (
            <div className={`absolute top-full left-0 mt-2 w-56 rounded-lg shadow-lg border z-50 ${
              darkMode
                ? 'bg-zenible-dark-card border-zenible-dark-border'
                : 'bg-white border-gray-200'
            }`}>
              <div className="p-4">
                <h3 className={`text-sm font-medium mb-3 ${
                  darkMode ? 'text-zenible-dark-text' : 'text-gray-900'
                }`}>
                  Filter by Provider
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={providerFilter === ''}
                      onChange={() => onProviderChange('')}
                      className="mr-2"
                    />
                    <span className={`text-sm ${
                      darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
                    }`}>
                      All Providers
                    </span>
                  </label>
                  {backendProviders.map(provider => (
                    <label key={provider.value} className="flex items-center">
                      <input
                        type="radio"
                        checked={providerFilter === provider.value}
                        onChange={() => onProviderChange(provider.value)}
                        className="mr-2"
                      />
                      <span className={`text-sm ${
                        darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
                      }`}>
                        {provider.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Filter */}
        <div className="relative status-dropdown-container">
          <button
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              darkMode
                ? 'bg-zenible-dark-card hover:bg-zenible-dark-tab-bg text-zenible-dark-text border border-zenible-dark-border'
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-neutral-300'
            }`}
          >
            <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Status {statusFilter && '•'}
          </button>

          {showStatusDropdown && (
            <div className={`absolute top-full left-0 mt-2 w-56 rounded-lg shadow-lg border z-50 ${
              darkMode
                ? 'bg-zenible-dark-card border-zenible-dark-border'
                : 'bg-white border-gray-200'
            }`}>
              <div className="p-4">
                <h3 className={`text-sm font-medium mb-3 ${
                  darkMode ? 'text-zenible-dark-text' : 'text-gray-900'
                }`}>
                  Filter by Status
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={statusFilter === ''}
                      onChange={() => onStatusChange('')}
                      className="mr-2"
                    />
                    <span className={`text-sm ${
                      darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
                    }`}>
                      All Status
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={statusFilter === 'active'}
                      onChange={() => onStatusChange('active')}
                      className="mr-2"
                    />
                    <span className={`text-sm ${
                      darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
                    }`}>
                      Active
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={statusFilter === 'inactive'}
                      onChange={() => onStatusChange('inactive')}
                      className="mr-2"
                    />
                    <span className={`text-sm ${
                      darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
                    }`}>
                      Inactive
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Columns Selector */}
        <div className="relative field-selector-container">
          <button
            onClick={() => setShowFieldSelector(!showFieldSelector)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              darkMode
                ? 'bg-zenible-dark-card hover:bg-zenible-dark-tab-bg text-zenible-dark-text border border-zenible-dark-border'
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-neutral-300'
            }`}
          >
            <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Columns
          </button>

            {showFieldSelector && (
              <div className={`absolute top-full left-0 mt-2 w-56 rounded-lg shadow-lg border z-50 ${
                darkMode
                  ? 'bg-zenible-dark-card border-zenible-dark-border'
                  : 'bg-white border-gray-200'
              }`}>
                <div className="p-4">
                  <h3 className={`text-sm font-medium mb-3 ${
                    darkMode ? 'text-zenible-dark-text' : 'text-gray-900'
                  }`}>
                    Show/Hide Columns
                  </h3>
                  <div className="space-y-2">
                    {availableColumns.map(column => (
                      <label key={column.key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={visibleColumns[column.key as keyof VisibleColumns]}
                          onChange={() => toggleColumnVisibility(column.key as keyof VisibleColumns)}
                          className="mr-2 rounded"
                        />
                        <span className={`text-sm ${
                          darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
                        }`}>
                          {column.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

        <button
          onClick={onCreateCategory}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            darkMode
              ? 'bg-zenible-dark-card hover:bg-zenible-dark-tab-bg text-zenible-dark-text border border-zenible-dark-border'
              : 'bg-white hover:bg-gray-100 text-gray-700 border border-neutral-300'
          }`}
        >
          Manage Categories
        </button>

        <button
          onClick={onManagePlatforms}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            darkMode
              ? 'bg-zenible-dark-card hover:bg-zenible-dark-tab-bg text-zenible-dark-text border border-zenible-dark-border'
              : 'bg-white hover:bg-gray-100 text-gray-700 border border-neutral-300'
          }`}
        >
          Manage Platforms
        </button>

        <button
          onClick={onCreateCharacter}
          className="px-3 py-1.5 bg-zenible-primary text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
        >
          Create Character
        </button>
      </div>
    </div>
  );
}
