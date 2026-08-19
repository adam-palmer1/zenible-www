import { createRequest, buildQueryString } from '../httpClient';

const request = createRequest('BookingWebhooksAPI');

export interface WebhookEndpoint {
  id: string;
  name?: string | null;
  url: string;
  is_enabled: boolean;
  has_secret: boolean;
  last_success_at?: string | null;
  last_failure_at?: string | null;
  consecutive_failures: number;
  created_at: string;
  updated_at?: string | null;
}

export interface WebhookDelivery {
  id: string;
  endpoint_id: string;
  appointment_id?: string | null;
  event_id: string;
  event: string;
  status: 'pending' | 'delivered' | 'failed' | 'dead';
  attempt_count: number;
  next_attempt_at?: string | null;
  last_attempt_at?: string | null;
  delivered_at?: string | null;
  last_status_code?: number | null;
  last_error?: string | null;
  last_response_body?: string | null;
  payload?: Record<string, unknown> | null;
  created_at: string;
}

export interface WebhookDeliveryList {
  items: WebhookDelivery[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface WebhookTestResult {
  delivered: boolean;
  status_code?: number | null;
  error?: string | null;
}

const BASE = '/crm/booking-webhooks';

const bookingWebhooksAPI = {
  listEndpoints: () =>
    request(`${BASE}/endpoints`, { method: 'GET' }) as Promise<WebhookEndpoint[]>,

  createEndpoint: (data: {
    name?: string;
    url: string;
    secret: string;
    is_enabled?: boolean;
  }) =>
    request(`${BASE}/endpoints`, {
      method: 'POST',
      body: JSON.stringify(data),
    }) as Promise<WebhookEndpoint>,

  updateEndpoint: (
    id: string,
    data: { name?: string; url?: string; secret?: string; is_enabled?: boolean }
  ) =>
    request(`${BASE}/endpoints/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }) as Promise<WebhookEndpoint>,

  deleteEndpoint: (id: string) =>
    request(`${BASE}/endpoints/${id}`, { method: 'DELETE' }) as Promise<void>,

  testEndpoint: (id: string) =>
    request(`${BASE}/endpoints/${id}/test`, {
      method: 'POST',
      body: JSON.stringify({}),
    }) as Promise<WebhookTestResult>,

  listDeliveries: (
    params: { endpoint_id?: string; status?: string; page?: number; page_size?: number } = {}
  ) => {
    const queryString = buildQueryString(params as Record<string, string>);
    const endpoint = queryString ? `${BASE}/deliveries?${queryString}` : `${BASE}/deliveries`;
    return request(endpoint, { method: 'GET' }) as Promise<WebhookDeliveryList>;
  },

  resendDelivery: (id: string) =>
    request(`${BASE}/deliveries/${id}/resend`, {
      method: 'POST',
      body: JSON.stringify({}),
    }) as Promise<WebhookDelivery>,

  markAttendance: (
    appointmentId: string,
    attendanceStatus: 'completed' | 'no_show' | null
  ) =>
    request(`${BASE}/appointments/${appointmentId}/attendance`, {
      method: 'POST',
      body: JSON.stringify({ attendance_status: attendanceStatus }),
    }) as Promise<{ appointment_id: string; attendance_status: string | null }>,
};

export default bookingWebhooksAPI;
