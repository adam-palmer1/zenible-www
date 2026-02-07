import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Modal from '../ui/modal/Modal';
import statusesAPI from '../../services/api/crm/statuses';
import { useNotification } from '../../contexts/NotificationContext';
import { useModalState } from '../../hooks/useModalState';
import ConfirmationModal from '../common/ConfirmationModal';

interface CRMSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface StatusRowProps {
  status: any;
  isSystem: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

interface StatusFormModalProps {
  status: any;
  onClose: () => void;
  onSuccess: () => void;
}

interface DeleteStatusModalProps {
  status: any;
  onClose: () => void;
  onSuccess: () => void;
}

const CRMSettingsModal: React.FC<CRMSettingsModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [globalStatuses, setGlobalStatuses] = useState<any[]>([]);
  const [customStatuses, setCustomStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const createModal = useModalState();
  const [editingStatus, setEditingStatus] = useState<any>(null);
  const [deletingStatus, setDeletingStatus] = useState<any>(null);
  const { showSuccess, showError } = useNotification() as any;

  // Fetch statuses
  const fetchStatuses = async () => {
    try {
      setLoading(true);
      const data = await (statusesAPI as any).getAvailable();
      setGlobalStatuses(data.global_statuses || []);
      setCustomStatuses(data.custom_statuses || []);
    } catch (error) {
      showError('Failed to load statuses');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatuses();
    }
  }, [isOpen]);

  return (
    <>
      <Modal
        open={isOpen}
        onOpenChange={onClose}
        title="CRM Settings"
        size="3xl"
      >
        <div className="space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary"></div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* System Statuses */}
                  <div>
                    <div className="mb-3">
                      <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                        System Statuses
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Default statuses - you can only edit display properties
                      </p>
                    </div>

