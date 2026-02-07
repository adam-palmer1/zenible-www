// API service for Quiz Management endpoints
import { API_BASE_URL } from '@/config/api';
import logger from '../utils/logger';

interface ApiError extends Error {
  response?: unknown;
}

interface AnswerObject {
  is_correct: boolean;
}

interface QuestionObject {
  points?: number;
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

class QuizAPI {
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

      return JSON.parse(text) as T;
    } catch (error) {
      logger.error('Quiz API request failed:', error);
      throw error;
    }
  }

  // ==========================================
  // ADMIN: QUIZ TAGS MANAGEMENT
  // ==========================================

  async createQuizTag(data: unknown): Promise<unknown> {
    return this.request('/admin/quiz-tags', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getQuizTags(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/admin/quiz-tags?${queryString}` : '/admin/quiz-tags';
    return this.request(endpoint, { method: 'GET' });
  }

  async getQuizTag(tagId: string): Promise<unknown> {
    return this.request(`/admin/quiz-tags/${tagId}`, { method: 'GET' });
  }

  async updateQuizTag(tagId: string, data: unknown): Promise<unknown> {
    return this.request(`/admin/quiz-tags/${tagId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteQuizTag(tagId: string): Promise<unknown> {
    return this.request(`/admin/quiz-tags/${tagId}`, { method: 'DELETE' });
  }

  async assignPlansToQuizTag(tagId: string, planIds: string[]): Promise<unknown> {
    return this.request(`/admin/quiz-tags/${tagId}/plans`, {
      method: 'POST',
      body: JSON.stringify({ subscription_plan_ids: planIds }),
    });
  }

  async bulkUpdateQuizTags(data: unknown): Promise<unknown> {
    return this.request('/admin/quiz-tags/bulk', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async bulkDeleteQuizTags(data: unknown): Promise<unknown> {
    return this.request('/admin/quiz-tags/bulk', {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
  }

  // ==========================================
  // ADMIN: QUIZZES MANAGEMENT
  // ==========================================

  async createQuiz(data: unknown): Promise<unknown> {
    return this.request('/admin/quizzes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getQuizzes(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/admin/quizzes?${queryString}` : '/admin/quizzes';
    return this.request(endpoint, { method: 'GET' });
  }

  async getQuiz(quizId: string): Promise<unknown> {
    return this.request(`/admin/quizzes/${quizId}`, { method: 'GET' });
  }

  async updateQuiz(quizId: string, data: unknown): Promise<unknown> {
    return this.request(`/admin/quizzes/${quizId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteQuiz(quizId: string): Promise<unknown> {
    return this.request(`/admin/quizzes/${quizId}`, { method: 'DELETE' });
  }

  async bulkDeleteQuizzes(data: unknown): Promise<unknown> {
    return this.request('/admin/quizzes/bulk', {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
  }

  async assignTagsToQuiz(quizId: string, tagIds: string[]): Promise<unknown> {
    return this.request(`/admin/quizzes/${quizId}/tags`, {
      method: 'POST',
      body: JSON.stringify({ tag_ids: tagIds }),
    });
  }

  // ==========================================
  // ADMIN: QUESTIONS MANAGEMENT
  // ==========================================

  async addQuestion(quizId: string, data: unknown): Promise<unknown> {
    return this.request(`/admin/quizzes/${quizId}/questions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateQuestion(questionId: string, data: unknown): Promise<unknown> {
    return this.request(`/admin/questions/${questionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteQuestion(questionId: string): Promise<unknown> {
    return this.request(`/admin/questions/${questionId}`, { method: 'DELETE' });
  }

  async bulkUploadQuestions(quizId: string, data: unknown): Promise<unknown> {
    return this.request(`/admin/quizzes/${quizId}/questions/bulk`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async bulkUploadQuizzes(data: unknown): Promise<unknown> {
    return this.request('/admin/quizzes/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ==========================================
  // USER: QUIZ DISCOVERY
  // ==========================================

  async getRandomQuiz(tag: string | null = null, quizCount: number | null = null): Promise<unknown> {
    const params = new URLSearchParams();
    if (tag) params.append('tag', tag);
    if (quizCount) params.append('quiz_count', quizCount.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `/quizzes/random?${queryString}` : '/quizzes/random';
    return this.request(endpoint, { method: 'GET' });
  }

  async getQuizPreview(quizId: string): Promise<unknown> {
    return this.request(`/quizzes/${quizId}/preview`, { method: 'GET' });
  }

  // ==========================================
  // USER: QUIZ ATTEMPTS
  // ==========================================

  async startQuizAttempt(quizId: string): Promise<unknown> {
    return this.request(`/quizzes/${quizId}/start`, { method: 'POST' });
  }

  async submitAnswer(attemptId: string, payload: unknown): Promise<unknown> {
    return this.request(`/quizzes/attempts/${attemptId}/submit-answer`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getQuizResult(attemptId: string): Promise<unknown> {
    return this.request(`/quizzes/attempts/${attemptId}/result`, { method: 'GET' });
  }

  async getAttemptHistory(page: number = 1, perPage: number = 10): Promise<unknown> {
    return this.request(`/quizzes/attempts/history?page=${page}&per_page=${perPage}`, {
      method: 'GET'
    });
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  formatDate(isoDateTime: string): string {
    if (!isoDateTime) return '-';
    return new Date(isoDateTime).toLocaleDateString();
  }

  getQuestionTypeBadge(questionType: string): string {
    if (questionType === 'single_select') {
      return 'bg-blue-100 text-blue-800';
    } else if (questionType === 'multi_select') {
      return 'bg-purple-100 text-purple-800';
    }
    return 'bg-gray-100 text-gray-800';
  }

  determineQuestionType(answers: AnswerObject[]): string {
    const correctCount = answers.filter(a => a.is_correct).length;
    return correctCount >= 2 ? 'multi_select' : 'single_select';
  }

  calculateTotalPoints(questions: QuestionObject[]): number {
    return questions.reduce((sum, q) => sum + (q.points || 0), 0);
  }
}

export default new QuizAPI();
