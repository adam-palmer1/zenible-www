/**
 * Admin Subscriptions API Service
 * Handles subscription management, upgrades, downgrades, and cancellations
 */

import { createRequest } from '../httpClient';

const request = createRequest('AdminSubscriptionsAPI');

const adminSubscriptionsAPI = {
  async getSubscriptions(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/subscriptions/admin/all?${queryString}` : '/subscriptions/admin/all';
    return request(endpoint, { method: 'GET' });
  },

  async getCurrentSubscription(): Promise<unknown> {
    return request('/subscriptions/current', { method: 'GET' });
  },

  async createSubscription(data: unknown): Promise<unknown> {
    return request('/subscriptions/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async upgradeSubscription(data: unknown): Promise<unknown> {
    return request('/subscriptions/upgrade', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async downgradeSubscription(data: unknown): Promise<unknown> {
    return request('/subscriptions/downgrade', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async cancelSubscription(subscriptionId: string, options: { cancelAtPeriodEnd?: boolean; reason?: string; feedback?: string } = {}): Promise<unknown> {
    const { cancelAtPeriodEnd = true, reason = '', feedback = '' } = options;
    return request(`/subscriptions/admin/cancel/${subscriptionId}`, {
      method: 'POST',
      body: JSON.stringify({
        cancel_at_period_end: cancelAtPeriodEnd,
        reason,
        feedback
      })
    });
  },

  async reactivateSubscription(subscriptionId: string, options: { paymentMethodId?: string | null; billingCycle?: string | null } = {}): Promise<unknown> {
    const { paymentMethodId = null, billingCycle = null } = options;
    const body: Record<string, string> = {};
    if (paymentMethodId) body.payment_method_id = paymentMethodId;
    if (billingCycle) body.billing_cycle = billingCycle;

    return request(`/subscriptions/admin/reactivate/${subscriptionId}`, {
      method: 'POST',
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined
    });
  },

  async getSubscriptionUsage(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/subscriptions/usage?${queryString}` : '/subscriptions/usage';
    return request(endpoint, { method: 'GET' });
  },
};

export default adminSubscriptionsAPI;
