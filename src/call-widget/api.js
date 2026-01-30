// Standalone API client for the booking widget
// No dependencies on app configuration

class WidgetAPI {
  constructor(baseUrl) {
    this.baseUrl = baseUrl || 'https://api.zenible.com/api/v1';
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      const err = new Error(error.detail || `Request failed with status ${response.status}`);
      err.status = response.status;
      throw err;
    }

    return response.json();
  }

  // Get call type page data (host info, call type details, settings)
  async getCallTypePage(username, shortcode) {
    return this.request(`/book/${username}/${shortcode}`);
  }

  // Get available time slots for a date range
  async getAvailableSlots(username, shortcode, startDate, endDate) {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
    });
    return this.request(`/book/${username}/${shortcode}/slots?${params}`);
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
    return this.request(`/book/lookup/${cancelToken}`);
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

export default WidgetAPI;
