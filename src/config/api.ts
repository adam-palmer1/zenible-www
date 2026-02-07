// API Configuration - Central source of truth
// All service files should import from here instead of defining their own API_BASE_URL
import logger from '../utils/logger';

if (!import.meta.env.VITE_API_BASE_URL) {
  throw new Error(
    'VITE_API_BASE_URL environment variable is not set. ' +
    'Please set it in your .env file (e.g., VITE_API_BASE_URL=https://api.zenible.com/api/v1)'
  );
}

export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL;

// Derive WebSocket URL from API_BASE_URL (replace http/https with ws/wss)
export const WS_URL: string = API_BASE_URL.replace(/^http/, 'ws');

// API Headers
const getHeaders = (includeAuth = true): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add API Key if available
  const apiKey = localStorage.getItem('apiKey');
  if (includeAuth && apiKey) {
    headers['X-API-Key'] = apiKey;
  }

  return headers;
};

interface RequestOptions extends RequestInit {
  includeAuth?: boolean;
}

// API Client
class ApiClient {
  baseURL: string;

  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  async request<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const { includeAuth, ...fetchOptions } = options;
    const config: RequestInit = {
      ...fetchOptions,
      headers: {
        ...getHeaders(includeAuth !== false),
        ...(fetchOptions.headers as Record<string, string>),
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('API request failed:', error);
      throw error;
    }
  }

  // GET request
  async get<T = unknown>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const queryString = new URLSearchParams(params).toString();
    const fullEndpoint = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request<T>(fullEndpoint, { method: 'GET' });
  }

  // POST request
  async post<T = unknown>(endpoint: string, data: unknown = {}): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put<T = unknown>(endpoint: string, data: unknown = {}): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete<T = unknown>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Upload file
  async upload<T = unknown>(endpoint: string, file: File, additionalData: Record<string, string> = {}): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    const headers: Record<string, string> = {};
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers: headers,
    });
  }
}

// Create default API client instance
const api = new ApiClient();

interface SSEOptions {
  top_k?: number;
  score_threshold?: number;
  include_sources?: boolean;
  temperature?: number;
  system_prompt?: string;
}

// API Endpoints based on OpenAPI spec
export const endpoints = {
  // Health
  health: '/health',
  ready: '/ready',
  database: '/database',

  // Collections
  collections: {
    list: '/collections/',
    create: '/collections/',
    get: (name: string) => `/collections/${name}`,
    update: (name: string) => `/collections/${name}`,
    delete: (name: string) => `/collections/${name}`,
    stats: '/collections/stats/overview',
    uploadAvatar: (collectionId: string) => `/collections/${collectionId}/avatar`,
    deleteAvatar: (collectionId: string) => `/collections/${collectionId}/avatar`,
  },

  // Documents
  documents: {
    listAll: '/documents',
    upload: (collectionName: string) => `/collections/${collectionName}/documents`,
    list: (collectionName: string) => `/collections/${collectionName}/documents`,
    delete: (collectionName: string, documentId: string) => `/collections/${collectionName}/documents/${documentId}`,
  },

  // Search & Q&A
  search: {
    search: '/search',
    history: '/search/history',
    ask: '/ask',
    askMultiple: '/ask-multiple',
    compareExperts: '/compare-experts',
    sseQA: '/sse/qa',  // SSE endpoint for streaming Q&A
  },

  // Analytics
  analytics: {
    dashboard: '/analytics/dashboard',
  },
};

// Helper functions for common API calls
export const apiHelpers = {
  // Collections
  async getCollections(params: Record<string, string> = {}) {
    return api.get(endpoints.collections.list, params);
  },

  async createCollection(data: unknown) {
    return api.post(endpoints.collections.create, data);
  },

  async getCollection(name: string) {
    return api.get(endpoints.collections.get(name));
  },

  async updateCollection(name: string, data: unknown) {
    return api.put(endpoints.collections.update(name), data);
  },

  async deleteCollection(name: string) {
    return api.delete(endpoints.collections.delete(name));
  },

  async getCollectionStats() {
    return api.get(endpoints.collections.stats);
  },

  async uploadCollectionAvatar(collectionId: string, file: File, cropData: unknown = null, adjustments: unknown = null) {
    const formData = new FormData();
    formData.append('file', file);

    if (cropData) {
      formData.append('crop_data', JSON.stringify(cropData));
    }

    if (adjustments) {
      formData.append('adjustments', JSON.stringify(adjustments));
    }

    const headers: Record<string, string> = {};
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    return api.request(endpoints.collections.uploadAvatar(collectionId), {
      method: 'POST',
      body: formData,
      headers: headers,
    });
  },

  async deleteCollectionAvatar(collectionId: string) {
    return api.delete(endpoints.collections.deleteAvatar(collectionId));
  },

  // Documents
  async getAllDocuments(params: Record<string, string> = {}) {
    return api.get(endpoints.documents.listAll, params);
  },

  async uploadDocument(collectionName: string, file: File) {
    return api.upload(endpoints.documents.upload(collectionName), file);
  },

  async getDocuments(collectionName: string, params: Record<string, string> = {}) {
    return api.get(endpoints.documents.list(collectionName), params);
  },

  async deleteDocument(collectionName: string, documentId: string) {
    return api.delete(endpoints.documents.delete(collectionName, documentId));
  },

  // Search & Q&A
  async search(query: string, collectionName: string, options: Record<string, unknown> = {}) {
    return api.post(endpoints.search.search, {
      query,
      collection_name: collectionName,
      ...options,
    });
  },

  async askQuestion(question: string, collectionName: string, options: Record<string, unknown> = {}) {
    return api.post(endpoints.search.ask, {
      question,
      collection_name: collectionName,
      ...options,
    });
  },

  // SSE Streaming endpoint helper
  getSSEUrl(question: string, collectionName: string, options: SSEOptions = {}): string {
    const params = new URLSearchParams({
      question,
      collection: collectionName,
      top_k: String(options.top_k || 5),
      score_threshold: String(options.score_threshold || 0.7),
      include_sources: options.include_sources !== false ? 'true' : 'false',
      ...(options.temperature && { temperature: String(options.temperature) }),
      ...(options.system_prompt && { system_prompt: options.system_prompt })
    });

    // Add auth if available
    const accessToken = localStorage.getItem('access_token');
    const apiKey = localStorage.getItem('apiKey');

    if (accessToken) {
      params.append('access_token', accessToken);
    } else if (apiKey) {
      params.append('api_key', apiKey);
    }

    return `${API_BASE_URL}${endpoints.search.sseQA}?${params}`;
  },

  async askMultipleCollections(question: string, collectionNames: string[], options: Record<string, unknown> = {}) {
    return api.post(endpoints.search.askMultiple, {
      question,
      collection_names: collectionNames,
      ...options,
    });
  },

  async compareExperts(question: string, experts: unknown[], options: Record<string, unknown> = {}) {
    return api.post(endpoints.search.compareExperts, {
      question,
      experts,
      ...options,
    });
  },

  async getSearchHistory(limit = 10) {
    return api.get(endpoints.search.history, { limit: String(limit) });
  },

  // Analytics
  async getAnalyticsDashboard() {
    return api.get(endpoints.analytics.dashboard);
  },

  // Health
  async checkHealth() {
    return api.get(endpoints.health);
  },

  async checkReady() {
    return api.get(endpoints.ready);
  },

  async checkDatabase() {
    return api.get(endpoints.database);
  },
};

export default api;
