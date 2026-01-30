// API service for Booking Settings endpoints

import { API_BASE_URL } from '@/config/api';

class BookingSettingsAPI {
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
      console.error('BookingSettings API request failed:', error);
      throw error;
    }
  }

  // Get booking settings
  async get() {
    return this.request('/crm/booking-settings', { method: 'GET' });
  }

  // Update booking settings
  async update(data) {
    return this.request('/crm/booking-settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // List availability windows
  async listAvailability(callTypeId = null) {
    const params = callTypeId ? `?call_type_id=${callTypeId}` : '';
    return this.request(`/crm/booking-settings/availability${params}`, { method: 'GET' });
  }

  // Create availability window
  async createAvailability(data) {
    return this.request('/crm/booking-settings/availability', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get single availability window
  async getAvailability(windowId) {
    return this.request(`/crm/booking-settings/availability/${windowId}`, { method: 'GET' });
  }

  // Update availability window
  async updateAvailability(windowId, data) {
    return this.request(`/crm/booking-settings/availability/${windowId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Delete availability window
  async deleteAvailability(windowId) {
    return this.request(`/crm/booking-settings/availability/${windowId}`, { method: 'DELETE' });
  }

  // Bulk update availability windows
  async bulkUpdateAvailability(data) {
    return this.request('/crm/booking-settings/availability/bulk', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // List calendar sources (legacy)
  async listCalendarSources() {
    return this.request('/crm/booking-settings/calendar-sources', { method: 'GET' });
  }

  // Add calendar source (legacy)
  async addCalendarSource(data) {
    return this.request('/crm/booking-settings/calendar-sources', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update calendar source (legacy)
  async updateCalendarSource(sourceId, data) {
    return this.request(`/crm/booking-settings/calendar-sources/${sourceId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Delete calendar source (legacy)
  async deleteCalendarSource(sourceId) {
    return this.request(`/crm/booking-settings/calendar-sources/${sourceId}`, { method: 'DELETE' });
  }

  // ========== Google Account Conflict Checking ==========

  // List connected Google accounts with conflict status
  async listGoogleAccounts() {
    return this.request('/crm/booking-settings/google-accounts', { method: 'GET' });
  }

  // Enable conflict checking for a Google account
  async enableAccountConflicts(tokenId) {
    return this.request(`/crm/booking-settings/google-accounts/${tokenId}/enable-conflicts`, {
      method: 'POST',
    });
  }

  // Disable conflict checking for a Google account
  async disableAccountConflicts(tokenId) {
    return this.request(`/crm/booking-settings/google-accounts/${tokenId}/disable-conflicts`, {
      method: 'POST',
    });
  }
}

export default new BookingSettingsAPI();
