import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { usePreferences } from '../../../../../contexts/PreferencesContext';
import { useNotification } from '../../../../../contexts/NotificationContext';
import companyUsersAPI from '../../../../../services/api/crm/companyUsers';

/**
 * Modal for inviting a new user to the company
 */
const InviteUserModal = ({
  permissions = [],
  categories = [],
  categoryLabels = {},
  onClose,
  onSuccess,
}) => {
  const { darkMode } = usePreferences();
  const { showError } = useNotification();

  const [email, setEmail] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [sendEmail, setSendEmail] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group permissions by category
  const permissionsByCategory = categories.reduce((acc, category) => {
    acc[category] = permissions.filter((p) => p.category === category);
    return acc;
  }, {});

  // Toggle a permission
  const togglePermission = (code) => {
    setSelectedPermissions((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code]
    );
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      showError('Please enter an email address');
      return;
    }

    setIsSubmitting(true);

    try {
      await companyUsersAPI.inviteUser({
        email: email.trim(),
        permission_codes: selectedPermissions,
        send_invite_email: sendEmail,
      });
      onSuccess?.();
    } catch (error) {
      console.error('Failed to invite user:', error);
      showError(error.message || 'Failed to invite user. Please try again.');
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
            Invite Team Member
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Email input */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
                }`}
              >
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                required
                className={`w-full px-3 py-2 border rounded-lg ${
                  darkMode
                    ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text placeholder-gray-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-zenible-primary focus:border-transparent`}
              />
            </div>

            {/* Permissions */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
                }`}
              >
                Permissions
              </label>
              <p
                className={`text-sm mb-4 ${
                  darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                }`}
              >
                Select the access levels for this user. Users with no permissions can log in but
                cannot access any features.
              </p>

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
                                  darkMode
                                    ? 'text-zenible-dark-text-secondary'
                                    : 'text-gray-500'
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

            {/* Send email checkbox */}
            <label
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer ${
                darkMode ? 'border-zenible-dark-border' : 'border-gray-200'
              }`}
            >
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="mt-0.5 h-4 w-4 text-zenible-primary border-gray-300 rounded focus:ring-zenible-primary"
              />
              <div className="flex-1 min-w-0">
                <span
                  className={`block font-medium text-sm ${
                    darkMode ? 'text-zenible-dark-text' : 'text-gray-900'
                  }`}
                >
                  Send invitation email
                </span>
                <span
                  className={`block text-xs mt-0.5 ${
                    darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                  }`}
                >
                  User will receive an email with login instructions
                </span>
              </div>
            </label>
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
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-zenible-primary text-white rounded-lg font-medium hover:bg-opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                'Send Invitation'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteUserModal;
