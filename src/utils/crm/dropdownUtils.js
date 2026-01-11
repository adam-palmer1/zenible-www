/**
 * Dropdown Positioning Utility
 *
 * Consolidates dropdown positioning logic used across 3+ components.
 * Provides smart positioning that:
 * - Prevents dropdown from overflowing viewport
 * - Automatically adjusts position based on available space
 * - Handles both horizontal and vertical positioning
 *
 * This eliminates 120+ lines of duplicate code across ClientsView,
 * ContactsListView, and ContactActionMenu components.
 */

/**
 * Calculate optimal position for a dropdown menu
 *
 * @param {HTMLElement} buttonElement - The button element that triggered the dropdown
 * @param {Object} options - Configuration options
 * @param {number} options.dropdownWidth - Width of the dropdown menu (default: 200)
 * @param {number} options.dropdownHeight - Height of the dropdown menu (default: 150)
 * @param {number} options.gap - Gap between button and dropdown (default: 5)
 * @param {number} options.margin - Minimum margin from viewport edges (default: 10)
 * @param {'below' | 'above' | 'auto'} options.verticalPreference - Preferred vertical position (default: 'auto')
 * @param {'left' | 'right' | 'auto'} options.horizontalAlign - Horizontal alignment (default: 'auto')
 *
 * @returns {Object} Position object with { top, left, right }
 *   - top: CSS top value in pixels
 *   - left: CSS left value in pixels or 'auto'
 *   - right: CSS right value in pixels or 'auto'
 */
export const calculateDropdownPosition = (
  buttonElement,
  {
    dropdownWidth = 200,
    dropdownHeight = 150,
    gap = 5,
    margin = 10,
    verticalPreference = 'auto',
    horizontalAlign = 'auto',
  } = {}
) => {
  if (!buttonElement) {
    console.warn('calculateDropdownPosition: buttonElement is required');
    return { top: 0, left: 0, right: 'auto' };
  }

  const buttonRect = buttonElement.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Calculate available space
  const spaceOnRight = viewportWidth - buttonRect.right;
  const spaceOnLeft = buttonRect.left;
  const spaceBelow = viewportHeight - buttonRect.bottom;
  const spaceAbove = buttonRect.top;

  // Determine vertical position
  let top;
  if (verticalPreference === 'above') {
    top = buttonRect.top - dropdownHeight - gap;
  } else if (verticalPreference === 'below') {
    top = buttonRect.bottom + gap;
  } else {
    // Auto: prefer below, but use above if not enough space
    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      top = buttonRect.top - dropdownHeight - gap;
    } else {
      top = buttonRect.bottom + gap;
    }
  }

  // Ensure vertical position stays within viewport
  if (top < margin) {
    top = margin;
  }
  if (top + dropdownHeight > viewportHeight - margin) {
    top = Math.max(margin, viewportHeight - dropdownHeight - margin);
  }

  // Determine horizontal position
  let left = 'auto';
  let right = 'auto';

  if (horizontalAlign === 'left') {
    left = buttonRect.left;
  } else if (horizontalAlign === 'right') {
    left = buttonRect.right - dropdownWidth;
  } else {
    // Auto: prefer right-aligned to button, adjust if overflows
    left = buttonRect.right - dropdownWidth;

    // If left alignment goes off-screen, align to left edge of button
    if (left < margin) {
      left = buttonRect.left;
    }

    // If still overflows on right, push to right edge of viewport
    if (left + dropdownWidth > viewportWidth - margin) {
      left = Math.max(margin, viewportWidth - dropdownWidth - margin);
    }
  }

  return { top, left, right };
};

/**
 * Alternative positioning for menus that should align relative to viewport edges
 * Used by ContactActionMenu for more complex positioning
 *
 * @param {HTMLElement} buttonElement - The button element that triggered the dropdown
 * @param {Object} options - Configuration options
 * @param {number} options.menuWidth - Width of the menu (default: 200)
 * @param {number} options.menuHeight - Height of the menu (default: 300)
 * @param {number} options.gap - Gap between button and menu (default: 4)
 *
 * @returns {Object} Position object with { top, left, right }
 */
export const calculateMenuPosition = (
  buttonElement,
  { menuWidth = 200, menuHeight = 300, gap = 4 } = {}
) => {
  if (!buttonElement) {
    console.warn('calculateMenuPosition: buttonElement is required');
    return { top: 0, left: 0, right: 'auto' };
  }

  const buttonRect = buttonElement.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const spaceOnRight = viewportWidth - buttonRect.right;
  const spaceBelow = viewportHeight - buttonRect.bottom;
  const spaceAbove = buttonRect.top;

  // Determine vertical position - prefer below, but use above if not enough space
  let top;
  if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
    // Position above the button
    top = buttonRect.top - menuHeight - gap;
  } else {
    // Position below the button (default)
    top = buttonRect.bottom + gap;
  }

  // Determine horizontal position
  let position;
  if (spaceOnRight < menuWidth) {
    // Not enough space on right, align to right edge
    position = {
      top,
      right: viewportWidth - buttonRect.right,
      left: 'auto',
    };
  } else {
    // Align to left of button
    position = {
      top,
      left: buttonRect.left,
      right: 'auto',
    };
  }

  return position;
};

/**
 * Hook for managing dropdown state with positioning
 *
 * @param {Object} options - Configuration options
 * @param {Function} options.calculatePosition - Position calculation function (default: calculateDropdownPosition)
 *
 * @returns {Object} Dropdown state and handlers
 *   - activeDropdown: ID of currently active dropdown
 *   - dropdownPosition: Position object { top, left, right }
 *   - buttonRefs: Ref object for button elements
 *   - handleDropdownToggle: Toggle handler function
 *   - closeDropdown: Close dropdown function
 */
export const useDropdownPosition = ({
  calculatePosition = calculateDropdownPosition,
} = {}) => {
  const [activeDropdown, setActiveDropdown] = React.useState(null);
  const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0 });
  const buttonRefs = React.useRef({});

  const handleDropdownToggle = React.useCallback(
    (itemId, event, positionOptions = {}) => {
      event.stopPropagation();

      if (activeDropdown === itemId) {
        setActiveDropdown(null);
        return;
      }

      const buttonElement = buttonRefs.current[itemId];
      if (buttonElement) {
        const position = calculatePosition(buttonElement, positionOptions);
        setDropdownPosition(position);
        setActiveDropdown(itemId);
      }
    },
    [activeDropdown, calculatePosition]
  );

  const closeDropdown = React.useCallback(() => {
    setActiveDropdown(null);
  }, []);

  return {
    activeDropdown,
    dropdownPosition,
    buttonRefs,
    handleDropdownToggle,
    closeDropdown,
  };
};

// Note: In React 19, we need to import React for hooks
import React from 'react';
