import { API_BASE_URL } from '@/config/api';
import logger from '../utils/logger';

interface ApiError extends Error {
  response?: unknown;
}

const getHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const accessToken = localStorage.getItem('access_token');
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  return headers;
};

class CustomizationAPI {
  private async request<T = unknown>(endpoint: string, options: RequestInit & { headers?: Record<string, string> } = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
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
        const error: ApiError = new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
        error.response = errorData;
        throw error;
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        return null as T;
      }

      // Handle empty responses
      const text = await response.text();
      if (!text) {
        return null as T;
      }

      // Parse JSON response
      return JSON.parse(text) as T;
    } catch (error) {
      logger.error('API request failed:', error);
      throw error;
    }
  }

  // Get all active questions for the current user
  async getQuestions(): Promise<unknown> {
    return this.request('/customization/questions');
  }

  // Get user's existing answers
  async getMyAnswers(): Promise<unknown> {
    return this.request('/customization/answers');
  }

  // Submit or update a single answer
  async submitAnswer(questionId: string, answer: unknown): Promise<unknown> {
    return this.request(`/customization/answers/${questionId}`, {
      method: 'PUT',
      body: JSON.stringify({ answer }),
    });
  }

  // Submit multiple answers at once
  async submitBulkAnswers(answers: unknown): Promise<unknown> {
    return this.request('/customization/answers', {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  }

  // Update an existing answer
  async updateAnswer(questionId: string, answer: unknown): Promise<unknown> {
    return this.request(`/customization/answers/${questionId}`, {
      method: 'PUT',
      body: JSON.stringify({ answer }),
    });
  }

  // Delete an answer
  async deleteAnswer(questionId: string): Promise<unknown> {
    return this.request(`/customization/answers/${questionId}`, {
      method: 'DELETE',
    });
  }

  // Get progress/completion status
  async getCompletionStatus(): Promise<unknown> {
    return this.request('/customization/progress');
  }

  // Get a specific answer
  async getAnswer(questionId: string): Promise<unknown> {
    return this.request(`/customization/answers/${questionId}`);
  }
}

export const customizationAPI = new CustomizationAPI();
export default customizationAPI;
