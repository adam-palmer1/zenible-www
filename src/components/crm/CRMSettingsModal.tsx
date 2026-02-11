import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Modal from '../ui/modal/Modal';
import Dropdown from '../ui/dropdown/Dropdown';
import statusesAPI from '../../services/api/crm/statuses';
import { useNotification } from '../../contexts/NotificationContext';
import { useModalState } from '../../hooks/useModalState';
import type { SimpleStatusResponse, AvailableStatuses, StatusRolesResponse } from '../../types/crm';

interface StatusData extends SimpleStatusResponse {
  isGlobal?: boolean;
}

interface CRMSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface StatusRowProps {
  status: SimpleStatusResponse;
  isSystem: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  role?: string | null;
  onRoleChange?: (role: string | null) => void;
}

interface StatusFormModalProps {
  status: StatusData | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface DeleteStatusModalProps {
  status: SimpleStatusResponse;
  onClose: () => void;
  onSuccess: () => void;
}

const ROLE_OPTIONS = [
  { value: null, label: 'None' },
  { value: 'lead', label: 'Lead' },
  { value: 'call_booked', label: 'Call Booked' },
  { value: 'lost', label: 'Lost' },
  { value: 'won', label: 'Won' },
] as const;

const ROLE_FIELD_MAP: Record<string, keyof StatusRolesResponse> = {
  lead: 'lead_status_id',
  call_booked: 'call_booked_status_id',
  lost: 'lost_status_id',
  won: 'won_status_id',
};

/** Given a status ID and the current roles, return the role name assigned to it (or null) */
function getRoleForStatus(statusId: string, roles: StatusRolesResponse): string | null {
  if (roles.lead_status_id === statusId) return 'lead';
  if (roles.call_booked_status_id === statusId) return 'call_booked';
  if (roles.lost_status_id === statusId) return 'lost';
  if (roles.won_status_id === statusId) return 'won';
  return null;
}

const CRMSettingsModal: React.FC<CRMSettingsModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [globalStatuses, setGlobalStatuses] = useState<SimpleStatusResponse[]>([]);
  const [customStatuses, setCustomStatuses] = useState<SimpleStatusResponse[]>([]);
  const [roles, setRoles] = useState<StatusRolesResponse>({});
  const [loading, setLoading] = useState(true);
  const createModal = useModalState();
  const [editingStatus, setEditingStatus] = useState<StatusData | null>(null);
  const [deletingStatus, setDeletingStatus] = useState<SimpleStatusResponse | null>(null);
  const { showError } = useNotification();

