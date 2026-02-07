// API service for AI Characters (public endpoints)
import { API_BASE_URL } from '@/config/api';
import logger from '../utils/logger';

class AICharacterAPI {
  private async request<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add auth token if available (optional for these endpoints)
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

      return await response.json() as T;
    } catch (error) {
      logger.error('AI Character API request failed:', error);
      throw error;
    }
  }

  // Get list of available AI characters
  async getCharacters(params: Record<string, string> = {}): Promise<unknown> {
    const queryParams = new URLSearchParams();

    // Add optional filters
    if (params.search) queryParams.append('search', params.search);
    if (params.category) queryParams.append('category', params.category);
    if (params.provider) queryParams.append('backend_provider', params.provider);
    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', params.per_page);

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/ai/characters/?${queryString}` : '/ai/characters/';

    return this.request(endpoint, { method: 'GET' });
  }

  // Get specific character details
  async getCharacter(characterId: string): Promise<unknown> {
    return this.request(`/ai/characters/${characterId}`, { method: 'GET' });
  }

  // Get character categories
  async getCategories(): Promise<unknown> {
    return this.request('/ai/characters/categories/', { method: 'GET' });
  }

  // Get characters suitable for proposal analysis
  async getProposalAnalysisCharacters(): Promise<unknown[]> {
    // Filter for characters that support proposal analysis
    // You might want to add specific category or tag filtering here
    const response = await this.getCharacters({
      per_page: '50' // Get more characters to find suitable ones
    }) as unknown;

    // Handle paginated response structure
    if (Array.isArray(response)) {
      return response;
    }

    const resp = response as Record<string, unknown>;

    // Check for common paginated response structures
    if (resp?.data && Array.isArray(resp.data)) {
      return resp.data;
    }
    if (resp?.items && Array.isArray(resp.items)) {
      return resp.items;
    }
    if (resp?.characters && Array.isArray(resp.characters)) {
      return resp.characters;
    }
    if (resp?.results && Array.isArray(resp.results)) {
      return resp.results;
    }

    logger.warn('Unexpected response structure from getProposalAnalysisCharacters:', response);
    return [];
  }

  // Get user's available characters (alias for getCharacters)
  async getUserCharacters(params: Record<string, string> = {}): Promise<unknown[]> {
    const response = await this.getCharacters(params) as unknown;

    // Handle paginated response structure
    if (Array.isArray(response)) {
      return response;
    }

    const resp = response as Record<string, unknown>;

    // Check for common paginated response structures
    if (resp?.data && Array.isArray(resp.data)) {
      return resp.data;
    }
    if (resp?.items && Array.isArray(resp.items)) {
      return resp.items;
    }
    if (resp?.characters && Array.isArray(resp.characters)) {
      return resp.characters;
    }
    if (resp?.results && Array.isArray(resp.results)) {
      return resp.results;
    }

    logger.warn('Unexpected response structure from getUserCharacters:', response);
    return [];
  }
}

export default new AICharacterAPI();
