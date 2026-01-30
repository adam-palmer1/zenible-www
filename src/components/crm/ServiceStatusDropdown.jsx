import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckIcon } from '@heroicons/react/24/outline';
import { useModalPortal } from '../../contexts/ModalPortalContext';

/**
 * Dropdown for selecting a service status
 * Portals to body to escape modal stacking contexts
 */
const ServiceStatusDropdown = ({
  isOpen,
  onClose,
  onSelect,
  selectedStatus,
  statuses = [],
  anchorRef = null,
}) => {
  const dropdownRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  // Get the modal portal container if we're inside a modal
  const modalPortalRef = useModalPortal();
  const portalTarget = modalPortalRef?.current || document.body;

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isOpen, anchorRef]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          anchorRef?.current && !anchorRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{ pointerEvents: 'auto' }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        onClick={onClose}
      />

      {/* Dropdown */}
      <div
        ref={dropdownRef}
        className="fixed bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto"
        style={{
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          width: dropdownPosition.width,
        }}
      >
        {statuses.length === 0 ? (
          <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
            No statuses available
          </div>
        ) : (
          <div className="py-1">
            {statuses.map((status) => {
              const isSelected = selectedStatus === status.value;

              return (
                <button
                  key={status.value}
                  type="button"
                  onClick={() => {
                    onSelect(status.value);
                    onClose();
                  }}
                  className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between ${
                    isSelected ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                  }`}
                >
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {status.label}
                    </span>
                    {status.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {status.description}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <CheckIcon className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>,
    portalTarget
  );
};

export default ServiceStatusDropdown;
