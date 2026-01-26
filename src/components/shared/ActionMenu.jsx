import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Shared ActionMenu Component
 *
 * A reusable dropdown action menu that uses portal to escape overflow containers.
 * Used by InvoiceList, QuoteList, ExpenseList, PaymentList, etc.
 *
 * @param {Object} props
 * @param {string|number} props.itemId - Unique identifier for positioning
 * @param {Function} props.onClose - Callback when menu closes
 * @param {Array} props.actions - Array of action objects: { label, onClick, condition?, variant?, icon? }
 *
 * @example
 * <ActionMenu
 *   itemId={invoice.id}
 *   onClose={() => setActiveMenu(null)}
 *   actions={[
 *     { label: 'View', onClick: () => handleView(invoice) },
 *     { label: 'Edit', onClick: () => handleEdit(invoice) },
 *     { label: 'Delete', onClick: () => handleDelete(invoice), variant: 'danger' },
 *   ]}
 * />
 */
const ActionMenu = ({
  itemId,
  onClose,
  actions = [],
  buttonIdPrefix = 'action-btn',
  menuWidth = 192, // w-48 = 12rem = 192px
}) => {
  const menuRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    // Get the button position to place the menu
    const button = document.getElementById(`${buttonIdPrefix}-${itemId}`);
    if (button) {
      const rect = button.getBoundingClientRect();

      // Position below the button, aligned to the right
      setPosition({
        top: rect.bottom + 4,
        left: Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 16),
      });
    }
  }, [itemId, buttonIdPrefix, menuWidth]);

  // Filter actions based on condition
  const visibleActions = actions.filter(action =>
    action.condition === undefined || action.condition
  );

  if (visibleActions.length === 0) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998]"
        onClick={onClose}
      />
      {/* Menu */}
      <div
        ref={menuRef}
        className="fixed w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-[9999]"
        style={{ top: position.top, left: position.left }}
      >
        <div className="py-1">
          {visibleActions.map((action, index) => {
            const isDestructive = action.variant === 'danger';
            const baseClasses = "block w-full text-left px-4 py-2 text-sm transition-colors";
            const colorClasses = isDestructive
              ? "text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700";

            return (
              <button
                key={action.label || index}
                onClick={() => {
                  action.onClick();
                  if (!action.keepOpen) {
                    onClose();
                  }
                }}
                disabled={action.disabled}
                className={`${baseClasses} ${colorClasses} ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="flex items-center gap-2">
                  {action.icon && <action.icon className="h-4 w-4" />}
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>,
    document.body
  );
};

export default ActionMenu;
