/**
 * Upload API Service
 * Handles S3 file uploads for course module resources with support for:
 * - Single file uploads (< 100MB)
 * - Chunked multipart uploads (>= 100MB)
 * - Progress tracking
 * - Upload session management
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://demo-api.zenible.com/api/v1';

class UploadAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/admin`;
    this.chunkSize = 5 * 1024 * 1024; // 5MB chunks for multipart upload
    this.largeFileThreshold = 100 * 1024 * 1024; // 100MB threshold
  }

  /**
   * Get authorization headers
   */
  getHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Make an API request
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const defaultHeaders = this.getHeaders();

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create an upload session
   *
   * @param {number} courseId - Course ID
   * @param {number} moduleId - Module ID
   * @param {number} resourceId - Resource ID
   * @param {string} filename - Original filename
   * @param {number} fileSize - File size in bytes
   * @param {string} resourceType - Resource type (video, pdf, etc)
   * @returns {Promise<Object>} Upload session data
   */
  async createUploadSession(courseId, moduleId, resourceId, filename, fileSize, resourceType) {
    const data = {
      filename,
      file_size: fileSize,
      resource_type: resourceType
    };

    return this.request(
      `/courses/${courseId}/modules/${moduleId}/resources/${resourceId}/upload/session`,
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    );
  }

  /**
   * Upload a file chunk
   *
   * @param {number} courseId - Course ID
   * @param {number} moduleId - Module ID
   * @param {number} resourceId - Resource ID
   * @param {string} sessionId - Upload session ID
   * @param {Blob} chunk - File chunk to upload
   * @param {number} partNumber - Part number (1-indexed)
   * @returns {Promise<Object>} Upload response with ETag
   */
  async uploadChunk(courseId, moduleId, resourceId, sessionId, chunk, partNumber) {
    const token = localStorage.getItem('access_token');
    const url = `${this.baseURL}/courses/${courseId}/modules/${moduleId}/resources/${resourceId}/upload/${sessionId}/chunk`;

    // Create FormData for multipart/form-data upload
    const formData = new FormData();
    formData.append('file', chunk);
    formData.append('part_number', partNumber.toString());

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
        // Don't set Content-Type - browser will set it with boundary for FormData
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || `Failed to upload chunk ${partNumber}`);
    }

    return response.json();
  }

  /**
   * Complete a multipart upload
   *
   * @param {number} courseId - Course ID
   * @param {number} moduleId - Module ID
   * @param {number} resourceId - Resource ID
   * @param {string} sessionId - Upload session ID
   * @returns {Promise<Object>} Completion response with file details
   */
  async completeUpload(courseId, moduleId, resourceId, sessionId) {
    return this.request(
      `/courses/${courseId}/modules/${moduleId}/resources/${resourceId}/upload/${sessionId}/complete`,
      {
        method: 'POST'
      }
    );
  }

  /**
   * Check upload status
   *
   * @param {number} courseId - Course ID
   * @param {number} moduleId - Module ID
   * @param {number} resourceId - Resource ID
   * @param {string} sessionId - Upload session ID
   * @returns {Promise<Object>} Upload status
   */
  async checkUploadStatus(courseId, moduleId, resourceId, sessionId) {
    return this.request(
      `/courses/${courseId}/modules/${moduleId}/resources/${resourceId}/upload/${sessionId}/status`,
      {
        method: 'GET'
      }
    );
  }

  /**
   * Abort an upload
   *
   * @param {number} courseId - Course ID
   * @param {number} moduleId - Module ID
   * @param {number} resourceId - Resource ID
   * @param {string} sessionId - Upload session ID
   * @returns {Promise<Object>} Abort confirmation
   */
  async abortUpload(courseId, moduleId, resourceId, sessionId) {
    return this.request(
      `/courses/${courseId}/modules/${moduleId}/resources/${resourceId}/upload/${sessionId}`,
      {
        method: 'DELETE'
      }
    );
  }

  /**
   * Get a temporary download URL for a resource
   *
   * @param {number} courseId - Course ID
   * @param {number} moduleId - Module ID
   * @param {number} resourceId - Resource ID
   * @param {number} expiration - URL expiration in seconds (default: 3600)
   * @returns {Promise<Object>} Download URL data
   */
  async getDownloadUrl(courseId, moduleId, resourceId, expiration = 3600) {
    return this.request(
      `/courses/${courseId}/modules/${moduleId}/resources/${resourceId}/download?expiration=${expiration}`,
      {
        method: 'GET'
      }
    );
  }

  /**
   * Upload a small file in a single request
   *
   * @param {number} courseId - Course ID
   * @param {number} moduleId - Module ID
   * @param {number} resourceId - Resource ID
   * @param {File} file - File object to upload
   * @param {string} resourceType - Resource type
   * @param {Function} onProgress - Progress callback (0-100)
   * @returns {Promise<Object>} Upload result
   */
  async uploadSingleFile(courseId, moduleId, resourceId, file, resourceType, onProgress = null) {
    // Create session
    const session = await this.createUploadSession(
      courseId,
      moduleId,
      resourceId,
      file.name,
      file.size,
      resourceType
    );

    if (onProgress) onProgress(10);

    // Upload as single chunk
    await this.uploadChunk(courseId, moduleId, resourceId, session.session_id, file, 1);

    if (onProgress) onProgress(90);

    // Complete upload
    const result = await this.completeUpload(courseId, moduleId, resourceId, session.session_id);

    if (onProgress) onProgress(100);

    return result;
  }

  /**
   * Upload a large file using chunked multipart upload
   *
   * @param {number} courseId - Course ID
   * @param {number} moduleId - Module ID
   * @param {number} resourceId - Resource ID
   * @param {File} file - File object to upload
   * @param {string} resourceType - Resource type
   * @param {Function} onProgress - Progress callback (0-100)
   * @param {Function} onError - Error callback
   * @returns {Promise<Object>} Upload result with abort function
   */
  async uploadChunkedFile(courseId, moduleId, resourceId, file, resourceType, onProgress = null, onError = null) {
    let aborted = false;
    let sessionId = null;

    try {
      // Create session
      const session = await this.createUploadSession(
        courseId,
        moduleId,
        resourceId,
        file.name,
        file.size,
        resourceType
      );
      sessionId = session.session_id;

      if (onProgress) onProgress(5);

      // Calculate chunks
      const totalChunks = Math.ceil(file.size / this.chunkSize);
      const uploadedParts = [];

      // Upload chunks
      for (let i = 0; i < totalChunks; i++) {
        if (aborted) {
          throw new Error('Upload aborted by user');
        }

        const start = i * this.chunkSize;
        const end = Math.min(start + this.chunkSize, file.size);
        const chunk = file.slice(start, end);
        const partNumber = i + 1;

        const result = await this.uploadChunk(
          courseId,
          moduleId,
          resourceId,
          sessionId,
          chunk,
          partNumber
        );

        uploadedParts.push(result);

        // Update progress (5% for session creation, 90% for upload, 5% for completion)
        const uploadProgress = 5 + ((i + 1) / totalChunks) * 90;
        if (onProgress) onProgress(Math.round(uploadProgress));
      }

      // Complete upload
      const result = await this.completeUpload(courseId, moduleId, resourceId, sessionId);

      if (onProgress) onProgress(100);

      return {
        ...result,
        abort: () => {} // No-op since upload is complete
      };

    } catch (error) {
      // Abort upload if session was created
      if (sessionId && !aborted) {
        try {
          await this.abortUpload(courseId, moduleId, resourceId, sessionId);
        } catch (abortError) {
          console.error('Failed to abort upload:', abortError);
        }
      }

      if (onError) onError(error);
      throw error;
    }
  }

  /**
   * Smart upload - automatically chooses single or chunked upload based on file size
   *
   * @param {number} courseId - Course ID
   * @param {number} moduleId - Module ID
   * @param {number} resourceId - Resource ID
   * @param {File} file - File object to upload
   * @param {string} resourceType - Resource type
   * @param {Function} onProgress - Progress callback (0-100)
   * @param {Function} onError - Error callback
   * @returns {Promise<Object>} Upload result
   */
  async uploadFile(courseId, moduleId, resourceId, file, resourceType, onProgress = null, onError = null) {
    if (file.size < this.largeFileThreshold) {
      return this.uploadSingleFile(courseId, moduleId, resourceId, file, resourceType, onProgress);
    } else {
      return this.uploadChunkedFile(courseId, moduleId, resourceId, file, resourceType, onProgress, onError);
    }
  }

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  // ==========================================
  // S3 MANAGEMENT ENDPOINTS
  // ==========================================

  /**
   * Get S3 storage analytics
   * @returns {Promise<Object>} Storage analytics data
   */
  async getS3Analytics() {
    return this.request('/s3/analytics', { method: 'GET' });
  }

  /**
   * Check S3 health status
   * @returns {Promise<Object>} Health status data
   */
  async checkS3Health() {
    return this.request('/s3/health', { method: 'GET' });
  }

  /**
   * Perform bulk actions on S3 resources
   * @param {string} action - Action type: 'delete', 'cleanup-orphaned', or 'resync'
   * @param {Object} options - Action options
   * @param {Array<string>} options.resource_ids - Optional: specific resource IDs
   * @param {Object} options.filters - Optional: filter criteria
   * @param {boolean} options.confirm_deletion - Required for 'delete' action
   * @returns {Promise<Object>} Bulk action result
   */
  async performBulkAction(action, options = {}) {
    const data = {
      action,
      confirm_deletion: true,
      ...options
    };

    return this.request('/s3/bulk-actions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Browse S3 files by prefix
   * @param {string} prefix - S3 prefix to browse (default: 'courses/')
   * @param {number} limit - Max files to return (1-1000, default: 100)
   * @returns {Promise<Object>} Files and folders listing
   */
  async browseS3Files(prefix = 'courses/', limit = 100) {
    const params = new URLSearchParams({ prefix, limit: limit.toString() });
    return this.request(`/s3/browse?${params}`, { method: 'GET' });
  }

  /**
   * Get enhanced download URL for a resource with metadata
   * @param {number} courseId - Course ID
   * @param {number} moduleId - Module ID
   * @param {number} resourceId - Resource ID
   * @param {number} expiration - URL expiration in seconds (300-86400, default: 3600)
   * @returns {Promise<Object>} Download URL with file metadata
   */
  async getResourceDownloadUrl(courseId, moduleId, resourceId, expiration = 3600) {
    return this.getDownloadUrl(courseId, moduleId, resourceId, expiration);
  }

  // ==========================================
  // SRT SUBTITLE FILE MANAGEMENT
  // ==========================================

  /**
   * Create SRT upload session
   * @param {number} courseId - Course ID
   * @param {number} moduleId - Module ID
   * @param {number} resourceId - Resource ID
   * @param {string} filename - SRT filename
   * @param {number} fileSize - File size in bytes
   * @returns {Promise<Object>} Upload session data
   */
  async createSRTUploadSession(courseId, moduleId, resourceId, filename, fileSize) {
    return this.request(
      `/courses/${courseId}/modules/${moduleId}/resources/${resourceId}/srt/upload/session`,
      {
        method: 'POST',
        body: JSON.stringify({
          filename,
          file_size: fileSize
        })
      }
    );
  }

  /**
   * Upload SRT file
   * @param {number} courseId - Course ID
   * @param {number} moduleId - Module ID
   * @param {number} resourceId - Resource ID
   * @param {string} sessionId - Upload session ID
   * @param {File} file - SRT file to upload
   * @returns {Promise<Object>} Upload response with progress
   */
  async uploadSRTChunk(courseId, moduleId, resourceId, sessionId, file) {
    const token = localStorage.getItem('access_token');
    const url = `${this.baseURL}/courses/${courseId}/modules/${moduleId}/resources/${resourceId}/srt/upload/${sessionId}/chunk`;

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
        // Don't set Content-Type - browser will set it with boundary for FormData
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || 'Failed to upload SRT file');
    }

    return response.json();
  }

  /**
   * Complete SRT upload
   * @param {number} courseId - Course ID
   * @param {number} moduleId - Module ID
   * @param {number} resourceId - Resource ID
   * @param {string} sessionId - Upload session ID
   * @returns {Promise<Object>} Completion response
   */
  async completeSRTUpload(courseId, moduleId, resourceId, sessionId) {
    return this.request(
      `/courses/${courseId}/modules/${moduleId}/resources/${resourceId}/srt/upload/${sessionId}/complete`,
      {
        method: 'POST'
      }
    );
  }

  /**
   * Get SRT file information
   * @param {number} courseId - Course ID
   * @param {number} moduleId - Module ID
   * @param {number} resourceId - Resource ID
   * @param {boolean} includeDownloadUrl - Whether to include presigned download URL
   * @returns {Promise<Object|null>} SRT file info or null if not found
   */
  async getSRTInfo(courseId, moduleId, resourceId, includeDownloadUrl = true) {
    try {
      const params = includeDownloadUrl ? '?include_download_url=true' : '';
      return await this.request(
        `/courses/${courseId}/modules/${moduleId}/resources/${resourceId}/srt${params}`,
        {
          method: 'GET'
        }
      );
    } catch (error) {
      // Return null if SRT file doesn't exist (404)
      if (error.message.includes('404') || error.message.includes('not found')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get SRT download URL
   * @param {number} courseId - Course ID
   * @param {number} moduleId - Module ID
   * @param {number} resourceId - Resource ID
   * @param {number} expiration - URL expiration in seconds (default: 3600)
   * @returns {Promise<Object>} Download URL data
   */
  async downloadSRT(courseId, moduleId, resourceId, expiration = 3600) {
    return this.request(
      `/courses/${courseId}/modules/${moduleId}/resources/${resourceId}/srt/download?expiration=${expiration}`,
      {
        method: 'GET'
      }
    );
  }

  /**
   * Delete SRT file
   * @param {number} courseId - Course ID
   * @param {number} moduleId - Module ID
   * @param {number} resourceId - Resource ID
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteSRT(courseId, moduleId, resourceId) {
    return this.request(
      `/courses/${courseId}/modules/${moduleId}/resources/${resourceId}/srt`,
      {
        method: 'DELETE'
      }
    );
  }

  /**
   * Abort SRT upload session
   * @param {number} courseId - Course ID
   * @param {number} moduleId - Module ID
   * @param {number} resourceId - Resource ID
   * @param {string} sessionId - Upload session ID
   * @returns {Promise<void>}
   */
  async abortSRTUpload(courseId, moduleId, resourceId, sessionId) {
    try {
      await this.request(
        `/courses/${courseId}/modules/${moduleId}/resources/${resourceId}/srt/upload/${sessionId}`,
        {
          method: 'DELETE'
        }
      );
    } catch (error) {
      console.error('Failed to abort SRT upload:', error);
    }
  }

  /**
   * Complete SRT upload workflow
   * Handles the full upload process: session creation, file upload, and completion
   * @param {number} courseId - Course ID
   * @param {number} moduleId - Module ID
   * @param {number} resourceId - Resource ID
   * @param {File} file - SRT file to upload
   * @param {Function} onProgress - Progress callback (0-100)
   * @returns {Promise<Object>} Upload result
   */
  async uploadSRTFile(courseId, moduleId, resourceId, file, onProgress = null) {
    let sessionId = null;

    try {
      // Validate file
      if (!file.name.toLowerCase().endsWith('.srt')) {
        throw new Error('File must have .srt extension');
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error('SRT file size must be under 10MB');
      }

      if (file.size === 0) {
        throw new Error('SRT file appears to be empty');
      }

      // Step 1: Create upload session
      if (onProgress) onProgress(10);
      const session = await this.createSRTUploadSession(
        courseId,
        moduleId,
        resourceId,
        file.name,
        file.size
      );
      sessionId = session.session_id;

      // Step 2: Upload file
      if (onProgress) onProgress(40);
      await this.uploadSRTChunk(courseId, moduleId, resourceId, sessionId, file);

      // Step 3: Complete upload
      if (onProgress) onProgress(80);
      const result = await this.completeSRTUpload(courseId, moduleId, resourceId, sessionId);

      if (onProgress) onProgress(100);

      return result;
    } catch (error) {
      // Abort session if created
      if (sessionId) {
        await this.abortSRTUpload(courseId, moduleId, resourceId, sessionId);
      }
      throw error;
    }
  }
}

// Export singleton instance
const uploadAPI = new UploadAPI();
export default uploadAPI;
