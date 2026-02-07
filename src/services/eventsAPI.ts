// API service for Events, Hosts, and Event Tags management
import { API_BASE_URL } from '@/config/api';
import logger from '../utils/logger';

interface ApiError extends Error {
  response?: unknown;
}

interface EventObject {
  tags?: string[];
}

const getHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const accessToken = localStorage.getItem('access_token');
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  return headers;
};

class EventsAPI {
  private async request<T = unknown>(endpoint: string, options: RequestInit & { headers?: Record<string, string> } = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        const error: ApiError = new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
        error.response = errorData;
        throw error;
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        return null as T;
      }

      // Handle empty responses
      const text = await response.text();
      if (!text) {
        return null as T;
      }

      return JSON.parse(text) as T;
    } catch (error) {
      logger.error('Events API request failed:', error);
      throw error;
    }
  }

  // ==========================================
  // PUBLIC USER ENDPOINTS
  // ==========================================

  async listEvents(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/events/?${queryString}` : '/events/';
    return this.request(endpoint, { method: 'GET' });
  }

  async getEvent(eventId: string): Promise<unknown> {
    return this.request(`/events/${eventId}`, { method: 'GET' });
  }

  async registerForEvent(eventId: string): Promise<unknown> {
    return this.request(`/events/${eventId}/register`, { method: 'POST' });
  }

  async unregisterFromEvent(eventId: string): Promise<unknown> {
    return this.request(`/events/${eventId}/register`, { method: 'DELETE' });
  }

  async getMyRegistrations(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/events/my-registrations?${queryString}` : '/events/my-registrations';
    return this.request(endpoint, { method: 'GET' });
  }

  async listHosts(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/events/hosts?${queryString}` : '/events/hosts';
    return this.request(endpoint, { method: 'GET' });
  }

  async listTags(): Promise<unknown> {
    return this.request('/events/tags', { method: 'GET' });
  }

  // ==========================================
  // ADMIN: EVENTS MANAGEMENT
  // ==========================================

  async getAdminEvents(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/admin/events/?${queryString}` : '/admin/events/';
    return this.request(endpoint, { method: 'GET' });
  }

  async getAdminEvent(eventId: string): Promise<unknown> {
    return this.request(`/admin/events/${eventId}`, { method: 'GET' });
  }

  async createEvent(data: unknown): Promise<unknown> {
    return this.request('/admin/events/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEvent(eventId: string, data: unknown): Promise<unknown> {
    return this.request(`/admin/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEvent(eventId: string): Promise<unknown> {
    return this.request(`/admin/events/${eventId}`, { method: 'DELETE' });
  }

  async bulkActionEvents(data: unknown): Promise<unknown> {
    return this.request('/admin/events/bulk-action', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getEventAnalytics(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/admin/events/analytics/overview?${queryString}`
      : '/admin/events/analytics/overview';
    return this.request(endpoint, { method: 'GET' });
  }

  async getEventRegistrations(eventId: string, params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/admin/events/${eventId}/registrations?${queryString}`
      : `/admin/events/${eventId}/registrations`;
    return this.request(endpoint, { method: 'GET' });
  }

  // ==========================================
  // ADMIN: HOSTS MANAGEMENT
  // ==========================================

  async getAdminHosts(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/admin/hosts/?${queryString}` : '/admin/hosts/';
    return this.request(endpoint, { method: 'GET' });
  }

  async getAdminHost(hostId: string): Promise<unknown> {
    return this.request(`/admin/hosts/${hostId}`, { method: 'GET' });
  }

  async createHost(data: unknown): Promise<unknown> {
    return this.request('/admin/hosts/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateHost(hostId: string, data: unknown): Promise<unknown> {
    return this.request(`/admin/hosts/${hostId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteHost(hostId: string): Promise<unknown> {
    return this.request(`/admin/hosts/${hostId}`, { method: 'DELETE' });
  }

  async uploadHostImage(hostId: string, file: File): Promise<unknown> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${API_BASE_URL}/admin/hosts/${hostId}/upload-image`;
    const token = localStorage.getItem('access_token');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type for FormData, browser will set it with boundary
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Image upload failed' }));
      throw new Error(error.detail || `Image upload failed with status ${response.status}`);
    }

    return await response.json();
  }

  async deleteHostImage(hostId: string): Promise<unknown> {
    return this.request(`/admin/hosts/${hostId}/image`, { method: 'DELETE' });
  }

  async getHostEvents(hostId: string, params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/admin/hosts/${hostId}/events?${queryString}`
      : `/admin/hosts/${hostId}/events`;
    return this.request(endpoint, { method: 'GET' });
  }

  async getHostAnalytics(): Promise<unknown> {
    return this.request('/admin/hosts/analytics/overview', { method: 'GET' });
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  extractUniqueTags(events: EventObject[]): string[] {
    const tagsSet = new Set<string>();
    events.forEach(event => {
      if (event.tags && Array.isArray(event.tags)) {
        event.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet).sort();
  }

  formatLocalDateTime(isoDateTime: string): string {
    if (!isoDateTime) return '-';
    return new Date(isoDateTime).toLocaleString();
  }

  formatLocalDate(isoDateTime: string): string {
    if (!isoDateTime) return '-';
    return new Date(isoDateTime).toLocaleDateString();
  }

  toISODateTime(localDateTime: string): string {
    return new Date(localDateTime).toISOString();
  }

  toLocalInputDateTime(isoDateTime: string): string {
    if (!isoDateTime) return '';
    const date = new Date(isoDateTime);
    // Format: YYYY-MM-DDTHH:mm
    return date.toISOString().slice(0, 16);
  }
}

export default new EventsAPI();
