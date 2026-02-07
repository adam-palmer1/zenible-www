/**
 * Admin Preferences API Service
 * Handles user preference management (get, set, bulk, clear)
 */

import { createRequest } from '../httpClient';

const request = createRequest('AdminPreferencesAPI');

const adminPreferencesAPI = {
  async getPreferences(category: string | null = null): Promise<unknown> {
    const params = category ? `?category=${category}` : '';
    return request(`/preferences${params}`);
  },

  async getPreferencesDict(category: string | null = null): Promise<unknown> {
    const params = category ? `?category=${category}` : '';
    return request(`/preferences/dict${params}`);
  },

  async getPreferenceCategories(): Promise<unknown> {
    return request('/preferences/categories');
  },

  async getPreference(key: string): Promise<unknown> {
    return request(`/preferences/${key}`);
  },

  async setPreference(key: string, data: unknown): Promise<unknown> {
    return request(`/preferences/${key}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deletePreference(key: string): Promise<unknown> {
    return request(`/preferences/${key}`, { method: 'DELETE' });
  },

  async bulkGetPreferences(keys: string[], category: string | null = null): Promise<unknown> {
    return request('/preferences/bulk', {
      method: 'POST',
      body: JSON.stringify({ keys, category }),
    });
  },

  async bulkSetPreferences(data: unknown): Promise<unknown> {
    return request('/preferences/bulk', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async clearPreferences(category: string | null = null): Promise<unknown> {
    const params = category ? `?category=${category}` : '';
    return request(`/preferences${params}`, { method: 'DELETE' });
  },
};

export default adminPreferencesAPI;
