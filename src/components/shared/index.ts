/**
 * Shared Components Index
 *
 * Centralized exports for reusable UI components.
 * These components help reduce code duplication across the codebase.
 */

// Action Menu - Dropdown menu for list item actions
export { default as ActionMenu } from './ActionMenu';

// Currency Display - Consistent currency formatting
export { default as Currency, CurrencySymbol, CurrencyInput } from './Currency';

// Filter Bar - Reusable search and filter controls
export { default as FilterBar, SortButton } from './FilterBar';

// Form Modal - Standardized modal wrapper for forms
export { default as FormModal, DeleteConfirmModal } from './FormModal';

// Table Building Blocks - Composable pieces for list/table views
export { default as SortableHeader } from './SortableHeader';
export { default as EmptyState } from './EmptyState';
export { default as LoadingSpinner } from './LoadingSpinner';

// Existing shared components
export { default as ConfirmationModal } from './ConfirmationModal';
export { default as CircularScoreIndicator } from './CircularScoreIndicator';
export { default as ImageCropperModal } from './ImageCropperModal';
export { default as AIFeedbackSection } from './AIFeedbackSection';
export { default as TimePickerInput } from './TimePickerInput';
export { default as DatePickerCalendar } from './DatePickerCalendar';
