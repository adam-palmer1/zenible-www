import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useCustomReports } from '@/contexts/CustomReportsContext';
import {
  ENTITY_TYPE_LABELS,
  ENTITY_TYPE_COLORS,
  type ReportEntityType,
  type EntitySelectionConfig,
} from '@/types/customReport';

interface EntityConfigPanelProps {
  selection: EntitySelectionConfig;
}

const EntityConfigPanel: React.FC<EntityConfigPanelProps> = ({ selection }) => {
  const {
    availableColumns,
    setEntityColumns,
    setEntityStatusFilters,
    setEntityExtraFilters,
  } = useCustomReports();
  const [isExpanded, setIsExpanded] = useState(true);

  const entityMeta = availableColumns?.entities.find(
    (e) => e.entity_type === selection.entity_type
  );

  if (!entityMeta) return null;

  const colors = ENTITY_TYPE_COLORS[selection.entity_type];
  const selectedColumnsSet = new Set(selection.columns);
  const selectedStatusesSet = new Set(selection.status_filters || []);

  const handleColumnToggle = (columnKey: string) => {
    const newColumns = selectedColumnsSet.has(columnKey)
      ? selection.columns.filter((c) => c !== columnKey)
      : [...selection.columns, columnKey];
    setEntityColumns(selection.entity_type, newColumns);
  };

  const handleSelectAllColumns = () => {
    const allKeys = entityMeta.columns.map((c) => c.key);
    const allSelected = allKeys.every((k) => selectedColumnsSet.has(k));
    setEntityColumns(selection.entity_type, allSelected ? [] : allKeys);
  };

  const handleStatusToggle = (status: string) => {
    const currentStatuses = selection.status_filters || [];
    const newStatuses = selectedStatusesSet.has(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];
    setEntityStatusFilters(selection.entity_type, newStatuses);
  };

  const handleExtraFilterToggle = (filterKey: string) => {
    const current = selection.extra_filters || {};
    const currentVal = (current as Record<string, unknown>)[filterKey];
    setEntityExtraFilters(selection.entity_type, {
      ...current,
      [filterKey]: currentVal ? undefined : true,
    });
  };

  const allColumnsSelected = entityMeta.columns.every((c) => selectedColumnsSet.has(c.key));

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}
          >
            {ENTITY_TYPE_LABELS[selection.entity_type]}
          </span>
          <span className="text-xs text-[#71717a]">
            {selection.columns.length} column{selection.columns.length !== 1 ? 's' : ''} selected
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Columns */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Columns
              </label>
              <button
                type="button"
                onClick={handleSelectAllColumns}
                className="text-xs text-[#8e51ff] hover:text-[#7c3aed]"
              >
                {allColumnsSelected ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {entityMeta.columns.map((col) => (
                <label
                  key={col.key}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedColumnsSet.has(col.key)}
                    onChange={() => handleColumnToggle(col.key)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-[#09090b] truncate">{col.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Status Filters */}
          {entityMeta.filters.status_options.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Status Filter
              </label>
              <div className="flex flex-wrap gap-1.5">
                {entityMeta.filters.status_options.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatusToggle(status)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      selectedStatusesSet.has(status)
                        ? 'bg-purple-100 text-purple-700 border border-purple-300'
                        : 'bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200'
                    }`}
                  >
                    {status.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Extra Filters */}
          {entityMeta.filters.extra_filters.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Additional Filters
              </label>
              <div className="flex flex-wrap gap-1.5">
                {entityMeta.filters.extra_filters.map((filterKey) => {
                  const isActive = !!(selection.extra_filters as Record<string, unknown> | undefined)?.[filterKey];
                  return (
                    <button
                      key={filterKey}
                      type="button"
                      onClick={() => handleExtraFilterToggle(filterKey)}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-purple-100 text-purple-700 border border-purple-300'
                          : 'bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200'
                      }`}
                    >
                      {filterKey.replace(/^is_|^has_/, '').replace(/_/g, ' ')}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EntityConfigPanel;
