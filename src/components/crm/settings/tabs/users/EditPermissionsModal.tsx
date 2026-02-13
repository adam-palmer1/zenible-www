import React, { useState } from 'react';
import { XMarkIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useEscapeKey } from '../../../../../hooks/useEscapeKey';
import { usePreferences } from '../../../../../contexts/PreferencesContext';
import { useNotification } from '../../../../../contexts/NotificationContext';
import companyUsersAPI from '../../../../../services/api/crm/companyUsers';

/**
 * Modal for editing a user's permissions
 */
interface Permission {
  code: string;
  name: string;
  description?: string | null;
  category: string;
}

interface EditPermissionsModalProps {
  user: any;
  permissions?: Permission[];
  categories?: string[];
  categoryLabels?: Record<string, string>;
  onClose: () => void;
  onSuccess?: () => void;
}

const EditPermissionsModal = ({
  user,
  permissions = [],
  categories = [],
  categoryLabels = {},
  onClose,
  onSuccess,
}: EditPermissionsModalProps) => {
  const { darkMode } = usePreferences();
  const { showError } = useNotification();

  useEscapeKey(onClose);

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(user.permissions || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group permissions by category
  const permissionsByCategory = categories.reduce<Record<string, Permission[]>>((acc, category) => {
    acc[category] = permissions.filter((p) => p.category === category);
    return acc;
  }, {});

  // Toggle a permission
  const togglePermission = (code: string) => {
    setSelectedPermissions((prev: string[]) =>
      prev.includes(code) ? prev.filter((p: string) => p !== code) : [...prev, code]
    );
  };

  // Get initials for avatar
  const getInitials = () => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user.full_name) {
      const parts = user.full_name.split(' ');
      return parts.length > 1
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : parts[0][0].toUpperCase();
    }
    return user.email?.[0]?.toUpperCase() || '?';
  };

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      await companyUsersAPI.updateUserPermissions(user.id, selectedPermissions);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to update permissions:', error);
      showError((error as Error).message || 'Failed to update permissions. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className={`w-full max-w-lg mx-4 rounded-xl max-h-[90vh] flex flex-col ${
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
            Edit Permissions
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
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* User info */}
          <div className="flex items-center gap-4">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name || user.email}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold ${
                  darkMode
                    ? 'bg-zenible-dark-bg text-zenible-dark-text'
                    : 'bg-zenible-primary/10 text-zenible-primary'
                }`}
              >
                {getInitials()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h4
                  className={`font-medium ${
                    darkMode ? 'text-zenible-dark-text' : 'text-gray-900'
                  }`}
                >
                  {user.full_name || 'No name'}
                </h4>
                {user.is_company_admin && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-zenible-primary text-white">
                    <ShieldCheckIcon className="h-3 w-3" />
                    Admin
                  </span>
                )}
              </div>
              <p
                className={`text-sm ${
                  darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                }`}
              >
                {user.email}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div
            className={`border-t ${
              darkMode ? 'border-zenible-dark-border' : 'border-gray-200'
            }`}
          ></div>

          {/* Permissions */}
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category}>
                <h4
                  className={`text-sm font-medium mb-2 ${
                    darkMode ? 'text-zenible-dark-text' : 'text-gray-900'
                  }`}
                >
                  {categoryLabels[category] || category}
                </h4>
                <div className="space-y-2">
                  {permissionsByCategory[category]?.map((permission) => (
                    <label
                      key={permission.code}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedPermissions.includes(permission.code)
                          ? darkMode
                            ? 'border-zenible-primary bg-zenible-primary/10'
                            : 'border-zenible-primary bg-zenible-primary/5'
                          : darkMode
                            ? 'border-zenible-dark-border hover:border-zenible-dark-text-secondary'
                            : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(permission.code)}
                        onChange={() => togglePermission(permission.code)}
                        className="mt-0.5 h-4 w-4 text-zenible-primary border-gray-300 rounded focus:ring-zenible-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <span
                          className={`block font-medium text-sm ${
                            darkMode ? 'text-zenible-dark-text' : 'text-gray-900'
                          }`}
                        >
                          {permission.name}
                        </span>
                        {permission.description && (
                          <span
                            className={`block text-xs mt-0.5 ${
                              darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                            }`}
                          >
                            {permission.description}
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
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
            className="px-4 py-2 bg-zenible-primary text-white rounded-lg font-medium hover:bg-opacity-90 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPermissionsModal;
