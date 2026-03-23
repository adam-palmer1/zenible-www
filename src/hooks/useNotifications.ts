import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/query-keys';
import notificationsAPI, { type NotificationListParams } from '../services/api/notifications';

export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => notificationsAPI.getUnreadCount(),
    staleTime: 0,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });
}

export function useNotificationList(params: NotificationListParams = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.notifications.list(params),
    queryFn: () => notificationsAPI.list(params),
    staleTime: 0,
    enabled: options?.enabled,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsAPI.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useMarkAsUnread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsAPI.markAsUnread(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsAPI.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
