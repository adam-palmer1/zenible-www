/**
 * Admin Dashboard API Service
 * Handles dashboard stats, revenue, and user analytics
 */

import { createRequest } from '../httpClient';

const request = createRequest('AdminDashboardAPI');

const adminDashboardAPI = {
  async getDashboardStats(): Promise<unknown> {
    return request('/admin/dashboard/stats', { method: 'GET' });
  },

  async getDashboardRevenue(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/admin/dashboard/revenue?${queryString}` : '/admin/dashboard/revenue';
    return request(endpoint, { method: 'GET' });
  },

  async getDashboardUsers(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/admin/dashboard/users?${queryString}` : '/admin/dashboard/users';
    return request(endpoint, { method: 'GET' });
  },
};

export default adminDashboardAPI;
