import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, ClockIcon } from '@heroicons/react/24/outline';
import callTypesAPI from '../../../../../services/api/crm/callTypes';
import { useNotification } from '../../../../../contexts/NotificationContext';
import { useDeleteConfirmation } from '../../../../../hooks/useDeleteConfirmation';
import CallTypeModal from './CallTypeModal';
import ConfirmationModal from '../../../../common/ConfirmationModal';

const CallTypesList = () => {
  const [callTypes, setCallTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCallType, setEditingCallType] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const deleteConfirm = useDeleteConfirmation<string>();

  const { showSuccess, showError } = useNotification();

  // Load call types
  useEffect(() => {
    loadCallTypes();
  }, []);

  const loadCallTypes = async () => {
    try {
      const data = await callTypesAPI.list({ include_inactive: true }) as any;
      setCallTypes(data.call_types || []);
    } catch (error) {
      showError('Failed to load call types');
      console.error('Failed to load call types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCallType(null);
    setModalOpen(true);
  };

  const handleEdit = (callType) => {
    setEditingCallType(callType);
    setModalOpen(true);
  };

  const handleDelete = (callTypeId) => {
    deleteConfirm.requestDelete(callTypeId);
  };

  const confirmDeleteCallType = async () => {
    await deleteConfirm.confirmDelete(async (callTypeId) => {
      setDeletingId(callTypeId);
      try {
        await callTypesAPI.delete(callTypeId);
        setCallTypes(callTypes.filter((ct) => ct.id !== callTypeId));
        showSuccess('Call type deleted');
      } catch (error) {
        showError('Failed to delete call type');
        console.error('Failed to delete:', error);
        throw error;
      } finally {
        setDeletingId(null);
      }
    });
  };

  const handleToggleActive = async (callType) => {
    try {
      const updated = await callTypesAPI.update(callType.id, {
        is_active: !callType.is_active,
      }) as any;
      setCallTypes(callTypes.map((ct: any) =>
        ct.id === callType.id ? updated : ct
      ));
      showSuccess(updated.is_active ? 'Call type activated' : 'Call type deactivated');
    } catch (error) {
      showError('Failed to update call type');
      console.error('Failed to update:', error);
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingCallType(null);
  };

  const handleModalSave = (savedCallType) => {
    if (editingCallType) {
      // Update existing
      setCallTypes(callTypes.map((ct) =>
        ct.id === savedCallType.id ? savedCallType : ct
      ));
    } else {
      // Add new
      setCallTypes([...callTypes, savedCallType]);
    }
    handleModalClose();
  };

  const getConferencingLabel = (type) => {
    switch (type) {
      case 'google_meet':
        return 'Google Meet';
      case 'zoom':
        return 'Zoom';
      case 'custom':
        return 'Custom Link';
      default:
        return 'No video';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading call types...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Call Types
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create different types of calls for visitors to book
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 font-medium transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Add Call Type
        </button>
      </div>

      {callTypes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No call types
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by creating your first call type.
          </p>
          <div className="mt-6">
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 font-medium transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Add Call Type
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {callTypes.map((callType) => (
            <div
              key={callType.id}
              className={`
                flex items-center justify-between p-4 bg-white dark:bg-gray-800 border rounded-lg
                ${callType.is_active
                  ? 'border-gray-200 dark:border-gray-700'
                  : 'border-gray-200 dark:border-gray-700 opacity-60'
                }
              `}
            >
              <div className="flex items-center gap-4">
                {/* Color indicator */}
                <div
                  className="w-3 h-12 rounded-full"
                  style={{ backgroundColor: callType.color || '#6b7280' }}
                />

                {/* Call type info */}
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {callType.name}
                    </h4>
                    {!callType.is_active && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <ClockIcon className="h-4 w-4" />
                      {callType.duration_minutes} min
                    </span>
                    <span>/{callType.shortcode}</span>
                    <span>{getConferencingLabel(callType.conferencing_type)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* Active toggle */}
                <button
                  type="button"
                  onClick={() => handleToggleActive(callType)}
                  className={`
                    relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
                    transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${callType.is_active ? 'bg-zenible-primary' : 'bg-gray-300 dark:bg-gray-600'}
                  `}
                  title={callType.is_active ? 'Deactivate' : 'Activate'}
                >
                  <span
                    className={`
                      pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0
                      transition duration-200 ease-in-out
                      ${callType.is_active ? 'translate-x-4' : 'translate-x-0'}
                    `}
                  />
                </button>

                {/* Edit button */}
                <button
                  onClick={() => handleEdit(callType)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="Edit"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>

                {/* Delete button */}
                <button
                  onClick={() => handleDelete(callType.id)}
                  disabled={deletingId === callType.id}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                  title="Delete"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Call Type Modal */}
      <CallTypeModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        callType={editingCallType}
      />

      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={deleteConfirm.cancelDelete}
        onConfirm={confirmDeleteCallType}
        title="Delete Call Type"
        message="Are you sure you want to delete this call type?"
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="red"
      />
    </div>
  );
};

export default CallTypesList;
