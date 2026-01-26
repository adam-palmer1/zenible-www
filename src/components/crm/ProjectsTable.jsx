import React, { useState } from 'react';
import { PencilIcon, TrashIcon, ReceiptPercentIcon } from '@heroicons/react/24/outline';
import { useProjects } from '../../hooks/crm';
import { useCRM } from '../../contexts/CRMContext';
import { useNotification } from '../../contexts/NotificationContext';
import { ExpenseProvider } from '../../contexts/ExpenseContext';
import ConfirmationModal from '../common/ConfirmationModal';
import AssignExpenseModal from '../finance/expenses/AssignExpenseModal';
import ProjectDetailModal from './ProjectDetailModal';
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
} from '../../constants/crm';

export default function ProjectsTable({ selectedStatuses = [] }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [showExpensesModal, setShowExpensesModal] = useState(false);
  const [projectForExpenses, setProjectForExpenses] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const { projects, loading, deleteProject } = useProjects(
    selectedStatuses.length > 0 ? { statuses: selectedStatuses } : {}
  );
  const { openProjectModal } = useCRM();
  const { showSuccess, showError } = useNotification();

  const handleDeleteClick = (project) => {
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  const handleExpensesClick = (project) => {
    setProjectForExpenses(project);
    setShowExpensesModal(true);
  };

  const handleViewProject = (project) => {
    setSelectedProject(project);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedProject(null);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;

    try {
      await deleteProject(projectToDelete.id);
      showSuccess('Project deleted successfully');
      setShowDeleteModal(false);
      setProjectToDelete(null);
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
                <tr
                  key={project.id}
                  onClick={() => handleViewProject(project)}
                  className={`border-b border-[#e5e5e5] dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${index === projects.length - 1 ? 'border-b-0' : ''}`}
                >
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {project.name}
                    </div>
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
                  <td className="px-4 py-4 text-right text-sm" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleExpensesClick(project)}
                      className="text-green-600 hover:text-green-700 dark:hover:text-green-400 mr-3 transition-colors"
                      title="Expenses"
                    >
                      <ReceiptPercentIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openProjectModal(project)}
                      className="text-zenible-primary hover:text-purple-600 dark:hover:text-purple-400 mr-3 transition-colors"
                      title="Edit"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(project)}
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

      {/* Delete Project Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setProjectToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Project?"
        message={
          <div>
            <p className="mb-2">
              Are you sure you want to delete the project "{projectToDelete?.name}"?
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
          <AssignExpenseModal
            open={showExpensesModal}
            onOpenChange={(open) => {
              setShowExpensesModal(open);
              if (!open) setProjectForExpenses(null);
            }}
            entityType="project"
            entityId={projectForExpenses.id}
            entityName={projectForExpenses.name}
            onUpdate={() => {
              // Optionally refresh projects if needed
            }}
          />
        </ExpenseProvider>
      )}

      {/* Project Detail Modal */}
      <ProjectDetailModal
        isOpen={showDetailModal}
        onClose={handleCloseDetailModal}
        project={selectedProject}
        onUpdate={() => {
          // Optionally refresh projects if needed
        }}
      />
    </div>
  );
}
