// Public plan API service for pricing page
import { API_BASE_URL } from '@/config/api';
import logger from '../utils/logger';

class PlanAPI {
  // Public endpoints (no authentication required)
  async getPublicPlans(): Promise<unknown> {
    try {
      const response = await fetch(`${API_BASE_URL}/plans/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || error.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error('Failed to fetch public plans:', error);
      throw error;
    }
  }

  async getPublicPlanDetails(planId: string): Promise<unknown> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Include auth token if available
      const accessToken = localStorage.getItem('access_token');
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${API_BASE_URL}/plans/${planId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to fetch plan details:', error);
      throw error;
    }
  }

  // Get plan with all its features (display features from public endpoint)
  async getPlanWithFeatures(planId: string): Promise<unknown> {
    return this.getPublicPlanDetails(planId);
  }

  // Authenticated endpoints
  async getCurrentSubscription(): Promise<unknown> {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/current`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.status === 404) {
        // No subscription found
        return null;
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || error.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error('Failed to fetch current subscription:', error);
      logger.error('Error details:', (error as Error).message);
      return null;
    }
  }

  async createSubscription(planId: string, billingCycle: string = 'monthly', paymentMethodId: string | null = null): Promise<unknown> {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      throw new Error('Authentication required');
    }

    try {
      const body: Record<string, string> = {
        plan_id: planId,
        billing_cycle: billingCycle,
      };

      // Add payment method ID if provided
      if (paymentMethodId) {
        body.payment_method_id = paymentMethodId;
      }

      const response = await fetch(`${API_BASE_URL}/subscriptions/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        const detail = error.detail;
        const message = typeof detail === 'string'
          ? detail
          : typeof detail === 'object' && detail !== null
            ? Object.entries(detail).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('; ')
            : error.message || `HTTP error! status: ${response.status}`;
        throw new Error(message);
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to create subscription:', error);
      throw error;
    }
  }

  // Deprecated: use changeSubscription instead
  async upgradeSubscription(newPlanId: string, changeImmediately: boolean = false): Promise<unknown> {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      throw new Error('Authentication required');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          new_plan_id: newPlanId,
          change_immediately: changeImmediately,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to upgrade subscription:', error);
      throw error;
    }
  }

  // Deprecated: use changeSubscription instead
  async downgradeSubscription(newPlanId: string, changeAtPeriodEnd: boolean = true): Promise<unknown> {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      throw new Error('Authentication required');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/downgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          new_plan_id: newPlanId,
          change_at_period_end: changeAtPeriodEnd,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to downgrade subscription:', error);
      throw error;
    }
  }

  async previewPlanChange(newPlanId: string, options?: {
    billingCycle?: string;
  }): Promise<unknown> {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      throw new Error('Authentication required');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/preview-change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          new_plan_id: newPlanId,
          billing_cycle: options?.billingCycle,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        const detail = error.detail;
        const message = typeof detail === 'string'
          ? detail
          : typeof detail === 'object' && detail !== null
            ? (detail.message || JSON.stringify(detail))
            : error.message || `HTTP error! status: ${response.status}`;
        throw new Error(message);
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to preview plan change:', error);
      throw error;
    }
  }

  async changeSubscription(newPlanId: string, options?: {
    billingCycle?: string;
    applyImmediately?: boolean;
    reason?: string;
    paymentMethodId?: string;
  }): Promise<unknown> {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      throw new Error('Authentication required');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          new_plan_id: newPlanId,
          billing_cycle: options?.billingCycle,
          apply_immediately: options?.applyImmediately,
          reason: options?.reason,
          payment_method_id: options?.paymentMethodId,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        const detail = error.detail;
        const message = typeof detail === 'string'
          ? detail
          : typeof detail === 'object' && detail !== null
            ? (detail.message || JSON.stringify(detail))
            : error.message || `HTTP error! status: ${response.status}`;
        throw new Error(message);
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to change subscription:', error);
      throw error;
    }
  }

  async cancelSubscription(reason: string = '', cancelImmediately: boolean = false): Promise<unknown> {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      throw new Error('Authentication required');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          reason,
          cancel_immediately: cancelImmediately,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  async reactivateSubscription(): Promise<unknown> {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      throw new Error('Authentication required');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/reactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to reactivate subscription:', error);
      throw error;
    }
  }

  async updatePaymentMethod(paymentMethodId: string, setAsDefault: boolean = true): Promise<unknown> {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      throw new Error('Authentication required');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/payment-method`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          payment_method_id: paymentMethodId,
          set_as_default: setAsDefault,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to update payment method:', error);
      throw error;
    }
  }

  async getUserFeatures(): Promise<unknown> {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/users/me/features`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to fetch user features:', error);
      return null;
    }
  }

  // Public character endpoints (no authentication required)
  async getPublicCharacters(params: Record<string, string> = {}): Promise<unknown> {
    try {
      const queryParams = new URLSearchParams({
        page: params.page || '1',
        per_page: params.per_page || '100',
        is_active: 'true', // Only get active characters
        ...params
      });

      const response = await fetch(`${API_BASE_URL}/ai/characters/?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to fetch public characters:', error);
      throw error;
    }
  }

