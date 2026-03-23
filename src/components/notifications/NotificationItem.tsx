import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  CurrencyDollarIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  UserIcon,
  FolderIcon,
  CreditCardIcon,
  DocumentDuplicateIcon,
  CogIcon,
} from '@heroicons/react/24/outline';
import type { NotificationItem as NotificationItemType } from '../../services/api/notifications';

const typeIcons: Record<string, React.ElementType> = {
  invoice: DocumentTextIcon,
  payment: CurrencyDollarIcon,
  quote: DocumentDuplicateIcon,
  appointment: CalendarDaysIcon,
  contact: UserIcon,
  project: FolderIcon,
  expense: CreditCardIcon,
  credit_note: DocumentDuplicateIcon,
  system: CogIcon,
};

interface NotificationItemProps {
  notification: NotificationItemType;
  onClick?: (notification: NotificationItemType) => void;
  onMarkRead?: (id: string) => void;
  onMarkUnread?: (id: string) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

export default function NotificationItem({
  notification,
  onClick,
  onMarkRead,
  onMarkUnread,
  onDelete,
  compact = false,
}: NotificationItemProps) {
  const Icon = typeIcons[notification.type] || CogIcon;
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });

  return (
    <div
      className={`group flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 ${
        !notification.is_read ? 'bg-purple-50/40' : ''
      }`}
      onClick={() => onClick?.(notification)}
    >
      {/* Unread dot */}
      <div className="flex-shrink-0 mt-1.5 w-2 h-2">
        {!notification.is_read && (
          <div className="w-2 h-2 rounded-full bg-purple-600" />
        )}
      </div>

      {/* Type icon */}
      <div className="flex-shrink-0 mt-0.5">
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
          <Icon className="w-4 h-4 text-gray-600" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium text-gray-900 ${compact ? 'truncate' : ''}`}>
          {notification.title}
        </p>
        <p className={`text-xs text-gray-500 mt-0.5 ${compact ? 'truncate' : 'line-clamp-2'}`}>
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 mt-1">{timeAgo}</p>
      </div>

      {/* Hover actions */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
        {notification.is_read ? (
          <button
            onClick={(e) => { e.stopPropagation(); onMarkUnread?.(notification.id); }}
            className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
            title="Mark as unread"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onMarkRead?.(notification.id); }}
            className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
            title="Mark as read"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(notification.id); }}
            className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-red-500"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
