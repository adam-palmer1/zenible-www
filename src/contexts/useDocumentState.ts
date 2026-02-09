/**
 * useDocumentState - Shared hook for finance document context providers.
 *
 * Extracts the ~250 lines of boilerplate that is nearly identical across
 * InvoiceContext, QuoteContext, and ExpenseContext:
 *   - Filter / search / sort / pagination state
 *   - Preferences persistence (load on mount, save on change)
 *   - Fetch list with duplicate-request guard
 *   - Generic CRUD helpers (create, update, delete)
 *   - Modal state (show/editing/selected)
 *   - Refresh mechanism (refreshKey)
 *
 * Each concrete context calls this hook and then layers on its
 * domain-specific state and methods (e.g. sendInvoice, bulkDelete, etc.).
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { usePreferences } from './PreferencesContext';
import { DEFAULT_PAGE_SIZE } from '../constants/pagination';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

/** Shape returned by apiService.list() */
export interface ListResponse {
  items?: unknown[];
  total?: number;
  length?: number;
  stats?: unknown;
  [key: string]: unknown;
}

/** Minimal shape for items with an id field */
interface Identifiable {
  id: string;
  [key: string]: unknown;
}

/** Filters that have the common `status` and `search` keys */
interface CommonFilterKeys {
  status?: unknown;
  search?: unknown;
}

/**
 * Describes how fetch params are built for the backend.
 * InvoiceContext sends skip/limit + sort_order,
 * while QuoteContext & ExpenseContext send page/per_page + sort_direction.
 */
export type PaginationStyle = 'skip-limit' | 'page-perpage';

export interface DocumentStateConfig<TFilters extends object> {
  /** Human-readable name used for logging, e.g. "Invoice" */
  name: string;

  /** The API service object – must have a `.list(params)` method */
  apiService: {
    list: (params: Record<string, string>) => Promise<unknown>;
    create?: (data: unknown) => Promise<unknown>;
    update?: (id: string, data: unknown) => Promise<unknown>;
    delete?: (id: string) => Promise<unknown>;
  };

  /**
   * How to translate pagination state into request params.
   * 'skip-limit'   -> { skip, limit, sort_order }     (InvoiceContext)
   * 'page-perpage' -> { page, per_page, sort_direction } (Quote/Expense)
   * @default 'page-perpage'
   */
  paginationStyle?: PaginationStyle;

  /**
   * Override the sort-direction param name for page-perpage style.
   * @default 'sort_direction'
   */
  sortParamName?: string;

  /** Default value for sortBy, e.g. 'created_at', 'expense_date' */
  defaultSort: string;

  /** Default sort order */
  defaultSortOrder?: string;

  /** Prefix used for preference keys, e.g. 'invoice', 'quote', 'expense' */
  preferencePrefix: string;

  /** Default page size override */
  defaultPageSize?: number;

  /** The default filter state (domain-specific) */
  defaultFilters: TFilters;

  /**
   * Optional callback to load extra preference keys into the initial filters.
   * Receives `getPreference` and should return a partial filter object.
   * The hook always loads `<prefix>_search`, `<prefix>_filter_status`,
   * `<prefix>_sort_by`, and `<prefix>_sort_order` automatically.
   */
  loadExtraPreferences?: (
    getPreference: (key: string, defaultValue: unknown) => unknown,
  ) => Partial<TFilters>;

  /**
   * Optional callback to persist extra filter keys when `updateFilters` is
   * called. Receives the partial filter update and `updatePreference`.
   */
  saveExtraPreferences?: (
    newFilters: Partial<TFilters>,
    updatePreference: (key: string, value: unknown, category?: string) => void,
  ) => void;

  /**
   * Optional callback to transform filter entries into request params.
   * Return `null` to skip the entry, or `{ key, value }` to add it.
   * If not provided, all non-null/empty filters are added as-is.
   */
  transformFilterParam?: (
    key: string,
    value: unknown,
    filters: TFilters,
  ) => { key: string; value: unknown } | null | undefined;

