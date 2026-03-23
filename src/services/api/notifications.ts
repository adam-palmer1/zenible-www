import { createRequest } from './httpClient';

const request = createRequest('Notifications');

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  action_url: string | null;
  is_read: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
  read_at: string | null;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface UnreadCountResponse {
  count: number;
}

export interface NotificationListParams {
  page?: number;
  per_page?: number;
  is_read?: boolean;
}

const notificationsAPI = {
  list(params: NotificationListParams = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.per_page) searchParams.set('per_page', String(params.per_page));
    if (params.is_read !== undefined) searchParams.set('is_read', String(params.is_read));
    const qs = searchParams.toString();
    return request<NotificationListResponse>(`/notifications${qs ? `?${qs}` : ''}`);
  },

  getUnreadCount() {
    return request<UnreadCountResponse>('/notifications/unread-count');
  },

  markAsRead(id: string) {
    return request<NotificationItem>(`/notifications/${id}/read`, { method: 'PATCH' });
  },

  markAsUnread(id: string) {
    return request<NotificationItem>(`/notifications/${id}/unread`, { method: 'PATCH' });
  },

  markAllAsRead() {
    return request<{ message: string; count: number }>('/notifications/mark-all-read', { method: 'PATCH' });
  },

  delete(id: string) {
    return request<null>(`/notifications/${id}`, { method: 'DELETE' });
  },
};

export default notificationsAPI;
