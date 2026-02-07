/**
 * Admin Customization API Service
 * Handles customization questions, answers, stats, and categories
 */

import { createRequest } from '../httpClient';

const request = createRequest('AdminCustomizationAPI');

const adminCustomizationAPI = {
  async getAllCustomizationQuestions(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/admin/customization/?${queryString}` : '/admin/customization/';
    return request(endpoint);
  },

  async getCustomizationQuestion(questionId: string): Promise<unknown> {
    return request(`/admin/customization/${questionId}`);
  },

  async createCustomizationQuestion(data: unknown): Promise<unknown> {
    return request('/admin/customization/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateCustomizationQuestion(questionId: string, data: unknown): Promise<unknown> {
    return request(`/admin/customization/${questionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteCustomizationQuestion(questionId: string, force: boolean = false): Promise<unknown> {
    const endpoint = force
      ? `/admin/customization/${questionId}?force=true`
      : `/admin/customization/${questionId}`;
    return request(endpoint, { method: 'DELETE' });
  },

  async getQuestionAnswers(questionId: string): Promise<unknown> {
    return request(`/admin/customization/${questionId}/answers`);
  },

  async getAnswersByQuestion(questionId: string, params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/admin/customization/${questionId}/answers?${queryString}` : `/admin/customization/${questionId}/answers`;
    return request(endpoint);
  },

  async getCustomizationQuestionsStats(): Promise<unknown> {
    return request('/admin/customization/stats/overview');
  },

  async getCustomizationCategories(): Promise<unknown> {
    return request('/admin/customization/categories');
  },
};

export default adminCustomizationAPI;
