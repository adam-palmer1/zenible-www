/**
 * Quotes API Service
 * Handles all quote-related API operations
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Base API request handler
 */
const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('access_token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 204) {
      return null;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const error = new Error(data?.detail || data?.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('[QuotesAPI] Request error:', error);
    throw error;
  }
};

/**
 * Quotes API Client
 */
class QuotesAPI {
  constructor() {
    this.baseEndpoint = '/crm/quotes';
  }

  /**
   * List quotes with filtering and pagination
   * @param {Object} params - Query parameters (contact_id, status, expired_only, skip, limit, sort_by, sort_order)
   * @returns {Promise<Object>} Paginated list of quotes
   */
  async list(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `${this.baseEndpoint}/?${queryString}` : `${this.baseEndpoint}/`;
    return request(endpoint, { method: 'GET' });
  }

  /**
   * Get a single quote by ID
   * @param {string} quoteId - Quote UUID
   * @returns {Promise<Object>} Quote details
   */
  async get(quoteId) {
    return request(`${this.baseEndpoint}/${quoteId}`, { method: 'GET' });
  }

  /**
   * Create a new quote (starts in DRAFT status)
   * @param {Object} quoteData - Quote data
   * @returns {Promise<Object>} Created quote
   */
  async create(quoteData) {
    return request(`${this.baseEndpoint}/`, {
      method: 'POST',
      body: JSON.stringify(quoteData),
    });
  }

  /**
   * Update a quote (limited fields, not for accepted quotes)
   * @param {string} quoteId - Quote UUID
   * @param {Object} quoteData - Updated quote data
   * @returns {Promise<Object>} Updated quote
   */
  async update(quoteId, quoteData) {
    return request(`${this.baseEndpoint}/${quoteId}`, {
      method: 'PATCH',
      body: JSON.stringify(quoteData),
    });
  }

  /**
   * Soft delete a quote
   * @param {string} quoteId - Quote UUID
   * @returns {Promise<void>}
   */
  async delete(quoteId) {
    return request(`${this.baseEndpoint}/${quoteId}`, { method: 'DELETE' });
  }

  /**
   * Get next available quote number for preview
   * @returns {Promise<Object>} { next_number: "QUO-0042", prefix: "QUO" }
   */
  async getNextNumber() {
    return request(`${this.baseEndpoint}/next-number`, {
      method: 'GET',
    });
  }

  /**
   * Send quote via email (DRAFT → SENT)
   * @param {string} quoteId - Quote UUID
   * @param {Object} emailData - Email options { to, cc, subject, message, attach_pdf }
   * @returns {Promise<Object>} Send result
   */
  async send(quoteId, emailData) {
    return request(`${this.baseEndpoint}/${quoteId}/send`, {
      method: 'POST',
      body: JSON.stringify(emailData),
    });
  }

  /**
   * Accept a quote
   * @param {string} quoteId - Quote UUID
   * @param {Object} acceptanceData - Optional acceptance details
   * @returns {Promise<Object>} Updated quote
   */
  async accept(quoteId, acceptanceData = {}) {
    return request(`${this.baseEndpoint}/${quoteId}/accept`, {
      method: 'POST',
      body: JSON.stringify(acceptanceData),
    });
  }

  /**
   * Reject a quote
   * @param {string} quoteId - Quote UUID
   * @param {Object} rejectionData - Rejection details { reason }
   * @returns {Promise<Object>} Updated quote
   */
  async reject(quoteId, rejectionData = {}) {
    return request(`${this.baseEndpoint}/${quoteId}/reject`, {
      method: 'POST',
      body: JSON.stringify(rejectionData),
    });
  }

  /**
   * Convert accepted quote to invoice
   * @param {string} quoteId - Quote UUID
   * @param {Object} conversionData - Conversion options { invoice_date, due_date, auto_send }
   * @returns {Promise<Object>} Created invoice
   */
  async convertToInvoice(quoteId, conversionData = {}) {
    return request(`${this.baseEndpoint}/${quoteId}/convert-to-invoice`, {
      method: 'POST',
      body: JSON.stringify(conversionData),
    });
  }

