/**
 * Admin Users API Service
 * Handles user management, profiles, password reset, and admin-specific user actions
 */

import { createRequest } from '../httpClient';

const request = createRequest('AdminUsersAPI');

const adminUsersAPI = {
  // User management endpoints
  async getUsers(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/users/?${queryString}` : '/users/';
    return request(endpoint, { method: 'GET' });
  },

  async getUser(userId: string): Promise<unknown> {
    return request(`/users/${userId}`, { method: 'GET' });
  },

  async updateUser(userId: string, data: unknown): Promise<unknown> {
    return request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteUser(userId: string): Promise<unknown> {
    return request(`/users/${userId}`, { method: 'DELETE' });
  },

  async restoreUser(userId: string): Promise<unknown> {
    return request(`/users/${userId}/restore`, { method: 'POST' });
  },

  async updateUserRole(userId: string, role: string): Promise<unknown> {
    return request(`/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  },

  async getUserPayments(userId: string, params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/users/${userId}/payments?${queryString}` : `/users/${userId}/payments`;
    return request(endpoint, { method: 'GET' });
  },

  async getUserSubscriptions(userId: string, params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/users/${userId}/subscriptions?${queryString}` : `/users/${userId}/subscriptions`;
    return request(endpoint, { method: 'GET' });
  },

  // Admin-specific user actions
  async assignPlanToUser(userId: string, planId: string, options: { startDate?: string; endDate?: string } = {}): Promise<unknown> {
    const params = new URLSearchParams({ plan_id: planId });

    if (options.startDate) {
      params.append('start_date', options.startDate);
    }
    if (options.endDate) {
      params.append('end_date', options.endDate);
    }

    return request(`/admin/users/${userId}/assign-plan?${params.toString()}`, {
      method: 'POST',
    });
  },

  async verifyUserEmail(userId: string): Promise<unknown> {
    return request(`/admin/users/${userId}/verify-email`, { method: 'POST' });
  },

  async resetUserApiUsage(userId: string): Promise<unknown> {
    return request(`/admin/users/${userId}/reset-api-usage`, { method: 'POST' });
  },

  async permanentlyDeleteUser(userId: string, { confirm = true, dryRun = false }: { confirm?: boolean; dryRun?: boolean } = {}): Promise<unknown> {
    const params = new URLSearchParams({ confirm: confirm.toString() });
    if (dryRun) {
      params.append('dry_run', 'true');
    }
    return request(`/admin/users/${userId}/permanent?${params.toString()}`, {
      method: 'DELETE',
    });
  },

  // User Profile endpoints
  async getUserProfile(): Promise<unknown> {
    return request('/users/profile', { method: 'GET' });
  },

  async updateUserProfile(data: unknown): Promise<unknown> {
    return request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Password reset endpoints
  async forgotPassword(email: string): Promise<unknown> {
    return request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resendVerificationEmail(): Promise<unknown> {
    return request('/auth/resend-verification', { method: 'POST' });
  },

  // Audit logs endpoint
  async getAuditLogs(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/admin/audit-logs?${queryString}` : '/admin/audit-logs';
    return request(endpoint, { method: 'GET' });
  },
};

export default adminUsersAPI;
