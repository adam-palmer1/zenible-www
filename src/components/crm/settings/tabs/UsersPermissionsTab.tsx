import React, { useState, useEffect, useCallback } from 'react';
import { MagnifyingGlassIcon, PlusIcon, PencilIcon, TrashIcon, ShieldCheckIcon, PlayIcon, EnvelopeIcon, ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { usePreferences } from '../../../../contexts/PreferencesContext';
import { useNotification } from '../../../../contexts/NotificationContext';
import logger from '../../../../utils/logger';
import { useAuth } from '../../../../contexts/AuthContext';
import companyUsersAPI from '../../../../services/api/crm/companyUsers';
import InviteUserModal from './users/InviteUserModal';
import EditPermissionsModal from './users/EditPermissionsModal';
import RemoveUserModal from './users/RemoveUserModal';
import { LoadingSpinner } from '../../../shared';
import type { CompanyUserSummary, PermissionResponse, CompanyInvitationResponse } from '../../../../types/common';

/** Extended user type including runtime `is_active` field from the API */
interface CompanyUser extends CompanyUserSummary {
  is_active?: boolean;
}

const CategoryLabels: Record<string, string> = {
  admin: 'Administration',
  financial: 'Financial',
  crm: 'CRM & Contacts',
};

/**
 * Format a relative time string for invitation expiry
 */
function formatExpiry(expiresAt: string): { label: string; isExpired: boolean } {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffMs = expires.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { label: 'Expired', isExpired: true };
  }

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffDays > 0) {
    return { label: `Expires in ${diffDays}d`, isExpired: false };
  }
  if (diffHours > 0) {
    return { label: `Expires in ${diffHours}h`, isExpired: false };
  }
  return { label: 'Expires soon', isExpired: false };
}

/**
 * Users & Permissions Settings Tab
 */
