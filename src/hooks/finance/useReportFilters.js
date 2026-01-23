import { useMemo, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Get date for last N days
 */
const getDateDaysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

/**
 * Get today's date in ISO format
 */
const getToday = () => new Date().toISOString().split('T')[0];

/**
 * Default filter values
 */
const DEFAULT_FILTERS = {
  page: 1,
  per_page: 20,
  start_date: getDateDaysAgo(30),
  end_date: getToday(),
  sort_by: 'transaction_date',
  sort_direction: 'desc',
};

/**
 * Valid transaction types
 */
export const TRANSACTION_TYPES = ['invoice', 'quote', 'expense', 'credit_note', 'payment'];

/**
 * Valid unified statuses
 */
export const UNIFIED_STATUSES = ['draft', 'pending', 'in_progress', 'completed', 'cancelled', 'refunded'];

/**
 * Date range presets
 */
export const DATE_PRESETS = {
  today: () => {
    const today = getToday();
    return { start_date: today, end_date: today };
  },
  thisWeek: () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - dayOfWeek);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return {
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
    };
  },
  thisMonth: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
    };
  },
  last30Days: () => ({
    start_date: getDateDaysAgo(30),
    end_date: getToday(),
  }),
  thisQuarter: () => {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3);
    const start = new Date(now.getFullYear(), quarter * 3, 1);
    const end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
    return {
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
    };
  },
  thisYear: () => {
    const year = new Date().getFullYear();
    return {
      start_date: `${year}-01-01`,
      end_date: `${year}-12-31`,
    };
  },
  last90Days: () => ({
    start_date: getDateDaysAgo(90),
    end_date: getToday(),
  }),
  allTime: () => ({
    start_date: undefined,
    end_date: undefined,
  }),
};

/**
 * Hook for managing report filters with URL persistence
 * @param {Object} options
 * @param {number} options.debounceMs - Debounce delay for search input (default: 300)
 * @returns {Object} Filter state and update methods
 */
export function useReportFilters({ debounceMs = 300 } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTimeoutRef = useRef(null);

  // Parse filters from URL
  const filters = useMemo(() => {
    const page = parseInt(searchParams.get('page') || DEFAULT_FILTERS.page, 10);
    const per_page = parseInt(searchParams.get('per_page') || DEFAULT_FILTERS.per_page, 10);
    const start_date = searchParams.get('start_date') || DEFAULT_FILTERS.start_date;
    const end_date = searchParams.get('end_date') || DEFAULT_FILTERS.end_date;
    const contact_id = searchParams.get('contact_id') || undefined;
    const sort_by = searchParams.get('sort_by') || DEFAULT_FILTERS.sort_by;
    const sort_direction = searchParams.get('sort_direction') || DEFAULT_FILTERS.sort_direction;
    const search = searchParams.get('search') || undefined;
    const min_amount = searchParams.get('min_amount') ? parseFloat(searchParams.get('min_amount')) : undefined;
    const max_amount = searchParams.get('max_amount') ? parseFloat(searchParams.get('max_amount')) : undefined;

    // Parse arrays
    const transaction_types = searchParams.getAll('transaction_types').filter(Boolean);
    const unified_statuses = searchParams.getAll('unified_statuses').filter(Boolean);

    return {
      page,
      per_page,
      start_date,
      end_date,
      contact_id,
      transaction_types: transaction_types.length > 0 ? transaction_types : undefined,
      unified_statuses: unified_statuses.length > 0 ? unified_statuses : undefined,
      min_amount,
      max_amount,
      sort_by,
      sort_direction,
      search,
    };
  }, [searchParams]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Update filters in URL
  const updateFilters = useCallback(
    (updates, options = {}) => {
      const { resetPage = true } = options;

      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);

        // Reset to page 1 on filter changes (unless updating page itself)
        if (resetPage && !('page' in updates)) {
          newParams.set('page', '1');
        }

        Object.entries(updates).forEach(([key, value]) => {
          // Handle deletion
          if (value === undefined || value === null || value === '') {
            newParams.delete(key);
            return;
          }

          // Handle arrays
          if (Array.isArray(value)) {
            newParams.delete(key);
            value.forEach((v) => {
              if (v) newParams.append(key, v);
            });
            return;
          }

          // Handle single values
          newParams.set(key, String(value));
        });

        return newParams;
      });
    },
    [setSearchParams]
  );

  // Debounced search update
  const updateSearch = useCallback(
    (value) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        updateFilters({ search: value || undefined });
      }, debounceMs);
    },
    [updateFilters, debounceMs]
  );

  // Set page number
  const setPage = useCallback(
    (page) => {
      updateFilters({ page }, { resetPage: false });
    },
    [updateFilters]
  );

  // Toggle sort (or set specific direction)
  const setSort = useCallback(
    (field, direction) => {
      const newDirection =
        direction ??
        (filters.sort_by === field && filters.sort_direction === 'desc' ? 'asc' : 'desc');

      updateFilters({
        sort_by: field,
        sort_direction: newDirection,
      });
    },
    [updateFilters, filters.sort_by, filters.sort_direction]
  );

  // Apply date preset
  const applyDatePreset = useCallback(
    (presetName) => {
      const preset = DATE_PRESETS[presetName];
      if (preset) {
        updateFilters(preset());
      }
    },
    [updateFilters]
  );

  // Reset all filters to defaults
  const resetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  // Build API params (exclude undefined values)
  const apiParams = useMemo(() => {
    const params = {};

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value) && value.length === 0) {
          return;
        }
        params[key] = value;
      }
    });

    return params;
  }, [filters]);

  return {
    filters,
    apiParams,
    updateFilters,
    updateSearch,
    setPage,
    setSort,
    applyDatePreset,
    resetFilters,
  };
}

export default useReportFilters;
