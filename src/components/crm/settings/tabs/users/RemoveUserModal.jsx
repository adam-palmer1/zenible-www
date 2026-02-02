import React, { useState } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { usePreferences } from '../../../../../contexts/PreferencesContext';
import { useNotification } from '../../../../../contexts/NotificationContext';
import companyUsersAPI from '../../../../../services/api/crm/companyUsers';

/**
 * Modal for removing a user from the company
 */
const RemoveUserModal = ({ user, users = [], onClose, onSuccess }) => {
  const { darkMode } = usePreferences();
  const { showError } = useNotification();

  const [reassignTo, setReassignTo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get other users for reassignment (exclude the user being removed)
  const otherUsers = users.filter((u) => u.id !== user.id && u.is_active);

  // Handle removal
  const handleRemove = async () => {
    setIsSubmitting(true);

    try {
      await companyUsersAPI.removeUser(user.id, reassignTo || null);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to remove user:', error);
      showError(error.message || 'Failed to remove user. Please try again.');
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
          {/* Warning */}
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
              <div>
                <p
                  className={`font-medium ${
                    darkMode ? 'text-red-400' : 'text-red-800'
                  }`}
                >
                  Are you sure you want to remove{' '}
                  <strong>{user.full_name || user.email}</strong>?
                </p>
                <p
                  className={`text-sm mt-1 ${
                    darkMode ? 'text-red-300' : 'text-red-600'
                  }`}
                >
                  They will lose access to all company data. Their user account will not be deleted.
                </p>
              </div>
            </div>
          </div>

          {/* Reassignment dropdown */}
          {otherUsers.length > 0 && (
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
                }`}
              >
                Reassign contacts to (optional)
              </label>
              <select
                value={reassignTo}
                onChange={(e) => setReassignTo(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg ${
                  darkMode
                    ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-zenible-primary focus:border-transparent`}
              >
                <option value="">Don't reassign</option>
                {otherUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name || u.email}
                  </option>
                ))}
              </select>
              <p
                className={`text-xs mt-1 ${
                  darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                }`}
              >
                Contacts created by this user will be reassigned to the selected team member.
              </p>
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
            onClick={handleRemove}
            disabled={isSubmitting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Removing...
              </>
            ) : (
              'Remove User'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RemoveUserModal;