                    <div className="space-y-0 border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
                      {globalStatuses.map((status: any) => (
                        <StatusRow
                          key={status.id}
                          status={status}
                          isSystem={true}
                          onEdit={() => setEditingStatus({ ...status, isGlobal: true })}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Custom Statuses */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                          Custom Statuses
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Custom statuses for your company's workflow
                        </p>
                      </div>
                      <button
                        onClick={() => createModal.open()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-zenible-primary rounded-lg hover:bg-opacity-90 transition-colors"
                      >
                        <PlusIcon className="w-4 h-4" />
                        Create
                      </button>
                    </div>

                    {customStatuses.length === 0 ? (
                      <div className="text-center py-12 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No custom statuses yet. Click "Create" to add one.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-0 border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
                        {customStatuses.map((status: any) => (
                          <StatusRow
                            key={status.id}
                            status={status}
                            isSystem={false}
                            onEdit={() => setEditingStatus({ ...status, isGlobal: false })}
                            onDelete={() => setDeletingStatus(status)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
        </div>
      </Modal>

      {/* Create/Edit Modal */}
      {(createModal.isOpen || editingStatus) && (
        <StatusFormModal
          status={editingStatus}
          onClose={() => {
            createModal.close();
            setEditingStatus(null);
          }}
          onSuccess={() => {
            fetchStatuses();
            createModal.close();
            setEditingStatus(null);
            // Notify parent to refresh CRM data
            if (onSuccess) {
              onSuccess();
            }
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deletingStatus && (
        <DeleteStatusModal
          status={deletingStatus}
          onClose={() => setDeletingStatus(null)}
          onSuccess={() => {
            fetchStatuses();
            setDeletingStatus(null);
            // Notify parent to refresh CRM data
            if (onSuccess) {
              onSuccess();
            }
          }}
        />
      )}
    </>
  );
};

// Status Row Component - Figma Design
const StatusRow: React.FC<StatusRowProps> = ({ status, isSystem, onEdit, onDelete }) => {
  return (
    <div className="flex items-center justify-between py-3.5 px-4 bg-white dark:bg-gray-800">
      <div className="flex items-center gap-3 flex-1">
        {/* Colored Circle Indicator */}
        <div
          className="w-5 h-5 rounded-full flex-shrink-0"
          style={{
            backgroundColor: status.color,
          }}
        />

        {/* Status Name */}
        <div className="text-sm font-normal text-gray-900 dark:text-white flex-1">
          {status.friendly_name || status.name}
        </div>
      </div>

      {/* Color Code and Edit Icon */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
          {status.color?.toUpperCase()}
        </span>
        <button
          onClick={onEdit}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Edit status"
        >
          <PencilIcon className="w-4 h-4" />
        </button>
        {!isSystem && (
          <button
            onClick={onDelete}
            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Delete status"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// Status Form Modal (Create/Edit)
const StatusFormModal: React.FC<StatusFormModalProps> = ({ status, onClose, onSuccess }) => {
  const isEdit = !!status;
  const isGlobal = status?.isGlobal || false;
  const { showSuccess, showError } = useNotification() as any;

  const [formData, setFormData] = useState({
    name: status?.name || '',
    friendly_name: status?.friendly_name || '',
    color: status?.color || '#DBEAFE',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!isGlobal && !isEdit) {
      if (!formData.name) {
        newErrors.name = 'Name is required';
      } else if (formData.name.length > 20) {
        newErrors.name = 'Name must be 20 characters or less';
      } else if (!/^[a-z_]+$/.test(formData.name)) {
        newErrors.name = 'Name must be lowercase letters and underscores only';
      }
    }

    if (!formData.friendly_name) {
      newErrors.friendly_name = 'Display name is required';
    } else if (formData.friendly_name.length > 255) {
      newErrors.friendly_name = 'Display name must be 255 characters or less';
    }

    if (!/^#[0-9A-Fa-f]{6}$/.test(formData.color)) {
      newErrors.color = 'Color must be a valid hex code (e.g., #RRGGBB)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setSubmitting(true);

    try {
      if (isEdit) {
        // Update existing status
        const updateData: any = {
          friendly_name: formData.friendly_name,
          color: formData.color,
        };

        if (!isGlobal) {
          updateData.name = formData.name;
        }

        if (isGlobal) {
          await (statusesAPI as any).updateGlobal(status.id, updateData);
        } else {
          await (statusesAPI as any).updateCustom(status.id, updateData);
        }
        showSuccess('Status updated successfully');
      } else {
        // Create new custom status
        await (statusesAPI as any).createCustom(formData);
        showSuccess('Status created successfully');
      }

      onSuccess();
    } catch (error: any) {
      showError(error.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={true}
      onOpenChange={(open: boolean) => !open && onClose()}
      title={isEdit ? 'Edit Status' : 'Create Custom Status'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isGlobal && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Internal Name {!isEdit && '*'}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
              placeholder="demo_scheduled"
              maxLength={20}
              disabled={isEdit}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
            {!isEdit && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Lowercase letters and underscores only
              </p>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Display Name *
          </label>
          <input
            type="text"
            value={formData.friendly_name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, friendly_name: e.target.value })}
            placeholder="Demo Scheduled"
            maxLength={255}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          {errors.friendly_name && (
            <p className="text-xs text-red-600 mt-1">{errors.friendly_name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Color *
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={formData.color}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, color: e.target.value })}
              className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
            />
            <input
              type="text"
              value={formData.color}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, color: e.target.value })}
              placeholder="#DBEAFE"
              maxLength={7}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          {errors.color && <p className="text-xs text-red-600 mt-1">{errors.color}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-white bg-zenible-primary rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
          >
            {submitting ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save' : 'Create')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Delete Status Modal
const DeleteStatusModal: React.FC<DeleteStatusModalProps> = ({ status, onClose, onSuccess }) => {
  const { showSuccess, showError } = useNotification() as any;
  const [deleting, setDeleting] = useState(false);
  const [contactCount, setContactCount] = useState<number | null>(null);

  const handleDelete = async () => {
    setDeleting(true);

    try {
      await (statusesAPI as any).deleteCustom(status.id);
      showSuccess('Status deleted successfully');
      onSuccess();
    } catch (error: any) {
      // Extract contact count from error message
      const match = error.message.match(/(\d+) contact\(s\)/);
      if (match) {
        setContactCount(parseInt(match[1]));
      }
      showError(error.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ConfirmationModal
      isOpen={true}
      onClose={onClose}
      onConfirm={handleDelete}
      title="Delete Custom Status?"
      message={
        contactCount !== null ? (
          <div>
            <p className="mb-2">Cannot delete this status.</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {contactCount} contact(s) are currently using this status. Please reassign these contacts to a different status before deleting.
            </p>
          </div>
        ) : (
          <div>
            <p className="mb-2">Are you sure you want to delete "{status.friendly_name}"?</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This action cannot be undone. If contacts are using this status, you'll need to reassign them first.
            </p>
          </div>
        )
      }
      confirmText={contactCount !== null ? 'OK' : 'Delete Status'}
      cancelText="Cancel"
      confirmColor="red"
      icon={TrashIcon}
      iconColor="text-red-600"
    />
  );
};

export default CRMSettingsModal;