  async getPublicCharacterCategories(): Promise<unknown> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/characters/categories/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to fetch character categories:', error);
      throw error;
    }
  }

  // Get all display features (admin endpoint but might be accessible)
  async getDisplayFeatures(): Promise<unknown> {
    try {
      const accessToken = localStorage.getItem('access_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${API_BASE_URL}/admin/features/display-features`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        return { features: [] };
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to fetch display features:', error);
      return { features: [] };
    }
  }

  // Payment History endpoints
  async getPayments(params: Record<string, string> = {}): Promise<unknown> {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      throw new Error('Authentication required');
    }

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.per_page) queryParams.append('per_page', params.per_page);
      if (params.status) queryParams.append('status', params.status);
      if (params.type) queryParams.append('type', params.type);
      if (params.start_date) queryParams.append('start_date', params.start_date);
      if (params.end_date) queryParams.append('end_date', params.end_date);

      const response = await fetch(`${API_BASE_URL}/payments/?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to fetch payments:', error);
      throw error;
    }
  }

  async getSubscriptionPayments(subscriptionId: string, params: Record<string, string> = {}): Promise<unknown> {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      throw new Error('Authentication required');
    }

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.per_page) queryParams.append('per_page', params.per_page);

      const response = await fetch(`${API_BASE_URL}/subscriptions/${subscriptionId}/payments?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to fetch subscription payments:', error);
      throw error;
    }
  }

  async getPaymentHistory(params: Record<string, string> = {}): Promise<unknown> {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      throw new Error('Authentication required');
    }

    try {
      const queryParams = new URLSearchParams();
      if (params.start_date) queryParams.append('start_date', params.start_date);
      if (params.end_date) queryParams.append('end_date', params.end_date);

      const response = await fetch(`${API_BASE_URL}/payments/history?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to fetch payment history:', error);
      throw error;
    }
  }

  async getPaymentDetails(paymentId: string): Promise<unknown> {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      throw new Error('Authentication required');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to fetch payment details:', error);
      throw error;
    }
  }

  async getInvoices(params: Record<string, string> = {}): Promise<unknown> {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      throw new Error('Authentication required');
    }

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.per_page) queryParams.append('per_page', params.per_page);

      const response = await fetch(`${API_BASE_URL}/payments/invoices?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to fetch invoices:', error);
      throw error;
    }
  }

  // Usage Dashboard - comprehensive view of user's plan, features, limits, and usage
  async getUsageDashboard(): Promise<unknown> {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      throw new Error('Authentication required');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/me/usage-dashboard`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to fetch usage dashboard:', error);
      throw error;
    }
  }
}

export const planAPI = new PlanAPI();
export default planAPI;
