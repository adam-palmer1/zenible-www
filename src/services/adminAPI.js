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

class AdminAPI {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...getHeaders(),
        ...options.headers,
      },
    };

    console.log('Making request to:', url, 'with config:', config);

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        const error = new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
        error.response = errorData; // Attach the full error response for validation details
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
      console.error('Admin API request failed:', error);
      throw error;
    }
  }

  // Dashboard endpoints
  async getDashboardStats() {
    return this.request('/admin/dashboard/stats', { method: 'GET' });
  }

  async getDashboardRevenue(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/admin/dashboard/revenue?${queryString}` : '/admin/dashboard/revenue';
    return this.request(endpoint, { method: 'GET' });
  }

  async getDashboardUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/admin/dashboard/users?${queryString}` : '/admin/dashboard/users';
    return this.request(endpoint, { method: 'GET' });
  }

  // User management endpoints
  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/users/?${queryString}` : '/users/';
    return this.request(endpoint, { method: 'GET' });
  }

  async getUser(userId) {
    return this.request(`/users/${userId}`, { method: 'GET' });
  }

  async updateUser(userId, data) {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(userId) {
    return this.request(`/users/${userId}`, { method: 'DELETE' });
  }

  async restoreUser(userId) {
    return this.request(`/users/${userId}/restore`, { method: 'POST' });
  }

  async updateUserRole(userId, role) {
    return this.request(`/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async getUserPayments(userId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/users/${userId}/payments?${queryString}` : `/users/${userId}/payments`;
    return this.request(endpoint, { method: 'GET' });
  }

  async getUserSubscriptions(userId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/users/${userId}/subscriptions?${queryString}` : `/users/${userId}/subscriptions`;
    return this.request(endpoint, { method: 'GET' });
  }

  // Admin-specific user actions
  async assignPlanToUser(userId, planId, billingCycle = 'monthly') {
    return this.request(`/admin/users/${userId}/assign-plan`, {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId, billing_cycle: billingCycle }),
    });
  }

  async verifyUserEmail(userId) {
    return this.request(`/admin/users/${userId}/verify-email`, { method: 'POST' });
  }

  async resetUserApiUsage(userId) {
    return this.request(`/admin/users/${userId}/reset-api-usage`, { method: 'POST' });
  }

  // Plan management endpoints
  async getPlans(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/plans/?${queryString}` : '/plans/';
    return this.request(endpoint, { method: 'GET' });
  }

  async getPlan(planId) {
    return this.request(`/plans/${planId}`, { method: 'GET' });
  }

  async createPlan(data) {
    return this.request('/plans/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePlan(planId, data) {
    return this.request(`/plans/${planId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePlan(planId) {
    return this.request(`/plans/${planId}`, { method: 'DELETE' });
  }

  async getPlanSubscribers(planId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/plans/${planId}/subscribers?${queryString}` : `/plans/${planId}/subscribers`;
    return this.request(endpoint, { method: 'GET' });
  }

  async syncPlanWithStripe(planId, options = {}) {
    const defaultOptions = {
      sync_prices: true,
      create_if_missing: true,
      archive_old_prices: false
    };
    return this.request(`/plans/${planId}/sync-stripe`, {
      method: 'POST',
      body: JSON.stringify({ ...defaultOptions, ...options }),
    });
  }

  async activatePlan(planId) {
    return this.request(`/admin/plans/${planId}/activate`, { method: 'POST' });
  }

  async deactivatePlan(planId) {
    return this.request(`/admin/plans/${planId}/deactivate`, { method: 'POST' });
  }

  // Subscription management endpoints
  async getSubscriptions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/subscriptions/admin/all?${queryString}` : '/subscriptions/admin/all';
    return this.request(endpoint, { method: 'GET' });
  }

  async getCurrentSubscription() {
    return this.request('/subscriptions/current', { method: 'GET' });
  }

  async createSubscription(data) {
    return this.request('/subscriptions/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async upgradeSubscription(data) {
    return this.request('/subscriptions/upgrade', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async downgradeSubscription(data) {
    return this.request('/subscriptions/downgrade', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async cancelSubscription(subscriptionId, options = {}) {
    const { cancelAtPeriodEnd = true, reason = '', feedback = '' } = options;
    return this.request(`/subscriptions/admin/cancel/${subscriptionId}`, {
      method: 'POST',
      body: JSON.stringify({
        cancel_at_period_end: cancelAtPeriodEnd,
        reason,
        feedback
      })
    });
  }

  async reactivateSubscription(subscriptionId, options = {}) {
    const { paymentMethodId = null, billingCycle = null } = options;
    const body = {};
    if (paymentMethodId) body.payment_method_id = paymentMethodId;
    if (billingCycle) body.billing_cycle = billingCycle;

    return this.request(`/subscriptions/admin/reactivate/${subscriptionId}`, {
      method: 'POST',
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined
    });
  }

  async getSubscriptionUsage(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/subscriptions/usage?${queryString}` : '/subscriptions/usage';
    return this.request(endpoint, { method: 'GET' });
  }

  // Payment management endpoints
  async getAllPayments(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/payments/admin/all?${queryString}` : '/payments/admin/all';
    return this.request(endpoint, { method: 'GET' });
  }

  async getPaymentStats(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/payments/admin/stats?${queryString}` : '/payments/admin/stats';
    return this.request(endpoint, { method: 'GET' });
  }

  async getPayments(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/payments/?${queryString}` : '/payments/';
    return this.request(endpoint, { method: 'GET' });
  }

  async getPayment(paymentId) {
    return this.request(`/payments/${paymentId}`, { method: 'GET' });
  }

  async getPaymentHistory(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/payments/history?${queryString}` : '/payments/history';
    return this.request(endpoint, { method: 'GET' });
  }

  async getInvoices(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/payments/invoices?${queryString}` : '/payments/invoices';
    return this.request(endpoint, { method: 'GET' });
  }

  async refundPayment(paymentId, data = {}) {
    return this.request(`/payments/refund/${paymentId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Audit logs endpoint
  async getAuditLogs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/admin/audit-logs?${queryString}` : '/admin/audit-logs';
    return this.request(endpoint, { method: 'GET' });
  }

  // User Profile endpoints
  async getUserProfile() {
    return this.request('/users/profile', { method: 'GET' });
  }

  async updateUserProfile(data) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Password reset endpoints
  async forgotPassword(email) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resendVerificationEmail() {
    return this.request('/auth/resend-verification', { method: 'POST' });
  }

  // Thread management endpoints
  async getThreads(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/ai/threads/?${queryString}` : '/ai/threads/';
    return this.request(endpoint, { method: 'GET' });
  }

  async getThread(threadId) {
    return this.request(`/ai/threads/${threadId}`, { method: 'GET' });
  }

  async getOpenAIThread(threadId) {
    return this.request(`/ai/threads/${threadId}/openai`, { method: 'GET' });
  }

  async getThreadMessages(threadId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/ai/threads/${threadId}/messages?${queryString}` : `/ai/threads/${threadId}/messages`;
    return this.request(endpoint, { method: 'GET' });
  }

  async deleteThread(threadId, deleteFromOpenAI = true) {
    const endpoint = `/ai/threads/${threadId}?delete_from_openai=${deleteFromOpenAI}`;
    return this.request(endpoint, { method: 'DELETE' });
  }

  async updateThreadStatus(threadId, status) {
    return this.request(`/ai/threads/${threadId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async getUserThreads(userId) {
    return this.request(`/ai/threads/user/${userId}`, { method: 'GET' });
  }

  async cleanupOrphanedThreads(dryRun = true) {
    const endpoint = `/ai/threads/cleanup?dry_run=${dryRun}`;
    return this.request(endpoint, { method: 'POST' });
  }

  // AI Character management endpoints
  async getAICharacters(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/ai/characters/?${queryString}` : '/ai/characters/';
    return this.request(endpoint, { method: 'GET' });
  }

  async getAICharacter(characterId) {
    return this.request(`/ai/characters/${characterId}`, { method: 'GET' });
  }

  async createAICharacter(data) {
    return this.request('/ai/characters/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAICharacter(characterId, data) {
    return this.request(`/ai/characters/${characterId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAICharacter(characterId) {
    return this.request(`/ai/characters/${characterId}`, { method: 'DELETE' });
  }

  // Upload avatar for AI character
  async uploadAICharacterAvatar(characterId, file) {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${API_BASE_URL}/ai/characters/${characterId}/avatar`;
    const token = localStorage.getItem('access_token');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type for FormData, browser will set it with boundary
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Avatar upload failed' }));
      throw new Error(error.detail || `Avatar upload failed with status ${response.status}`);
    }

    return await response.json();
  }

  // Delete avatar for AI character
  async deleteAICharacterAvatar(characterId) {
    const url = `${API_BASE_URL}/ai/characters/${characterId}/avatar`;
    const token = localStorage.getItem('access_token');

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok && response.status !== 204) {
      const error = await response.json().catch(() => ({ detail: 'Avatar deletion failed' }));
      throw new Error(error.detail || `Avatar deletion failed with status ${response.status}`);
    }

    return response.status === 204 ? { success: true } : await response.json();
  }

  // AI Character Category endpoints
  async getAICharacterCategories(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/ai/characters/categories/?${queryString}` : '/ai/characters/categories/';
    return this.request(endpoint, { method: 'GET' });
  }

  async getAICharacterCategory(categoryId) {
    return this.request(`/ai/characters/categories/${categoryId}`, { method: 'GET' });
  }

  async createAICharacterCategory(data) {
    return this.request('/ai/characters/categories/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAICharacterCategory(categoryId, data) {
    return this.request(`/ai/characters/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAICharacterCategory(categoryId) {
    return this.request(`/ai/characters/categories/${categoryId}`, { method: 'DELETE' });
  }

  // Sync AI Character with OpenAI Assistant
  async syncAICharacterWithAssistant(characterId, force = false) {
    return this.request(`/ai/characters/${characterId}/sync`, {
      method: 'POST',
      body: JSON.stringify({ force }),
    });
  }

  // User Preferences
  async getPreferences(category = null) {
    const params = category ? `?category=${category}` : '';
    return this.request(`/preferences${params}`);
  }

  async getPreferencesDict(category = null) {
    const params = category ? `?category=${category}` : '';
    return this.request(`/preferences/dict${params}`);
  }

  async getPreferenceCategories() {
    return this.request('/preferences/categories');
  }

  async getPreference(key) {
    return this.request(`/preferences/${key}`);
  }

  async setPreference(key, data) {
    return this.request(`/preferences/${key}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePreference(key) {
    return this.request(`/preferences/${key}`, { method: 'DELETE' });
  }

  async bulkGetPreferences(keys, category = null) {
    return this.request('/preferences/bulk', {
      method: 'POST',
      body: JSON.stringify({ keys, category }),
    });
  }

  async bulkSetPreferences(data) {
    return this.request('/preferences/bulk', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async clearPreferences(category = null) {
    const params = category ? `?category=${category}` : '';
    return this.request(`/preferences${params}`, { method: 'DELETE' });
  }

  // OpenAI Model Management endpoints
  async syncOpenAIModels(options = {}) {
    return this.request('/admin/openai/models/sync', {
      method: 'POST',
      body: JSON.stringify({
        force: options.force || false,
        update_pricing: options.update_pricing !== false, // Default true
        deactivate_missing: options.deactivate_missing || false,
      }),
    });
  }

  async getOpenAIModels(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/admin/openai/models?${queryString}` : '/admin/openai/models';
    return this.request(endpoint, { method: 'GET' });
  }

  async updateOpenAIModel(modelId, data) {
    return this.request(`/admin/openai/models/${modelId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getOpenAITools() {
    return this.request('/admin/openai/tools', { method: 'GET' });
  }

  async getAICharacterShortcodes() {
    return this.request('/ai/characters/shortcodes', { method: 'GET' });
  }

  // Conversation Management endpoints
  async getConversations(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/ai/conversations/admin/all?${queryString}` : '/ai/conversations/admin/all';
    return this.request(endpoint, { method: 'GET' });
  }

  async getConversation(conversationId) {
    return this.request(`/ai/conversations/admin/${conversationId}`, { method: 'GET' });
  }

  async getConversationStats(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/ai/conversations/admin/stats?${queryString}` : '/ai/conversations/admin/stats';
    return this.request(endpoint, { method: 'GET' });
  }

  async exportConversation(conversationId, format = 'json') {
    const response = await this.request(`/ai/conversations/admin/${conversationId}/export`, {
      method: 'POST',
      body: JSON.stringify({ format }),
    });

    // Handle different export formats
    if (format === 'json') {
      return response;
    } else if (format === 'csv' || format === 'txt') {
      // For CSV and TXT, the response might be text/plain
      // Convert to downloadable format
      const blob = new Blob([response], {
        type: format === 'csv' ? 'text/csv' : 'text/plain'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation_${conversationId}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      return { success: true, format };
    }

    return response;
  }

  // Feature Management endpoints

  // Display Features
  async getDisplayFeatures() {
    return this.request('/admin/features/display-features', { method: 'GET' });
  }

  async getDisplayFeature(featureId) {
    return this.request(`/admin/features/display-features/${featureId}`, { method: 'GET' });
  }

  async createDisplayFeature(data) {
    return this.request('/admin/features/display-features', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDisplayFeature(featureId, data) {
    return this.request(`/admin/features/display-features/${featureId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDisplayFeature(featureId) {
    return this.request(`/admin/features/display-features/${featureId}`, { method: 'DELETE' });
  }

  // System Features
  async getSystemFeatures() {
    return this.request('/admin/features/system-features', { method: 'GET' });
  }

  async getSystemFeature(featureId) {
    return this.request(`/admin/features/system-features/${featureId}`, { method: 'GET' });
  }

  async createSystemFeature(data) {
    return this.request('/admin/features/system-features', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSystemFeature(featureId, data) {
    return this.request(`/admin/features/system-features/${featureId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSystemFeature(featureId) {
    return this.request(`/admin/features/system-features/${featureId}`, { method: 'DELETE' });
  }

  // Plan Feature Assignments
  async getPlanFeatures(planId) {
    return this.request(`/admin/features/plans/${planId}/features`, { method: 'GET' });
  }

  async updatePlanDisplayFeatures(planId, features) {
    return this.request(`/admin/features/plans/${planId}/display-features`, {
      method: 'PUT',
      body: JSON.stringify({ features }),
    });
  }

  async updatePlanSystemFeatures(planId, features) {
    return this.request(`/admin/features/plans/${planId}/system-features`, {
      method: 'PUT',
      body: JSON.stringify({ features }),
    });
  }

  async updatePlanCharacterAccess(planId, characters) {
    return this.request(`/admin/features/plans/${planId}/character-access`, {
      method: 'PUT',
      body: JSON.stringify({ characters }),
    });
  }

  // Customization Questions Management
  async getAllCustomizationQuestions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/admin/customization/?${queryString}` : '/admin/customization/';
    return this.request(endpoint);
  }

  async getCustomizationQuestion(questionId) {
    return this.request(`/admin/customization/${questionId}`);
  }

  async createCustomizationQuestion(data) {
    return this.request('/admin/customization/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCustomizationQuestion(questionId, data) {
    return this.request(`/admin/customization/${questionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCustomizationQuestion(questionId) {
    return this.request(`/admin/customization/${questionId}`, { method: 'DELETE' });
  }

  async getQuestionAnswers(questionId) {
    return this.request(`/admin/customization/${questionId}/answers`);
  }

  async getAnswersByQuestion(questionId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/admin/customization/${questionId}/answers?${queryString}` : `/admin/customization/${questionId}/answers`;
    return this.request(endpoint);
  }

  async getCustomizationQuestionsStats() {
    return this.request('/admin/customization/stats/overview');
  }

  async getCustomizationCategories() {
    return this.request('/admin/customization/categories');
  }

  // Platform management endpoints
  async getAllPlatforms(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/platforms/?${queryString}` : '/platforms/';
    return this.request(endpoint, { method: 'GET' });
  }

  async createPlatform(data) {
    return this.request('/platforms/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePlatform(platformId, data) {
    return this.request(`/platforms/${platformId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePlatform(platformId) {
    return this.request(`/platforms/${platformId}`, {
      method: 'DELETE',
    });
  }

  // Character-Platform configuration endpoints
  async getCharacterPlatforms(characterId) {
    return this.request(`/ai/characters/${characterId}/platforms`, {
      method: 'GET',
    });
  }

  async addCharacterPlatform(characterId, data) {
    return this.request(`/ai/characters/${characterId}/platforms`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCharacterPlatform(characterId, platformId, data) {
    return this.request(`/ai/characters/${characterId}/platforms/${platformId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCharacterPlatform(characterId, platformId) {
    return this.request(`/ai/characters/${characterId}/platforms/${platformId}`, {
      method: 'DELETE',
    });
  }

  // AI Tools Management endpoints

  /**
   * Get all AI tools with optional filtering
   * @param {Object} params - Query parameters
   * @param {boolean} params.active_only - Filter by active tools only (default: true)
   * @returns {Promise<Array>} List of AI tools
   */
  async getAITools(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/admin/ai-tools/?${queryString}` : '/admin/ai-tools/';
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * Get a specific AI tool by ID
   * @param {string} toolId - The tool ID
   * @returns {Promise<Object>} Tool object
   */
  async getAITool(toolId) {
    return this.request(`/admin/ai-tools/${toolId}`, { method: 'GET' });
  }

  /**
   * Create a new AI tool
   * @param {Object} data - Tool data
   * @param {string} data.name - Tool name (unique)
   * @param {string} data.description - Tool description
   * @param {Object} data.argument_schema - JSON Schema for tool arguments
   * @param {boolean} data.is_active - Whether tool is active
   * @returns {Promise<Object>} Created tool object
   */
  async createAITool(data) {
    console.log('createAITool called with:', data);
    try {
      const result = await this.request('/admin/ai-tools/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      console.log('createAITool result:', result);
      return result;
    } catch (error) {
      console.error('createAITool error:', error);
      throw error;
    }
  }

  /**
   * Update an existing AI tool
   * @param {string} toolId - Tool ID
   * @param {Object} data - Updated tool data
   * @returns {Promise<Object>} Updated tool object
   */
  async updateAITool(toolId, data) {
    return this.request(`/admin/ai-tools/${toolId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete an AI tool
   * @param {string} toolId - Tool ID
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteAITool(toolId) {
    return this.request(`/admin/ai-tools/${toolId}`, { method: 'DELETE' });
  }

  // Character Tool Instructions endpoints

  /**
   * Get character tool instructions with optional filtering
   * @param {Object} params - Query parameters
   * @param {string} params.character_id - Filter by character ID
   * @param {string} params.tool_id - Filter by tool ID
   * @param {boolean} params.enabled_only - Filter by enabled associations (default: true)
   * @returns {Promise<Array>} List of character tool instructions
   */
  async getCharacterToolInstructions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/admin/ai-tools/character-tools/?${queryString}` : '/admin/ai-tools/character-tools/';
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * Assign a tool to a character with custom instructions
   * @param {Object} data - Assignment data
   * @param {string} data.character_id - Character ID
   * @param {string} data.tool_id - Tool ID
   * @param {string} data.instructions - Custom instructions for this character
   * @param {boolean} data.is_enabled - Whether assignment is enabled
   * @returns {Promise<Object>} Created assignment
   */
  async assignToolToCharacter(data) {
    return this.request('/admin/ai-tools/character-tools/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update character tool instructions
   * @param {string} instructionsId - Instructions ID
   * @param {Object} data - Updated data
   * @param {string} data.instructions - Updated instructions
   * @param {boolean} data.is_enabled - Whether assignment is enabled
   * @returns {Promise<Object>} Updated assignment
   */
  async updateCharacterToolInstructions(instructionsId, data) {
    return this.request(`/admin/ai-tools/character-tools/${instructionsId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Remove a tool from a character
   * @param {string} instructionsId - Instructions ID
   * @returns {Promise<Object>} Removal confirmation
   */
  async removeToolFromCharacter(instructionsId) {
    return this.request(`/admin/ai-tools/character-tools/${instructionsId}`, { method: 'DELETE' });
  }

  /**
   * Get all tools assigned to a specific character
   * @param {string} characterId - Character ID
   * @param {Object} params - Query parameters
   * @param {boolean} params.enabled_only - Filter by enabled tools (default: true)
   * @returns {Promise<Object>} Character tools data
   */
  async getCharacterTools(characterId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/admin/ai-tools/characters/${characterId}/tools?${queryString}`
      : `/admin/ai-tools/characters/${characterId}/tools`;
    return this.request(endpoint, { method: 'GET' });
  }

  // Completion Questions Management endpoints

  /**
   * Get completion questions for a character tool assignment
   * @param {string} instructionsId - The character tool instructions ID
   * @returns {Promise<Array>} List of completion questions
   */
  async getCompletionQuestions(instructionsId) {
    return this.request(`/admin/ai-tools/character-tools/${instructionsId}/completion-questions`, {
      method: 'GET'
    });
  }

  /**
   * Create a single completion question for a character tool assignment
   * @param {string} instructionsId - The character tool instructions ID
   * @param {Object} questionData - Question data
   * @param {string} questionData.question_type - Type: text, number, select, multiselect, boolean
   * @param {string} questionData.question_text - The question text
   * @param {Object} questionData.validation_rules - Validation rules (optional)
   * @param {boolean} questionData.is_required - Whether question is required
   * @param {number} questionData.order_index - Display order
   * @returns {Promise<Object>} Created question
   */
  async createCompletionQuestion(instructionsId, questionData) {
    return this.request(`/admin/ai-tools/character-tools/${instructionsId}/completion-questions`, {
      method: 'POST',
      body: JSON.stringify(questionData)
    });
  }

  /**
   * Bulk create/replace completion questions for a character tool assignment
   * @param {string} instructionsId - The character tool instructions ID
   * @param {Array} questionsArray - Array of question objects
   * @returns {Promise<Array>} Created questions
   */
  async bulkCreateCompletionQuestions(instructionsId, questionsArray) {
    return this.request(`/admin/ai-tools/character-tools/${instructionsId}/completion-questions/bulk`, {
      method: 'POST',
      body: JSON.stringify({
        character_tool_instructions_id: instructionsId,
        questions: questionsArray
      })
    });
  }

  /**
   * Update a completion question
   * @param {string} questionId - The question ID
   * @param {Object} questionData - Updated question data
   * @returns {Promise<Object>} Updated question
   */
  async updateCompletionQuestion(questionId, questionData) {
    return this.request(`/admin/ai-tools/completion-questions/${questionId}`, {
      method: 'PUT',
      body: JSON.stringify(questionData)
    });
  }

  /**
   * Delete a completion question
   * @param {string} questionId - The question ID
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteCompletionQuestion(questionId) {
    return this.request(`/admin/ai-tools/completion-questions/${questionId}`, {
      method: 'DELETE'
    });
  }

  // Tips Management endpoints

  /**
   * Get all tips with pagination and filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (≥1)
   * @param {number} params.per_page - Items per page (1-100)
   * @param {string} params.character_id - Filter by AI character ID
   * @param {boolean} params.is_active - Filter by active status
   * @param {string} params.search - Search in content
   * @returns {Promise<Object>} Paginated tips list
   */
  async getTips(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/admin/tips/?${queryString}` : '/admin/tips/';
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * Get a specific tip by ID
   * @param {string} tipId - Tip ID
   * @returns {Promise<Object>} Tip object
   */
  async getTip(tipId) {
    return this.request(`/admin/tips/${tipId}`, { method: 'GET' });
  }

  /**
   * Create a new tip
   * @param {Object} data - Tip data
   * @param {string} data.content - Main tip content (required)
   * @param {string} data.ai_character_id - AI Character ID (optional)
   * @param {boolean} data.is_active - Whether tip is active (default: true)
   * @param {number} data.priority - Priority 1-10 (default: 1)
   * @returns {Promise<Object>} Created tip object
   */
  async createTip(data) {
    return this.request('/admin/tips/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update an existing tip
   * @param {string} tipId - Tip ID
   * @param {Object} data - Updated tip data
   * @returns {Promise<Object>} Updated tip object
   */
  async updateTip(tipId, data) {
    return this.request(`/admin/tips/${tipId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a tip
   * @param {string} tipId - Tip ID
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteTip(tipId) {
    return this.request(`/admin/tips/${tipId}`, { method: 'DELETE' });
  }

  /**
   * Bulk create tips
   * @param {Array} tips - Array of tip objects to create
   * @returns {Promise<Array>} Created tips
   */
  async bulkCreateTips(tips) {
    return this.request('/admin/tips/bulk', {
      method: 'POST',
      body: JSON.stringify({ tips }),
    });
  }

  /**
   * Perform bulk actions on tips
   * @param {Object} data - Bulk action data
   * @param {Array<string>} data.tip_ids - List of tip IDs
   * @param {string} data.action - Action: activate, deactivate, delete, assign
   * @param {string} data.ai_character_id - Required for assign action
   * @returns {Promise<Object>} Action result
   */
  async bulkActionTips(data) {
    return this.request('/admin/tips/bulk-action', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get tips analytics
   * @param {Object} params - Query parameters
   * @param {number} params.days - Number of days to analyze (1-365, default: 30)
   * @param {string} params.character_id - Filter by character ID
   * @returns {Promise<Object>} Analytics data
   */
  async getTipsAnalytics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/admin/tips/analytics?${queryString}` : '/admin/tips/analytics';
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * Get tips engagement statistics
   * @param {Object} params - Query parameters
   * @param {number} params.days - Number of days to analyze (1-365, default: 30)
   * @returns {Promise<Object>} Engagement statistics
   */
  async getTipsEngagement(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/admin/tips/engagement?${queryString}` : '/admin/tips/engagement';
    return this.request(endpoint, { method: 'GET' });
  }
}

export const adminAPI = new AdminAPI();
export default adminAPI;