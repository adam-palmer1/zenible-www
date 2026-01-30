// API service for Events, Hosts, and Event Tags management
import { API_BASE_URL } from '@/config/api';

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };

  const accessToken = localStorage.getItem('access_token');
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  return headers;
};

class EventsAPI {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
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
        const error = new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
        error.response = errorData;
        throw error;
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        return null;
      }

      // Handle empty responses
      const text = await response.text();
      if (!text) {
        return null;
      }

      return JSON.parse(text);
    } catch (error) {
      console.error('Events API request failed:', error);
      throw error;
    }
  }

  // ==========================================
  // PUBLIC USER ENDPOINTS
  // ==========================================

  async listEvents(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/events/?${queryString}` : '/events/';
    return this.request(endpoint, { method: 'GET' });
  }

  async getEvent(eventId) {
    return this.request(`/events/${eventId}`, { method: 'GET' });
  }

  async registerForEvent(eventId) {
    return this.request(`/events/${eventId}/register`, { method: 'POST' });
  }

  async unregisterFromEvent(eventId) {
    return this.request(`/events/${eventId}/register`, { method: 'DELETE' });
  }

  async getMyRegistrations(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/events/my-registrations?${queryString}` : '/events/my-registrations';
    return this.request(endpoint, { method: 'GET' });
  }

  async listHosts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/events/hosts?${queryString}` : '/events/hosts';
    return this.request(endpoint, { method: 'GET' });
  }

  async listTags() {
    return this.request('/events/tags', { method: 'GET' });
  }

  // ==========================================
  // ADMIN: EVENTS MANAGEMENT
  // ==========================================

  /**
   * List events with filtering and pagination (Admin)
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (≥1)
   * @param {number} params.per_page - Items per page (1-100)
   * @param {boolean} params.is_active - Filter by active status
   * @param {string} params.search - Search in title and description
   * @param {string} params.host_id - Filter by specific host UUID
   * @param {string} params.required_plan_id - Filter by subscription plan UUID
   * @param {string} params.tags - Comma-separated tags filter
   * @returns {Promise<Object>} Paginated events list with hosts and registration counts
   */
  async getAdminEvents(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/admin/events/?${queryString}` : '/admin/events/';
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * Get event details by ID (Admin)
   * @param {string} eventId - Event UUID
   * @returns {Promise<Object>} Event details with hosts and registration info
   */
  async getAdminEvent(eventId) {
    return this.request(`/admin/events/${eventId}`, { method: 'GET' });
  }

  /**
   * Create a new event (Admin)
   * @param {Object} data - Event data
   * @param {string} data.title - Event title (required)
   * @param {string} data.description - Event description (required)
   * @param {string} data.rating - Event rating (e.g., "4.9")
   * @param {string} data.start_datetime - ISO datetime string (required)
   * @param {number} data.duration_minutes - Duration in minutes (required)
   * @param {number} data.guest_limit - Maximum number of guests (required)
   * @param {Array<string>} data.tags - Array of tag strings
   * @param {string} data.required_plan_id - Plan UUID (optional)
   * @param {string} data.replay_url - Replay URL (optional)
   * @param {string} data.past_summary - Summary text (optional)
   * @param {boolean} data.is_active - Active status (default: true)
   * @param {Array<string>} data.host_ids - Array of host UUIDs
   * @returns {Promise<Object>} Created event
   */
  async createEvent(data) {
    return this.request('/admin/events/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update an existing event (Admin)
   * @param {string} eventId - Event UUID
   * @param {Object} data - Updated event data (all fields optional)
   * @returns {Promise<Object>} Updated event with hosts
   */
  async updateEvent(eventId, data) {
    return this.request(`/admin/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete an event (Admin)
   * @param {string} eventId - Event UUID
   * @returns {Promise<Object>} Deletion confirmation message
   */
  async deleteEvent(eventId) {
    return this.request(`/admin/events/${eventId}`, { method: 'DELETE' });
  }

  /**
   * Bulk actions on multiple events (Admin)
   * @param {Object} data - Bulk action data
   * @param {Array<string>} data.event_ids - Array of event UUIDs
   * @param {string} data.action - Action: "activate", "deactivate", or "delete"
   * @returns {Promise<Object>} Action result message
   */
  async bulkActionEvents(data) {
    return this.request('/admin/events/bulk-action', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get event analytics overview (Admin)
   * @param {Object} params - Query parameters
   * @param {number} params.days - Number of days to analyze (1-365, default: 30)
   * @returns {Promise<Object>} Analytics data with event stats
   */
  async getEventAnalytics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/admin/events/analytics/overview?${queryString}`
      : '/admin/events/analytics/overview';
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * Get registrations for a specific event (Admin)
   * @param {string} eventId - Event UUID
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.per_page - Items per page (default: 50, max: 100)
   * @returns {Promise<Object>} Paginated registrations list
   */
  async getEventRegistrations(eventId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/admin/events/${eventId}/registrations?${queryString}`
      : `/admin/events/${eventId}/registrations`;
    return this.request(endpoint, { method: 'GET' });
  }

  // ==========================================
  // ADMIN: HOSTS MANAGEMENT
  // ==========================================

  /**
   * List hosts with filtering and pagination (Admin)
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (≥1)
   * @param {number} params.per_page - Items per page (1-100)
   * @param {boolean} params.is_active - Filter by active status
   * @param {string} params.search - Search in name and byline
   * @returns {Promise<Object>} Paginated hosts list
   */
  async getAdminHosts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/admin/hosts/?${queryString}` : '/admin/hosts/';
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * Get host details by ID (Admin)
   * @param {string} hostId - Host UUID
   * @returns {Promise<Object>} Host details
   */
  async getAdminHost(hostId) {
    return this.request(`/admin/hosts/${hostId}`, { method: 'GET' });
  }

  /**
   * Create a new host (Admin)
   * @param {Object} data - Host data
   * @param {string} data.name - Host name (required)
   * @param {string} data.byline - Host byline/description (required)
   * @param {string} data.image_url - Image URL (optional)
   * @param {boolean} data.is_active - Active status (default: true)
   * @returns {Promise<Object>} Created host
   */
  async createHost(data) {
    return this.request('/admin/hosts/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update an existing host (Admin)
   * @param {string} hostId - Host UUID
   * @param {Object} data - Updated host data (all fields optional)
   * @returns {Promise<Object>} Updated host
   */
  async updateHost(hostId, data) {
    return this.request(`/admin/hosts/${hostId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a host (Admin)
   * @param {string} hostId - Host UUID
   * @returns {Promise<Object>} Deletion confirmation message
   */
  async deleteHost(hostId) {
    return this.request(`/admin/hosts/${hostId}`, { method: 'DELETE' });
  }

  /**
   * Upload image for a host (Admin)
   * @param {string} hostId - Host UUID
   * @param {File} file - Image file (JPEG, PNG, GIF, WebP, max 10MB)
   * @returns {Promise<Object>} Upload result with image_url
   */
  async uploadHostImage(hostId, file) {
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

  /**
   * Delete host image (Admin)
   * @param {string} hostId - Host UUID
   * @returns {Promise<Object>} Deletion confirmation message
   */
  async deleteHostImage(hostId) {
    return this.request(`/admin/hosts/${hostId}/image`, { method: 'DELETE' });
  }

  /**
   * Get events for a specific host (Admin)
   * @param {string} hostId - Host UUID
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.per_page - Items per page (default: 20, max: 100)
   * @returns {Promise<Object>} Paginated events list for the host
   */
  async getHostEvents(hostId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/admin/hosts/${hostId}/events?${queryString}`
      : `/admin/hosts/${hostId}/events`;
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * Get host analytics overview (Admin)
   * @returns {Promise<Object>} Host statistics including event counts
   */
  async getHostAnalytics() {
    return this.request('/admin/hosts/analytics/overview', { method: 'GET' });
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  /**
   * Extract unique tags from events
   * @param {Array} events - Array of event objects
   * @returns {Array<string>} Sorted unique tags
   */
  extractUniqueTags(events) {
    const tagsSet = new Set();
    events.forEach(event => {
      if (event.tags && Array.isArray(event.tags)) {
        event.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet).sort();
  }

  /**
   * Format datetime for display in local timezone
   * @param {string} isoDateTime - ISO datetime string
   * @returns {string} Formatted local datetime
   */
  formatLocalDateTime(isoDateTime) {
    if (!isoDateTime) return '-';
    return new Date(isoDateTime).toLocaleString();
  }

  /**
   * Format date for display
   * @param {string} isoDateTime - ISO datetime string
   * @returns {string} Formatted local date
   */
  formatLocalDate(isoDateTime) {
    if (!isoDateTime) return '-';
    return new Date(isoDateTime).toLocaleDateString();
  }

  /**
   * Convert local datetime-local input to ISO string
   * @param {string} localDateTime - Local datetime string from input
   * @returns {string} ISO datetime string
   */
  toISODateTime(localDateTime) {
    return new Date(localDateTime).toISOString();
  }

  /**
   * Convert ISO datetime to datetime-local input format
   * @param {string} isoDateTime - ISO datetime string
   * @returns {string} Local datetime for datetime-local input
   */
  toLocalInputDateTime(isoDateTime) {
    if (!isoDateTime) return '';
    const date = new Date(isoDateTime);
    // Format: YYYY-MM-DDTHH:mm
    return date.toISOString().slice(0, 16);
  }
}

export default new EventsAPI();
