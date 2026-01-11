// API service for Contact Status endpoints

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://demo-api.zenible.com/api/v1';

class ContactStatusesAPI {
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * Get all available statuses (global + custom)
   */
  async getAvailableStatuses() {
    return this.request('/crm/contact-statuses/available');
  }

  /**
   * Create a custom status
   */
  async createCustomStatus(statusData) {
    return this.request('/crm/contact-statuses/custom', {
      method: 'POST',
      body: JSON.stringify(statusData),
    });
  }

  /**
   * Update a custom status (including renaming)
   */
  async updateCustomStatus(statusId, statusData) {
    return this.request(`/crm/contact-statuses/custom/${statusId}`, {
      method: 'PATCH',
      body: JSON.stringify(statusData),
    });
  }

  /**
   * Delete a custom status
   */
  async deleteCustomStatus(statusId) {
    return this.request(`/crm/contact-statuses/custom/${statusId}`, {
      method: 'DELETE',
    });
  }
}

export default new ContactStatusesAPI();
