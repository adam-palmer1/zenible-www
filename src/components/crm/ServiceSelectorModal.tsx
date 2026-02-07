import React, { useState, useEffect } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import Modal from '../ui/modal/Modal';

interface ServiceSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (selectedIds: string[]) => void;
  availableServices?: any[];
  selectedServiceIds?: string[];
  loading?: boolean;
}

/**
 * Modal for selecting multiple services with checkboxes
 * Uses the base Modal component for proper nested modal support
 */
const ServiceSelectorModal: React.FC<ServiceSelectorModalProps> = ({
  isOpen,
  onClose,
  onApply,
  availableServices = [],
  selectedServiceIds = [],
  loading = false,
}) => {
  const [localSelection, setLocalSelection] = useState<string[]>([]);

  // Initialize local selection when modal opens or selected IDs change
  useEffect(() => {
    if (isOpen) {
      setLocalSelection([...selectedServiceIds]);
    }
  }, [isOpen, selectedServiceIds]);

  const handleToggle = (serviceId: string) => {
    setLocalSelection((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSelectAll = () => {
    setLocalSelection(availableServices.map((s: any) => s.id));
  };

  const handleDeselectAll = () => {
    setLocalSelection([]);
  };

  const handleApply = () => {
    onApply(localSelection);
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onOpenChange={onClose}
      title="Select Services"
      size="2xl"
    >
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zenible-primary"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading services...</span>
          </div>
        ) : availableServices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No services available for this client.</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Services must be assigned to the client first.
            </p>
          </div>
        ) : (
          <div>
            {/* Bulk actions */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {localSelection.length} of {availableServices.length} selected
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-sm text-zenible-primary hover:text-zenible-primary/80"
                >
                  Select All
                </button>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Service list */}
            <div className="space-y-2">
              {availableServices.map((service: any) => {
                const isSelected = localSelection.includes(service.id);

                return (
                  <label
                    key={service.id}
                    className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-zenible-primary bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggle(service.id)}
                      className="mr-3 h-4 w-4 text-zenible-primary border-gray-300 rounded focus:ring-zenible-primary"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {service.name || 'Unnamed Service'}
                      </div>
                      {service.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {service.description}
                        </div>
                      )}
                    </div>
                    {service.price && (
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 ml-3">
                        {service.currency?.code || ''} {service.price}
                      </div>
                    )}
                    {isSelected && (
                      <CheckIcon className="h-5 w-5 text-zenible-primary ml-2" />
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-zenible-primary rounded-lg hover:bg-opacity-90 disabled:opacity-50 transition-colors"
          >
            Apply Selection ({localSelection.length})
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ServiceSelectorModal;
