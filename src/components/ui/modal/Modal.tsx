import React, { useState, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ModalPortalContext } from '../../../contexts/ModalPortalContext';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  size?: ModalSize;
  showCloseButton?: boolean;
  className?: string;
}

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
 * - Provides portal container for nested floating elements (dropdowns, tooltips)
 *
 * Usage:
 * <Modal open={isOpen} onOpenChange={setIsOpen} title="Add Contact" size="lg">
 *   <form>...</form>
 * </Modal>
 */
const Modal: React.FC<ModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  className = '',
}) => {
  // Callback ref for the portal container — using state instead of useRef so that
  // setting the ref triggers a re-render, ensuring the ModalPortalContext.Provider
  // delivers the actual DOM element to children (not null from the initial render).
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);
  const portalContainerRef = useCallback((node: HTMLDivElement | null) => {
    setPortalContainer(node);
  }, []);

  // Whether this size should go fullscreen on small screens
  const isLargeSize = ['lg', 'xl', '2xl', '3xl', '4xl', 'full'].includes(size);

  // Size mappings — small/md stay compact; lg+ go fullscreen on mobile
  const sizeClasses: Record<ModalSize, string> = {
    sm: 'max-w-sm mx-4',
    md: 'max-w-md mx-4',
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
            fixed z-50 flex flex-col
            bg-white dark:bg-gray-800 shadow-lg
            focus:outline-none
            data-[state=open]:animate-in
            data-[state=closed]:animate-out
            data-[state=closed]:fade-out-0
            data-[state=open]:fade-in-0
            ${isLargeSize
              ? `inset-0 rounded-none max-h-full w-full
                 sm:inset-auto sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%]
                 sm:rounded-lg sm:max-h-[90vh] sm:w-full ${sizeClasses[size]}
                 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95
                 sm:data-[state=closed]:slide-out-to-left-1/2 sm:data-[state=closed]:slide-out-to-top-[48%]
                 sm:data-[state=open]:slide-in-from-left-1/2 sm:data-[state=open]:slide-in-from-top-[48%]`
              : `left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]
                 rounded-lg max-h-[90vh] w-full ${sizeClasses[size]}
                 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
                 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]
                 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]`
            }
            ${className}
          `}
        >
          {/* Provide portal context to all children */}
          <ModalPortalContext.Provider value={portalContainer}>
            {/* Accessibility: sr-only fallbacks when header is hidden */}
            {!(title || showCloseButton) && (
              <>
                <Dialog.Title className="sr-only">Modal dialog</Dialog.Title>
                <Dialog.Description className="sr-only">Modal dialog</Dialog.Description>
              </>
            )}

            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div>
                  <Dialog.Title className={title ? "text-lg sm:text-xl font-semibold text-gray-900 dark:text-white" : "sr-only"}>
                    {title || 'Modal dialog'}
                  </Dialog.Title>
                  {description ? (
                    <Dialog.Description className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {description}
                    </Dialog.Description>
                  ) : (
                    <Dialog.Description className="sr-only">
                      {title || 'Modal dialog'}
                    </Dialog.Description>
                  )}
                </div>

                {showCloseButton && (
                  <Dialog.Close className="p-2 -mr-2 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100 dark:data-[state=open]:bg-gray-700">
                    <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <span className="sr-only">Close</span>
                  </Dialog.Close>
                )}
              </div>
            )}

            {/* Body - Scrollable */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              {children}
            </div>
          </ModalPortalContext.Provider>
        </Dialog.Content>

        {/*
          Portal container for nested floating elements (dropdowns, tooltips, etc.)
          - OUTSIDE Dialog.Content to avoid transform creating a new containing block
          - Inside Dialog.Portal to maintain proper event propagation
          - Fixed position to allow elements to appear anywhere on screen
          - pointer-events-none so it doesn't block clicks on the modal
          - Floating elements inside use pointer-events-auto on their interactive parts
          - z-index 51 puts it above overlay (z-50) in the same stacking context
        */}
        <div
          ref={portalContainerRef}
          className="fixed inset-0 pointer-events-none overflow-visible z-[51]"
        />
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default Modal;

type ConfirmModalVariant = 'primary' | 'danger';

interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmModalVariant;
  isLoading?: boolean;
}

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
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
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
          className="px-4 py-2 min-h-[44px] sm:min-h-0 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isLoading}
          className={`px-4 py-2 min-h-[44px] sm:min-h-0 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 ${confirmButtonClass}`}
        >
          {isLoading ? 'Processing...' : confirmText}
        </button>
      </div>
    </Modal>
  );
};
