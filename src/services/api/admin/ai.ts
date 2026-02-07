/**
 * Admin AI API Service
 * Handles AI characters, categories, OpenAI models, tools, and shortcodes
 */

import { API_BASE_URL } from '@/config/api';
import { createRequest } from '../httpClient';

const request = createRequest('AdminAI_API');

const adminAI_API = {
  // AI Character management endpoints
  async getAICharacters(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/ai/characters/?${queryString}` : '/ai/characters/';
    return request(endpoint, { method: 'GET' });
  },

  async getAICharacter(characterId: string): Promise<unknown> {
    return request(`/ai/characters/${characterId}`, { method: 'GET' });
  },

  async createAICharacter(data: unknown): Promise<unknown> {
    return request('/ai/characters/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateAICharacter(characterId: string, data: unknown): Promise<unknown> {
    return request(`/ai/characters/${characterId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteAICharacter(characterId: string): Promise<unknown> {
    return request(`/ai/characters/${characterId}`, { method: 'DELETE' });
  },

  // Upload avatar for AI character
  async uploadAICharacterAvatar(characterId: string, file: File): Promise<unknown> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${API_BASE_URL}/ai/characters/${characterId}/avatar`;
    const token = localStorage.getItem('access_token');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type for FormData, browser will set it with boundary
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Avatar upload failed' }));
      throw new Error(error.detail || `Avatar upload failed with status ${response.status}`);
    }

    return await response.json();
  },

  // Delete avatar for AI character
  async deleteAICharacterAvatar(characterId: string): Promise<unknown> {
    const url = `${API_BASE_URL}/ai/characters/${characterId}/avatar`;
    const token = localStorage.getItem('access_token');

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok && response.status !== 204) {
      const error = await response.json().catch(() => ({ detail: 'Avatar deletion failed' }));
      throw new Error(error.detail || `Avatar deletion failed with status ${response.status}`);
    }

    return response.status === 204 ? { success: true } : await response.json();
  },

  // AI Character Category endpoints
  async getAICharacterCategories(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/ai/characters/categories/?${queryString}` : '/ai/characters/categories/';
    return request(endpoint, { method: 'GET' });
  },

  async getAICharacterCategory(categoryId: string): Promise<unknown> {
    return request(`/ai/characters/categories/${categoryId}`, { method: 'GET' });
  },

  async createAICharacterCategory(data: unknown): Promise<unknown> {
    return request('/ai/characters/categories/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateAICharacterCategory(categoryId: string, data: unknown): Promise<unknown> {
    return request(`/ai/characters/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteAICharacterCategory(categoryId: string): Promise<unknown> {
    return request(`/ai/characters/categories/${categoryId}`, { method: 'DELETE' });
  },

  // Sync AI Character with OpenAI Assistant
  async syncAICharacterWithAssistant(characterId: string, force: boolean = false): Promise<unknown> {
    return request(`/ai/characters/${characterId}/sync`, {
      method: 'POST',
      body: JSON.stringify({ force }),
    });
  },

  // OpenAI Model Management endpoints
  async syncOpenAIModels(options: { force?: boolean; update_pricing?: boolean; deactivate_missing?: boolean } = {}): Promise<unknown> {
    return request('/admin/openai/models/sync', {
      method: 'POST',
      body: JSON.stringify({
        force: options.force || false,
        update_pricing: options.update_pricing !== false, // Default true
        deactivate_missing: options.deactivate_missing || false,
      }),
    });
  },

  async getOpenAIModels(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/admin/openai/models?${queryString}` : '/admin/openai/models';
    return request(endpoint, { method: 'GET' });
  },

  async updateOpenAIModel(modelId: string, data: unknown): Promise<unknown> {
    return request(`/admin/openai/models/${modelId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getOpenAITools(): Promise<unknown> {
    return request('/admin/openai/tools', { method: 'GET' });
  },

  async getAICharacterShortcodes(): Promise<unknown> {
    return request('/ai/characters/shortcodes', { method: 'GET' });
  },
};

export default adminAI_API;
