// Public plan API service for pricing page
import { API_BASE_URL } from '@/config/api';

class PlanAPI {
  // Public endpoints (no authentication required)
  async getPublicPlans() {
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
      console.error('Failed to fetch public plans:', error);
      throw error;
    }
  }

  async getPublicPlanDetails(planId) {
    try {
      const headers = {
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
      console.error('Failed to fetch plan details:', error);
      throw error;
    }
  }

  // Get plan with all its features (display and system)
  async getPlanWithFeatures(planId) {
    try {
      // Try with authentication if available
      const accessToken = localStorage.getItem('access_token');

      if (accessToken) {
        const response = await fetch(`${API_BASE_URL}/admin/features/plans/${planId}/features`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          return await response.json();
        }
      }

      // Fall back to basic plan details
      return this.getPublicPlanDetails(planId);
    } catch (error) {
      // Fall back to basic plan details if features endpoint is not available
      return this.getPublicPlanDetails(planId);
    }
  }

  // Authenticated endpoints
  async getCurrentSubscription() {
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
      console.error('Failed to fetch current subscription:', error);
      console.error('Error details:', error.message);
      return null;
    }
  }

  async createSubscription(planId, billingCycle = 'monthly', paymentMethodId = null) {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      throw new Error('Authentication required');
    }

    try {
      const body = {
        plan_id: planId,
        billing_cycle: billingCycle,
      };

      // Add payment method ID if provided
      if (paymentMethodId) {
        body.payment_method_id = paymentMethodId;
      }

      const response = await fetch(`${API_BASE_URL}/subscriptions/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to create subscription:', error);
      throw error;
    }
  }

  async upgradeSubscription(newPlanId, changeImmediately = false) {
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
      console.error('Failed to upgrade subscription:', error);
      throw error;
    }
  }

  async downgradeSubscription(newPlanId, changeAtPeriodEnd = true) {
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
      console.error('Failed to downgrade subscription:', error);
      throw error;
    }
  }

  async cancelSubscription(reason = '', cancelImmediately = false) {
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
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  async reactivateSubscription() {
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
      console.error('Failed to reactivate subscription:', error);
      throw error;
    }
  }

  async updatePaymentMethod(paymentMethodId, setAsDefault = true) {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      throw new Error('Authentication required');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/update-payment-method`, {
        method: 'POST',
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
      console.error('Failed to update payment method:', error);
      throw error;
    }
  }

  async getUserFeatures() {
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
      console.error('Failed to fetch user features:', error);
      return null;
    }
  }

  // Public character endpoints (no authentication required)
  async getPublicCharacters(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        page: params.page || 1,
        per_page: params.per_page || 100,
        is_active: true, // Only get active characters
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
      console.error('Failed to fetch public characters:', error);
      throw error;
    }
  }

  async getPublicCharacterCategories() {
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
      console.error('Failed to fetch character categories:', error);
      throw error;
    }
  }

  // Get all display features (admin endpoint but might be accessible)
  async getDisplayFeatures() {
    try {
      const accessToken = localStorage.getItem('access_token');
      const headers = {
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
      console.error('Failed to fetch display features:', error);
      return { features: [] };
    }
  }

  // Payment History endpoints
  async getPayments(params = {}) {
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
      console.error('Failed to fetch payments:', error);
      throw error;
    }
  }

  async getSubscriptionPayments(subscriptionId, params = {}) {
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
      console.error('Failed to fetch subscription payments:', error);
      throw error;
    }
  }

  async getPaymentHistory(params = {}) {
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
      console.error('Failed to fetch payment history:', error);
      throw error;
    }
  }

  async getPaymentDetails(paymentId) {
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
      console.error('Failed to fetch payment details:', error);
      throw error;
    }
  }

  async getInvoices(params = {}) {
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
      console.error('Failed to fetch invoices:', error);
      throw error;
    }
  }

  // Usage Dashboard - comprehensive view of user's plan, features, limits, and usage
  async getUsageDashboard() {
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
      console.error('Failed to fetch usage dashboard:', error);
      throw error;
    }
  }
}

export const planAPI = new PlanAPI();
export default planAPI;