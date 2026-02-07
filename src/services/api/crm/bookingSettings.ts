// API service for Booking Settings endpoints

import { API_BASE_URL } from '@/config/api';
import logger from '../../../utils/logger';

class BookingSettingsAPI {
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
      logger.error('BookingSettings API request failed:', error);
      throw error;
    }
  }

  // Get booking settings
  async get<T = unknown>(): Promise<T> {
    return this.request<T>('/crm/booking-settings', { method: 'GET' });
  }

  // Update booking settings
  async update<T = unknown>(data: unknown): Promise<T> {
    return this.request<T>('/crm/booking-settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // List availability windows
  async listAvailability<T = unknown>(callTypeId: string | null = null): Promise<T> {
    const params = callTypeId ? `?call_type_id=${callTypeId}` : '';
    return this.request<T>(`/crm/booking-settings/availability${params}`, { method: 'GET' });
  }

  // Create availability window
  async createAvailability<T = unknown>(data: unknown): Promise<T> {
    return this.request<T>('/crm/booking-settings/availability', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get single availability window
  async getAvailability<T = unknown>(windowId: string): Promise<T> {
    return this.request<T>(`/crm/booking-settings/availability/${windowId}`, { method: 'GET' });
  }

  // Update availability window
  async updateAvailability<T = unknown>(windowId: string, data: unknown): Promise<T> {
    return this.request<T>(`/crm/booking-settings/availability/${windowId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Delete availability window
  async deleteAvailability<T = unknown>(windowId: string): Promise<T> {
    return this.request<T>(`/crm/booking-settings/availability/${windowId}`, { method: 'DELETE' });
  }

  // Bulk update availability windows
  async bulkUpdateAvailability<T = unknown>(data: unknown): Promise<T> {
    return this.request<T>('/crm/booking-settings/availability/bulk', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // List calendar sources (legacy)
  async listCalendarSources<T = unknown>(): Promise<T> {
    return this.request<T>('/crm/booking-settings/calendar-sources', { method: 'GET' });
  }

  // Add calendar source (legacy)
  async addCalendarSource<T = unknown>(data: unknown): Promise<T> {
    return this.request<T>('/crm/booking-settings/calendar-sources', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update calendar source (legacy)
  async updateCalendarSource<T = unknown>(sourceId: string, data: unknown): Promise<T> {
    return this.request<T>(`/crm/booking-settings/calendar-sources/${sourceId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Delete calendar source (legacy)
  async deleteCalendarSource<T = unknown>(sourceId: string): Promise<T> {
    return this.request<T>(`/crm/booking-settings/calendar-sources/${sourceId}`, { method: 'DELETE' });
  }

  // ========== Google Account Conflict Checking ==========

  // List connected Google accounts with conflict status
  async listGoogleAccounts<T = unknown>(): Promise<T> {
    return this.request<T>('/crm/booking-settings/google-accounts', { method: 'GET' });
  }

  // Enable conflict checking for a Google account
  async enableAccountConflicts<T = unknown>(tokenId: string): Promise<T> {
    return this.request<T>(`/crm/booking-settings/google-accounts/${tokenId}/enable-conflicts`, {
      method: 'POST',
    });
  }

  // Disable conflict checking for a Google account
  async disableAccountConflicts<T = unknown>(tokenId: string): Promise<T> {
    return this.request<T>(`/crm/booking-settings/google-accounts/${tokenId}/disable-conflicts`, {
      method: 'POST',
    });
  }
}

export default new BookingSettingsAPI();
