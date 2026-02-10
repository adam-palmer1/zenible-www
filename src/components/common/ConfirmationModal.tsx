import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: React.ReactNode;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'purple' | 'blue' | 'orange' | 'red' | 'green';
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  iconColor?: string;
}

/**
 * Reusable confirmation modal component using Radix UI Dialog
 * Uses Radix for proper focus management when stacked over other Radix modals
 */
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'blue',
  icon: Icon,
  iconColor = 'text-blue-600'
}) => {
  const colorClasses: Record<string, string> = {
    purple: 'bg-zenible-primary hover:bg-opacity-90',
    blue: 'bg-blue-600 hover:bg-blue-700',
    orange: 'bg-orange-600 hover:bg-orange-700',
    red: 'bg-red-600 hover:bg-red-700',
    green: 'bg-green-600 hover:bg-green-700'
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content
          className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6 focus:outline-none"
        >
          <Dialog.Title className="sr-only">{typeof title === 'string' ? title : 'Confirmation'}</Dialog.Title>
          <Dialog.Description className="sr-only">Confirmation dialog</Dialog.Description>

          {/* Close button */}
          <Dialog.Close className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <XMarkIcon className="h-5 w-5" />
          </Dialog.Close>

          {/* Icon and content */}
          <div className="flex items-start gap-4">
            {Icon && (
              <div className="flex-shrink-0">
                <Icon className={`h-6 w-6 ${iconColor}`} />
              </div>
            )}
            <div className="flex-1 pr-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {title}
              </h3>
              {typeof message === 'string' ? (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {message}
                </p>
              ) : (
                message
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${colorClasses[confirmColor] || colorClasses.blue}`}
            >
              {confirmText}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ConfirmationModal;
