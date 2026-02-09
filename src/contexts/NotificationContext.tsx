import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  id: number;
  type: NotificationType;
  message: string;
  title?: string;
  action?: string;
  onAction?: () => void;
  duration?: number;
}

interface NotificationOptions {
  title?: string;
  action?: string;
  onAction?: () => void;
  duration?: number;
}

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
}

interface NotificationContextValue {
  showSuccess: (message: string, options?: NotificationOptions) => number;
  showError: (message: string, options?: NotificationOptions) => number;
  showInfo: (message: string, options?: NotificationOptions) => number;
  showWarning: (message: string, options?: NotificationOptions) => number;
  showConfirm: (title: string, message: string) => Promise<boolean>;
  removeNotification: (id: number) => void;
}

interface ToastProps {
  notification: Notification;
  onClose: (id: number) => void;
  onAction: (id: number) => void;
}

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export const useNotification = (): NotificationContextValue => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

/**
 * Toast notification component
 */
const Toast = ({ notification, onClose, onAction }: ToastProps) => {
  const icons: Record<NotificationType, typeof CheckCircleIcon> = {
    success: CheckCircleIcon,
    error: ExclamationCircleIcon,
    info: InformationCircleIcon,
    warning: ExclamationCircleIcon
  };

  const colors: Record<NotificationType, string> = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-orange-50 border-orange-200 text-orange-800'
  };

  const iconColors: Record<NotificationType, string> = {
    success: 'text-green-600',
    error: 'text-red-600',
    info: 'text-blue-600',
    warning: 'text-orange-600'
  };

  const Icon = icons[notification.type] || InformationCircleIcon;

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg ${colors[notification.type]} transition-all duration-300 max-w-md`}
      role="alert"
    >
      <Icon className={`h-5 w-5 flex-shrink-0 ${iconColors[notification.type]}`} />
      <div className="flex-1 min-w-0">
        {notification.title && (
          <p className="font-semibold text-sm mb-1">{notification.title}</p>
        )}
        <p className="text-sm">{notification.message}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {notification.action && (
          <button
            onClick={() => {
              onAction(notification.id);
              onClose(notification.id);
            }}
            className="text-sm font-medium hover:underline"
          >
            {notification.action}
          </button>
        )}
        <button
          onClick={() => onClose(notification.id)}
          className="text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

/**
 * Confirmation dialog component - uses Radix UI Dialog so it properly
 * stacks above other Radix Dialogs (each gets its own focus trap)
 */
const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel }: ConfirmDialogProps) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[10000]" />
        <Dialog.Content
          className="fixed left-[50%] top-[50%] z-[10000] translate-x-[-50%] translate-y-[-50%] bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6 focus:outline-none"
        >
          <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</Dialog.Title>
          <Dialog.Description className="text-gray-600 dark:text-gray-300 mb-6">{message}</Dialog.Description>
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Confirm
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

/**
 * NotificationProvider - Manages toast notifications
 */
export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({ isOpen: false, title: '', message: '' });
  const confirmResolveRef = useRef<((value: boolean) => void) | null>(null);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Date.now() + Math.random();
    const newNotification: Notification = { id, ...notification };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-dismiss after duration (default 5s)
    if (notification.duration !== 0) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration || 5000);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const showSuccess = useCallback((message: string, options: NotificationOptions = {}) => {
    return addNotification({
      type: 'success',
      message,
      ...options
    });
  }, [addNotification]);

  const showError = useCallback((message: string, options: NotificationOptions = {}) => {
    return addNotification({
      type: 'error',
      message,
      duration: options.duration || 7000, // Errors stay longer
      ...options
    });
  }, [addNotification]);

  const showInfo = useCallback((message: string, options: NotificationOptions = {}) => {
    return addNotification({
      type: 'info',
      message,
      ...options
    });
  }, [addNotification]);

  const showWarning = useCallback((message: string, options: NotificationOptions = {}) => {
    return addNotification({
      type: 'warning',
      message,
      ...options
    });
  }, [addNotification]);

  const showConfirm = useCallback((title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      confirmResolveRef.current = resolve;
      setConfirmDialog({ isOpen: true, title, message });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (confirmResolveRef.current) {
      confirmResolveRef.current(true);
      confirmResolveRef.current = null;
    }
    setConfirmDialog({ isOpen: false, title: '', message: '' });
  }, []);

  const handleCancel = useCallback(() => {
    if (confirmResolveRef.current) {
      confirmResolveRef.current(false);
      confirmResolveRef.current = null;
    }
    setConfirmDialog({ isOpen: false, title: '', message: '' });
  }, []);

  const handleAction = useCallback((id: number) => {
    const notification = notifications.find(n => n.id === id);
    if (notification?.onAction) {
      notification.onAction();
    }
  }, [notifications]);

  const value: NotificationContextValue = {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showConfirm,
    removeNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {notifications.map(notification => (
          <div key={notification.id} className="pointer-events-auto">
            <Toast
              notification={notification}
              onClose={removeNotification}
              onAction={handleAction}
            />
          </div>
        ))}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </NotificationContext.Provider>
  );
};
