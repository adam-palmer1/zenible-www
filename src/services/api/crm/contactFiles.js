// API service for Contact Files endpoints

import { API_BASE_URL } from '@/config/api';

class ContactFilesAPI {
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

        // Handle validation errors (422) with detail array
        if (Array.isArray(error.detail)) {
          const messages = error.detail.map(err => {
            const field = err.loc ? err.loc[err.loc.length - 1] : 'Field';
            return `${field}: ${err.msg}`;
          }).join('; ');
          throw new Error(messages);
        }

        throw new Error(error.detail || `Request failed with status ${response.status}`);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Contact Files API request failed:', error);
      throw error;
    }
  }

  /**
   * List files for a contact
   * @param {string} contactId - Contact ID
   * @param {Object} params - Query parameters
   * @param {string} params.project_id - Filter by project (optional)
   * @param {boolean} params.include_download_urls - Include presigned download URLs
   * @returns {Promise<{items: Array, total: number}>}
   */
  async list(contactId, params = {}) {
    const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});

    const queryString = new URLSearchParams(cleanParams).toString();
    const endpoint = queryString
      ? `/crm/contacts/${contactId}/files?${queryString}`
      : `/crm/contacts/${contactId}/files`;

    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * Get a single file
   * @param {string} contactId - Contact ID
   * @param {string} fileId - File ID
   * @returns {Promise<Object>} File object with download URL
   */
  async get(contactId, fileId) {
    return this.request(`/crm/contacts/${contactId}/files/${fileId}`, { method: 'GET' });
  }

  /**
   * Upload a file
   * @param {string} contactId - Contact ID
   * @param {Object} fileData - File data
   * @param {string} fileData.filename - Original filename
   * @param {string} fileData.content_type - MIME type
   * @param {number} fileData.file_size - Size in bytes
   * @param {string} fileData.file_data - Base64 encoded file content
   * @param {string} fileData.description - File description (optional)
   * @param {string} fileData.project_id - Project ID to associate (optional)
   * @returns {Promise<{file: Object, message: string}>}
   */
  async upload(contactId, fileData) {
    return this.request(`/crm/contacts/${contactId}/files`, {
      method: 'POST',
      body: JSON.stringify(fileData),
    });
  }

  /**
   * Update file metadata
   * @param {string} contactId - Contact ID
   * @param {string} fileId - File ID
   * @param {Object} updateData - Update data
   * @param {string} updateData.description - New description (optional)
   * @param {string|null} updateData.project_id - New project ID (null to remove)
   * @returns {Promise<Object>} Updated file object
   */
  async update(contactId, fileId, updateData) {
    return this.request(`/crm/contacts/${contactId}/files/${fileId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  }

  /**
   * Delete a file
   * @param {string} contactId - Contact ID
   * @param {string} fileId - File ID
   * @returns {Promise<null>}
   */
  async delete(contactId, fileId) {
    return this.request(`/crm/contacts/${contactId}/files/${fileId}`, { method: 'DELETE' });
  }

  /**
   * Helper to convert File object to upload format
   * @param {File} file - Browser File object
   * @returns {Promise<{filename: string, content_type: string, file_size: number, file_data: string}>}
   */
  async fileToUploadData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Remove data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = reader.result.split(',')[1];
        resolve({
          filename: file.name,
          content_type: file.type,
          file_size: file.size,
          file_data: base64,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

const contactFilesAPI = new ContactFilesAPI();
export default contactFilesAPI;
