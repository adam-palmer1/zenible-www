/**
 * Status utility functions
 * Shared helpers for status colors and formatting
 */

export const STATUS_COLORS: Record<string, string> = {
  lead: '#f7f5ff',
  call_booked: '#f3f0ff',
  confirmed: '#ede9fe',
  follow_up: '#fef3e7',
  won: '#e6f7ed',
  lost: '#f3f4f6',
  default: '#f7f5ff'
};

interface StatusLike {
  name?: string;
  friendly_name?: string;
  color?: string | null;
}

export const getStatusColor = (status: StatusLike | null | undefined): string => {
  if (!status) return STATUS_COLORS.default;

  // Use custom color if set
  if (status.color) return status.color;

  // Fall back to predefined color by name
  return (status.name && STATUS_COLORS[status.name]) || STATUS_COLORS.default;
};

export const getStatusDisplayName = (status: StatusLike | null | undefined): string => {
  if (!status) return '';
  return status.friendly_name || status.name || '';
};