const UsersPermissionsTab: React.FC = () => {
  const { darkMode } = usePreferences();
  const { showSuccess, showError } = useNotification();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<CompanyInvitationResponse[]>([]);
  const [permissions, setPermissions] = useState<PermissionResponse[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CompanyUser | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersData, permsData] = await Promise.all([
        companyUsersAPI.getCompanyUsers({ include_inactive: true }) as Promise<{ users: CompanyUser[]; pending_invitations?: CompanyInvitationResponse[] }>,
        companyUsersAPI.getPermissions() as Promise<{ permissions: PermissionResponse[]; categories: string[] }>,
      ]);
      setUsers(usersData.users || []);
      setPendingInvitations(usersData.pending_invitations || []);
      setPermissions(permsData.permissions || []);
      setCategories(permsData.categories || []);
    } catch (error) {
      logger.error('Failed to load users and permissions:', error);
      showError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredUsers = users
    .filter((user: CompanyUser) => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return user.email?.toLowerCase().includes(searchLower) || user.first_name?.toLowerCase().includes(searchLower) || user.last_name?.toLowerCase().includes(searchLower) || user.full_name?.toLowerCase().includes(searchLower);
    })
    .sort((a: CompanyUser, b: CompanyUser) => {
      if (a.id === currentUser?.id) return -1;
      if (b.id === currentUser?.id) return 1;
      if (a.is_active && !b.is_active) return -1;
      if (!a.is_active && b.is_active) return 1;
      return 0;
    });

  const filteredInvitations = pendingInvitations.filter((inv) => {
    if (!search) return true;
    return inv.email.toLowerCase().includes(search.toLowerCase());
  });

  const handleEditClick = (user: CompanyUser) => { setSelectedUser(user); setShowEditModal(true); };
  const handleRemoveClick = (user: CompanyUser) => { setSelectedUser(user); setShowRemoveModal(true); };
  const handleInviteSuccess = () => { setShowInviteModal(false); showSuccess('User invited successfully'); loadData(); };
  const handleEditSuccess = () => { setShowEditModal(false); setSelectedUser(null); showSuccess('Permissions updated successfully'); loadData(); };
  const handleRemoveSuccess = () => { setShowRemoveModal(false); setSelectedUser(null); showSuccess('User removed from company'); loadData(); };

  const handleReactivateUser = async (user: CompanyUser) => {
    try {
      await companyUsersAPI.activateUser(user.id);
      showSuccess(`${user.full_name || user.email} has been reactivated`);
      loadData();
    } catch (error: unknown) {
      logger.error('Failed to reactivate user:', error);
      showError((error as Error).message || 'Failed to reactivate user. Please try again.');
    }
  };

  const handleCancelInvitation = async (invitationId: string, email: string) => {
    if (!window.confirm(`Cancel the invitation for ${email}?`)) return;
    try {
      await companyUsersAPI.cancelInvitation(invitationId);
      showSuccess(`Invitation for ${email} cancelled`);
      loadData();
    } catch (error: unknown) {
      logger.error('Failed to cancel invitation:', error);
      showError((error as Error).message || 'Failed to cancel invitation. Please try again.');
    }
  };

  const handleResendInvitation = async (invitationId: string, email: string) => {
    try {
      await companyUsersAPI.resendInvitation(invitationId);
      showSuccess(`Invitation resent to ${email}`);
      loadData();
    } catch (error: unknown) {
      logger.error('Failed to resend invitation:', error);
      showError((error as Error).message || 'Failed to resend invitation. Please try again.');
    }
  };

  const getPermissionName = (code: string) => {
    const perm = permissions.find((p: PermissionResponse) => p.code === code);
    return perm?.name || code;
  };

  const getInitials = (user: CompanyUser) => {
    if (user.first_name && user.last_name) return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    if (user.full_name) { const parts = user.full_name.split(' '); return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : parts[0][0].toUpperCase(); }
    return user.email?.[0]?.toUpperCase() || '?';
  };

  if (loading) {
    return <LoadingSpinner size="h-8 w-8" height="py-12" />;
  }

  const hasInvitations = filteredInvitations.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-400'}`} />
          <input type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className={`w-full pl-10 pr-4 py-2 border rounded-lg ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} focus:outline-none focus:ring-2 focus:ring-zenible-primary focus:border-transparent`} />
        </div>
        <button onClick={() => setShowInviteModal(true)} className="flex items-center gap-2 px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium">
          <PlusIcon className="h-5 w-5" />Invite User
        </button>
      </div>

      {/* Pending Invitations Section */}
      {hasInvitations && (
        <div className="space-y-3">
          <h3 className={`text-sm font-semibold uppercase tracking-wide ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
            Pending Invitations ({filteredInvitations.length})
          </h3>
          {filteredInvitations.map((inv) => {
            const expiry = formatExpiry(inv.expires_at);
            return (
              <div key={inv.id} className={`p-4 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${darkMode ? 'bg-zenible-dark-card text-zenible-dark-text-secondary' : 'bg-amber-50 text-amber-600'}`}>
                      <EnvelopeIcon className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>{inv.email}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${darkMode ? 'bg-amber-900/50 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>Pending</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        expiry.isExpired
                          ? (darkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700')
                          : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600')
                      }`}>{expiry.label}</span>
                    </div>
                    {inv.invited_by_name && (
                      <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Invited by {inv.invited_by_name} on {new Date(inv.created_at).toLocaleDateString()}
                      </p>
                    )}
                    {inv.permission_codes && inv.permission_codes.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {inv.permission_codes.slice(0, 4).map((code: string) => (
                          <span key={code} className={`px-2 py-0.5 rounded text-xs ${darkMode ? 'bg-zenible-dark-card text-zenible-dark-text-secondary' : 'bg-gray-200 text-gray-700'}`}>{getPermissionName(code)}</span>
                        ))}
                        {inv.permission_codes.length > 4 && <span className={`px-2 py-0.5 rounded text-xs ${darkMode ? 'bg-zenible-dark-card text-zenible-dark-text-secondary' : 'bg-gray-200 text-gray-700'}`}>+{inv.permission_codes.length - 4} more</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleResendInvitation(inv.id, inv.email)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium ${darkMode ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`} title="Resend invitation">
                      <ArrowPathIcon className="h-4 w-4" />Resend
                    </button>
                    <button onClick={() => handleCancelInvitation(inv.id, inv.email)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium ${darkMode ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-50 text-red-700 hover:bg-red-100'}`} title="Cancel invitation">
                      <XMarkIcon className="h-4 w-4" />Cancel
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Team Members Section */}
      {hasInvitations && (
        <h3 className={`text-sm font-semibold uppercase tracking-wide ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
          Team Members
        </h3>
      )}

      {filteredUsers.length === 0 && !hasInvitations ? (
        <div className={`text-center py-12 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
          {search ? <p>No users found matching &quot;{search}&quot;</p> : <p>No team members yet. Invite someone to get started.</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user: CompanyUser) => (
            <div key={user.id} className={`p-4 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.full_name || user.email} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold ${darkMode ? 'bg-zenible-dark-card text-zenible-dark-text' : 'bg-zenible-primary/10 text-zenible-primary'}`}>{getInitials(user)}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>{user.full_name || 'No name'}</h3>
                    {currentUser?.id === user.id && <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>You</span>}
                    {user.is_company_admin && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-zenible-primary text-white"><ShieldCheckIcon className="h-3 w-3" />Admin</span>}
                    {!user.is_active && <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>Inactive</span>}
                  </div>
                  <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>{user.email}</p>
                  {user.permissions && user.permissions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {user.permissions.slice(0, 4).map((code: string) => (
                        <span key={code} className={`px-2 py-0.5 rounded text-xs ${darkMode ? 'bg-zenible-dark-card text-zenible-dark-text-secondary' : 'bg-gray-200 text-gray-700'}`}>{getPermissionName(code)}</span>
                      ))}
                      {user.permissions.length > 4 && <span className={`px-2 py-0.5 rounded text-xs ${darkMode ? 'bg-zenible-dark-card text-zenible-dark-text-secondary' : 'bg-gray-200 text-gray-700'}`}>+{user.permissions.length - 4} more</span>}
                    </div>
                  )}
                </div>
                {currentUser?.id !== user.id && (
                  <div className="flex items-center gap-2">
                    {user.is_active ? (
                      <>
                        <button onClick={() => handleEditClick(user)} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-zenible-dark-card text-zenible-dark-text-secondary hover:text-zenible-dark-text' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'}`} title="Edit permissions"><PencilIcon className="h-5 w-5" /></button>
                        <button onClick={() => handleRemoveClick(user)} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-red-900/30 text-zenible-dark-text-secondary hover:text-red-400' : 'hover:bg-red-50 text-gray-500 hover:text-red-600'}`} title="Deactivate or remove user"><TrashIcon className="h-5 w-5" /></button>
                      </>
                    ) : (
                      <button onClick={() => handleReactivateUser(user)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors font-medium text-sm ${darkMode ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50' : 'bg-green-50 text-green-700 hover:bg-green-100'}`} title="Reactivate user"><PlayIcon className="h-4 w-4" />Reactivate</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showInviteModal && <InviteUserModal permissions={permissions as any[]} categories={categories as any[]} categoryLabels={CategoryLabels} onClose={() => setShowInviteModal(false)} onSuccess={handleInviteSuccess} />}
      {showEditModal && selectedUser && <EditPermissionsModal user={selectedUser} permissions={permissions as any[]} categories={categories as any[]} categoryLabels={CategoryLabels} onClose={() => { setShowEditModal(false); setSelectedUser(null); }} onSuccess={handleEditSuccess} />}
      {showRemoveModal && selectedUser && <RemoveUserModal user={selectedUser} onClose={() => { setShowRemoveModal(false); setSelectedUser(null); }} onSuccess={handleRemoveSuccess} />}
    </div>
  );
};

export default UsersPermissionsTab;
