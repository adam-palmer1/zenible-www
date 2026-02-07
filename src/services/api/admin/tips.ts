/**
 * Admin Tips API Service
 * Handles tips management, bulk operations, analytics, and engagement
 */

import { createRequest } from '../httpClient';

const request = createRequest('AdminTipsAPI');

const adminTipsAPI = {
  async getTips(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/admin/tips/?${queryString}` : '/admin/tips/';
    return request(endpoint, { method: 'GET' });
  },

  async getTip(tipId: string): Promise<unknown> {
    return request(`/admin/tips/${tipId}`, { method: 'GET' });
  },

  async createTip(data: unknown): Promise<unknown> {
    return request('/admin/tips/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateTip(tipId: string, data: unknown): Promise<unknown> {
    return request(`/admin/tips/${tipId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteTip(tipId: string): Promise<unknown> {
    return request(`/admin/tips/${tipId}`, { method: 'DELETE' });
  },

  async bulkCreateTips(tips: unknown[]): Promise<unknown> {
    return request('/admin/tips/bulk', {
      method: 'POST',
      body: JSON.stringify({ tips }),
    });
  },

  async bulkActionTips(data: unknown): Promise<unknown> {
    return request('/admin/tips/bulk-action', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getTipsAnalytics(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/admin/tips/analytics?${queryString}` : '/admin/tips/analytics';
    return request(endpoint, { method: 'GET' });
  },

  async getTipsEngagement(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/admin/tips/engagement?${queryString}` : '/admin/tips/engagement';
    return request(endpoint, { method: 'GET' });
  },
};

export default adminTipsAPI;
