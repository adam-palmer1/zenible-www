import React, { useState } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { useNotification } from '../contexts/NotificationContext';
import {
  useNotificationList,
  useUnreadCount,
  useMarkAsRead,
  useMarkAsUnread,
  useMarkAllAsRead,
  useDeleteNotification,
} from '../hooks/useNotifications';
import NotificationItem from '../components/notifications/NotificationItem';
import AppLayout from '../components/layout/AppLayout';
import { useNavigate } from 'react-router-dom';

type FilterTab = 'all' | 'unread' | 'read';

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const { showConfirm, showSuccess } = useNotification();

  const isReadFilter = activeTab === 'unread' ? false : activeTab === 'read' ? true : undefined;

  const { data, isLoading } = useNotificationList({
    page,
    per_page: 20,
    is_read: isReadFilter,
  });
  const { data: unreadData } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAsUnread = useMarkAsUnread();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  const unreadCount = unreadData?.count ?? 0;

  const handleMarkAllRead = async () => {
    const confirmed = await showConfirm(
      'Mark all notifications as read?',
      'This will mark all your unread notifications as read.'
    );
    if (confirmed) {
      markAllAsRead.mutate(undefined, {
        onSuccess: (result) => {
          showSuccess(`Marked ${result.count} notification(s) as read`);
        },
      });
    }
  };

  const handleNotificationClick = (notification: { id: string; action_url: string | null; is_read: boolean }) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
    { key: 'read', label: 'Read' },
  ];

  return (
    <AppLayout pageTitle="Notifications">
      {/* Top Bar - matches Invoice page style */}
      <div className="bg-white border-b border-[#e5e5e5] px-4 py-3 flex items-center justify-between min-h-[64px]">
        <h1 className="text-xl md:text-2xl font-semibold text-[#09090b]">
          Notifications
        </h1>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm text-purple-600 hover:text-purple-800 font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {/* Filter tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setPage(1); }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          </div>
        ) : data?.items && data.items.length > 0 ? (
          <>
            <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100 overflow-hidden">
              {data.items.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={handleNotificationClick}
                  onMarkRead={(id) => markAsRead.mutate(id)}
                  onMarkUnread={(id) => markAsUnread.mutate(id)}
                  onDelete={(id) => deleteNotification.mutate(id)}
                />
              ))}
            </div>

            {/* Pagination */}
            {data.total_pages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Page {data.page} of {data.total_pages} ({data.total} total)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                    disabled={page >= data.total_pages}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <BellIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              {activeTab === 'unread'
                ? "You're all caught up!"
                : 'No notifications yet'}
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
