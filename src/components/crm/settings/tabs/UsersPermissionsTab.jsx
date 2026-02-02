import React, { useState, useEffect, useCallback } from 'react';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { usePreferences } from '../../../../contexts/PreferencesContext';
import { useNotification } from '../../../../contexts/NotificationContext';
import companyUsersAPI from '../../../../services/api/crm/companyUsers';
import InviteUserModal from './users/InviteUserModal';
import EditPermissionsModal from './users/EditPermissionsModal';
import RemoveUserModal from './users/RemoveUserModal';

// Permission category labels for display
const CategoryLabels = {
  admin: 'Administration',
  financial: 'Financial',
  crm: 'CRM & Contacts',
};

/**
 * Users & Permissions Settings Tab
 * Allows company admins to manage users and their permissions
 */
const UsersPermissionsTab = () => {
  const { darkMode } = usePreferences();
  const { showSuccess, showError } = useNotification();

  // State
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersData, permsData] = await Promise.all([
        companyUsersAPI.getCompanyUsers(),
        companyUsersAPI.getPermissions(),
      ]);
      setUsers(usersData.users || []);
      setPermissions(permsData.permissions || []);
      setCategories(permsData.categories || []);
    } catch (error) {
      console.error('Failed to load users and permissions:', error);
      showError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter users by search
  const filteredUsers = users.filter((user) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower) ||
      user.full_name?.toLowerCase().includes(searchLower)
    );
  });

  // Handle edit click
  const handleEditClick = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  // Handle remove click
  const handleRemoveClick = (user) => {
    setSelectedUser(user);
    setShowRemoveModal(true);
  };

  // Handle invite success
  const handleInviteSuccess = () => {
    setShowInviteModal(false);
    showSuccess('User invited successfully');
    loadData();
  };

  // Handle edit success
  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedUser(null);
    showSuccess('Permissions updated successfully');
    loadData();
  };

  // Handle remove success
  const handleRemoveSuccess = () => {
    setShowRemoveModal(false);
    setSelectedUser(null);
    showSuccess('User removed from company');
    loadData();
  };

  // Get permission name by code
  const getPermissionName = (code) => {
    const perm = permissions.find((p) => p.code === code);
    return perm?.name || code;
  };

  // Get initials for avatar
  const getInitials = (user) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user.full_name) {
      const parts = user.full_name.split(' ');
      return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : parts[0][0].toUpperCase();
    }
    return user.email?.[0]?.toUpperCase() || '?';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zenible-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with search and invite button */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon
            className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${
              darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-400'
            }`}
          />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg ${
              darkMode
                ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text placeholder-gray-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            } focus:outline-none focus:ring-2 focus:ring-zenible-primary focus:border-transparent`}
          />
        </div>

        {/* Invite button */}
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium"
        >
          <PlusIcon className="h-5 w-5" />
          Invite User
        </button>
      </div>

      {/* User list */}
      {filteredUsers.length === 0 ? (
        <div className={`text-center py-12 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
          {search ? (
            <p>No users found matching "{search}"</p>
          ) : (
            <p>No team members yet. Invite someone to get started.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className={`p-4 rounded-lg border ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
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
                          ? 'bg-zenible-dark-card text-zenible-dark-text'
                          : 'bg-zenible-primary/10 text-zenible-primary'
                      }`}
                    >
                      {getInitials(user)}
                    </div>
                  )}
                </div>

                {/* User info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                      {user.full_name || 'No name'}
                    </h3>
                    {user.is_company_admin && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-zenible-primary text-white">
                        <ShieldCheckIcon className="h-3 w-3" />
                        Admin
                      </span>
                    )}
                    {!user.is_active && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                      }`}>
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                    {user.email}
                  </p>

                  {/* Permissions */}
                  {user.permissions && user.permissions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {user.permissions.slice(0, 4).map((code) => (
                        <span
                          key={code}
                          className={`px-2 py-0.5 rounded text-xs ${
                            darkMode
                              ? 'bg-zenible-dark-card text-zenible-dark-text-secondary'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {getPermissionName(code)}
                        </span>
                      ))}
                      {user.permissions.length > 4 && (
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          darkMode
                            ? 'bg-zenible-dark-card text-zenible-dark-text-secondary'
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          +{user.permissions.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditClick(user)}
                    className={`p-2 rounded-lg transition-colors ${
                      darkMode
                        ? 'hover:bg-zenible-dark-card text-zenible-dark-text-secondary hover:text-zenible-dark-text'
                        : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                    }`}
                    title="Edit permissions"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleRemoveClick(user)}
                    className={`p-2 rounded-lg transition-colors ${
                      darkMode
                        ? 'hover:bg-red-900/30 text-zenible-dark-text-secondary hover:text-red-400'
                        : 'hover:bg-red-50 text-gray-500 hover:text-red-600'
                    }`}
                    title="Remove user"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showInviteModal && (
        <InviteUserModal
          permissions={permissions}
          categories={categories}
          categoryLabels={CategoryLabels}
          onClose={() => setShowInviteModal(false)}
          onSuccess={handleInviteSuccess}
        />
      )}

      {showEditModal && selectedUser && (
        <EditPermissionsModal
          user={selectedUser}
          permissions={permissions}
          categories={categories}
          categoryLabels={CategoryLabels}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}

      {showRemoveModal && selectedUser && (
        <RemoveUserModal
          user={selectedUser}
          users={users}
          onClose={() => {
            setShowRemoveModal(false);
            setSelectedUser(null);
          }}
          onSuccess={handleRemoveSuccess}
        />
      )}
    </div>
  );
};

export default UsersPermissionsTab;
