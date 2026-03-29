/**
 * Admin AI Tools API Service
 * Handles AI tools management and character tool instructions
 */

import { createZbiRequest } from '../httpClient';
import logger from '../../../utils/logger';

const request = createZbiRequest('AdminAIToolsAPI');

const adminAIToolsAPI = {
  // AI Tools Management endpoints
  async getAITools(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/admin/ai-tools/?${queryString}` : '/admin/ai-tools/';
    return request(endpoint, { method: 'GET' });
  },

  async getAITool(toolId: string): Promise<unknown> {
    return request(`/admin/ai-tools/${toolId}`, { method: 'GET' });
  },

  async createAITool(data: unknown): Promise<unknown> {
    try {
      const result = await request('/admin/ai-tools/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return result;
    } catch (error) {
      logger.error('createAITool error:', error);
      throw error;
    }
  },

  async updateAITool(toolId: string, data: unknown): Promise<unknown> {
    return request(`/admin/ai-tools/${toolId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteAITool(toolId: string): Promise<unknown> {
    return request(`/admin/ai-tools/${toolId}`, { method: 'DELETE' });
  },

  // Character Tool Instructions endpoints
  async getCharacterToolInstructions(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/admin/ai-tools/character-tools/?${queryString}` : '/admin/ai-tools/character-tools/';
    return request(endpoint, { method: 'GET' });
  },

  async assignToolToCharacter(data: unknown): Promise<unknown> {
    return request('/admin/ai-tools/character-tools/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateCharacterToolInstructions(instructionsId: string, data: unknown): Promise<unknown> {
    return request(`/admin/ai-tools/character-tools/${instructionsId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async removeToolFromCharacter(instructionsId: string): Promise<unknown> {
    return request(`/admin/ai-tools/character-tools/${instructionsId}`, { method: 'DELETE' });
  },

  async getCharacterTools(characterId: string, params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/admin/ai-tools/characters/${characterId}/tools?${queryString}`
      : `/admin/ai-tools/characters/${characterId}/tools`;
    return request(endpoint, { method: 'GET' });
  },

};

export default adminAIToolsAPI;
