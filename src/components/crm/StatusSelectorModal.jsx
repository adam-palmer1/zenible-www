import React from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  PROJECT_STATUS,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_HEX_COLORS,
} from '../../constants/crm';

/**
 * Modal for selecting a single project status
 * Uses portal and high z-index to appear above other modals
 */
const StatusSelectorModal = ({
  isOpen,
  onClose,
  onSelect,
  selectedStatus,
}) => {
  if (!isOpen) return null;

  const allStatuses = Object.values(PROJECT_STATUS);

  const modal = (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
      style={{ zIndex: 99999 }}
      onClick={onClose}
    >
      {/* Modal Content - stop propagation to prevent backdrop click */}
      <div
        className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Select Project Status
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <div className="space-y-2">
            {allStatuses.map((status) => {
              const isSelected = selectedStatus === status;

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    onSelect(status);
                    onClose();
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-zenible-primary bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: PROJECT_STATUS_HEX_COLORS[status] }}
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {PROJECT_STATUS_LABELS[status]}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  // Render using portal at document.body level to ensure proper z-index stacking
  return createPortal(modal, document.body);
};

export default StatusSelectorModal;
