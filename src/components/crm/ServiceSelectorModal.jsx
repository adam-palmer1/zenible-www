import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Modal for selecting multiple services with checkboxes
 * Uses portal and high z-index to appear above other modals
 */
const ServiceSelectorModal = ({
  isOpen,
  onClose,
  onApply,
  availableServices = [],
  selectedServiceIds = [],
  loading = false,
}) => {
  const [localSelection, setLocalSelection] = useState([]);

  // Initialize local selection when modal opens or selected IDs change
  useEffect(() => {
    if (isOpen) {
      setLocalSelection([...selectedServiceIds]);
    }
  }, [isOpen, selectedServiceIds]);

  const handleToggle = (serviceId) => {
    setLocalSelection((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSelectAll = () => {
    setLocalSelection(availableServices.map((s) => s.id));
  };

  const handleDeselectAll = () => {
    setLocalSelection([]);
  };

  const handleApply = () => {
    onApply(localSelection);
    onClose();
  };

  if (!isOpen) return null;

  const modal = (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
      style={{ zIndex: 99999 }}
      onClick={onClose}
    >
      {/* Modal Content - stop propagation to prevent backdrop click */}
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Select Services
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
        <div className="flex-1 overflow-y-auto px-6 py-4">
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
                {availableServices.map((service) => {
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
    </div>
  );

  // Render using portal at document.body level to ensure proper z-index stacking
  return createPortal(modal, document.body);
};

export default ServiceSelectorModal;
