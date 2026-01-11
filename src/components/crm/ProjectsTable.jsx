import React, { useState, useRef, useEffect } from 'react';
import { PencilIcon, TrashIcon, PlusIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useProjects } from '../../hooks/crm';
import { useCRM } from '../../contexts/CRMContext';
import { useNotification } from '../../contexts/NotificationContext';
import { usePreferences } from '../../contexts/PreferencesContext';
import { useDebouncedPreference } from '../../hooks/useDebouncedPreference';
import {
  PROJECT_STATUS,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
  PROJECT_STATUS_HEX_COLORS
} from '../../constants/crm';

export default function ProjectsTable() {
  const { getPreference } = usePreferences();
  const { updatePreference: updateDebouncedPreference } = useDebouncedPreference();
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const statusFilterRef = useRef(null);

  const { projects, loading, deleteProject } = useProjects(
    selectedStatuses.length > 0 ? { statuses: selectedStatuses } : {}
  );
  const { openProjectModal } = useCRM();
  const { showSuccess, showError } = useNotification();

  // Load status filter from preferences
  useEffect(() => {
    if (!preferencesLoaded) {
      const savedStatuses = getPreference('projects_status_filter', []);
      setSelectedStatuses(savedStatuses);
      setPreferencesLoaded(true);
    }
  }, [getPreference, preferencesLoaded]);

  // Close status filter dropdown when clicking outside
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

  const handleStatusToggle = async (status) => {
    const newStatuses = selectedStatuses.includes(status)
      ? selectedStatuses.filter(s => s !== status)
      : [...selectedStatuses, status];

    setSelectedStatuses(newStatuses);

    // Save to backend preferences
    try {
      await updateDebouncedPreference('projects_status_filter', newStatuses, 'projects');
    } catch (error) {
      console.error('Failed to save status filter preference:', error);
    }
  };

  const handleClearStatuses = async () => {
    setSelectedStatuses([]);
    try {
      await updateDebouncedPreference('projects_status_filter', [], 'projects');
    } catch (error) {
      console.error('Failed to clear status filter preference:', error);
    }
  };

  // All project statuses for the filter
  const allProjectStatuses = Object.values(PROJECT_STATUS);

  const handleDelete = async (project) => {
    if (!confirm(`Delete project "${project.name}"?`)) return;

    try {
      await deleteProject(project.id);
      showSuccess('Project deleted successfully');
    } catch (error) {
      showError('Failed to delete project');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zenible-primary"></div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div>
        {/* Status Filter */}
        <div className="mb-6">
          <div className="relative" ref={statusFilterRef}>
            <button
              onClick={() => setShowStatusFilter(!showStatusFilter)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="text-sm font-medium design-text-primary">Status</span>
              {selectedStatuses.length > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-zenible-primary text-white rounded-full">
                  {selectedStatuses.length}
                </span>
              )}
              <ChevronDownIcon className={`h-4 w-4 design-text-secondary transition-transform ${showStatusFilter ? 'rotate-180' : ''}`} />
            </button>

            {/* Status Filter Dropdown */}
            {showStatusFilter && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                <div className="p-3 space-y-2">
                  {allProjectStatuses.map((status) => (
                    <label
                      key={status}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes(status)}
                        onChange={() => handleStatusToggle(status)}
                        className="h-4 w-4 rounded border-gray-300 text-zenible-primary focus:ring-zenible-primary"
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: PROJECT_STATUS_HEX_COLORS[status] }}
                        />
                        <span className="text-sm design-text-primary">
                          {PROJECT_STATUS_LABELS[status]}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Clear Filter Button */}
                {selectedStatuses.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-3">
                    <button
                      onClick={handleClearStatuses}
                      className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center justify-center gap-2"
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

        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {selectedStatuses.length > 0 ? 'No projects match your filter' : 'No projects yet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {selectedStatuses.length > 0 ? 'Try selecting different statuses or clear the filter' : 'Create your first project to get started'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Status Filter */}
      <div className="mb-6">
        <div className="relative" ref={statusFilterRef}>
          <button
            onClick={() => setShowStatusFilter(!showStatusFilter)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="text-sm font-medium text-gray-900 dark:text-white">Status</span>
            {selectedStatuses.length > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-zenible-primary text-white rounded-full">
                {selectedStatuses.length}
              </span>
            )}
            <ChevronDownIcon className={`h-4 w-4 text-gray-600 dark:text-gray-400 transition-transform ${showStatusFilter ? 'rotate-180' : ''}`} />
          </button>

          {/* Status Filter Dropdown */}
          {showStatusFilter && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
              <div className="p-3 space-y-2">
                {allProjectStatuses.map((status) => (
                  <label
                    key={status}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes(status)}
                      onChange={() => handleStatusToggle(status)}
                      className="h-4 w-4 rounded border-gray-300 text-zenible-primary focus:ring-zenible-primary"
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: PROJECT_STATUS_HEX_COLORS[status] }}
                      />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {PROJECT_STATUS_LABELS[status]}
                      </span>
                    </div>
                  </label>
                ))}
              </div>

              {/* Clear Filter Button */}
              {selectedStatuses.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-3">
                  <button
                    onClick={handleClearStatuses}
                    className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center justify-center gap-2"
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

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-[#e5e5e5] dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e5e5e5] dark:border-gray-700">
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Project Name
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Client
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Services
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Start Date
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  End Date
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project, index) => (
                <tr key={project.id} className={`border-b border-[#e5e5e5] dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 ${index === projects.length - 1 ? 'border-b-0' : ''}`}>
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{project.name}</div>
                    {project.description && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-md">
                        {project.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {project.contact?.business_name ||
                       `${project.contact?.first_name || ''} ${project.contact?.last_name || ''}`.trim() ||
                       'N/A'}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${PROJECT_STATUS_COLORS[project.status]}`}>
                      {PROJECT_STATUS_LABELS[project.status]}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {project.services_count || 0} services
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                    {project.start_date ? new Date(project.start_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                    {project.end_date ? new Date(project.end_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-4 text-right text-sm">
                    <button
                      onClick={() => openProjectModal(project)}
                      className="text-zenible-primary hover:text-purple-600 dark:hover:text-purple-400 mr-3 transition-colors"
                      title="Edit"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(project)}
                      className="text-red-600 hover:text-red-900 dark:hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
