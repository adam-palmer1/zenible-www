import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Z_INDEX } from '../../constants/crm';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  message: React.ReactNode;
  buttonText?: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  iconColor?: string;
}

/**
 * Reusable success modal component using React Portal
 * Rendered at document.body level to avoid z-index issues
 */
const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  buttonText = 'OK',
  icon: Icon = CheckCircleIcon,
  iconColor = 'text-green-600'
}) => {
  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modal = (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: Z_INDEX.MODAL_BACKDROP }}
      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Modal Content */}
      <div
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
        style={{ zIndex: Z_INDEX.MODAL }}
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

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

        {/* Action */}
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );

  // Render modal using portal at document.body level
  return createPortal(modal, document.body);
};

export default SuccessModal;
