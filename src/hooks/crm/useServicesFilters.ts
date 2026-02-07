import { useState, useCallback } from 'react';

/**
 * Custom hook for managing Services tab filter state
 * Handles subtab selection and filter options for both Default Services and Client Services
 */
export function useServicesFilters() {
  // Subtab state: 'default' | 'client'
  const [activeSubtab, setActiveSubtab] = useState<string>('default');

  // Search query (applies to both subtabs)
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Client Services filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [frequencyTypeFilter, setFrequencyTypeFilter] = useState<string>('');

  // Clear all filters
  const clearAllFilters = useCallback((): void => {
    setSearchQuery('');
    setStatusFilter('');
    setFrequencyTypeFilter('');
  }, []);

  // Handle subtab change
  const handleSubtabChange = useCallback((subtab: string): void => {
    setActiveSubtab(subtab);
    // Optionally clear filters when switching subtabs
    // clearAllFilters();
  }, []);

  // Count active filters (for badge display)
  const activeFilterCount: number = [statusFilter, frequencyTypeFilter].filter(Boolean).length;

  return {
    // Subtab
    activeSubtab,
    setActiveSubtab: handleSubtabChange,

    // Search
    searchQuery,
    setSearchQuery,

    // Client Services filters
    statusFilter,
    setStatusFilter,
    frequencyTypeFilter,
    setFrequencyTypeFilter,

    // Utils
    activeFilterCount,
    clearAllFilters,
  };
}
