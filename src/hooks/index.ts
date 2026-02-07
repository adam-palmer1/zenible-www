/**
 * Hooks Index
 *
 * Centralized exports for custom React hooks.
 */

// Data fetching hook - replaces common loading/error/fetch patterns
export { default as useDataFetch, useDataFetchLazy } from './useDataFetch';

// Calendar hook
export { useCalendar } from './useCalendar';

// AI Analysis hooks
export { useBaseAIAnalysis } from './useBaseAIAnalysis';
export { useProfileAnalysis } from './useProfileAnalysis';
export { useHeadlineAnalysis } from './useHeadlineAnalysis';
export { useProposalAnalysis } from './useProposalAnalysis';
export { useViralPostAnalysis } from './useViralPostAnalysis';

// UI state hooks
export { useModalState } from './useModalState';
export { useDeleteConfirmation } from './useDeleteConfirmation';

// Utility hooks
export { useSSEStreaming } from './useSSEStreaming';
export { useWebSocketConnection } from './useWebSocketConnection';
export { useDebouncedPreference } from './useDebouncedPreference';
