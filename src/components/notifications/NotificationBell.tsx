import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { BellIcon } from '@heroicons/react/24/outline';
import { useNotification } from '../../contexts/NotificationContext';
import {
  useUnreadCount,
  useNotificationList,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from '../../hooks/useNotifications';
import NotificationItem from './NotificationItem';

interface NotificationBellProps {
  collapsed?: boolean;
}

export default function NotificationBell({ collapsed = false }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { showConfirm, showSuccess } = useNotification();

  const { data: unreadData } = useUnreadCount();
  const { data: listData } = useNotificationList({ per_page: 10 }, { enabled: open });
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  const unreadCount = unreadData?.count ?? 0;

  // Close dropdown on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        bellRef.current && !bellRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Position the portal dropdown next to the bell
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    if (!bellRef.current) return;
    const rect = bellRef.current.getBoundingClientRect();
    const dropdownWidth = 380;
    let left = rect.left;
    if (left + dropdownWidth > window.innerWidth - 8) {
      left = window.innerWidth - dropdownWidth - 8;
    }
    if (left < 8) left = 8;
    setPos({ top: rect.bottom + 8, left });
  }, []);

  useEffect(() => {
    if (!open) return;
    // Compute initial position after a frame so layout has settled
    const rafId = requestAnimationFrame(updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, updatePosition]);

  const handleNotificationClick = async (notification: { id: string; action_url: string | null; is_read: boolean }) => {
    if (!notification.is_read) {
      try {
        await markAsRead.mutateAsync(notification.id);
      } catch {
        // proceed with navigation even if mark-as-read fails
      }
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    }
    setOpen(false);
  };

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

  const dropdown = open ? createPortal(
    <div
      ref={dropdownRef}
      style={{ position: 'fixed', top: pos.top, left: pos.left, width: 380 }}
      className="z-50 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-purple-600 hover:text-purple-800 font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notification list */}
      <div className="max-h-[400px] overflow-y-auto">
        {listData?.items && listData.items.length > 0 ? (
          listData.items.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClick={handleNotificationClick}
              onMarkRead={(id) => markAsRead.mutate(id)}
              onMarkUnread={() => {}}
              onDelete={(id) => deleteNotification.mutate(id)}
              compact
            />
          ))
        ) : (
          <div className="py-10 text-center">
            <BellIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No notifications yet</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-4 py-2">
        <button
          onClick={() => { navigate('/notifications'); setOpen(false); }}
          className="w-full text-center text-sm text-purple-600 hover:text-purple-800 font-medium py-1"
        >
          View All
        </button>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button
        ref={bellRef}
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 rounded-md hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <BellIcon className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {dropdown}
    </>
  );
}
