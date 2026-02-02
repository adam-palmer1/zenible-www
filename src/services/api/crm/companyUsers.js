// API service for Company Users & Permissions endpoints

import { API_BASE_URL } from '@/config/api';

class CompanyUsersAPI {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add auth token
    const token = localStorage.getItem('access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || `Request failed with status ${response.status}`);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('CompanyUsers API request failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // Permissions
  // ============================================================================

  /**
   * Get all available permissions
   * @returns {Promise<{permissions: Array, categories: string[]}>}
   */
  async getPermissions() {
    return this.request('/crm/company/permissions', { method: 'GET' });
  }

  /**
   * Get current user's permissions
   * @returns {Promise<{user_id: string, company_id: string, permissions: string[], is_company_admin: boolean, is_platform_admin: boolean}>}
   */
  async getMyPermissions() {
    return this.request('/crm/company/permissions/me', { method: 'GET' });
  }

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
  async getCompanyUsers(params = {}) {
    const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});

    const queryString = new URLSearchParams(cleanParams).toString();
    const endpoint = queryString ? `/crm/company/users?${queryString}` : '/crm/company/users';

    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * Get a single company user with detailed permissions
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User details with permission_details array
   */
  async getCompanyUser(userId) {
    return this.request(`/crm/company/users/${userId}`, { method: 'GET' });
  }

  /**
   * Invite a user to the company
   * @param {Object} data - Invite data
   * @param {string} data.email - User's email address
   * @param {string[]} data.permission_codes - Array of permission codes to grant
   * @param {boolean} [data.send_invite_email=true] - Whether to send invitation email
   * @returns {Promise<{user_id: string, email: string, is_new_user: boolean, permissions_granted: string[], invite_sent: boolean}>}
   */
  async inviteUser(data) {
    return this.request('/crm/company/users/invite', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Remove a user from the company
   * @param {string} userId - User ID to remove
   * @param {string} [reassignContactsTo] - User ID to reassign contacts to
   * @returns {Promise<{status: string, message: string, user_id: string, permissions_deleted: number}>}
   */
  async removeUser(userId, reassignContactsTo = null) {
    const params = reassignContactsTo ? `?reassign_contacts_to=${reassignContactsTo}` : '';
    return this.request(`/crm/company/users/${userId}${params}`, { method: 'DELETE' });
  }

  // ============================================================================
  // Permission Management
  // ============================================================================

  /**
   * Grant a single permission to a user
   * @param {string} userId - User ID
   * @param {string} permissionCode - Permission code to grant
   * @returns {Promise<{status: string, permission: string}>}
   */
  async grantPermission(userId, permissionCode) {
    return this.request(`/crm/company/users/${userId}/permissions/grant`, {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        permission_code: permissionCode,
      }),
    });
  }

  /**
   * Revoke a single permission from a user
   * @param {string} userId - User ID
   * @param {string} permissionCode - Permission code to revoke
   * @returns {Promise<{status: string, permission: string}>}
   */
  async revokePermission(userId, permissionCode) {
    return this.request(`/crm/company/users/${userId}/permissions/revoke`, {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        permission_code: permissionCode,
      }),
    });
  }

  /**
   * Bulk update user permissions (replaces all existing permissions)
   * @param {string} userId - User ID
   * @param {string[]} permissionCodes - Array of permission codes
   * @returns {Promise<{status: string, user_id: string, permissions: string[]}>}
   */
  async updateUserPermissions(userId, permissionCodes) {
    return this.request(`/crm/company/users/${userId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({
        user_id: userId,
        permission_codes: permissionCodes,
      }),
    });
  }
}

export default new CompanyUsersAPI();