  // Fetch statuses
  const fetchStatuses = async () => {
    try {
      setLoading(true);
      const data = await statusesAPI.getAvailable() as AvailableStatuses;
      setGlobalStatuses(data.global_statuses || []);
      setCustomStatuses(data.custom_statuses || []);
      setRoles(data.roles || {});
    } catch (error) {
      showError('Failed to load statuses');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (statusId: string, newRole: string | null) => {
    try {
      // Build update payload: clear old assignment, set new one
      const update: Record<string, string | null> = {};

      // If this status currently has a role, clear it
      const currentRole = getRoleForStatus(statusId, roles);
      if (currentRole) {
        update[ROLE_FIELD_MAP[currentRole]] = null;
      }

      // If a new role is being assigned, clear it from any other status first, then assign
      if (newRole) {
        update[ROLE_FIELD_MAP[newRole]] = statusId;
      }

      await statusesAPI.updateRoles(update);
      // Refetch to get the updated roles
      const data = await statusesAPI.getAvailable() as AvailableStatuses;
      setRoles(data.roles || {});
      if (onSuccess) onSuccess();
    } catch (error: any) {
      showError(error.message || 'Failed to update role');
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
                      {globalStatuses.map((status) => (
                        <StatusRow
                          key={status.id}
                          status={status}
                          isSystem={true}
                          onEdit={() => setEditingStatus({ ...status, isGlobal: true })}
                          role={getRoleForStatus(status.id, roles)}
                          onRoleChange={(role) => handleRoleChange(status.id, role)}
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
                        {customStatuses.map((status) => (
                          <StatusRow
                            key={status.id}
                            status={status}
                            isSystem={false}
                            onEdit={() => setEditingStatus({ ...status, isGlobal: false })}
                            onDelete={() => setDeletingStatus(status)}
                            role={getRoleForStatus(status.id, roles)}
                            onRoleChange={(role) => handleRoleChange(status.id, role)}
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

/** Label for the currently-selected role (shown on the trigger button) */
function roleTriggerLabel(role: string | null | undefined): string {
  const match = ROLE_OPTIONS.find((o) => o.value === role);
  return match && match.value ? match.label : 'No role';
}

// Status Row Component - Figma Design
const StatusRow: React.FC<StatusRowProps> = ({ status, isSystem, onEdit, onDelete, role, onRoleChange }) => {
  return (
    <div className="flex items-center justify-between py-3.5 px-4 bg-white dark:bg-gray-800">
      {/* Left: color dot + name */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className="w-5 h-5 rounded-full flex-shrink-0"
          style={{ backgroundColor: status.color }}
        />
        <div className="text-sm font-normal text-gray-900 dark:text-white truncate">
          {status.friendly_name || status.name}
        </div>
      </div>

      {/* Right: role dropdown, color code, edit/delete icons */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Role Dropdown (styled Radix) */}
        {onRoleChange && (
          <Dropdown
            align="end"
            side="bottom"
            sideOffset={4}
            className="min-w-[160px]"
            trigger={
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
              >
                {roleTriggerLabel(role)}
                <ChevronDownIcon className="w-3 h-3 opacity-50" />
              </button>
            }
          >
            <Dropdown.Label>Use as</Dropdown.Label>
            {ROLE_OPTIONS.map((opt) => (
              <Dropdown.Item
                key={opt.value ?? 'none'}
                highlighted={role === opt.value}
                onSelect={() => onRoleChange(opt.value)}
              >
                {opt.value ? opt.label : 'No role'}
              </Dropdown.Item>
            ))}
          </Dropdown>
        )}

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
  const { showSuccess, showError } = useNotification();

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
        const updateData: { friendly_name: string; color: string; name?: string } = {
          friendly_name: formData.friendly_name,
          color: formData.color,
        };

        if (!isGlobal) {
          updateData.name = formData.name;
        }

        if (isGlobal) {
          await statusesAPI.updateGlobal(status.id, updateData);
        } else {
          await statusesAPI.updateCustom(status.id, updateData);
        }
        showSuccess('Status updated successfully');
      } else {
        // Create new custom status
        await statusesAPI.createCustom(formData);
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

// Delete Status Modal - uses Radix Modal for proper focus management when stacked
const DeleteStatusModal: React.FC<DeleteStatusModalProps> = ({ status, onClose, onSuccess }) => {
  const { showSuccess, showError } = useNotification();
  const [deleting, setDeleting] = useState(false);
  const [contactCount, setContactCount] = useState<number | null>(null);

  const handleDelete = async () => {
    setDeleting(true);

    try {
      await statusesAPI.deleteCustom(status.id);
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
    <Modal
      open={true}
      onOpenChange={(open: boolean) => !open && onClose()}
      title="Delete Custom Status?"
      size="md"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <TrashIcon className="h-6 w-6 text-red-600" />
        </div>
        <div className="flex-1">
          {contactCount !== null ? (
            <div>
              <p className="mb-2 text-sm text-gray-900 dark:text-white">Cannot delete this status.</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {contactCount} contact(s) are currently using this status. Please reassign these contacts to a different status before deleting.
              </p>
            </div>
          ) : (
            <div>
              <p className="mb-2 text-sm text-gray-900 dark:text-white">Are you sure you want to delete &quot;{status.friendly_name}&quot;?</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This action cannot be undone. If contacts are using this status, you&apos;ll need to reassign them first.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
        >
          {contactCount !== null ? 'OK' : deleting ? 'Deleting...' : 'Delete Status'}
        </button>
      </div>
    </Modal>
  );
};

export default CRMSettingsModal;
