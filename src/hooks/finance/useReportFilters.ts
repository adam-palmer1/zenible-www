import { useMemo, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { formatLocalDate } from '../../utils/dateUtils';

/**
 * Get date for last N days
 */
const getDateDaysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatLocalDate(date);
};

/**
 * Get today's date in YYYY-MM-DD format (local timezone)
 */
const getToday = (): string => formatLocalDate(new Date());

/**
 * Filter state shape parsed from URL search params
 */
export interface ReportFilters {
  page: number;
  per_page: number;
  start_date: string;
  end_date: string;
  contact_id: string | undefined;
  transaction_types: string[] | undefined;
  unified_statuses: string[] | undefined;
  min_amount: number | undefined;
  max_amount: number | undefined;
  sort_by: string;
  sort_direction: string;
  search: string | undefined;
}

/**
 * Partial filter updates (any subset of filter keys)
 */
export type FilterUpdates = Record<string, string | number | string[] | undefined | null>;

export interface UpdateFilterOptions {
  resetPage?: boolean;
}

export interface DatePresetResult {
  start_date: string | undefined;
  end_date: string | undefined;
}

export interface UseReportFiltersOptions {
  debounceMs?: number;
}

export interface UseReportFiltersReturn {
  filters: ReportFilters;
  apiParams: Record<string, string | number | string[]>;
  updateFilters: (updates: FilterUpdates, options?: UpdateFilterOptions) => void;
  updateSearch: (value: string | undefined) => void;
  setPage: (page: number) => void;
  setSort: (field: string, direction?: string) => void;
  applyDatePreset: (presetName: DatePresetName) => void;
  resetFilters: () => void;
}

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
} as const;

/**
 * Valid transaction types
 */
export const TRANSACTION_TYPES: readonly string[] = ['invoice', 'quote', 'expense', 'credit_note', 'payment'];

/**
 * Valid unified statuses
 */
export const UNIFIED_STATUSES: readonly string[] = ['draft', 'pending', 'in_progress', 'completed', 'cancelled', 'refunded'];

/**
 * Date range presets
 */
export const DATE_PRESETS: Record<string, () => DatePresetResult> = {
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
      start_date: formatLocalDate(start),
      end_date: formatLocalDate(end),
    };
  },
  thisMonth: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start_date: formatLocalDate(start),
      end_date: formatLocalDate(end),
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
      start_date: formatLocalDate(start),
      end_date: formatLocalDate(end),
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

export type DatePresetName = keyof typeof DATE_PRESETS;

/**
 * Hook for managing report filters with URL persistence
 */
export function useReportFilters({ debounceMs = 300 }: UseReportFiltersOptions = {}): UseReportFiltersReturn {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Parse filters from URL
  const filters = useMemo((): ReportFilters => {
    const page = parseInt(searchParams.get('page') || String(DEFAULT_FILTERS.page), 10);
    const per_page = parseInt(searchParams.get('per_page') || String(DEFAULT_FILTERS.per_page), 10);
    const start_date = searchParams.get('start_date') || DEFAULT_FILTERS.start_date;
    const end_date = searchParams.get('end_date') || DEFAULT_FILTERS.end_date;
    const contact_id = searchParams.get('contact_id') || undefined;
    const sort_by = searchParams.get('sort_by') || DEFAULT_FILTERS.sort_by;
    const sort_direction = searchParams.get('sort_direction') || DEFAULT_FILTERS.sort_direction;
    const search = searchParams.get('search') || undefined;
    const min_amount = searchParams.get('min_amount') ? parseFloat(searchParams.get('min_amount')!) : undefined;
    const max_amount = searchParams.get('max_amount') ? parseFloat(searchParams.get('max_amount')!) : undefined;

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
    (updates: FilterUpdates, options: UpdateFilterOptions = {}) => {
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
    (value: string | undefined) => {
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
    (page: number) => {
      updateFilters({ page }, { resetPage: false });
    },
    [updateFilters]
  );

  // Toggle sort (or set specific direction)
  const setSort = useCallback(
    (field: string, direction?: string) => {
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
    (presetName: DatePresetName) => {
      const preset = DATE_PRESETS[presetName];
      if (preset) {
        updateFilters(preset() as unknown as FilterUpdates);
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
    const params: Record<string, string | number | string[]> = {};

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
