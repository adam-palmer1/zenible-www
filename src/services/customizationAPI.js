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

class CustomizationAPI {
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

      // Parse JSON response
      return JSON.parse(text);
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Get all active questions for the current user
  async getQuestions() {
    return this.request('/customization/questions');
  }

  // Get user's existing answers
  async getMyAnswers() {
    return this.request('/customization/answers');
  }

  // Submit or update a single answer
  async submitAnswer(questionId, answer) {
    return this.request(`/customization/answers/${questionId}`, {
      method: 'PUT',
      body: JSON.stringify({ answer }),
    });
  }

  // Submit multiple answers at once
  async submitBulkAnswers(answers) {
    return this.request('/customization/answers', {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  }

  // Update an existing answer
  async updateAnswer(questionId, answer) {
    return this.request(`/customization/answers/${questionId}`, {
      method: 'PUT',
      body: JSON.stringify({ answer }),
    });
  }

  // Delete an answer
  async deleteAnswer(questionId) {
    return this.request(`/customization/answers/${questionId}`, {
      method: 'DELETE',
    });
  }

  // Get progress/completion status
  async getCompletionStatus() {
    return this.request('/customization/progress');
  }

  // Get a specific answer
  async getAnswer(questionId) {
    return this.request(`/customization/answers/${questionId}`);
  }
}

export const customizationAPI = new CustomizationAPI();
export default customizationAPI;