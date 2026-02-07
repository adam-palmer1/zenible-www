import React from 'react';
import Modal from '../ui/modal/Modal';
import {
  PROJECT_STATUS,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_HEX_COLORS,
} from '../../constants/crm';

interface StatusSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (status: string) => void;
  selectedStatus: string;
}

/**
 * Modal for selecting a single project status
 * Uses the base Modal component for proper nested modal support
 */
const StatusSelectorModal: React.FC<StatusSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedStatus,
}) => {
  const allStatuses = Object.values(PROJECT_STATUS) as string[];

  return (
    <Modal
      open={isOpen}
      onOpenChange={onClose}
      title="Select Project Status"
      size="md"
    >
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
                  style={{ backgroundColor: (PROJECT_STATUS_HEX_COLORS as any)[status] }}
                />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {(PROJECT_STATUS_LABELS as any)[status]}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
};

export default StatusSelectorModal;
