// Public plan API service for pricing page
import logger from '../utils/logger';
import { ApiError } from './api/ApiError';
import { createRequest, createZbiRequest } from './api/httpClient';
import type { MonthlyUsageHistoryResponse } from '../types/usageHistory';

const request = createRequest('PlanAPI');
const zbiRequest = createZbiRequest('PlanAPI');

const requireAuth = (): void => {
  if (!localStorage.getItem('access_token')) {
    throw new Error('Authentication required');
  }
};

class PlanAPI {
  // Public endpoints (no authentication required)
  async getPublicPlans(): Promise<unknown> {
    return request('/plans/', { method: 'GET' });
  }

  async getPublicPlanDetails(planId: string): Promise<unknown> {
    return request(`/plans/${planId}`, { method: 'GET' });
  }

  // Get plan with all its features (display features from public endpoint)
  async getPlanWithFeatures(planId: string): Promise<unknown> {
    return this.getPublicPlanDetails(planId);
  }

  // Authenticated endpoints
  async getCurrentSubscription(): Promise<unknown> {
    if (!localStorage.getItem('access_token')) return null;

    try {
      return await request('/subscriptions/current', { method: 'GET' });
    } catch (error) {
      // No subscription is a 404 — not an error condition.
      if (error instanceof ApiError && error.isNotFound) return null;
      logger.error('Failed to fetch current subscription:', error);
      return null;
    }
  }

  async createSubscription(planId: string, billingCycle: string = 'monthly', paymentMethodId: string | null = null): Promise<unknown> {
    requireAuth();
    const body: Record<string, string> = {
      plan_id: planId,
      billing_cycle: billingCycle,
    };
    if (paymentMethodId) {
      body.payment_method_id = paymentMethodId;
    }
    return request('/subscriptions/', { method: 'POST', body: JSON.stringify(body) });
  }

  // Deprecated: use changeSubscription instead
  async upgradeSubscription(newPlanId: string, changeImmediately: boolean = false): Promise<unknown> {
    requireAuth();
    return request('/subscriptions/upgrade', {
      method: 'POST',
      body: JSON.stringify({
        new_plan_id: newPlanId,
        change_immediately: changeImmediately,
      }),
    });
  }

  // Deprecated: use changeSubscription instead
  async downgradeSubscription(newPlanId: string, changeAtPeriodEnd: boolean = true): Promise<unknown> {
    requireAuth();
    return request('/subscriptions/downgrade', {
      method: 'POST',
      body: JSON.stringify({
        new_plan_id: newPlanId,
        change_at_period_end: changeAtPeriodEnd,
      }),
    });
  }

  async previewPlanChange(newPlanId: string, options?: {
    billingCycle?: string;
  }): Promise<unknown> {
    requireAuth();
    return request('/subscriptions/preview-change', {
      method: 'POST',
      body: JSON.stringify({
        new_plan_id: newPlanId,
        billing_cycle: options?.billingCycle,
      }),
    });
  }

  async changeSubscription(newPlanId: string, options?: {
    billingCycle?: string;
    applyImmediately?: boolean;
    reason?: string;
    paymentMethodId?: string;
  }): Promise<unknown> {
    requireAuth();
    return request('/subscriptions/change', {
      method: 'POST',
      body: JSON.stringify({
        new_plan_id: newPlanId,
        billing_cycle: options?.billingCycle,
        apply_immediately: options?.applyImmediately,
        reason: options?.reason,
        payment_method_id: options?.paymentMethodId,
      }),
    });
  }

  async cancelSubscription(reason: string = '', cancelImmediately: boolean = false): Promise<unknown> {
    requireAuth();
    return request('/subscriptions/cancel', {
      method: 'POST',
      body: JSON.stringify({ reason, cancel_immediately: cancelImmediately }),
    });
  }

  async reactivateSubscription(): Promise<unknown> {
    requireAuth();
    return request('/subscriptions/reactivate', { method: 'POST' });
  }

  async updatePaymentMethod(paymentMethodId: string, setAsDefault: boolean = true): Promise<unknown> {
    requireAuth();
    return request('/subscriptions/payment-method', {
      method: 'PATCH',
      body: JSON.stringify({
        payment_method_id: paymentMethodId,
        set_as_default: setAsDefault,
      }),
    });
  }

  async getUserFeatures(): Promise<unknown> {
    if (!localStorage.getItem('access_token')) return null;
    try {
      return await request('/users/me/features', { method: 'GET' });
    } catch (error) {
      logger.error('Failed to fetch user features:', error);
      return null;
    }
  }

  // Public character endpoints (no authentication required)
  async getPublicCharacters(params: Record<string, string> = {}): Promise<unknown> {
    const queryParams = new URLSearchParams({
      page: params.page || '1',
      per_page: params.per_page || '100',
      is_active: 'true', // Only get active characters
      ...params,
    });
    return zbiRequest(`/ai/characters/?${queryParams}`, { method: 'GET' });
  }

  async getPublicCharacterCategories(): Promise<unknown> {
    return zbiRequest('/ai/characters/categories/', { method: 'GET' });
  }

  // Get all display features (admin endpoint but might be accessible)
  async getDisplayFeatures(): Promise<unknown> {
    try {
      return await request('/admin/features/display-features', { method: 'GET' });
    } catch (error) {
      logger.error('Failed to fetch display features:', error);
      return { features: [] };
    }
  }

  // Payment History endpoints
  async getPayments(params: Record<string, string> = {}): Promise<unknown> {
    requireAuth();
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', params.per_page);
    if (params.status) queryParams.append('status', params.status);
    if (params.type) queryParams.append('type', params.type);
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);
    return request(`/payments/?${queryParams}`, { method: 'GET' });
  }

  async getSubscriptionPayments(subscriptionId: string, params: Record<string, string> = {}): Promise<unknown> {
    requireAuth();
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', params.per_page);
    return request(`/subscriptions/${subscriptionId}/payments?${queryParams}`, { method: 'GET' });
  }

  async getPaymentHistory(params: Record<string, string> = {}): Promise<unknown> {
    requireAuth();
    const queryParams = new URLSearchParams();
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);
    return request(`/payments/history?${queryParams}`, { method: 'GET' });
  }

  async getPaymentDetails(paymentId: string): Promise<unknown> {
    requireAuth();
    return request(`/payments/${paymentId}`, { method: 'GET' });
  }

  async getInvoices(params: Record<string, string> = {}): Promise<unknown> {
    requireAuth();
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', params.per_page);
    return request(`/payments/invoices?${queryParams}`, { method: 'GET' });
  }

  // Usage Dashboard - comprehensive view of user's plan, features, limits, and usage
  async getUsageDashboard(): Promise<unknown> {
    requireAuth();
    return request('/users/me/usage-dashboard', { method: 'GET' });
  }

  // Usage history - month-by-month breakdown over the subscription lifespan.
  async getUsageHistory(): Promise<MonthlyUsageHistoryResponse> {
    requireAuth();
    return request<MonthlyUsageHistoryResponse>('/users/me/usage-history', { method: 'GET' });
  }

  async addPaymentMethodDuringTrial(paymentMethodId: string): Promise<unknown> {
    requireAuth();
    return request('/subscriptions/current/add-payment-method', {
      method: 'POST',
      body: JSON.stringify({ payment_method_id: paymentMethodId }),
    });
  }
}

export const planAPI = new PlanAPI();
export default planAPI;
