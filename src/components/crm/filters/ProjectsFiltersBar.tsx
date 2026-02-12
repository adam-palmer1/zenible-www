import React, { useRef, useEffect } from 'react';
import {
  ChevronDownIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import {
  PROJECT_STATUS,
  PROJECT_STATUS_LABELS,
} from '../../../constants/crm';
import type { ProjectStatus } from '../../../constants/crm';

interface ProjectsFiltersBarProps {
  selectedStatuses: string[];
  onStatusToggle: (status: string) => void;
  onClearStatuses: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  // Hidden/Lost toggles
  showHiddenClients: boolean;
  onShowHiddenClientsToggle: () => void;
  showHiddenContacts: boolean;
  onShowHiddenContactsToggle: () => void;
  showLostContacts: boolean;
  onShowLostContactsToggle: () => void;
  activeFilterCount?: number;
}

/**
 * ProjectsFiltersBar - Search and status filter for Projects tab
 */
const ProjectsFiltersBar: React.FC<ProjectsFiltersBarProps> = ({
  selectedStatuses,
  onStatusToggle,
  onClearStatuses,
  searchQuery,
  onSearchChange,
  showHiddenClients,
  onShowHiddenClientsToggle,
  showHiddenContacts,
  onShowHiddenContactsToggle,
  showLostContacts,
  onShowLostContactsToggle,
  activeFilterCount: _activeFilterCount = 0,
}) => {
  const [showStatusFilter, setShowStatusFilter] = React.useState(false);
  const [showFunnelFilter, setShowFunnelFilter] = React.useState(false);
  const statusFilterRef = useRef<HTMLDivElement>(null);
  const funnelFilterRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
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

  // Close funnel dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (funnelFilterRef.current && !funnelFilterRef.current.contains(event.target as Node)) {
        setShowFunnelFilter(false);
      }
    };

    if (showFunnelFilter) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFunnelFilter]);

  const allProjectStatuses = Object.values(PROJECT_STATUS) as string[];

  // Count filters for funnel badge
  const funnelFilterCount =
    (showHiddenClients ? 1 : 0) +
    (showHiddenContacts ? 1 : 0) +
    (showLostContacts ? 1 : 0);

  return (
    <div className="flex items-center gap-2">
      {/* Search */}
      <div className="relative w-64">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search projects..."
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
              {allProjectStatuses.map((status: any) => (
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
                  <span className="text-sm text-gray-700">
                    {PROJECT_STATUS_LABELS[status as ProjectStatus]}
                  </span>
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

      {/* Filters dropdown (Hidden/Lost) */}
      <div className="relative" ref={funnelFilterRef}>
        <button
          onClick={() => setShowFunnelFilter(!showFunnelFilter)}
          className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <FunnelIcon className="h-4 w-4 text-gray-600" />
          {funnelFilterCount > 0 && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-zenible-primary rounded-full">
              {funnelFilterCount}
            </span>
          )}
          <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${showFunnelFilter ? 'rotate-180' : ''}`} />
        </button>

        {showFunnelFilter && (
          <div className="absolute top-full right-0 mt-2 w-[300px] bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="p-4">
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
        )}
      </div>
    </div>
  );
};

export default ProjectsFiltersBar;
