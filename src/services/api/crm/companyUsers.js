/**
 * Company Users & Permissions API Service
 */

import { createRequest, buildQueryString } from '../httpClient';

const request = createRequest('CompanyUsersAPI');

const companyUsersAPI = {
  // ============================================================================
  // Permissions
  // ============================================================================

  /**
   * Get all available permissions
   * @returns {Promise<{permissions: Array, categories: string[]}>}
   */
  getPermissions: () => request('/crm/company/permissions', { method: 'GET' }),

  /**
   * Get current user's permissions
   * @returns {Promise<{user_id: string, company_id: string, permissions: string[], is_company_admin: boolean, is_platform_admin: boolean}>}
   */
  getMyPermissions: () => request('/crm/company/permissions/me', { method: 'GET' }),

  // ============================================================================
  // Company Users
  // ============================================================================

  /**
   * List all company users
   * @param {Object} params - Query parameters
   * @param {string} [params.search] - Search by name or email
   * @param {boolean} [params.include_inactive] - Include inactive users
   * @returns {Promise<{users: Array, total: number}>}
   */
  getCompanyUsers: (params = {}) => {
    const queryString = buildQueryString(params);
    const endpoint = queryString ? `/crm/company/users?${queryString}` : '/crm/company/users';
    return request(endpoint, { method: 'GET' });
  },

  /**
   * Get a single company user with detailed permissions
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User details with permission_details array
   */
  getCompanyUser: (userId) => request(`/crm/company/users/${userId}`, { method: 'GET' }),

  /**
   * Invite a user to the company
   * @param {Object} data - Invite data
   * @param {string} data.email - User's email address
   * @param {string[]} data.permission_codes - Array of permission codes to grant
   * @param {boolean} [data.send_invite_email=true] - Whether to send invitation email
   * @returns {Promise<{user_id: string, email: string, is_new_user: boolean, permissions_granted: string[], invite_sent: boolean}>}
   */
  inviteUser: (data) => request('/crm/company/users/invite', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  /**
   * Remove (soft delete) a user from the company
   * @param {string} userId - User ID to remove
   * @returns {Promise<{status: string, message: string, user_id: string}>}
   */
  removeUser: (userId) => request(`/crm/company/users/${userId}`, { method: 'DELETE' }),

  /**
   * Deactivate a user (they lose access but can be reactivated)
   * @param {string} userId - User ID to deactivate
   * @returns {Promise<{status: string, message: string, user_id: string, email: string}>}
   */
  deactivateUser: (userId) => request(`/crm/company/users/${userId}/deactivate`, { method: 'POST' }),

  /**
   * Activate a deactivated user
   * @param {string} userId - User ID to activate
   * @returns {Promise<{status: string, message: string, user_id: string, email: string}>}
   */
  activateUser: (userId) => request(`/crm/company/users/${userId}/activate`, { method: 'POST' }),

  /**
   * Restore a soft-deleted user
   * @param {string} userId - User ID to restore
   * @returns {Promise<{status: string, message: string, user_id: string}>}
   */
  restoreUser: (userId) => request(`/crm/company/users/${userId}/restore`, { method: 'POST' }),

  // ============================================================================
  // Permission Management
  // ============================================================================

  /**
   * Grant a single permission to a user
   * @param {string} userId - User ID
   * @param {string} permissionCode - Permission code to grant
   * @returns {Promise<{status: string, permission: string}>}
   */
  grantPermission: (userId, permissionCode) => request(`/crm/company/users/${userId}/permissions/grant`, {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      permission_code: permissionCode,
    }),
  }),

  /**
   * Revoke a single permission from a user
   * @param {string} userId - User ID
   * @param {string} permissionCode - Permission code to revoke
   * @returns {Promise<{status: string, permission: string}>}
   */
  revokePermission: (userId, permissionCode) => request(`/crm/company/users/${userId}/permissions/revoke`, {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      permission_code: permissionCode,
    }),
  }),

  /**
   * Bulk update user permissions (replaces all existing permissions)
   * @param {string} userId - User ID
   * @param {string[]} permissionCodes - Array of permission codes
   * @returns {Promise<{status: string, user_id: string, permissions: string[]}>}
   */
  updateUserPermissions: (userId, permissionCodes) => request(`/crm/company/users/${userId}/permissions`, {
    method: 'PUT',
    body: JSON.stringify({
      user_id: userId,
      permission_codes: permissionCodes,
    }),
  }),
};

export default companyUsersAPI;
