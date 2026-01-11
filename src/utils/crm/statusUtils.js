/**
 * Status utility functions
 * Shared helpers for status colors and formatting
 */

/**
 * Default status color palette
 * Ultra-light colors for status columns (Zantra pattern)
 */
export const STATUS_COLORS = {
  lead: '#f7f5ff',
  call_booked: '#f3f0ff',
  confirmed: '#ede9fe',
  follow_up: '#fef3e7',
  won: '#e6f7ed',
  lost: '#f3f4f6',
  default: '#f7f5ff'
};

/**
 * Get status background color
 * Uses status.color if available, falls back to predefined colors
 * @param {Object} status - Status object with name and optional color
 * @returns {string} Hex color code
 */
export const getStatusColor = (status) => {
  if (!status) return STATUS_COLORS.default;

  // Use custom color if set
  if (status.color) return status.color;

  // Fall back to predefined color by name
  return STATUS_COLORS[status.name] || STATUS_COLORS.default;
};

/**
 * Get status display name
 * Uses friendly_name or falls back to name
 * @param {Object} status - Status object
 * @returns {string} Display name
 */
export const getStatusDisplayName = (status) => {
  if (!status) return '';
  return status.friendly_name || status.name;
};
