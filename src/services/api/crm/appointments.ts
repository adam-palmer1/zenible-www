// API service for Calendar Appointment endpoints

import { API_BASE_URL } from '@/config/api';
import logger from '../../../utils/logger';

class AppointmentsAPI {
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
        let message: string;
        if (Array.isArray(error.detail)) {
          message = error.detail.map((e: { msg?: string }) => e.msg || '').filter(Boolean).join('. ') || `Request failed with status ${response.status}`;
        } else {
          message = (typeof error.detail === 'string' ? error.detail : error.message) || `Request failed with status ${response.status}`;
        }
        throw new Error(message);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return null as T;
      }

      return await response.json() as T;
    } catch (error) {
      logger.error('Appointments API request failed:', error);
      throw error;
    }
  }

  // ========== CRUD Endpoints ==========

  // List appointments with pagination and filters
  async list<T = unknown>(params: Record<string, string> = {}): Promise<T> {
    // Filter out null, undefined, and empty string values
    const cleanParams = Object.entries(params).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value !== null && value !== undefined && value !== '' && value !== 'null') {
        acc[key] = value;
      }
      return acc;
    }, {});

    const queryString = new URLSearchParams(cleanParams).toString();
    const endpoint = queryString ? `/crm/appointments/?${queryString}` : '/crm/appointments/';
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // Get single appointment by ID
  async get<T = unknown>(appointmentId: string): Promise<T> {
    return this.request<T>(`/crm/appointments/${appointmentId}`, { method: 'GET' });
  }

  // Create new appointment
  async create<T = unknown>(data: unknown): Promise<T> {
    return this.request<T>('/crm/appointments/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update appointment
  async update<T = unknown>(appointmentId: string, data: unknown, queryParams: Record<string, string> = {}): Promise<T> {
    // Filter out null, undefined, and empty string values from query params
    const cleanParams = Object.entries(queryParams).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value !== null && value !== undefined && value !== '' && value !== 'null') {
        acc[key] = value;
      }
      return acc;
    }, {});

    const queryString = new URLSearchParams(cleanParams).toString();
    const endpoint = queryString
      ? `/crm/appointments/${appointmentId}?${queryString}`
      : `/crm/appointments/${appointmentId}`;

    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Delete appointment (soft delete)
  async delete<T = unknown>(appointmentId: string, queryParams: Record<string, string> = {}): Promise<T> {
    // Filter out null, undefined, and empty string values from query params
    const cleanParams = Object.entries(queryParams).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value !== null && value !== undefined && value !== '' && value !== 'null') {
        acc[key] = value;
      }
      return acc;
    }, {});

    const queryString = new URLSearchParams(cleanParams).toString();
    const endpoint = queryString
      ? `/crm/appointments/${appointmentId}?${queryString}`
      : `/crm/appointments/${appointmentId}`;

    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // ========== Google Calendar Integration ==========

  // Get Google Calendar connection status (returns multi-account info)
  async getGoogleStatus<T = unknown>(): Promise<T> {
    return this.request<T>('/crm/appointments/google/status', { method: 'GET' });
  }

  // Initiate Google OAuth flow
  async initiateGoogleOAuth<T = unknown>(setAsPrimary = false): Promise<T> {
    const params = setAsPrimary ? '?set_as_primary=true' : '';
    return this.request<T>(`/crm/appointments/google/auth/initiate${params}`, { method: 'GET' });
  }

  // Handle Google OAuth callback
  async handleGoogleCallback<T = unknown>(code: string, state: string): Promise<T> {
    const queryString = new URLSearchParams({ code, state }).toString();
    return this.request<T>(`/crm/appointments/google/auth/callback?${queryString}`, {
      method: 'POST',
    });
  }

  // Disconnect Google Calendar (legacy - disconnects primary)
  async disconnectGoogle<T = unknown>(): Promise<T> {
    return this.request<T>('/crm/appointments/google/disconnect', { method: 'POST' });
  }

  // Manual sync with Google Calendar (legacy - syncs primary)
  async syncGoogleCalendar<T = unknown>(): Promise<T> {
    return this.request<T>('/crm/appointments/google/sync', { method: 'POST' });
  }

  // ========== Multi-Account Management ==========

  // Set a Google account as primary
  async setAccountPrimary<T = unknown>(accountId: string): Promise<T> {
    return this.request<T>(`/crm/appointments/google/accounts/${accountId}/set-primary`, {
      method: 'POST',
    });
  }

  // Disconnect a specific Google account
  async disconnectAccount<T = unknown>(accountId: string): Promise<T> {
    return this.request<T>(`/crm/appointments/google/accounts/${accountId}`, {
      method: 'DELETE',
    });
  }

  // Update Google account (e.g., rename)
  async updateAccount<T = unknown>(accountId: string, data: unknown): Promise<T> {
    return this.request<T>(`/crm/appointments/google/accounts/${accountId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Sync a specific Google account
  async syncAccount<T = unknown>(accountId: string): Promise<T> {
    return this.request<T>(`/crm/appointments/google/accounts/${accountId}/sync`, {
      method: 'POST',
    });
  }

  // ========== Calendar View ==========

  // Get appointments for calendar display (optimized, includes contact info)
  async getCalendarAppointments<T = unknown>(startDate: string, endDate: string, filters: Record<string, string> = {}): Promise<T> {
    const params: Record<string, string> = {
      start_date: startDate,
      end_date: endDate,
      ...filters,
    };

    // Filter out null, undefined, and empty string values
    const cleanParams = Object.entries(params).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value !== null && value !== undefined && value !== '' && value !== 'null') {
        acc[key] = value;
      }
      return acc;
    }, {});

    const queryString = new URLSearchParams(cleanParams).toString();
    return this.request<T>(`/crm/appointments/calendar?${queryString}`, { method: 'GET' });
  }
}

export default new AppointmentsAPI();
