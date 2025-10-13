// API service for Quiz Management endpoints

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

class QuizAPI {
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
      console.error('Quiz API request failed:', error);
      throw error;
    }
  }

  // ==========================================
  // ADMIN: QUIZ TAGS MANAGEMENT
  // ==========================================

  /**
   * Create a new quiz tag (Admin)
   * @param {Object} data - Tag data
   * @param {string} data.name - Tag name (required)
   * @param {string} data.description - Tag description (optional)
   * @param {Array<string>} data.subscription_plan_ids - Array of plan UUIDs (optional)
   * @param {boolean} data.is_active - Active status (default: true)
   * @returns {Promise<Object>} Created tag
   */
  async createQuizTag(data) {
    return this.request('/admin/quiz-tags', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * List quiz tags with filtering and pagination (Admin)
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (≥1)
   * @param {number} params.per_page - Items per page (1-100)
   * @param {boolean} params.is_active - Filter by active status
   * @param {string} params.search - Search in name
   * @param {string} params.subscription_plan_id - Filter by specific plan UUID
   * @returns {Promise<Object>} Paginated tags list with quiz counts
   */
  async getQuizTags(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/admin/quiz-tags?${queryString}` : '/admin/quiz-tags';
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * Get quiz tag details by ID (Admin)
   * @param {string} tagId - Tag UUID
   * @returns {Promise<Object>} Tag details with associated plans
   */
  async getQuizTag(tagId) {
    return this.request(`/admin/quiz-tags/${tagId}`, { method: 'GET' });
  }

  /**
   * Update an existing quiz tag (Admin)
   * @param {string} tagId - Tag UUID
   * @param {Object} data - Updated tag data (all fields optional)
   * @returns {Promise<Object>} Updated tag
   */
  async updateQuizTag(tagId, data) {
    return this.request(`/admin/quiz-tags/${tagId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a quiz tag (Admin)
   * @param {string} tagId - Tag UUID
   * @returns {Promise<Object>} Deletion confirmation message
   */
  async deleteQuizTag(tagId) {
    return this.request(`/admin/quiz-tags/${tagId}`, { method: 'DELETE' });
  }

  /**
   * Assign subscription plans to a quiz tag (Admin)
   * @param {string} tagId - Tag UUID
   * @param {Array<string>} planIds - Array of plan UUIDs
   * @returns {Promise<Object>} Updated tag with plans
   */
  async assignPlansToQuizTag(tagId, planIds) {
    return this.request(`/admin/quiz-tags/${tagId}/plans`, {
      method: 'POST',
      body: JSON.stringify({ subscription_plan_ids: planIds }),
    });
  }

  /**
   * Bulk update multiple quiz tags (Admin)
   * @param {Object} data - Bulk update data
   * @param {Array<Object>} data.tags - Array of tag updates (required, max 100)
   * @param {string} data.tags[].tag_id - Tag UUID (required)
   * @param {boolean} data.tags[].is_active - Active status (optional)
   * @param {Array<string>} data.tags[].subscription_plan_ids - Plan UUIDs (optional)
   * @returns {Promise<Object>} Bulk update results with per-tag status
   */
  async bulkUpdateQuizTags(data) {
    return this.request('/admin/quiz-tags/bulk', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Bulk delete multiple quiz tags (Admin)
   * @param {Object} data - Bulk delete data
   * @param {Array<string>} data.tag_ids - Array of tag UUIDs (required, max 100)
   * @returns {Promise<Object>} Bulk delete results with per-tag status
   */
  async bulkDeleteQuizTags(data) {
    return this.request('/admin/quiz-tags/bulk', {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
  }

  // ==========================================
  // ADMIN: QUIZZES MANAGEMENT
  // ==========================================

  /**
   * Create a new quiz (Admin)
   * @param {Object} data - Quiz data
   * @param {string} data.title - Quiz title (required)
   * @param {string} data.description - Quiz description (optional)
   * @param {boolean} data.is_active - Active status (default: true)
   * @param {Array<string>} data.tag_ids - Array of tag UUIDs (optional)
   * @returns {Promise<Object>} Created quiz
   */
  async createQuiz(data) {
    return this.request('/admin/quizzes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * List quizzes with filtering and pagination (Admin)
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (≥1)
   * @param {number} params.per_page - Items per page (1-100)
   * @param {boolean} params.is_active - Filter by active status
   * @param {string} params.search - Search in title and description
   * @param {string} params.tag_id - Filter by specific tag UUID
   * @returns {Promise<Object>} Paginated quizzes list with question counts and total points
   */
  async getQuizzes(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/admin/quizzes?${queryString}` : '/admin/quizzes';
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * Get quiz details by ID with all questions and answers (Admin)
   * @param {string} quizId - Quiz UUID
   * @returns {Promise<Object>} Quiz with nested questions and answers
   */
  async getQuiz(quizId) {
    return this.request(`/admin/quizzes/${quizId}`, { method: 'GET' });
  }

  /**
   * Update an existing quiz (Admin)
   * @param {string} quizId - Quiz UUID
   * @param {Object} data - Updated quiz data (all fields optional)
   * @returns {Promise<Object>} Updated quiz
   */
  async updateQuiz(quizId, data) {
    return this.request(`/admin/quizzes/${quizId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a quiz (Admin)
   * @param {string} quizId - Quiz UUID
   * @returns {Promise<Object>} Deletion confirmation message
   */
  async deleteQuiz(quizId) {
    return this.request(`/admin/quizzes/${quizId}`, { method: 'DELETE' });
  }

  /**
   * Bulk delete multiple quizzes (Admin)
   * @param {Object} data - Bulk delete data
   * @param {Array<string>} data.quiz_ids - Array of quiz UUIDs (required, max 100)
   * @returns {Promise<Object>} Bulk delete results with per-quiz status
   */
  async bulkDeleteQuizzes(data) {
    return this.request('/admin/quizzes/bulk', {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
  }

  /**
   * Assign tags to a quiz (Admin)
   * @param {string} quizId - Quiz UUID
   * @param {Array<string>} tagIds - Array of tag UUIDs
   * @returns {Promise<Object>} Updated quiz with tags
   */
  async assignTagsToQuiz(quizId, tagIds) {
    return this.request(`/admin/quizzes/${quizId}/tags`, {
      method: 'POST',
      body: JSON.stringify({ tag_ids: tagIds }),
    });
  }

  // ==========================================
  // ADMIN: QUESTIONS MANAGEMENT
  // ==========================================

  /**
   * Add a question to a quiz with answers (Admin)
   * @param {string} quizId - Quiz UUID
   * @param {Object} data - Question data
   * @param {string} data.question_text - Question text (required)
   * @param {number} data.points - Points for this question (required)
   * @param {number} data.order_index - Display order (optional)
   * @param {Array<Object>} data.answers - Array of answer objects (required, min 2)
   * @param {string} data.answers[].answer_text - Answer text (required)
   * @param {boolean} data.answers[].is_correct - Whether correct (required)
   * @param {string} data.answers[].explanation - Explanation (optional)
   * @param {number} data.answers[].order_index - Display order (optional)
   * @returns {Promise<Object>} Created question with answers
   */
  async addQuestion(quizId, data) {
    return this.request(`/admin/quizzes/${quizId}/questions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update a question (Admin)
   * @param {string} questionId - Question UUID
   * @param {Object} data - Updated question data (all fields optional)
   * @returns {Promise<Object>} Updated question
   */
  async updateQuestion(questionId, data) {
    return this.request(`/admin/questions/${questionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a question (Admin)
   * @param {string} questionId - Question UUID
   * @returns {Promise<Object>} Deletion confirmation message
   */
  async deleteQuestion(questionId) {
    return this.request(`/admin/questions/${questionId}`, { method: 'DELETE' });
  }

  /**
   * Bulk upload questions to a quiz (Admin)
   * @param {string} quizId - Quiz UUID
   * @param {Object} data - Bulk upload data
   * @param {Array<Object>} data.questions - Array of questions with answers
   * @param {string} data.mode - Upload mode: 'append' or 'replace'
   * @returns {Promise<Object>} Bulk upload results
   */
  async bulkUploadQuestions(quizId, data) {
    return this.request(`/admin/quizzes/${quizId}/questions/bulk`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Bulk upload multiple quizzes (Admin)
   * @param {Object} data - Bulk quiz upload data
   * @param {string} data.default_tag_icon - Default icon for auto-created tags (required)
   * @param {Array<Object>} data.quizzes - Array of quiz objects (required, max 50)
   * @param {string} data.quizzes[].title - Quiz title (required)
   * @param {string} data.quizzes[].description - Quiz description (optional)
   * @param {Array<string>} data.quizzes[].tag_names - Array of tag names (optional)
   * @param {Array<Object>} data.quizzes[].questions - Array of questions (required, min 1)
   * @param {string} data.quizzes[].questions[].question_text - Question text (required)
   * @param {number} data.quizzes[].questions[].points - Points (required, ≥1)
   * @param {Array<Object>} data.quizzes[].questions[].answers - Array of answers (required, min 2)
   * @param {string} data.quizzes[].questions[].answers[].answer_text - Answer text (required)
   * @param {boolean} data.quizzes[].questions[].answers[].is_correct - Is correct (required)
   * @param {string} data.quizzes[].questions[].answers[].explanation - Explanation (optional)
   * @returns {Promise<Object>} Bulk upload results with created tags and per-quiz status
   */
  async bulkUploadQuizzes(data) {
    return this.request('/admin/quizzes/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ==========================================
  // USER: QUIZ DISCOVERY
  // ==========================================

  /**
   * Get random quiz(zes) by tag (User)
   * @param {string} tag - Tag name to filter quizzes (optional)
   * @param {number} quizCount - Number of quizzes to return (optional, returns single quiz if not specified)
   * @returns {Promise<Object|Array>} Single quiz or array of quiz previews with first question
   */
  async getRandomQuiz(tag = null, quizCount = null) {
    const params = new URLSearchParams();
    if (tag) params.append('tag', tag);
    if (quizCount) params.append('quiz_count', quizCount);

    const queryString = params.toString();
    const endpoint = queryString ? `/quizzes/random?${queryString}` : '/quizzes/random';
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * Get quiz preview without starting attempt (User)
   * @param {string} quizId - Quiz UUID
   * @returns {Promise<Object>} Quiz preview with first question
   */
  async getQuizPreview(quizId) {
    return this.request(`/quizzes/${quizId}/preview`, { method: 'GET' });
  }

  // ==========================================
  // USER: QUIZ ATTEMPTS
  // ==========================================

  /**
   * Start a new quiz attempt (User)
   * @param {string} quizId - Quiz UUID
   * @returns {Promise<Object>} Attempt details with first question
   */
  async startQuizAttempt(quizId) {
    return this.request(`/quizzes/${quizId}/start`, { method: 'POST' });
  }

  /**
   * Submit an answer to the current question (User)
   * @param {string} attemptId - Quiz attempt UUID
   * @param {Object} payload - Answer submission
   * @param {Array<string>} payload.selected_answer_ids - Array of selected answer UUIDs
   * @returns {Promise<Object>} Answer feedback with next question or completion
   */
  async submitAnswer(attemptId, payload) {
    return this.request(`/quizzes/attempts/${attemptId}/submit-answer`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Get quiz attempt result (User)
   * @param {string} attemptId - Quiz attempt UUID
   * @returns {Promise<Object>} Final result with score and stats
   */
  async getQuizResult(attemptId) {
    return this.request(`/quizzes/attempts/${attemptId}/result`, { method: 'GET' });
  }

  /**
   * Get user's quiz attempt history (User)
   * @param {number} page - Page number (≥1)
   * @param {number} perPage - Items per page (1-100)
   * @returns {Promise<Object>} Paginated attempts list
   */
  async getAttemptHistory(page = 1, perPage = 10) {
    return this.request(`/quizzes/attempts/history?page=${page}&per_page=${perPage}`, {
      method: 'GET'
    });
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  /**
   * Format date for display
   * @param {string} isoDateTime - ISO datetime string
   * @returns {string} Formatted local date
   */
  formatDate(isoDateTime) {
    if (!isoDateTime) return '-';
    return new Date(isoDateTime).toLocaleDateString();
  }

  /**
   * Get question type badge color
   * @param {string} questionType - 'single_select' or 'multi_select'
   * @returns {string} Tailwind color classes
   */
  getQuestionTypeBadge(questionType) {
    if (questionType === 'single_select') {
      return 'bg-blue-100 text-blue-800';
    } else if (questionType === 'multi_select') {
      return 'bg-purple-100 text-purple-800';
    }
    return 'bg-gray-100 text-gray-800';
  }

  /**
   * Determine question type based on correct answers count
   * @param {Array} answers - Array of answer objects
   * @returns {string} 'single_select' or 'multi_select'
   */
  determineQuestionType(answers) {
    const correctCount = answers.filter(a => a.is_correct).length;
    return correctCount >= 2 ? 'multi_select' : 'single_select';
  }

  /**
   * Calculate total points for a quiz
   * @param {Array} questions - Array of question objects
   * @returns {number} Total points
   */
  calculateTotalPoints(questions) {
    return questions.reduce((sum, q) => sum + (q.points || 0), 0);
  }
}

export default new QuizAPI();
