// API service for AI Characters (public endpoints)

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://demo-api.zenible.com/api/v1';

class AICharacterAPI {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
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

      return await response.json();
    } catch (error) {
      console.error('AI Character API request failed:', error);
      throw error;
    }
  }

  // Get list of available AI characters
  async getCharacters(params = {}) {
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
  async getCharacter(characterId) {
    return this.request(`/ai/characters/${characterId}`, { method: 'GET' });
  }

  // Get character categories
  async getCategories() {
    return this.request('/ai/characters/categories/', { method: 'GET' });
  }

  // Get characters suitable for proposal analysis
  async getProposalAnalysisCharacters() {
    // Filter for characters that support proposal analysis
    // You might want to add specific category or tag filtering here
    const response = await this.getCharacters({
      per_page: 50 // Get more characters to find suitable ones
    });

    // If response is an array, return it directly
    if (Array.isArray(response)) {
      return response;
    }

    // Otherwise check for common response structures
    if (response?.items) return response.items;
    if (response?.characters) return response.characters;
    if (response?.results) return response.results;

    return [];
  }
}

export default new AICharacterAPI();