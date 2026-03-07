import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PencilIcon, TrashIcon, ReceiptPercentIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import Dropdown from '../ui/dropdown/Dropdown';
import { useProjects } from '../../hooks/crm';
import { useCRM } from '../../contexts/CRMContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useModalState } from '../../hooks/useModalState';
import { useDeleteConfirmation } from '../../hooks/useDeleteConfirmation';
import { ExpenseProvider } from '../../contexts/ExpenseContext';
import ConfirmationModal from '../common/ConfirmationModal';
import AssignExpenseModal from '../finance/expenses/AssignExpenseModal';
import ProjectDetailModal from './ProjectDetailModal';
import { LoadingSpinner } from '../shared';
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
  type ProjectStatus,
} from '../../constants/crm';
import type { ProjectListItemResponse } from '../../types/crm';

interface ProjectsTableProps {
  selectedStatuses?: string[];
  searchQuery?: string;
  showHiddenContacts?: boolean;
  showLostContacts?: boolean;
}

export default function ProjectsTable({ selectedStatuses = [], searchQuery = '', showHiddenContacts = false, showLostContacts = false }: ProjectsTableProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const deleteConfirm = useDeleteConfirmation<ProjectListItemResponse>();
  const [showExpensesModal, setShowExpensesModal] = useState(false);
  const [projectForExpenses, setProjectForExpenses] = useState<ProjectListItemResponse | null>(null);
  const detailModal = useModalState<ProjectListItemResponse>();

  const projectFilters: Record<string, unknown> = {};
  if (selectedStatuses.length > 0) {
    projectFilters.statuses = selectedStatuses;
  }
  if (showHiddenContacts) {
    projectFilters.include_hidden_contacts = 'true';
  }
  if (showLostContacts) {
    projectFilters.include_lost_contacts = 'true';
  }

  const { projects: rawProjects, loading, deleteProject, refresh } = useProjects(projectFilters);
  const allProjects = rawProjects as unknown as ProjectListItemResponse[];
  const { openProjectModal } = useCRM();

  // Client-side search filtering by project name, client company name, client name
  const projects = useMemo(() => {
    if (!searchQuery) return allProjects;
    const query = searchQuery.toLowerCase();
    return allProjects.filter((project: any) => {
      const projectName = (project.name || '').toLowerCase();
      const businessName = (project.contact?.business_name || '').toLowerCase();
      const firstName = (project.contact?.first_name || '').toLowerCase();
      const lastName = (project.contact?.last_name || '').toLowerCase();
      const fullName = `${firstName} ${lastName}`.trim();
      return (
        projectName.includes(query) ||
        businessName.includes(query) ||
        firstName.includes(query) ||
        lastName.includes(query) ||
        fullName.includes(query)
      );
    });
  }, [allProjects, searchQuery]);
  const { showSuccess, showError } = useNotification();

  // Handle projectId query parameter - open project detail modal
  const urlProjectId = searchParams.get('projectId');
  useEffect(() => {
    if (urlProjectId && projects.length > 0 && !loading) {
      const project = projects.find((p) => p.id === urlProjectId);
      if (project) {
        detailModal.open(project);
      }
      // Clear the URL param after opening
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('projectId');
      setSearchParams(newParams, { replace: true });
    }
  }, [urlProjectId, projects, loading, searchParams, setSearchParams]);

  const handleDeleteClick = (project: ProjectListItemResponse) => {
    deleteConfirm.requestDelete(project);
  };

  const handleExpensesClick = (project: ProjectListItemResponse) => {
    setProjectForExpenses(project);
    setShowExpensesModal(true);
  };

  const handleViewProject = (project: ProjectListItemResponse) => {
    detailModal.open(project);
  };

  const handleCloseDetailModal = () => {
    detailModal.close();
  };

  const handleDeleteConfirm = async () => {
    await deleteConfirm.confirmDelete(async (project) => {
      try {
        await deleteProject(project.id);
        showSuccess('Project deleted successfully');
      } catch (error) {
        showError('Failed to delete project');
        throw error;
      }
    });
  };

  if (loading) {
    return <LoadingSpinner size="h-8 w-8" height="py-12" />;
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {selectedStatuses.length > 0 ? 'No projects match your filter' : 'No projects yet'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {selectedStatuses.length > 0 ? 'Try selecting different statuses or clear the filter' : 'Create your first project to get started'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-[#e5e5e5] dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e5e5e5] dark:border-gray-700">
                <th className="text-left px-2 md:px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Project Name
                </th>
                <th className="text-left px-2 md:px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Client
                </th>
                <th className="text-left px-2 md:px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Status
                </th>
                <th className="hidden md:table-cell text-left px-2 md:px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Services
                </th>
                <th className="hidden md:table-cell text-left px-2 md:px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Start Date
                </th>
                <th className="hidden md:table-cell text-left px-2 md:px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  End Date
                </th>
                <th className="text-right px-2 md:px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project, index) => (
                <tr
                  key={project.id}
                  onClick={() => handleViewProject(project)}
                  className={`border-b border-[#e5e5e5] dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${index === projects.length - 1 ? 'border-b-0' : ''}`}
                >
                  <td className="px-2 md:px-4 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {project.name}
                    </div>
                    {project.description && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-md">
                        {project.description}
                      </div>
                    )}
                  </td>
                  <td className="px-2 md:px-4 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {project.contact?.business_name ||
                       `${project.contact?.first_name || ''} ${project.contact?.last_name || ''}`.trim() ||
                       'N/A'}
                    </div>
                  </td>
                  <td className="px-2 md:px-4 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PROJECT_STATUS_COLORS[project.status as ProjectStatus]}`}>
                      {PROJECT_STATUS_LABELS[project.status as ProjectStatus]}
                    </span>
                  </td>
                  <td className="hidden md:table-cell px-2 md:px-4 py-4">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {project.active_services_count || 0} services
                    </span>
                  </td>
                  <td className="hidden md:table-cell px-2 md:px-4 py-4 text-sm text-gray-900 dark:text-white">
                    {project.start_date ? new Date(project.start_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="hidden md:table-cell px-2 md:px-4 py-4 text-sm text-gray-900 dark:text-white">
                    {project.end_date ? new Date(project.end_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-2 md:px-4 py-4 whitespace-nowrap text-right">
                    <Dropdown
                      trigger={
                        <button
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                          className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                          aria-label="Project actions"
                        >
                          <EllipsisVerticalIcon className="h-5 w-5" />
                        </button>
                      }
                      align="end"
                      side="bottom"
                    >
                      <Dropdown.Item
                        onSelect={(e: Event) => {
                          e.stopPropagation();
                          handleExpensesClick(project);
                        }}
                      >
                        <ReceiptPercentIcon className="h-4 w-4" />
                        Finance
                      </Dropdown.Item>
                      <Dropdown.Item
                        onSelect={(e: Event) => {
                          e.stopPropagation();
                          openProjectModal(project);
                        }}
                      >
                        <PencilIcon className="h-4 w-4" />
                        Edit
                      </Dropdown.Item>
                      <Dropdown.Item
                        onSelect={(e: Event) => {
                          e.stopPropagation();
                          handleDeleteClick(project);
                        }}
                        destructive
                      >
                        <TrashIcon className="h-4 w-4" />
                        Delete
                      </Dropdown.Item>
                    </Dropdown>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Project Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={deleteConfirm.cancelDelete}
        onConfirm={handleDeleteConfirm}
        title="Delete Project?"
        message={
          <div>
            <p className="mb-2">
              Are you sure you want to delete the project "{deleteConfirm.item?.name}"?
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
              Warning: This action cannot be undone.
            </p>
          </div>
        }
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="red"
        icon={TrashIcon}
        iconColor="text-red-600"
      />

      {/* Assign Expenses to Project Modal */}
      {projectForExpenses && (
        <ExpenseProvider>
          {React.createElement(AssignExpenseModal as React.ComponentType<{ open: boolean; onOpenChange: (open: boolean) => void; entityType: string; entityId: string; entityName: string; onUpdate: () => void }>, {
            open: showExpensesModal,
            onOpenChange: (open: boolean) => {
              setShowExpensesModal(open);
              if (!open) setProjectForExpenses(null);
            },
            entityType: "project",
            entityId: projectForExpenses.id,
            entityName: projectForExpenses.name,
            onUpdate: () => {
              // Optionally refresh projects if needed
            },
          })}
        </ExpenseProvider>
      )}

      {/* Project Detail Modal */}
      <ProjectDetailModal
        isOpen={detailModal.isOpen}
        onClose={handleCloseDetailModal}
        project={detailModal.data}
        onUpdate={refresh}
      />
    </div>
  );
}
