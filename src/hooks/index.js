/**
 * Hooks Index
 *
 * Centralized exports for custom React hooks.
 */

// Data fetching hook - replaces common loading/error/fetch patterns
export { default as useDataFetch, useDataFetchLazy } from './useDataFetch';

// Calendar hook
export { default as useCalendar } from './useCalendar';

// AI Analysis hooks
export { default as useBaseAIAnalysis } from './useBaseAIAnalysis';
export { default as useProfileAnalysis } from './useProfileAnalysis';
export { default as useHeadlineAnalysis } from './useHeadlineAnalysis';
export { default as useProposalAnalysis } from './useProposalAnalysis';
export { default as useViralPostAnalysis } from './useViralPostAnalysis';

// Utility hooks
export { default as useSSEStreaming } from './useSSEStreaming';
export { default as useWebSocketConnection } from './useWebSocketConnection';
export { default as useDebouncedPreference } from './useDebouncedPreference';
