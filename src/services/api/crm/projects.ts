// API service for Project endpoints

import { API_BASE_URL } from '@/config/api';
import logger from '../../../utils/logger';

class ProjectsAPI {
  private async request<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add auth token
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

      // Handle 204 No Content
      if (response.status === 204) {
        return null as T;
      }

      return await response.json() as T;
    } catch (error) {
      logger.error('Projects API request failed:', error);
      throw error;
    }
  }

  // List projects with filters
  async list<T = unknown>(params: Record<string, string | string[]> = {}): Promise<T> {
    // Build query string manually to handle array parameters
    const queryParts: string[] = [];

    Object.entries(params).forEach(([key, value]) => {
      // Skip null, undefined, empty string, and 'null' string
      if (value === null || value === undefined || value === '' || value === 'null') {
        return;
      }

      // Handle array values (e.g., statuses) - repeat parameter for each value
      if (Array.isArray(value)) {
        value.forEach(item => {
          if (item !== null && item !== undefined && item !== '') {
            queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(item)}`);
          }
        });
      } else {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      }
    });

    const queryString = queryParts.join('&');
    const endpoint = queryString ? `/crm/projects/?${queryString}` : '/crm/projects/';

    return this.request<T>(endpoint, {
      method: 'GET',
    });
  }

  // Get single project with details
  async get<T = unknown>(projectId: string): Promise<T> {
    return this.request<T>(`/crm/projects/${projectId}`, {
      method: 'GET',
    });
  }

  // Create project
  async create<T = unknown>(data: unknown): Promise<T> {
    return this.request<T>('/crm/projects/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update project
  async update<T = unknown>(projectId: string, data: unknown): Promise<T> {
    return this.request<T>(`/crm/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Soft delete project
  async delete<T = unknown>(projectId: string): Promise<T> {
    return this.request<T>(`/crm/projects/${projectId}`, {
      method: 'DELETE',
    });
  }

  // Get project statistics
  async getStats<T = unknown>(): Promise<T> {
    return this.request<T>('/crm/projects/stats', {
      method: 'GET',
    });
  }

  // Service assignment methods
  async listServices<T = unknown>(projectId: string): Promise<T> {
    return this.request<T>(`/crm/projects/${projectId}/services`, {
      method: 'GET',
    });
  }

  async assignService<T = unknown>(projectId: string, data: unknown): Promise<T> {
    return this.request<T>(`/crm/projects/${projectId}/services`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async unassignService<T = unknown>(projectId: string, assignmentId: string): Promise<T> {
    return this.request<T>(`/crm/projects/${projectId}/services/${assignmentId}`, {
      method: 'DELETE',
    });
  }

  async updateServiceAssignment<T = unknown>(projectId: string, assignmentId: string, data: unknown): Promise<T> {
    return this.request<T>(`/crm/projects/${projectId}/services/${assignmentId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

export const projectsAPI = new ProjectsAPI();
export default projectsAPI;
