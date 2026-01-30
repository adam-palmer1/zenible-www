import React, { useState } from 'react';
import { Mail, Plus, Edit2, Trash2 } from 'lucide-react';
import EmailTemplateEditor from '../email/EmailTemplateEditor';
import {
  useEmailTemplatesList,
  useDeleteEmailTemplate
} from '../../hooks/queries/useEmailTemplatesQuery';
import { useNotification } from '../../contexts/NotificationContext';
import { TEMPLATE_TYPE_LABELS, EmailTemplateType, TEMPLATE_CATEGORIES } from '../../types/emailTemplate';

/**
 * EmailTemplates Management Page
 *
 * Allows users to view, create, edit, and delete email templates
 * organized by template type (invoice_send, quote_send, etc.)
 */
const EmailTemplates = () => {
  const { showSuccess, showError } = useNotification();

  // UI state
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editingTemplateType, setEditingTemplateType] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, template: null });

  // Fetch all templates (including system defaults)
  const { templates, isLoading, refetch } = useEmailTemplatesList(
    { include_system_defaults: true },
    { refetchOnMount: true }
  );

  // Delete mutation
  const deleteMutation = useDeleteEmailTemplate({
    onSuccess: () => {
      showSuccess('Email template deleted successfully');
      setDeleteModal({ isOpen: false, template: null });
      refetch();
    },
    onError: (error) => {
      showError(error.message || 'Failed to delete template');
    }
  });

  const handleCreateOrEditTemplate = (templateType) => {
    // Find if user already has a custom template for this type
    const existingTemplate = templates.find(
      t => t.template_type === templateType && !t.is_system_default
    );

    if (existingTemplate) {
      // Edit existing custom template
      setEditingTemplate(existingTemplate);
      setEditingTemplateType(null);
    } else {
      // Create new template for this type
      setEditingTemplate(null);
      setEditingTemplateType(templateType);
    }
    setShowEditor(true);
  };

  const handleSaveTemplate = () => {
    setShowEditor(false);
    setEditingTemplate(null);
    setEditingTemplateType(null);
    refetch();
  };

  const handleCancelEditor = () => {
    setShowEditor(false);
    setEditingTemplate(null);
    setEditingTemplateType(null);
  };

  const handleDeleteTemplate = () => {
    if (deleteModal.template) {
      deleteMutation.mutate(deleteModal.template.id);
    }
  };

  // Group templates by type
  const getTemplateData = (type) => {
    const userTemplate = templates.find(
      t => t.template_type === type && !t.is_system_default
    );
    const systemTemplate = templates.find(
      t => t.template_type === type && t.is_system_default
    );

    return {
      userTemplate,
      systemTemplate,
      label: TEMPLATE_TYPE_LABELS[type] || type
    };
  };

  if (showEditor) {
    return (
      <div className="max-w-7xl mx-auto">
        <EmailTemplateEditor
          template={editingTemplate}
          templateType={editingTemplateType}
          onSave={handleSaveTemplate}
          onCancel={handleCancelEditor}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-zenible-primary" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Email Templates
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Customize email templates for invoices, quotes, and other communications
            </p>
          </div>
        </div>
      </div>

      {/* Templates List */}
      {isLoading ? (
        <div className="flex justify-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary mx-auto"></div>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading templates...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(TEMPLATE_CATEGORIES).map(([categoryKey, category]) => (
            <div key={categoryKey}>
              {/* Category Header */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {category.label}
              </h3>

              {/* Templates in this category */}
              <div className="space-y-3">
                {category.types.map((type) => {
                  const { userTemplate, systemTemplate, label } = getTemplateData(type);

                  return (
                    <div
                      key={type}
                      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:border-zenible-primary transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-base font-medium text-gray-900 dark:text-white">
                            {label}
                          </h4>

                          {userTemplate ? (
                            <div className="mt-2">
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-medium">Subject:</span> {userTemplate.subject}
                              </p>
                              {userTemplate.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {userTemplate.description}
                                </p>
                              )}
                              <div className="mt-2 flex items-center gap-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                                  Customized
                                </span>
                                {userTemplate.is_active && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                    Active
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="mt-2">
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Using system default template
                              </p>
                              {systemTemplate && (
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                  <span className="font-medium">Subject:</span> {systemTemplate.subject}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="ml-4 flex items-center gap-2">
                          <button
                            onClick={() => handleCreateOrEditTemplate(type)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-zenible-primary bg-white dark:bg-gray-800 border border-zenible-primary rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                          >
                            {userTemplate ? (
                              <>
                                <Edit2 className="h-4 w-4" />
                                Edit
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4" />
                                Customize
                              </>
                            )}
                          </button>

                          {userTemplate && (
                            <button
                              onClick={() => setDeleteModal({ isOpen: true, template: userTemplate })}
                              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setDeleteModal({ isOpen: false, template: null })}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Delete Email Template
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Are you sure you want to delete "{deleteModal.template?.name}"? This action
                cannot be undone and the system will revert to using the default template.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex items-center justify-end gap-3 rounded-b-lg">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, template: null })}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTemplate}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplates;
