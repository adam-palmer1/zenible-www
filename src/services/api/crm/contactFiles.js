/**
 * Contact Files API Service
 */

import { createRequest, buildQueryString } from '../httpClient';

const request = createRequest('ContactFilesAPI');

const contactFilesAPI = {
  /**
   * List files for a contact
   * @param {string} contactId - Contact ID
   * @param {Object} params - Query parameters
   * @param {string} params.project_id - Filter by project (optional)
   * @param {boolean} params.include_download_urls - Include presigned download URLs
   * @returns {Promise<{items: Array, total: number}>}
   */
  list: (contactId, params = {}) => {
    const queryString = buildQueryString(params);
    const endpoint = queryString
      ? `/crm/contacts/${contactId}/files?${queryString}`
      : `/crm/contacts/${contactId}/files`;
    return request(endpoint, { method: 'GET' });
  },

  /**
   * Get a single file
   * @param {string} contactId - Contact ID
   * @param {string} fileId - File ID
   * @returns {Promise<Object>} File object with download URL
   */
  get: (contactId, fileId) => request(`/crm/contacts/${contactId}/files/${fileId}`, { method: 'GET' }),

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
  upload: (contactId, fileData) => request(`/crm/contacts/${contactId}/files`, {
    method: 'POST',
    body: JSON.stringify(fileData),
  }),

  /**
   * Update file metadata
   * @param {string} contactId - Contact ID
   * @param {string} fileId - File ID
   * @param {Object} updateData - Update data
   * @param {string} updateData.description - New description (optional)
   * @param {string|null} updateData.project_id - New project ID (null to remove)
   * @returns {Promise<Object>} Updated file object
   */
  update: (contactId, fileId, updateData) => request(`/crm/contacts/${contactId}/files/${fileId}`, {
    method: 'PATCH',
    body: JSON.stringify(updateData),
  }),

  /**
   * Delete a file
   * @param {string} contactId - Contact ID
   * @param {string} fileId - File ID
   * @returns {Promise<null>}
   */
  delete: (contactId, fileId) => request(`/crm/contacts/${contactId}/files/${fileId}`, { method: 'DELETE' }),

  /**
   * Helper to convert File object to upload format
   * @param {File} file - Browser File object
   * @returns {Promise<{filename: string, content_type: string, file_size: number, file_data: string}>}
   */
  fileToUploadData: (file) => new Promise((resolve, reject) => {
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
  }),
};

export default contactFilesAPI;
