import React, { useRef, useEffect } from 'react';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  PROJECT_STATUS,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_HEX_COLORS
} from '../../../constants/crm';

/**
 * ProjectsFiltersBar - Status filter for Projects tab
 * Matches the inline design of other filter bars
 */
const ProjectsFiltersBar = ({
  selectedStatuses,
  onStatusToggle,
  onClearStatuses,
}) => {
  const [showStatusFilter, setShowStatusFilter] = React.useState(false);
  const statusFilterRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusFilterRef.current && !statusFilterRef.current.contains(event.target)) {
        setShowStatusFilter(false);
      }
    };

    if (showStatusFilter) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showStatusFilter]);

  const allProjectStatuses = Object.values(PROJECT_STATUS);

  return (
    <div className="flex items-center gap-2">
      {/* Status Filter */}
      <div className="relative" ref={statusFilterRef}>
        <button
          onClick={() => setShowStatusFilter(!showStatusFilter)}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <span className="text-sm font-medium text-gray-700">Status</span>
          {selectedStatuses.length > 0 && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-zenible-primary rounded-full">
              {selectedStatuses.length}
            </span>
          )}
          <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${showStatusFilter ? 'rotate-180' : ''}`} />
        </button>

        {/* Status Filter Dropdown */}
        {showStatusFilter && (
          <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="p-3 space-y-2">
              {allProjectStatuses.map((status) => (
                <label
                  key={status}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(status)}
                    onChange={() => onStatusToggle(status)}
                    className="h-4 w-4 rounded border-gray-300 text-zenible-primary focus:ring-zenible-primary"
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: PROJECT_STATUS_HEX_COLORS[status] }}
                    />
                    <span className="text-sm text-gray-900">
                      {PROJECT_STATUS_LABELS[status]}
                    </span>
                  </div>
                </label>
              ))}
            </div>

            {/* Clear Filter Button */}
            {selectedStatuses.length > 0 && (
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
    </div>
  );
};

export default ProjectsFiltersBar;
