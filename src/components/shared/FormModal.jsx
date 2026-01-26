import React, { useState } from 'react';
import Modal from '../ui/modal/Modal';
import { Loader2 } from 'lucide-react';

/**
 * FormModal - A standardized wrapper for form modals
 *
 * Provides consistent structure for the 35+ modals in the codebase:
 * - Standard header with title
 * - Scrollable content area
 * - Standard footer with Cancel/Submit buttons
 * - Loading state handling
 * - Async submission support
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Close callback
 * @param {string} props.title - Modal title
 * @param {string} props.description - Optional description
 * @param {Function} props.onSubmit - Async submit handler
 * @param {string} props.submitLabel - Submit button text (default: "Save")
 * @param {string} props.cancelLabel - Cancel button text (default: "Cancel")
 * @param {boolean} props.loading - External loading state
 * @param {boolean} props.disabled - Disable submit button
 * @param {string} props.size - Modal size (sm, md, lg, xl, 2xl)
 * @param {string} props.submitVariant - Button variant (primary, danger)
 * @param {boolean} props.showFooter - Show footer (default: true)
 * @param {React.ReactNode} props.children - Form content
 * @param {React.ReactNode} props.footerExtra - Extra content in footer (left side)
 *
 * @example
 * <FormModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   title="Add Contact"
 *   onSubmit={handleSubmit}
 *   submitLabel="Create Contact"
 * >
 *   <form>
 *     <input ... />
 *   </form>
 * </FormModal>
 */
const FormModal = ({
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

  const handleSubmit = async (e) => {
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
  const submitButtonStyles = {
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

/**
 * DeleteConfirmModal - Specialized modal for delete confirmations
 */
export const DeleteConfirmModal = ({
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
