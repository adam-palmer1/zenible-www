import React, { useState } from 'react';
import { XMarkIcon, ExclamationTriangleIcon, PauseCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useEscapeKey } from '../../../../../hooks/useEscapeKey';
import { usePreferences } from '../../../../../contexts/PreferencesContext';
import { useNotification } from '../../../../../contexts/NotificationContext';
import companyUsersAPI from '../../../../../services/api/crm/companyUsers';

/**
 * Modal for deactivating or removing a user from the company
 */
const RemoveUserModal = ({ user, onClose, onSuccess }: { user: any; onClose: () => void; onSuccess?: () => void }) => {
  const { darkMode } = usePreferences();
  const { showError } = useNotification();

  useEscapeKey(onClose);

  const [action, setAction] = useState('deactivate'); // 'deactivate' or 'delete'
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle action
  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      if (action === 'deactivate') {
        await companyUsersAPI.deactivateUser(user.id);
      } else {
        await companyUsersAPI.removeUser(user.id);
      }
      onSuccess?.();
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
      showError((error as Error).message || `Failed to ${action} user. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className={`w-full max-w-md mx-4 rounded-xl ${
          darkMode ? 'bg-zenible-dark-card' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'
          }`}
        >
          <h3
            className={`text-lg font-semibold ${
              darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'
            }`}
          >
            Remove Team Member
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              darkMode
                ? 'hover:bg-zenible-dark-bg text-zenible-dark-text-secondary'
                : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* User info */}
          <p className={`${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
            Choose an action for <strong>{user.full_name || user.email}</strong>:
          </p>

          {/* Action selection */}
          <div className="space-y-3">
            {/* Deactivate option */}
            <label
              className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                action === 'deactivate'
                  ? darkMode
                    ? 'border-yellow-500 bg-yellow-900/20'
                    : 'border-yellow-500 bg-yellow-50'
                  : darkMode
                    ? 'border-zenible-dark-border hover:bg-zenible-dark-bg'
                    : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="action"
                value="deactivate"
                checked={action === 'deactivate'}
                onChange={(e) => setAction(e.target.value)}
                className="mt-1 text-yellow-500 focus:ring-yellow-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <PauseCircleIcon className={`h-5 w-5 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                  <span className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                    Deactivate
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    darkMode ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    Recommended
                  </span>
                </div>
                <p className={`text-sm mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                  User loses access but can be reactivated later. All their data is preserved.
                </p>
              </div>
            </label>

            {/* Delete option */}
            <label
              className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                action === 'delete'
                  ? darkMode
                    ? 'border-red-500 bg-red-900/20'
                    : 'border-red-500 bg-red-50'
                  : darkMode
                    ? 'border-zenible-dark-border hover:bg-zenible-dark-bg'
                    : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="action"
                value="delete"
                checked={action === 'delete'}
                onChange={(e) => setAction(e.target.value)}
                className="mt-1 text-red-500 focus:ring-red-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <TrashIcon className={`h-5 w-5 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                  <span className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                    Delete
                  </span>
                </div>
                <p className={`text-sm mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                  Permanently remove user from the company. This action cannot be undone.
                </p>
              </div>
            </label>
          </div>

          {/* Warning for delete */}
          {action === 'delete' && (
            <div
              className={`p-4 rounded-lg border ${
                darkMode
                  ? 'bg-red-900/20 border-red-700'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex gap-3">
                <ExclamationTriangleIcon
                  className={`h-5 w-5 flex-shrink-0 ${
                    darkMode ? 'text-red-400' : 'text-red-600'
                  }`}
                />
                <p
                  className={`text-sm ${
                    darkMode ? 'text-red-300' : 'text-red-600'
                  }`}
                >
                  This will permanently remove the user and all their permissions. Consider deactivating instead if you may need to restore access later.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-4 border-t flex justify-end gap-3 ${
            darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className={`px-4 py-2 border rounded-lg font-medium transition-colors ${
              darkMode
                ? 'border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-bg'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            } disabled:opacity-50`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-4 py-2 text-white rounded-lg font-medium disabled:opacity-50 flex items-center gap-2 ${
              action === 'delete'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-yellow-600 hover:bg-yellow-700'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {action === 'delete' ? 'Deleting...' : 'Deactivating...'}
              </>
            ) : (
              action === 'delete' ? 'Delete User' : 'Deactivate User'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RemoveUserModal;
