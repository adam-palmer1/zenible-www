// API service for Public Booking endpoints (unauthenticated)

import { API_BASE_URL } from '@/config/api';

class PublicBookingAPI {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
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

      return await response.json();
    } catch (error) {
      console.error('Public Booking API request failed:', error);
      throw error;
    }
  }

  // Get user's booking page (list of call types)
  async getUserPage(username) {
    return this.request(`/book/${username}`, { method: 'GET' });
  }

  // Get specific call type booking page
  async getCallTypePage(username, shortcode) {
    return this.request(`/book/${username}/${shortcode}`, { method: 'GET' });
  }

  // Get available time slots
  async getAvailableSlots(username, shortcode, startDate, endDate) {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
    });
    return this.request(`/book/${username}/${shortcode}/slots?${params}`, { method: 'GET' });
  }

  // Create a booking
  async createBooking(username, shortcode, data) {
    return this.request(`/book/${username}/${shortcode}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Lookup booking by cancel token
  async lookupBooking(cancelToken) {
    return this.request(`/book/lookup/${cancelToken}`, { method: 'GET' });
  }

  // Cancel booking
  async cancelBooking(cancelToken, reason = null) {
    return this.request(`/book/cancel/${cancelToken}`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Reschedule booking
  async rescheduleBooking(cancelToken, newStartDatetime, timezone) {
    return this.request(`/book/reschedule/${cancelToken}`, {
      method: 'POST',
      body: JSON.stringify({
        new_start_datetime: newStartDatetime,
        timezone,
      }),
    });
  }
}

export default new PublicBookingAPI();
