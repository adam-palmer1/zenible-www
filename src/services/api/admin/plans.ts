/**
 * Admin Plans API Service
 * Handles plan management, Stripe sync, and plan activation
 */

import { createRequest } from '../httpClient';

const request = createRequest('AdminPlansAPI');

const adminPlansAPI = {
  async getPlans(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/plans/?${queryString}` : '/plans/';
    return request(endpoint, { method: 'GET' });
  },

  async getPlan(planId: string): Promise<unknown> {
    return request(`/plans/${planId}`, { method: 'GET' });
  },

  async createPlan(data: unknown): Promise<unknown> {
    return request('/plans/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updatePlan(planId: string, data: unknown): Promise<unknown> {
    return request(`/plans/${planId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deletePlan(planId: string): Promise<unknown> {
    return request(`/plans/${planId}`, { method: 'DELETE' });
  },

  async getPlanSubscribers(planId: string, params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/plans/${planId}/subscribers?${queryString}` : `/plans/${planId}/subscribers`;
    return request(endpoint, { method: 'GET' });
  },

  async syncPlanWithStripe(planId: string, options: { sync_prices?: boolean; create_if_missing?: boolean; archive_old_prices?: boolean } = {}): Promise<unknown> {
    const defaultOptions = {
      sync_prices: true,
      create_if_missing: true,
      archive_old_prices: false
    };
    return request(`/plans/${planId}/sync-stripe`, {
      method: 'POST',
      body: JSON.stringify({ ...defaultOptions, ...options }),
    });
  },

  async activatePlan(planId: string): Promise<unknown> {
    return request(`/admin/plans/${planId}/activate`, { method: 'POST' });
  },

  async deactivatePlan(planId: string): Promise<unknown> {
    return request(`/admin/plans/${planId}/deactivate`, { method: 'POST' });
  },
};

export default adminPlansAPI;