  /**
   * Optional callback invoked after a successful fetch response.
   * Useful for extracting extra data from the response (e.g. stats).
   */
  onFetchSuccess?: (response: ListResponse) => void;
}

export interface DocumentState<TFilters extends object> {
  // Core list state
  items: unknown[];
  setItems: React.Dispatch<React.SetStateAction<unknown[]>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  initialized: boolean;

  // Filters
  filters: TFilters;
  setFilters: React.Dispatch<React.SetStateAction<TFilters>>;

  // Pagination
  pagination: Pagination;
  setPagination: React.Dispatch<React.SetStateAction<Pagination>>;

  // Sort
  sortBy: string;
  sortOrder: string;

  // Modal state
  showModal: boolean;
  editingEntity: unknown;
  selectedEntity: unknown;

  // Actions
  fetchItems: () => Promise<void>;
  createItem: (data: unknown) => Promise<unknown>;
  updateItem: (id: string, data: unknown) => Promise<unknown>;
  deleteItem: (id: string) => Promise<void>;
  updateFilters: (newFilters: Partial<TFilters>) => void;
  updateSort: (field: string, order: string) => void;
  refresh: () => void;
  openModal: (entity?: unknown) => void;
  closeModal: () => void;
  selectEntity: (entity: unknown) => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDocumentState<TFilters extends object>(
  config: DocumentStateConfig<TFilters>,
): DocumentState<TFilters> {
  const {
    name,
    apiService,
    paginationStyle = 'page-perpage',
    sortParamName,
    defaultSort,
    defaultSortOrder = 'desc',
    preferencePrefix,
    defaultPageSize = DEFAULT_PAGE_SIZE,
    defaultFilters,
    loadExtraPreferences,
    saveExtraPreferences,
    transformFilterParam,
    onFetchSuccess,
  } = config;

  const { user } = useAuth();
  const { getPreference, updatePreference } = usePreferences();

  // Duplicate-request guard
  const fetchingRef = useRef(false);

  // Core list state
  const [items, setItems] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingEntity, setEditingEntity] = useState<unknown>(null);
  const [selectedEntity, setSelectedEntity] = useState<unknown>(null);

  // Filters
  const [filters, setFilters] = useState<TFilters>(defaultFilters);

