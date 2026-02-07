import React, { useState } from 'react';
import Modal, { type ModalSize } from '../ui/modal/Modal';
import { Loader2 } from 'lucide-react';

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  onSubmit?: () => Promise<void> | void;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  size?: ModalSize;
  submitVariant?: 'primary' | 'danger' | 'success';
  showFooter?: boolean;
  children?: React.ReactNode;
  footerExtra?: React.ReactNode;
  className?: string;
}

const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  onSubmit,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  loading: externalLoading = false,
  disabled = false,
  size = 'lg',
  submitVariant = 'primary',
  showFooter = true,
  children,
  footerExtra,
  className = '',
}) => {
  const [internalLoading, setInternalLoading] = useState(false);

  const isLoading = externalLoading || internalLoading;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!onSubmit || isLoading || disabled) return;

    try {
      setInternalLoading(true);
      await onSubmit();
    } catch (error) {
      // Error should be handled by onSubmit
      console.error('FormModal submit error:', error);
    } finally {
      setInternalLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  // Button variant styles
  const submitButtonStyles: Record<string, string> = {
    primary: 'bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
  };

  return (
    <Modal
      open={isOpen}
      onOpenChange={handleClose}
      title={title}
      description={description}
      size={size}
      className={className}
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        {/* Content */}
        <div className="flex-1 -mt-6 -mx-6 px-6">
          {children}
        </div>

        {/* Footer */}
        {showFooter && (
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200 dark:border-gray-700 -mx-6 px-6 -mb-6 pb-6">
            <div>
              {footerExtra}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                type="submit"
                disabled={isLoading || disabled}
                className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors ${submitButtonStyles[submitVariant]}`}
              >
                {isLoading && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {submitLabel}
              </button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default FormModal;

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  message?: string;
  itemName?: string;
  loading?: boolean;
}

/**
 * DeleteConfirmModal - Specialized modal for delete confirmations
 */
export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Item',
  message = 'Are you sure you want to delete this item? This action cannot be undone.',
  itemName,
  loading = false,
}) => {
  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      onSubmit={onConfirm}
      submitLabel="Delete"
      submitVariant="danger"
      loading={loading}
      size="sm"
    >
      <p className="text-gray-600 dark:text-gray-400">
        {message}
        {itemName && (
          <span className="block mt-2 font-medium text-gray-900 dark:text-white">
            "{itemName}"
          </span>
        )}
      </p>
    </FormModal>
  );
};
