/**
 * Admin Platforms API Service
 * Handles platform management and character-platform configurations
 */

import { createRequest } from '../httpClient';

const request = createRequest('AdminPlatformsAPI');

const adminPlatformsAPI = {
  // Platform management endpoints
  async getAllPlatforms(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/platforms/?${queryString}` : '/platforms/';
    return request(endpoint, { method: 'GET' });
  },

  async createPlatform(data: unknown): Promise<unknown> {
    return request('/platforms/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updatePlatform(platformId: string, data: unknown): Promise<unknown> {
    return request(`/platforms/${platformId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deletePlatform(platformId: string): Promise<unknown> {
    return request(`/platforms/${platformId}`, {
      method: 'DELETE',
    });
  },

  // Character-Platform configuration endpoints
  async getCharacterPlatforms(characterId: string): Promise<unknown> {
    return request(`/ai/characters/${characterId}/platforms`, {
      method: 'GET',
    });
  },

  async addCharacterPlatform(characterId: string, data: unknown): Promise<unknown> {
    return request(`/ai/characters/${characterId}/platforms`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateCharacterPlatform(characterId: string, platformId: string, data: unknown): Promise<unknown> {
    return request(`/ai/characters/${characterId}/platforms/${platformId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteCharacterPlatform(characterId: string, platformId: string): Promise<unknown> {
    return request(`/ai/characters/${characterId}/platforms/${platformId}`, {
      method: 'DELETE',
    });
  },
};

export default adminPlatformsAPI;
