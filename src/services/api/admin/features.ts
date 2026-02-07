/**
 * Admin Features API Service
 * Handles display features, system features, plan feature assignments, and tool access
 */

import { createRequest } from '../httpClient';

const request = createRequest('AdminFeaturesAPI');

const adminFeaturesAPI = {
  // Display Features
  async getDisplayFeatures(): Promise<unknown> {
    return request('/admin/features/display-features', { method: 'GET' });
  },

  async getDisplayFeature(featureId: string): Promise<unknown> {
    return request(`/admin/features/display-features/${featureId}`, { method: 'GET' });
  },

  async createDisplayFeature(data: unknown): Promise<unknown> {
    return request('/admin/features/display-features', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateDisplayFeature(featureId: string, data: unknown): Promise<unknown> {
    return request(`/admin/features/display-features/${featureId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteDisplayFeature(featureId: string): Promise<unknown> {
    return request(`/admin/features/display-features/${featureId}`, { method: 'DELETE' });
  },

  // System Features
  async getSystemFeatures(): Promise<unknown> {
    return request('/admin/features/system-features', { method: 'GET' });
  },

  async getSystemFeature(featureId: string): Promise<unknown> {
    return request(`/admin/features/system-features/${featureId}`, { method: 'GET' });
  },

  async createSystemFeature(data: unknown): Promise<unknown> {
    return request('/admin/features/system-features', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateSystemFeature(featureId: string, data: unknown): Promise<unknown> {
    return request(`/admin/features/system-features/${featureId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteSystemFeature(featureId: string): Promise<unknown> {
    return request(`/admin/features/system-features/${featureId}`, { method: 'DELETE' });
  },

  // Plan Feature Assignments
  async getPlanFeatures(planId: string): Promise<unknown> {
    return request(`/admin/features/plans/${planId}/features`, { method: 'GET' });
  },

  async updatePlanDisplayFeatures(planId: string, features: unknown): Promise<unknown> {
    return request(`/admin/features/plans/${planId}/display-features`, {
      method: 'PUT',
      body: JSON.stringify({ features }),
    });
  },

  async updatePlanSystemFeatures(planId: string, features: unknown): Promise<unknown> {
    return request(`/admin/features/plans/${planId}/system-features`, {
      method: 'PUT',
      body: JSON.stringify({ features }),
    });
  },

  async updatePlanCharacterAccess(planId: string, characters: unknown): Promise<unknown> {
    return request(`/admin/features/plans/${planId}/character-access`, {
      method: 'PUT',
      body: JSON.stringify({ characters }),
    });
  },

  // Tool Access Management
  async getAvailableTools(): Promise<unknown> {
    return request('/admin/features/tools', { method: 'GET' });
  },

  async getPlanToolAccess(planId: string): Promise<unknown> {
    return request(`/admin/features/plans/${planId}/tool-access`, { method: 'GET' });
  },

  async updatePlanToolAccess(planId: string, tools: unknown): Promise<unknown> {
    return request(`/admin/features/plans/${planId}/tool-access`, {
      method: 'PUT',
      body: JSON.stringify({ tools }),
    });
  },
};

export default adminFeaturesAPI;
