// API service for Calendar Appointment endpoints

import { API_BASE_URL } from '@/config/api';

class AppointmentsAPI {
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
      console.error('Appointments API request failed:', error);
      throw error;
    }
  }

  // ========== CRUD Endpoints ==========

  // List appointments with pagination and filters
  async list(params = {}) {
    // Filter out null, undefined, and empty string values
    const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== null && value !== undefined && value !== '' && value !== 'null') {
        acc[key] = value;
      }
      return acc;
    }, {});

    const queryString = new URLSearchParams(cleanParams).toString();
    const endpoint = queryString ? `/crm/appointments/?${queryString}` : '/crm/appointments/';
    return this.request(endpoint, { method: 'GET' });
  }

  // Get single appointment by ID
  async get(appointmentId) {
    return this.request(`/crm/appointments/${appointmentId}`, { method: 'GET' });
  }

  // Create new appointment
  async create(data) {
    return this.request('/crm/appointments/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update appointment
  async update(appointmentId, data, queryParams = {}) {
    // Filter out null, undefined, and empty string values from query params
    const cleanParams = Object.entries(queryParams).reduce((acc, [key, value]) => {
      if (value !== null && value !== undefined && value !== '' && value !== 'null') {
        acc[key] = value;
      }
      return acc;
    }, {});

    const queryString = new URLSearchParams(cleanParams).toString();
    const endpoint = queryString
      ? `/crm/appointments/${appointmentId}?${queryString}`
      : `/crm/appointments/${appointmentId}`;

    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Delete appointment (soft delete)
  async delete(appointmentId, queryParams = {}) {
    // Filter out null, undefined, and empty string values from query params
    const cleanParams = Object.entries(queryParams).reduce((acc, [key, value]) => {
      if (value !== null && value !== undefined && value !== '' && value !== 'null') {
        acc[key] = value;
      }
      return acc;
    }, {});

    const queryString = new URLSearchParams(cleanParams).toString();
    const endpoint = queryString
      ? `/crm/appointments/${appointmentId}?${queryString}`
      : `/crm/appointments/${appointmentId}`;

    return this.request(endpoint, { method: 'DELETE' });
  }

  // ========== Google Calendar Integration ==========

  // Get Google Calendar connection status (returns multi-account info)
  async getGoogleStatus() {
    return this.request('/crm/appointments/google/status', { method: 'GET' });
  }

  // Initiate Google OAuth flow
  async initiateGoogleOAuth(setAsPrimary = false) {
    const params = setAsPrimary ? '?set_as_primary=true' : '';
    return this.request(`/crm/appointments/google/auth/initiate${params}`, { method: 'GET' });
  }

  // Handle Google OAuth callback
  async handleGoogleCallback(code, state) {
    const queryString = new URLSearchParams({ code, state }).toString();
    return this.request(`/crm/appointments/google/auth/callback?${queryString}`, {
      method: 'POST',
    });
  }

  // Disconnect Google Calendar (legacy - disconnects primary)
  async disconnectGoogle() {
    return this.request('/crm/appointments/google/disconnect', { method: 'POST' });
  }

  // Manual sync with Google Calendar (legacy - syncs primary)
  async syncGoogleCalendar() {
    return this.request('/crm/appointments/google/sync', { method: 'POST' });
  }

  // ========== Multi-Account Management ==========

  // Set a Google account as primary
  async setAccountPrimary(accountId) {
    return this.request(`/crm/appointments/google/accounts/${accountId}/set-primary`, {
      method: 'POST',
    });
  }

  // Disconnect a specific Google account
  async disconnectAccount(accountId) {
    return this.request(`/crm/appointments/google/accounts/${accountId}`, {
      method: 'DELETE',
    });
  }

  // Update Google account (e.g., rename)
  async updateAccount(accountId, data) {
    return this.request(`/crm/appointments/google/accounts/${accountId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Sync a specific Google account
  async syncAccount(accountId) {
    return this.request(`/crm/appointments/google/accounts/${accountId}/sync`, {
      method: 'POST',
    });
  }

  // ========== Calendar View ==========

  // Get appointments for calendar display (optimized, includes contact info)
  async getCalendarAppointments(startDate, endDate, filters = {}) {
    const params = {
      start_date: startDate,
      end_date: endDate,
      ...filters,
    };

    // Filter out null, undefined, and empty string values
    const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== null && value !== undefined && value !== '' && value !== 'null') {
        acc[key] = value;
      }
      return acc;
    }, {});

    const queryString = new URLSearchParams(cleanParams).toString();
    return this.request(`/crm/appointments/calendar?${queryString}`, { method: 'GET' });
  }
}

export default new AppointmentsAPI();
