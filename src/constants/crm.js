/**
 * CRM Constants - Single source of truth for CRM-related constants
 */

// Status names - prevents typos and makes refactoring easier
export const CRM_STATUS_NAMES = {
  LEAD: 'lead',
  CALL_BOOKED: 'call_booked',
  CONFIRMED: 'confirmed',
  FOLLOW_UP: 'follow_up',
  WON: 'won',
  LOST: 'lost'
};

// Z-index layers for consistent stacking
export const Z_INDEX = {
  DROPDOWN: 9000,
  MODAL_BACKDROP: 9500,
  MODAL: 9600,
  TOOLTIP: 9999
};

// Status transition state machine
export const STATUS_TRANSITIONS = {
  [CRM_STATUS_NAMES.LEAD]: {
    allowed: [CRM_STATUS_NAMES.CALL_BOOKED, CRM_STATUS_NAMES.LOST],
    label: 'Lead'
  },
  [CRM_STATUS_NAMES.CALL_BOOKED]: {
    allowed: [CRM_STATUS_NAMES.CONFIRMED, CRM_STATUS_NAMES.FOLLOW_UP, CRM_STATUS_NAMES.LOST],
    label: 'Call Booked'
  },
  [CRM_STATUS_NAMES.CONFIRMED]: {
    allowed: [CRM_STATUS_NAMES.WON, CRM_STATUS_NAMES.LOST, CRM_STATUS_NAMES.FOLLOW_UP],
    label: 'Confirmed'
  },
  [CRM_STATUS_NAMES.FOLLOW_UP]: {
    allowed: [CRM_STATUS_NAMES.CONFIRMED, CRM_STATUS_NAMES.CALL_BOOKED, CRM_STATUS_NAMES.LOST],
    label: 'Follow Up'
  },
  [CRM_STATUS_NAMES.WON]: {
    allowed: [], // Terminal state
    label: 'Won'
  },
  [CRM_STATUS_NAMES.LOST]: {
    allowed: [CRM_STATUS_NAMES.LEAD], // Can resurrect
    label: 'Lost'
  }
};

// Quick action configurations
export const QUICK_ACTIONS = {
  MARK_LOST: {
    id: 'mark_lost',
    targetStatus: CRM_STATUS_NAMES.LOST,
    label: 'Mark Lost',
    icon: 'XCircleIcon',
    color: 'orange',
    confirmationRequired: true
  },
  MARK_WON: {
    id: 'mark_won',
    targetStatus: CRM_STATUS_NAMES.WON,
    label: 'Mark Won',
    icon: 'CheckCircleIcon',
    color: 'green',
    confirmationRequired: true
  }
};

// Error messages
export const CRM_ERRORS = {
  STATUS_NOT_FOUND: 'Status not found. Please contact your administrator.',
  UPDATE_FAILED: 'Failed to update contact. Please try again.',
  INVALID_TRANSITION: 'This status transition is not allowed.',
  PERMISSION_DENIED: 'You do not have permission to perform this action.',
  NETWORK_ERROR: 'Network error. Please check your connection.'
};

// Success messages
export const CRM_SUCCESS = {
  STATUS_UPDATED: 'Contact status updated successfully',
  CONTACT_CREATED: 'Contact created successfully',
  CONTACT_UPDATED: 'Contact updated successfully',
  CONTACT_DELETED: 'Contact deleted successfully'
};

// Project Status
export const PROJECT_STATUS = {
  PLANNING: 'planning',
  ACTIVE: 'active',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const PROJECT_STATUS_LABELS = {
  [PROJECT_STATUS.PLANNING]: 'Planning',
  [PROJECT_STATUS.ACTIVE]: 'Active',
  [PROJECT_STATUS.ON_HOLD]: 'On Hold',
  [PROJECT_STATUS.COMPLETED]: 'Completed',
  [PROJECT_STATUS.CANCELLED]: 'Cancelled',
};

export const PROJECT_STATUS_COLORS = {
  [PROJECT_STATUS.PLANNING]: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  [PROJECT_STATUS.ACTIVE]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  [PROJECT_STATUS.ON_HOLD]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  [PROJECT_STATUS.COMPLETED]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  [PROJECT_STATUS.CANCELLED]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

// Hex colors for status indicators (used in filter dropdowns)
export const PROJECT_STATUS_HEX_COLORS = {
  [PROJECT_STATUS.PLANNING]: '#6B7280', // gray
  [PROJECT_STATUS.ACTIVE]: '#3B82F6', // blue
  [PROJECT_STATUS.ON_HOLD]: '#F59E0B', // yellow
  [PROJECT_STATUS.COMPLETED]: '#10B981', // green
  [PROJECT_STATUS.CANCELLED]: '#EF4444', // red
};

// Service Status
export const SERVICE_STATUS = {
  PENDING: 'pending',
  INACTIVE: 'inactive',
  ACTIVE: 'active',
  COMPLETED: 'completed',
};

export const SERVICE_STATUS_LABELS = {
  [SERVICE_STATUS.PENDING]: 'Pending',
  [SERVICE_STATUS.INACTIVE]: 'Inactive',
  [SERVICE_STATUS.ACTIVE]: 'Active',
  [SERVICE_STATUS.COMPLETED]: 'Completed',
};

export const SERVICE_STATUS_COLORS = {
  [SERVICE_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  [SERVICE_STATUS.INACTIVE]: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  [SERVICE_STATUS.ACTIVE]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  [SERVICE_STATUS.COMPLETED]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
};

export const SERVICE_STATUS_HEX_COLORS = {
  [SERVICE_STATUS.PENDING]: '#F59E0B', // yellow/amber
  [SERVICE_STATUS.INACTIVE]: '#6B7280', // gray
  [SERVICE_STATUS.ACTIVE]: '#10B981', // green
  [SERVICE_STATUS.COMPLETED]: '#3B82F6', // blue
};
