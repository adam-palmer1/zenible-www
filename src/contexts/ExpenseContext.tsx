import { createContext, useState, useCallback, useMemo, useContext, useEffect, type Dispatch, type SetStateAction, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { usePreferences } from './PreferencesContext';
import expensesAPI from '../services/api/finance/expenses';
import { DEFAULT_PAGE_SIZE } from '../constants/pagination';

interface ExpenseFilters {
  search: string;
  category_id: string | null;
  vendor_id: string | null;
  vendor_ids: string | null;
  start_date: string | null;
  end_date: string | null;
  date_field: string;
  status: string | null;
  pricing_type: string | null;
  is_template: boolean | null;
}

interface ExpensePagination {
  page: number;
  limit: number;
  total: number;
}

interface ExpenseContextValue {
  expenses: unknown[];
  stats: unknown;
  categories: unknown[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
  categoriesLoaded: boolean;
  filters: ExpenseFilters;
  pagination: ExpensePagination;
  sortBy: string;
  sortOrder: string;
  showExpenseModal: boolean;
  editingExpense: unknown;
  selectedExpense: unknown;
  selectedExpenseIds: string[];
  bulkActionLoading: boolean;
  fetchExpenses: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  createExpense: (expenseData: unknown) => Promise<unknown>;
  updateExpense: (expenseId: string, expenseData: unknown) => Promise<unknown>;
  deleteExpense: (expenseId: string) => Promise<void>;
  bulkDeleteExpenses: (expenseIds: string[]) => Promise<void>;
  bulkUpdateExpenses: (expenseIds: string[], updates: unknown) => Promise<void>;
  createCategory: (categoryData: unknown) => Promise<unknown>;
  updateCategory: (categoryId: string, categoryData: unknown) => Promise<unknown>;
  deleteCategory: (categoryId: string) => Promise<void>;
  uploadAttachment: (expenseId: string, file: File) => Promise<unknown>;
  generateNextExpense: (expenseId: string) => Promise<unknown>;
  getRecurringChildren: (expenseId: string, params?: unknown) => Promise<unknown>;
  updateFilters: (newFilters: Partial<ExpenseFilters>) => void;
  updateSort: (field: string, order: string) => void;
  setPagination: Dispatch<SetStateAction<ExpensePagination>>;
  refresh: () => void;
  refreshCategories: () => void;
  openExpenseModal: (expense?: unknown) => void;
  closeExpenseModal: () => void;
  selectExpense: (expense: unknown) => void;
  toggleExpenseSelection: (expenseId: string) => void;
  selectAllExpenses: () => void;
  clearSelection: () => void;
}

export const ExpenseContext = createContext<ExpenseContextValue | null>(null);

export const ExpenseProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { getPreference, updatePreference } = usePreferences();

  const [expenses, setExpenses] = useState<unknown[]>([]);
  const [stats, setStats] = useState<unknown>(null);
  const [categories, setCategories] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<unknown>(null);
  const [selectedExpense, setSelectedExpense] = useState<unknown>(null);

  // Bulk selection state
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Default to last 30 days
  const getDefaultDateRange = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 29); // 29 days ago + today = 30 days
    return {
      start_date: thirtyDaysAgo.toISOString().split('T')[0],
      end_date: today.toISOString().split('T')[0],
    };
  };

  const defaultRange = getDefaultDateRange();
  const [filters, setFilters] = useState<ExpenseFilters>({
    search: '',
    category_id: null,
    vendor_id: null,
    vendor_ids: null, // comma-separated string of vendor IDs for multi-select filter
    start_date: defaultRange.start_date,
    end_date: defaultRange.end_date,
    date_field: 'entry', // 'entry' (expense_date) or 'paid' (paid_at)
    status: null, // pending, paid, completed, cancelled
    pricing_type: null, // fixed, recurring
    is_template: null, // true to show only recurring templates
  });

  const [pagination, setPagination] = useState<ExpensePagination>({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
  });

  const [sortBy, setSortBy] = useState('expense_date');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    if (user) {
      const savedDateField = getPreference('expense_date_field', 'entry');
      const savedFilters = {
        search: getPreference('expense_search', '') as string,
        category_id: getPreference('expense_filter_category', null) as string | null,
        vendor_id: getPreference('expense_filter_vendor', null) as string | null,
        vendor_ids: getPreference('expense_filter_vendor_ids', null) as string | null,
        date_field: savedDateField as string,
        status: getPreference('expense_filter_status', null) as string | null,
        pricing_type: getPreference('expense_filter_pricing_type', null) as string | null,
        is_template: getPreference('expense_filter_is_template', null) as boolean | null,
      };
      const savedSort = getPreference('expense_sort_by', 'expense_date') as string;
      const savedOrder = getPreference('expense_sort_order', 'desc') as string;

      setFilters(prev => ({ ...prev, ...savedFilters }));
      setSortBy(savedSort);
      setSortOrder(savedOrder);
      setPreferencesLoaded(true);
    }
  }, [user, getPreference]);

  const fetchExpenses = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Build params, filtering out null/undefined values
      const params: Record<string, unknown> = {
        page: pagination.page,
        per_page: pagination.limit,
        sort_by: sortBy,
        sort_direction: sortOrder,
      };

      // Only add filter params if they have actual values
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          // Handle date field translation
          if (key === 'date_field') {
            // Don't pass date_field directly, it's handled by translating start_date/end_date
            return;
          }
          if (key === 'start_date' || key === 'end_date') {
            // Translate based on date_field
            const dateField = filters.date_field || 'entry';
            if (dateField === 'paid') {
              // For paid date, use paid_from/paid_to
              if (key === 'start_date') {
                params.paid_from = value;
              } else {
                params.paid_to = value;
              }
            } else {
              // For entry date (expense_date), use start_date/end_date
              params[key] = value;
            }
            return;
          }
          params[key] = value;
        }
      });

      const response = await expensesAPI.list(params as Record<string, string>) as any;
      setExpenses(response.items || response);
      setStats(response.stats || null);
      setPagination(prev => ({
        ...prev,
        total: response.total || response.length,
      }));
      setInitialized(true);
    } catch (err) {
      console.error('[ExpenseContext] Error fetching expenses:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user, pagination.page, pagination.limit, sortBy, sortOrder, filters]);

  const fetchCategories = useCallback(async () => {
    if (!user) return;

    try {
      const data = await expensesAPI.getCategories();
      // Handle both array and paginated response formats
      const categoriesArray = Array.isArray(data) ? data : ((data as any)?.items || []);
      setCategories(categoriesArray);
      setCategoriesLoaded(true);
    } catch (err) {
      console.error('[ExpenseContext] Error fetching categories:', err);
    }
  }, [user]);

  useEffect(() => {
    if (preferencesLoaded) {
      fetchExpenses();
    }
  }, [fetchExpenses, refreshKey, preferencesLoaded]);

  useEffect(() => {
    if (user && !categoriesLoaded) {
      fetchCategories();
    }
  }, [user, categoriesLoaded, fetchCategories]);

  const createExpense = useCallback(async (expenseData: unknown) => {
    try {
      setLoading(true);
      const created = await expensesAPI.create(expenseData);
      setExpenses(prev => [created, ...prev]);
      return created;
    } catch (err) {
      console.error('[ExpenseContext] Error creating expense:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateExpense = useCallback(async (expenseId: string, expenseData: unknown) => {
    try {
      setLoading(true);
      const updated = await expensesAPI.update(expenseId, expenseData);
      setExpenses(prev => prev.map((e: any) => e.id === expenseId ? updated : e));
      return updated;
    } catch (err) {
      console.error('[ExpenseContext] Error updating expense:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteExpense = useCallback(async (expenseId: string) => {
    try {
      setLoading(true);
      await expensesAPI.delete(expenseId);
      setExpenses(prev => prev.filter((e: any) => e.id !== expenseId));
    } catch (err) {
      console.error('[ExpenseContext] Error deleting expense:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkDeleteExpenses = useCallback(async (expenseIds: string[]) => {
    try {
      setLoading(true);
      await expensesAPI.bulkDelete(expenseIds);
      setExpenses(prev => prev.filter((e: any) => !expenseIds.includes(e.id)));
    } catch (err) {
      console.error('[ExpenseContext] Error bulk deleting expenses:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createCategory = useCallback(async (categoryData: unknown) => {
    try {
      const created = await expensesAPI.createCategory(categoryData);
      setCategories(prev => [...prev, created]);
      return created;
    } catch (err) {
      console.error('[ExpenseContext] Error creating category:', err);
      throw err;
    }
  }, []);

  const updateCategory = useCallback(async (categoryId: string, categoryData: unknown) => {
    try {
      const updated = await expensesAPI.updateCategory(categoryId, categoryData);
      setCategories(prev => prev.map((c: any) => c.id === categoryId ? updated : c));
      return updated;
    } catch (err) {
      console.error('[ExpenseContext] Error updating category:', err);
      throw err;
    }
  }, []);

  const deleteCategory = useCallback(async (categoryId: string) => {
    try {
      await expensesAPI.deleteCategory(categoryId);
      setCategories(prev => prev.filter((c: any) => c.id !== categoryId));
    } catch (err) {
      console.error('[ExpenseContext] Error deleting category:', err);
      throw err;
    }
  }, []);

  const uploadAttachment = useCallback(async (expenseId: string, file: File) => {
    try {
      const result = await expensesAPI.uploadAttachment(expenseId, file);
      setExpenses(prev => prev.map((e: any) =>
        e.id === expenseId ? { ...e, has_attachment: true, attachment_filename: file.name } : e
      ));
      return result;
    } catch (err) {
      console.error('[ExpenseContext] Error uploading attachment:', err);
      throw err;
    }
  }, []);

  const generateNextExpense = useCallback(async (expenseId: string) => {
    try {
      setLoading(true);
      const newExpense = await expensesAPI.generateNext(expenseId);
      setExpenses(prev => [newExpense, ...prev]);
      return newExpense;
    } catch (err) {
      console.error('[ExpenseContext] Error generating next expense:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getRecurringChildren = useCallback(async (expenseId: string, params: unknown = {}) => {
    try {
      return await expensesAPI.getRecurringChildren(expenseId, params as Record<string, string>);
    } catch (err) {
      console.error('[ExpenseContext] Error fetching recurring children:', err);
      throw err;
    }
  }, []);

  const updateFilters = useCallback((newFilters: Partial<ExpenseFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 }));

    if (newFilters.category_id !== undefined) {
      updatePreference('expense_filter_category', newFilters.category_id, 'finance');
    }
    if (newFilters.vendor_id !== undefined) {
      updatePreference('expense_filter_vendor', newFilters.vendor_id, 'finance');
    }
    if (newFilters.vendor_ids !== undefined) {
      updatePreference('expense_filter_vendor_ids', newFilters.vendor_ids, 'finance');
    }
    if (newFilters.search !== undefined) {
      updatePreference('expense_search', newFilters.search, 'finance');
    }
    if (newFilters.date_field !== undefined) {
      updatePreference('expense_date_field', newFilters.date_field, 'finance');
    }
    if (newFilters.status !== undefined) {
      updatePreference('expense_filter_status', newFilters.status, 'finance');
    }
    if (newFilters.pricing_type !== undefined) {
      updatePreference('expense_filter_pricing_type', newFilters.pricing_type, 'finance');
    }
    if (newFilters.is_template !== undefined) {
      updatePreference('expense_filter_is_template', newFilters.is_template, 'finance');
    }
  }, [updatePreference]);

  const updateSort = useCallback((field: string, order: string) => {
    setSortBy(field);
    setSortOrder(order);
    updatePreference('expense_sort_by', field, 'finance');
    updatePreference('expense_sort_order', order, 'finance');
  }, [updatePreference]);

  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const refreshCategories = useCallback(() => {
    setCategoriesLoaded(false);
  }, []);

  const openExpenseModal = useCallback((expense: unknown = null) => {
    setEditingExpense(expense);
    setShowExpenseModal(true);
  }, []);

  const closeExpenseModal = useCallback(() => {
    setShowExpenseModal(false);
    setEditingExpense(null);
  }, []);

  const selectExpense = useCallback((expense: unknown) => {
    setSelectedExpense(expense);
  }, []);

  const toggleExpenseSelection = useCallback((expenseId: string) => {
    setSelectedExpenseIds(prev => {
      if (prev.includes(expenseId)) {
        return prev.filter(id => id !== expenseId);
      } else {
        return [...prev, expenseId];
      }
    });
  }, []);

  const selectAllExpenses = useCallback(() => {
    setSelectedExpenseIds(expenses.map((e: any) => e.id));
  }, [expenses]);

  const clearSelection = useCallback(() => {
    setSelectedExpenseIds([]);
  }, []);

  const bulkUpdateExpenses = useCallback(async (expenseIds: string[], updates: unknown) => {
    try {
      setBulkActionLoading(true);
      await expensesAPI.bulkUpdate(expenseIds, updates);
      // Refresh expenses to get updated data
      await fetchExpenses();
      clearSelection();
    } catch (err) {
      console.error('[ExpenseContext] Error bulk updating expenses:', err);
      throw err;
    } finally {
      setBulkActionLoading(false);
    }
  }, [fetchExpenses, clearSelection]);

  const value = useMemo(() => ({
    expenses,
    stats,
    categories,
    loading,
    error,
    initialized,
    categoriesLoaded,
    filters,
    pagination,
    sortBy,
    sortOrder,
    showExpenseModal,
    editingExpense,
    selectedExpense,
    selectedExpenseIds,
    bulkActionLoading,
    fetchExpenses,
    fetchCategories,
    createExpense,
    updateExpense,
    deleteExpense,
    bulkDeleteExpenses,
    bulkUpdateExpenses,
    createCategory,
    updateCategory,
    deleteCategory,
    uploadAttachment,
    generateNextExpense,
    getRecurringChildren,
    updateFilters,
    updateSort,
    setPagination,
    refresh,
    refreshCategories,
    openExpenseModal,
    closeExpenseModal,
    selectExpense,
    toggleExpenseSelection,
    selectAllExpenses,
    clearSelection,
  }), [
    expenses,
    stats,
    categories,
    loading,
    error,
    initialized,
    categoriesLoaded,
    filters,
    pagination,
    sortBy,
    sortOrder,
    showExpenseModal,
    editingExpense,
    selectedExpense,
    selectedExpenseIds,
    bulkActionLoading,
    fetchExpenses,
    fetchCategories,
    createExpense,
    updateExpense,
    deleteExpense,
    bulkDeleteExpenses,
    bulkUpdateExpenses,
    createCategory,
    updateCategory,
    deleteCategory,
    uploadAttachment,
    generateNextExpense,
    getRecurringChildren,
    updateFilters,
    updateSort,
    refresh,
    refreshCategories,
    openExpenseModal,
    closeExpenseModal,
    selectExpense,
    toggleExpenseSelection,
    selectAllExpenses,
    clearSelection,
  ]);

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
};

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
};