  // Pagination
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: defaultPageSize,
    total: 0,
  });

  // Sort
  const [sortBy, setSortBy] = useState(defaultSort);
  const [sortOrder, setSortOrder] = useState(defaultSortOrder);

  // -------------------------------------------------------------------------
  // Load preferences on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (user && !preferencesLoaded) {
      const savedSearch = getPreference(`${preferencePrefix}_search`, '') as string;
      const savedStatus = getPreference(`${preferencePrefix}_filter_status`, null) as string | null;
      const savedSort = getPreference(`${preferencePrefix}_sort_by`, defaultSort) as string;
      const savedOrder = getPreference(`${preferencePrefix}_sort_order`, defaultSortOrder) as string;

      const basePrefs = {
        search: savedSearch,
        status: savedStatus,
      } as unknown as Partial<TFilters>;

      const extraPrefs = loadExtraPreferences ? loadExtraPreferences(getPreference) : {};

      setFilters(prev => ({ ...prev, ...basePrefs, ...extraPrefs }));
      setSortBy(savedSort);
      setSortOrder(savedOrder);
      setPreferencesLoaded(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, preferencesLoaded]);

  // -------------------------------------------------------------------------
  // Fetch
  // -------------------------------------------------------------------------
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  const fetchItems = useCallback(async () => {
    if (!user) return;
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      setLoading(true);
      setError(null);

      // Build pagination / sort params
      const params: Record<string, unknown> = {};

      if (paginationStyle === 'skip-limit') {
        params.skip = (pagination.page - 1) * pagination.limit;
        params.limit = pagination.limit;
        params.sort_by = sortBy;
        params.sort_order = sortOrder;
      } else {
        params.page = pagination.page;
        params.per_page = pagination.limit;
        params.sort_by = sortBy;
        params[sortParamName ?? 'sort_direction'] = sortOrder;
      }

      // Add filter params
      Object.entries(filters).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') return;

        if (transformFilterParam) {
          const result = transformFilterParam(key, value, filters as TFilters);
          if (result === null || result === undefined) return;
          params[result.key] = result.value;
        } else {
          params[key] = value;
        }
      });

      const raw = await apiService.list(params as Record<string, string>);
      const response = (Array.isArray(raw) ? { items: raw, total: raw.length } : raw) as ListResponse;
      setItems(response.items || []);
      setPagination(prev => ({
        ...prev,
        total: response.total || 0,
      }));

      if (onFetchSuccess) {
        onFetchSuccess(response);
      }

      setInitialized(true);
    } catch (err) {
      console.error(`[${name}Context] Error fetching ${name.toLowerCase()}s:`, err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, pagination.page, pagination.limit, sortBy, sortOrder, filtersKey]);

  // Auto-fetch when dependencies change (only after preferences loaded)
  useEffect(() => {
    if (preferencesLoaded) {
      fetchItems();
    }
  }, [fetchItems, refreshKey, preferencesLoaded]);

  // -------------------------------------------------------------------------
  // CRUD
  // -------------------------------------------------------------------------
  const createItem = useCallback(async (data: unknown) => {
    try {
      setLoading(true);
      if (!apiService.create) throw new Error(`[${name}Context] apiService.create is not defined`);
      const created = await apiService.create(data);
      setItems(prev => [created, ...prev]);
      return created;
    } catch (err) {
      console.error(`[${name}Context] Error creating ${name.toLowerCase()}:`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateItem = useCallback(async (id: string, data: unknown) => {
    try {
      setLoading(true);
      if (!apiService.update) throw new Error(`[${name}Context] apiService.update is not defined`);
      const updated = await apiService.update(id, data);
      setItems(prev => prev.map((item) => (item as Identifiable).id === id ? updated : item));
      return updated;
    } catch (err) {
      console.error(`[${name}Context] Error updating ${name.toLowerCase()}:`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    try {
      setLoading(true);
      if (!apiService.delete) throw new Error(`[${name}Context] apiService.delete is not defined`);
      await apiService.delete(id);
      setItems(prev => prev.filter((item) => (item as Identifiable).id !== id));
    } catch (err) {
      console.error(`[${name}Context] Error deleting ${name.toLowerCase()}:`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------------
  // Filters / Sort / Refresh
  // -------------------------------------------------------------------------
  const updateFiltersCallback = useCallback((newFilters: Partial<TFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 }));

    // Persist common prefs
    const commonFilters = newFilters as Partial<CommonFilterKeys>;
    if (commonFilters.status !== undefined) {
      updatePreference(`${preferencePrefix}_filter_status`, commonFilters.status, 'finance');
    }
    if (commonFilters.search !== undefined) {
      updatePreference(`${preferencePrefix}_search`, commonFilters.search, 'finance');
    }

    // Persist domain-specific prefs
    if (saveExtraPreferences) {
      saveExtraPreferences(newFilters, updatePreference);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updatePreference]);

  const updateSortCallback = useCallback((field: string, order: string) => {
    setSortBy(field);
    setSortOrder(order);
    updatePreference(`${preferencePrefix}_sort_by`, field, 'finance');
    updatePreference(`${preferencePrefix}_sort_order`, order, 'finance');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updatePreference]);

  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // -------------------------------------------------------------------------
  // Modal helpers
  // -------------------------------------------------------------------------
  const openModal = useCallback((entity: unknown = null) => {
    setEditingEntity(entity);
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingEntity(null);
  }, []);

  const selectEntity = useCallback((entity: unknown) => {
    setSelectedEntity(entity);
  }, []);

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------
  return {
    items,
    setItems,
    loading,
    setLoading,
    error,
    setError,
    initialized,
    filters,
    setFilters,
    pagination,
    setPagination,
    sortBy,
    sortOrder,
    showModal,
    editingEntity,
    selectedEntity,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    updateFilters: updateFiltersCallback,
    updateSort: updateSortCallback,
    refresh,
    openModal,
    closeModal,
    selectEntity,
  };
}
