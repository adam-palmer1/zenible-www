import { useState, useCallback } from 'react';

/**
 * Custom hook for managing Services tab filter state
 * Handles subtab selection and filter options for both Default Services and Client Services
 *
 * @returns {Object} Services filter state and handlers
 */
export function useServicesFilters() {
  // Subtab state: 'default' | 'client'
  const [activeSubtab, setActiveSubtab] = useState('default');

  // Search query (applies to both subtabs)
  const [searchQuery, setSearchQuery] = useState('');

  // Client Services filters
  const [statusFilter, setStatusFilter] = useState('');
  const [frequencyTypeFilter, setFrequencyTypeFilter] = useState('');

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('');
    setFrequencyTypeFilter('');
  }, []);

  // Handle subtab change
  const handleSubtabChange = useCallback((subtab) => {
    setActiveSubtab(subtab);
    // Optionally clear filters when switching subtabs
    // clearAllFilters();
  }, []);

  // Count active filters (for badge display)
  const activeFilterCount = [statusFilter, frequencyTypeFilter].filter(Boolean).length;

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