  /**
   * Create a new revision of a quote
   * @param {string} quoteId - Quote UUID
   * @param {Object} revisionData - Optional revision notes
   * @returns {Promise<Object>} New quote revision
   */
  async createRevision(quoteId, revisionData = {}) {
    return request(`${this.baseEndpoint}/${quoteId}/create-revision`, {
      method: 'POST',
      body: JSON.stringify(revisionData),
    });
  }

  /**
   * Get quote statistics overview
   * @returns {Promise<Object>} Quote stats (counts, totals by status, acceptance rate)
   */
  async getStats() {
    return request(`${this.baseEndpoint}/stats/overview`, {
      method: 'GET',
    });
  }

  /**
   * Download quote PDF
   * @param {string} quoteId - Quote UUID
   * @returns {Promise<Blob>} PDF blob
   */
  async downloadPDF(quoteId) {
    const url = `${API_BASE_URL}${this.baseEndpoint}/${quoteId}/pdf`;
    const token = localStorage.getItem('access_token');

    const response = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Failed to download PDF');
    return response.blob();
  }

  /**
   * Clone a quote
   * @param {string} quoteId - Quote UUID
   * @returns {Promise<Object>} Cloned quote
   */
  async clone(quoteId) {
    return request(`${this.baseEndpoint}/${quoteId}/clone`, { method: 'POST' });
  }

  /**
   * Get quote by public token
   * @param {string} token - Public share token
   * @returns {Promise<Object>} Quote
   */
  async getPublic(token) {
    return request(`${this.baseEndpoint}/public/${token}`, { method: 'GET' });
  }

  /**
   * Accept quote by public token
   * @param {string} token - Public share token
   * @param {Object} acceptanceData - Acceptance details
   * @returns {Promise<Object>} Updated quote
   */
  async acceptByToken(token, acceptanceData = {}) {
    return request(`${this.baseEndpoint}/public/${token}/accept`, {
      method: 'POST',
      body: JSON.stringify(acceptanceData),
    });
  }

  /**
   * Reject quote by public token
   * @param {string} token - Public share token
   * @param {Object} rejectionData - Rejection details
   * @returns {Promise<Object>} Updated quote
   */
  async rejectByToken(token, rejectionData = {}) {
    return request(`${this.baseEndpoint}/public/${token}/reject`, {
      method: 'POST',
      body: JSON.stringify(rejectionData),
    });
  }

  // ==========================================
  // Quote Templates API
  // ==========================================

  /**
   * List quote templates
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} List of quote templates
   */
  async listTemplates(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `${this.baseEndpoint}/templates?${queryString}`
      : `${this.baseEndpoint}/templates`;
    return request(endpoint, { method: 'GET' });
  }

  /**
   * Create a new quote template
   * @param {Object} templateData - Template data
   * @returns {Promise<Object>} Created template
   */
  async createTemplate(templateData) {
    return request(`${this.baseEndpoint}/templates`, {
      method: 'POST',
      body: JSON.stringify(templateData),
    });
  }

  /**
   * Update a quote template
   * @param {string} templateId - Template UUID
   * @param {Object} templateData - Updated template data
   * @returns {Promise<Object>} Updated template
   */
  async updateTemplate(templateId, templateData) {
    return request(`${this.baseEndpoint}/templates/${templateId}`, {
      method: 'PATCH',
      body: JSON.stringify(templateData),
    });
  }

  /**
   * Soft delete a quote template
   * @param {string} templateId - Template UUID
   * @returns {Promise<void>}
   */
  async deleteTemplate(templateId) {
    return request(`${this.baseEndpoint}/templates/${templateId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Create quote from template
   * @param {string} templateId - Template UUID
   * @param {Object} quoteData - Additional quote data (contact_id, etc.)
   * @returns {Promise<Object>} Created quote
   */
  async createFromTemplate(templateId, quoteData = {}) {
    return request(`${this.baseEndpoint}/templates/${templateId}/create-quote`, {
      method: 'POST',
      body: JSON.stringify(quoteData),
    });
  }
}

const quotesAPI = new QuotesAPI();
export default quotesAPI;
