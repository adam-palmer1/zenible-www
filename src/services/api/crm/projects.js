// API service for Project endpoints

import { API_BASE_URL } from '@/config/api';

class ProjectsAPI {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
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
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Projects API request failed:', error);
      throw error;
    }
  }

  // List projects with filters
  async list(params = {}) {
    // Build query string manually to handle array parameters
    const queryParts = [];

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

    return this.request(endpoint, {
      method: 'GET',
    });
  }

  // Get single project with details
  async get(projectId) {
    return this.request(`/crm/projects/${projectId}`, {
      method: 'GET',
    });
  }

  // Create project
  async create(data) {
    return this.request('/crm/projects/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update project
  async update(projectId, data) {
    return this.request(`/crm/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Soft delete project
  async delete(projectId) {
    return this.request(`/crm/projects/${projectId}`, {
      method: 'DELETE',
    });
  }

  // Get project statistics
  async getStats() {
    return this.request('/crm/projects/stats', {
      method: 'GET',
    });
  }

  // Service assignment methods
  async listServices(projectId) {
    return this.request(`/crm/projects/${projectId}/services`, {
      method: 'GET',
    });
  }

  async assignService(projectId, data) {
    return this.request(`/crm/projects/${projectId}/services`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async unassignService(projectId, assignmentId) {
    return this.request(`/crm/projects/${projectId}/services/${assignmentId}`, {
      method: 'DELETE',
    });
  }
}

export const projectsAPI = new ProjectsAPI();
export default projectsAPI;
