/**
 * Admin Coupons API Service
 */
import { createRequest } from '../httpClient';

const request = createRequest('AdminCouponsAPI');

const adminCouponsAPI = {
  async getCoupons(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/coupons/?${queryString}` : '/coupons/';
    return request(endpoint, { method: 'GET' });
  },

  async getCoupon(couponId: string): Promise<unknown> {
    return request(`/coupons/${couponId}`, { method: 'GET' });
  },

  async createCoupon(data: unknown): Promise<unknown> {
    return request('/coupons/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateCoupon(couponId: string, data: unknown): Promise<unknown> {
    return request(`/coupons/${couponId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deactivateCoupon(couponId: string): Promise<unknown> {
    return request(`/coupons/${couponId}/deactivate`, { method: 'POST' });
  },

  async syncCouponToStripe(couponId: string): Promise<unknown> {
    return request(`/coupons/${couponId}/sync-stripe`, { method: 'POST' });
  },

  async syncAllCouponsToStripe(): Promise<unknown> {
    return request('/coupons/sync-all-stripe', { method: 'POST' });
  },

  async deleteCoupon(couponId: string): Promise<unknown> {
    return request(`/coupons/${couponId}`, { method: 'DELETE' });
  },
};

export default adminCouponsAPI;
