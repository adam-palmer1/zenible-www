// API service for Courses and Modules management

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://demo-api.zenible.com/api/v1';

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

class CoursesAPI {
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
      console.error('Courses API request failed:', error);
      throw error;
    }
  }

  // ==========================================
  // PUBLIC USER ENDPOINTS
  // ==========================================

  /**
   * List published courses for users
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (≥1)
   * @param {number} params.per_page - Items per page (1-100)
   * @param {string} params.category - Filter by category
   * @param {string} params.difficulty - Filter by difficulty (Beginner/Intermediate/Advanced)
   * @param {string} params.search - Search in title and description
   * @param {boolean} params.is_featured - Filter featured courses
   * @returns {Promise<Object>} Paginated courses list
   */
  async listCourses(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/courses/?${queryString}` : '/courses/';
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * Get course details by slug (for users)
   * @param {string} slug - Course slug
   * @returns {Promise<Object>} Course details with modules and enrollment info
   */
  async getCourse(slug) {
    return this.request(`/courses/${slug}`, { method: 'GET' });
  }

  /**
   * Enroll in a course
   * @param {string} courseId - Course UUID
   * @returns {Promise<Object>} Enrollment details
   */
  async enrollCourse(courseId) {
    return this.request(`/courses/${courseId}/enroll`, { method: 'POST' });
  }

  /**
   * Get user's enrollments
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.per_page - Items per page
   * @param {string} params.status - Filter by status (active, completed, dropped)
   * @returns {Promise<Object>} Paginated enrollments list
   */
  async getMyEnrollments(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/courses/my-enrollments?${queryString}` : '/courses/my-enrollments';
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * Update enrollment progress
   * @param {string} enrollmentId - Enrollment UUID
   * @param {Object} data - Progress data
   * @param {number} data.progress_percentage - Progress (0-100)
   * @param {string} data.last_accessed_module_id - Last accessed module UUID
   * @returns {Promise<Object>} Updated enrollment
   */
  async updateEnrollmentProgress(enrollmentId, data) {
    return this.request(`/courses/enrollments/${enrollmentId}/progress`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * Mark module as completed
   * @param {string} enrollmentId - Enrollment UUID
   * @param {string} moduleId - Module UUID
   * @returns {Promise<Object>} Updated progress
   */
  async completeModule(enrollmentId, moduleId) {
    return this.request(`/courses/enrollments/${enrollmentId}/modules/${moduleId}/complete`, {
      method: 'POST',
    });
  }

  // ==========================================
  // ADMIN: COURSES MANAGEMENT
  // ==========================================

  /**
   * List courses with filtering and pagination (Admin)
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (≥1)
   * @param {number} params.per_page - Items per page (1-100)
   * @param {string} params.search - Search in title and description
   * @param {string} params.category - Filter by category
   * @param {string} params.difficulty - Filter by difficulty
   * @param {boolean} params.is_active - Filter by active status
   * @param {boolean} params.is_published - Filter by published status
   * @param {boolean} params.is_featured - Filter by featured status
   * @param {string} params.required_plan_id - Filter by subscription plan UUID
   * @returns {Promise<Object>} Paginated courses list with enrollment counts
   */
  async getAdminCourses(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/admin/courses/?${queryString}` : '/admin/courses/';
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * Get course details by ID (Admin)
   * @param {string} courseId - Course UUID
   * @returns {Promise<Object>} Course details with modules
   */
  async getAdminCourse(courseId) {
    return this.request(`/admin/courses/${courseId}`, { method: 'GET' });
  }

  /**
   * Create a new course (Admin)
   * @param {Object} data - Course data
   * @param {string} data.title - Course title (required)
   * @param {string} data.slug - URL slug (optional, auto-generated from title)
   * @param {string} data.description - Course description (required)
   * @param {string} data.category - Category (required)
   * @param {string} data.difficulty - Difficulty level (Beginner/Intermediate/Advanced, required)
   * @param {number} data.estimated_duration_hours - Estimated duration (optional)
   * @param {string} data.thumbnail_url - Thumbnail URL (optional)
   * @param {string} data.intro_video_url - Introduction video URL (optional)
   * @param {Array<string>} data.required_plan_ids - Array of plan UUIDs (optional)
   * @param {boolean} data.is_active - Active status (default: true)
   * @param {boolean} data.is_published - Published status (default: false)
   * @param {boolean} data.is_featured - Featured status (default: false)
   * @param {string} data.meta_title - SEO meta title (optional)
   * @param {string} data.meta_description - SEO meta description (optional)
   * @returns {Promise<Object>} Created course
   */
  async createCourse(data) {
    return this.request('/admin/courses/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update an existing course (Admin)
   * @param {string} courseId - Course UUID
   * @param {Object} data - Updated course data (all fields optional)
   * @returns {Promise<Object>} Updated course
   */
  async updateCourse(courseId, data) {
    return this.request(`/admin/courses/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a course (Admin)
   * @param {string} courseId - Course UUID
   * @returns {Promise<Object>} Deletion confirmation message
   */
  async deleteCourse(courseId) {
    return this.request(`/admin/courses/${courseId}`, { method: 'DELETE' });
  }

  /**
   * Bulk actions on multiple courses (Admin)
   * @param {Object} data - Bulk action data
   * @param {Array<string>} data.course_ids - Array of course UUIDs
   * @param {string} data.action - Action: "activate", "deactivate", "publish", "unpublish", or "delete"
   * @returns {Promise<Object>} Action result message
   */
  async bulkActionCourses(data) {
    return this.request('/admin/courses/bulk-action', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get course analytics overview (Admin)
   * @param {Object} params - Query parameters
   * @param {number} params.days - Number of days to analyze (1-365, default: 30)
   * @returns {Promise<Object>} Analytics data with course stats
   */
  async getCourseAnalytics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/admin/courses/analytics/overview?${queryString}`
      : '/admin/courses/analytics/overview';
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * Get enrollments for a specific course (Admin)
   * @param {string} courseId - Course UUID
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.per_page - Items per page (default: 50, max: 100)
   * @param {string} params.status - Filter by enrollment status
   * @returns {Promise<Object>} Paginated enrollments list
   */
  async getCourseEnrollments(courseId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/admin/courses/${courseId}/enrollments?${queryString}`
      : `/admin/courses/${courseId}/enrollments`;
    return this.request(endpoint, { method: 'GET' });
  }

  // ==========================================
  // ADMIN: MODULES MANAGEMENT
  // ==========================================

  /**
   * List modules for a course (Admin)
   * @param {string} courseId - Course UUID
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.per_page - Items per page
   * @returns {Promise<Object>} Paginated modules list
   */
  async getCourseModules(courseId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/admin/courses/${courseId}/modules?${queryString}`
      : `/admin/courses/${courseId}/modules`;
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * Get module details (Admin)
   * @param {string} courseId - Course UUID
   * @param {string} moduleId - Module UUID
   * @returns {Promise<Object>} Module details
   */
  async getModule(courseId, moduleId) {
    return this.request(`/admin/courses/${courseId}/modules/${moduleId}`, { method: 'GET' });
  }

  /**
   * Create a new module in a course (Admin)
   * @param {string} courseId - Course UUID
   * @param {Object} data - Module data
   * @param {string} data.title - Module title (required)
   * @param {string} data.description - Module description (optional)
   * @param {string} data.content - Module content/body (optional)
   * @param {string} data.video_url - Video URL (optional)
   * @param {number} data.duration_minutes - Duration in minutes (optional)
   * @param {number} data.order_index - Display order (required)
   * @param {boolean} data.is_published - Published status (default: false)
   * @returns {Promise<Object>} Created module
   */
  async createModule(courseId, data) {
    return this.request(`/admin/courses/${courseId}/modules`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update an existing module (Admin)
   * @param {string} courseId - Course UUID
   * @param {string} moduleId - Module UUID
   * @param {Object} data - Updated module data (all fields optional)
   * @returns {Promise<Object>} Updated module
   */
  async updateModule(courseId, moduleId, data) {
    return this.request(`/admin/courses/${courseId}/modules/${moduleId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a module (Admin)
   * @param {string} courseId - Course UUID
   * @param {string} moduleId - Module UUID
   * @returns {Promise<Object>} Deletion confirmation message
   */
  async deleteModule(courseId, moduleId) {
    return this.request(`/admin/courses/${courseId}/modules/${moduleId}`, { method: 'DELETE' });
  }

  /**
   * Reorder modules in a course (Admin)
   * @param {string} courseId - Course UUID
   * @param {Object} data - Reorder data
   * @param {Array<Object>} data.module_orders - Array of {module_id, order_index}
   * @returns {Promise<Object>} Updated modules list
   */
  async reorderModules(courseId, data) {
    return this.request(`/admin/courses/${courseId}/modules/reorder`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Bulk delete modules (Admin)
   * @param {string} courseId - Course UUID
   * @param {Object} data - Bulk delete data
   * @param {Array<string>} data.module_ids - Array of module UUIDs to delete
   * @returns {Promise<Object>} Deletion result message
   */
  async bulkDeleteModules(courseId, data) {
    return this.request(`/admin/courses/${courseId}/modules/bulk-delete`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ==========================================
  // ADMIN: RESOURCES MANAGEMENT
  // ==========================================

  /**
   * List resources for a module (Admin)
   * @param {string} courseId - Course UUID
   * @param {string} moduleId - Module UUID
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.per_page - Items per page
   * @returns {Promise<Object>} Paginated resources list
   */
  async getModuleResources(courseId, moduleId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/admin/courses/${courseId}/modules/${moduleId}/resources?${queryString}`
      : `/admin/courses/${courseId}/modules/${moduleId}/resources`;
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * Get resource details (Admin)
   * @param {string} courseId - Course UUID
   * @param {string} moduleId - Module UUID
   * @param {string} resourceId - Resource UUID
   * @returns {Promise<Object>} Resource details
   */
  async getResource(courseId, moduleId, resourceId) {
    return this.request(`/admin/courses/${courseId}/modules/${moduleId}/resources/${resourceId}`, { method: 'GET' });
  }

  /**
   * Create a new resource in a module (Admin)
   * @param {string} courseId - Course UUID
   * @param {string} moduleId - Module UUID
   * @param {Object} data - Resource data
   * @param {string} data.title - Resource title (required)
   * @param {string} data.resource_type - Resource type: video, pdf, rich_text, link (required)
   * @param {string} data.description - Resource description (optional)
   * @param {string} data.content_url - URL for video/pdf/link types (required for those types)
   * @param {string} data.content_text - Text content for rich_text type (required for rich_text)
   * @param {number} data.duration_minutes - Duration in minutes (optional)
   * @param {number} data.order_index - Display order (required)
   * @param {boolean} data.is_required - Whether resource is required (default: true)
   * @param {string} data.status - Status: published or draft (default: draft)
   * @param {Object} data.resource_metadata - Additional metadata as JSON (optional)
   * @returns {Promise<Object>} Created resource
   */
  async createResource(courseId, moduleId, data) {
    return this.request(`/admin/courses/${courseId}/modules/${moduleId}/resources`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update an existing resource (Admin)
   * @param {string} courseId - Course UUID
   * @param {string} moduleId - Module UUID
   * @param {string} resourceId - Resource UUID
   * @param {Object} data - Updated resource data (all fields optional)
   * @returns {Promise<Object>} Updated resource
   */
  async updateResource(courseId, moduleId, resourceId, data) {
    return this.request(`/admin/courses/${courseId}/modules/${moduleId}/resources/${resourceId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a resource (Admin)
   * @param {string} courseId - Course UUID
   * @param {string} moduleId - Module UUID
   * @param {string} resourceId - Resource UUID
   * @returns {Promise<Object>} Deletion confirmation message
   */
  async deleteResource(courseId, moduleId, resourceId) {
    return this.request(`/admin/courses/${courseId}/modules/${moduleId}/resources/${resourceId}`, { method: 'DELETE' });
  }

  /**
   * Reorder resources in a module (Admin)
   * @param {string} courseId - Course UUID
   * @param {string} moduleId - Module UUID
   * @param {Object} data - Reorder data
   * @param {Array<Object>} data.resource_orders - Array of {resource_id, order_index}
   * @returns {Promise<Object>} Updated resources list
   */
  async reorderResources(courseId, moduleId, data) {
    return this.request(`/admin/courses/${courseId}/modules/${moduleId}/resources/reorder`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  /**
   * Generate slug from title
   * @param {string} title - Course/module title
   * @returns {string} URL-friendly slug
   */
  generateSlug(title) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
  }

  /**
   * Format duration hours for display
   * @param {number} hours - Duration in hours
   * @returns {string} Formatted duration
   */
  formatDuration(hours) {
    if (!hours) return '-';
    if (hours < 1) {
      return `${Math.round(hours * 60)} minutes`;
    }
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }

  /**
   * Get difficulty badge color
   * @param {string} difficulty - Difficulty level
   * @returns {Object} Tailwind color classes
   */
  getDifficultyColor(difficulty) {
    const colors = {
      Beginner: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
      Intermediate: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
      Advanced: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
    };
    return colors[difficulty] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' };
  }

  /**
   * Get status badge color
   * @param {string} status - Enrollment status
   * @returns {Object} Tailwind color classes
   */
  getStatusColor(status) {
    const colors = {
      active: { bg: 'bg-blue-100', text: 'text-blue-800' },
      completed: { bg: 'bg-green-100', text: 'text-green-800' },
      dropped: { bg: 'bg-gray-100', text: 'text-gray-800' },
    };
    return colors[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
  }

  /**
   * Calculate completion percentage
   * @param {number} completedModules - Number of completed modules
   * @param {number} totalModules - Total number of modules
   * @returns {number} Completion percentage (0-100)
   */
  calculateCompletion(completedModules, totalModules) {
    if (!totalModules || totalModules === 0) return 0;
    return Math.round((completedModules / totalModules) * 100);
  }

  /**
   * Extract unique categories from courses
   * @param {Array} courses - Array of course objects
   * @returns {Array<string>} Sorted unique categories
   */
  extractUniqueCategories(courses) {
    const categoriesSet = new Set();
    courses.forEach(course => {
      if (course.category) {
        categoriesSet.add(course.category);
      }
    });
    return Array.from(categoriesSet).sort();
  }

  /**
   * Get resource type display information
   * @param {string} resourceType - Resource type (video, pdf, rich_text, link)
   * @returns {Object} Display information with icon, label, and color
   */
  getResourceTypeInfo(resourceType) {
    const types = {
      video: {
        icon: '🎥',
        label: 'Video',
        color: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' }
      },
      pdf: {
        icon: '📄',
        label: 'PDF',
        color: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' }
      },
      rich_text: {
        icon: '📝',
        label: 'Content',
        color: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' }
      },
      link: {
        icon: '🔗',
        label: 'Link',
        color: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' }
      }
    };
    return types[resourceType] || {
      icon: '📦',
      label: 'Unknown',
      color: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' }
    };
  }
}

export default new CoursesAPI();
