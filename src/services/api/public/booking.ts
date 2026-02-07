// API service for Public Booking endpoints (unauthenticated)

import { API_BASE_URL } from '@/config/api';
import logger from '../../../utils/logger';

class PublicBookingAPI {
  private async request<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // No auth token for public endpoints

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || `Request failed with status ${response.status}`);
      }

      return await response.json() as T;
    } catch (error) {
      logger.error('Public Booking API request failed:', error);
      throw error;
    }
  }

  // Get user's booking page (list of call types)
  async getUserPage<T = unknown>(username: string): Promise<T> {
    return this.request<T>(`/book/${username}`, { method: 'GET' });
  }

  // Get specific call type booking page
  async getCallTypePage<T = unknown>(username: string, shortcode: string): Promise<T> {
    return this.request<T>(`/book/${username}/${shortcode}`, { method: 'GET' });
  }

  // Get available time slots
  async getAvailableSlots<T = unknown>(username: string, shortcode: string, startDate: string, endDate: string): Promise<T> {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
    });
    return this.request<T>(`/book/${username}/${shortcode}/slots?${params}`, { method: 'GET' });
  }

  // Create a booking
  async createBooking<T = unknown>(username: string, shortcode: string, data: unknown): Promise<T> {
    return this.request<T>(`/book/${username}/${shortcode}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Lookup booking by cancel token
  async lookupBooking<T = unknown>(cancelToken: string): Promise<T> {
    return this.request<T>(`/book/lookup/${cancelToken}`, { method: 'GET' });
  }

  // Cancel booking
  async cancelBooking<T = unknown>(cancelToken: string, reason: string | null = null): Promise<T> {
    return this.request<T>(`/book/cancel/${cancelToken}`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Reschedule booking
  async rescheduleBooking<T = unknown>(cancelToken: string, newStartDatetime: string, timezone: string): Promise<T> {
    return this.request<T>(`/book/reschedule/${cancelToken}`, {
      method: 'POST',
      body: JSON.stringify({
        new_start_datetime: newStartDatetime,
        timezone,
      }),
    });
  }
}

export default new PublicBookingAPI();
