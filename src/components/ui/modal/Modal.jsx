import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Base Modal component using Radix UI Dialog
 *
 * Benefits:
 * - Automatic portal to body
 * - Automatic backdrop
 * - Automatic ESC key handling
 * - Automatic focus trap
 * - Automatic ARIA attributes
 * - Eliminates 150+ lines of boilerplate per modal
 *
 * Usage:
 * <Modal open={isOpen} onOpenChange={setIsOpen} title="Add Contact" size="lg">
 *   <form>...</form>
 * </Modal>
 */
const Modal = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  showCloseButton = true,
  className = '',
}) => {
  // Size mappings
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Overlay (Backdrop) */}
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Content */}
        <Dialog.Content
          className={`
            fixed left-[50%] top-[50%] z-50
            translate-x-[-50%] translate-y-[-50%]
            w-full ${sizeClasses[size]}
            max-h-[90vh] flex flex-col
            bg-white dark:bg-gray-800 rounded-lg shadow-lg
            focus:outline-none
            data-[state=open]:animate-in
            data-[state=closed]:animate-out
            data-[state=closed]:fade-out-0
            data-[state=open]:fade-in-0
            data-[state=closed]:zoom-out-95
            data-[state=open]:zoom-in-95
            data-[state=closed]:slide-out-to-left-1/2
            data-[state=closed]:slide-out-to-top-[48%]
            data-[state=open]:slide-in-from-left-1/2
            data-[state=open]:slide-in-from-top-[48%]
            ${className}
          `}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div>
                {title && (
                  <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
                    {title}
                  </Dialog.Title>
                )}
                {description && (
                  <Dialog.Description className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {description}
                  </Dialog.Description>
                )}
              </div>

              {showCloseButton && (
                <Dialog.Close className="rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100 dark:data-[state=open]:bg-gray-700">
                  <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <span className="sr-only">Close</span>
                </Dialog.Close>
              )}
            </div>
          )}

          {/* Body - Scrollable */}
          <div className="p-6 overflow-y-auto flex-1">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default Modal;

/**
 * ConfirmModal - Specialized modal for confirmations
 *
 * Usage:
 * <ConfirmModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Delete Contact"
 *   description="Are you sure you want to delete this contact? This action cannot be undone."
 *   onConfirm={handleDelete}
 *   confirmText="Delete"
 *   cancelText="Cancel"
 *   variant="danger"
 * />
 */
export const ConfirmModal = ({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary', // 'primary' | 'danger'
  isLoading = false,
}) => {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    onOpenChange(false);
  };

  const confirmButtonClass = variant === 'danger'
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-purple-600 hover:bg-purple-700 text-white';

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="sm"
      showCloseButton={false}
    >
      <div className="flex gap-3 justify-end mt-6">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isLoading}
          className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 ${confirmButtonClass}`}
        >
          {isLoading ? 'Processing...' : confirmText}
        </button>
      </div>
    </Modal>
  );
};
