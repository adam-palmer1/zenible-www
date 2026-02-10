import { createContext, useState, useCallback, useMemo, useContext, useEffect, type Dispatch, type SetStateAction, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import expensesAPI from '../services/api/finance/expenses';
import { useDocumentState, type Pagination, type DocumentStateConfig } from './useDocumentState';

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

export interface Expense {
  id: string;
  status?: string;
  amount?: number | string;
  category_id?: string;
  vendor_id?: string;
  expense_date?: string;
  [key: string]: unknown;
}

export interface ExpenseStats {
  total_count?: number;
  converted_total?: { currency_symbol?: string; total?: string | number; [key: string]: unknown };
  converted_outstanding?: { currency_symbol?: string; total?: string | number; [key: string]: unknown };
  total_by_currency?: Array<{ currency_symbol?: string; total?: string | number; [key: string]: unknown }>;
  outstanding_by_currency?: Array<{ currency_symbol?: string; total?: string | number; [key: string]: unknown }>;
  [key: string]: unknown;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface ExpenseContextValue {
  expenses: Expense[];
  stats: ExpenseStats | null;
  categories: ExpenseCategory[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
  categoriesLoaded: boolean;
  filters: ExpenseFilters;
  pagination: Pagination;
  sortBy: string;
  sortOrder: string;
  showExpenseModal: boolean;
  editingExpense: Expense | null;
  selectedExpense: Expense | null;
  selectedExpenseIds: string[];
  bulkActionLoading: boolean;
  fetchExpenses: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  createExpense: (expenseData: unknown) => Promise<unknown>;
  updateExpense: (expenseId: string, expenseData: unknown) => Promise<unknown>;
  deleteExpense: (expenseId: string) => Promise<void>;
  bulkDeleteExpenses: (expenseIds: string[]) => Promise<void>;
  bulkUpdateExpenses: (expenseIds: string[], updates: unknown) => Promise<void>;
  createCategory: (categoryData: unknown) => Promise<{ id: string; [key: string]: unknown }>;
  updateCategory: (categoryId: string, categoryData: unknown) => Promise<unknown>;
  deleteCategory: (categoryId: string) => Promise<void>;
  uploadAttachment: (expenseId: string, file: File) => Promise<unknown>;
  generateNextExpense: (expenseId: string) => Promise<unknown>;
  getRecurringChildren: (expenseId: string, params?: unknown) => Promise<unknown>;
  updateFilters: (newFilters: Partial<ExpenseFilters>) => void;
  updateSort: (field: string, order: string) => void;
  setPagination: Dispatch<SetStateAction<Pagination>>;
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

// ExpenseContext-specific: translate date fields based on date_field filter
const transformFilterParam = (key: string, value: unknown, filters: ExpenseFilters) => {
  // Don't pass date_field directly, it's handled by translating start_date/end_date
  if (key === 'date_field') return null;

  if (key === 'start_date' || key === 'end_date') {
    const dateField = filters.date_field || 'entry';
    if (dateField === 'paid') {
      // For paid date, use paid_from/paid_to
      if (key === 'start_date') {
        return { key: 'paid_from', value };
      } else {
        return { key: 'paid_to', value };
      }
    }
    // For entry date (expense_date), use start_date/end_date as-is
    return { key, value };
  }

  return { key, value };
};

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

// Load expense-specific preference keys
const loadExtraPreferences = (
  getPreference: (key: string, defaultValue: unknown) => unknown,
) => ({
  category_id: getPreference('expense_filter_category', null) as string | null,
  vendor_id: getPreference('expense_filter_vendor', null) as string | null,
  vendor_ids: getPreference('expense_filter_vendor_ids', null) as string | null,
  date_field: getPreference('expense_date_field', 'entry') as string,
  pricing_type: getPreference('expense_filter_pricing_type', null) as string | null,
  is_template: getPreference('expense_filter_is_template', null) as boolean | null,
});

// Save expense-specific preference keys
const saveExtraPreferences = (
  newFilters: Partial<ExpenseFilters>,
  updatePreference: (key: string, value: unknown, category?: string) => void,
) => {
  if (newFilters.category_id !== undefined) {
    updatePreference('expense_filter_category', newFilters.category_id, 'finance');
  }
  if (newFilters.vendor_id !== undefined) {
    updatePreference('expense_filter_vendor', newFilters.vendor_id, 'finance');
  }
  if (newFilters.vendor_ids !== undefined) {
    updatePreference('expense_filter_vendor_ids', newFilters.vendor_ids, 'finance');
  }
  if (newFilters.date_field !== undefined) {
    updatePreference('expense_date_field', newFilters.date_field, 'finance');
  }
  if (newFilters.pricing_type !== undefined) {
    updatePreference('expense_filter_pricing_type', newFilters.pricing_type, 'finance');
  }
  if (newFilters.is_template !== undefined) {
    updatePreference('expense_filter_is_template', newFilters.is_template, 'finance');
  }
};

export const ExpenseProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();

  // -------------------------------------------------------------------------
  // Expense-specific state
  // -------------------------------------------------------------------------
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);

  // Bulk selection state
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const defaultRange = getDefaultDateRange();

  // -------------------------------------------------------------------------
  // Shared document state (filters, pagination, sort, CRUD, modal, fetch)
  // -------------------------------------------------------------------------
  const doc = useDocumentState<ExpenseFilters>({
    name: 'Expense',
    apiService: expensesAPI as unknown as DocumentStateConfig<ExpenseFilters>['apiService'],
    paginationStyle: 'page-perpage',
    defaultSort: 'expense_date',
    preferencePrefix: 'expense',
    defaultFilters: {
      search: '',
      category_id: null,
      vendor_id: null,
      vendor_ids: null,
      start_date: defaultRange.start_date,
      end_date: defaultRange.end_date,
      date_field: 'entry',
      status: null,
      pricing_type: null,
      is_template: null,
    },
    loadExtraPreferences,
    saveExtraPreferences,
    transformFilterParam,
    onFetchSuccess: (response) => {
      setStats((response.stats as ExpenseStats) || null);
    },
  });

  // -------------------------------------------------------------------------
  // Expense-specific: fetch categories
  // -------------------------------------------------------------------------
  const fetchCategories = useCallback(async () => {
    if (!user) return;

    try {
      const data = await expensesAPI.getCategories();
      // Handle both array and paginated response formats
      const categoriesArray = Array.isArray(data) ? data : ((data as { items?: ExpenseCategory[] })?.items || []);
      setCategories(categoriesArray);
      setCategoriesLoaded(true);
    } catch (err) {
      console.error('[ExpenseContext] Error fetching categories:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user && !categoriesLoaded) {
      fetchCategories();
    }
  }, [user, categoriesLoaded, fetchCategories]);

  // -------------------------------------------------------------------------
  // Expense-specific actions (using doc.setItems and doc.setLoading)
  // -------------------------------------------------------------------------
  const bulkDeleteExpenses = useCallback(async (expenseIds: string[]) => {
    try {
      doc.setLoading(true);
      await expensesAPI.bulkDelete(expenseIds);
      doc.setItems(prev => prev.filter((e) => !expenseIds.includes((e as Expense).id)));
      doc.refresh();
    } catch (err) {
      console.error('[ExpenseContext] Error bulk deleting expenses:', err);
      throw err;
    } finally {
      doc.setLoading(false);
    }
  }, [doc.setLoading, doc.setItems, doc.refresh]);

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
      setCategories(prev => prev.map((c) => c.id === categoryId ? (updated as ExpenseCategory) : c));
      return updated;
    } catch (err) {
      console.error('[ExpenseContext] Error updating category:', err);
      throw err;
    }
  }, []);

  const deleteCategory = useCallback(async (categoryId: string) => {
    try {
      await expensesAPI.deleteCategory(categoryId);
      setCategories(prev => prev.filter((c) => c.id !== categoryId));
    } catch (err) {
      console.error('[ExpenseContext] Error deleting category:', err);
      throw err;
    }
  }, []);

  const uploadAttachment = useCallback(async (expenseId: string, file: File) => {
    try {
      const result = await expensesAPI.uploadAttachment(expenseId, file);
      doc.setItems(prev => prev.map((e) =>
        (e as Expense).id === expenseId ? { ...e as Expense, has_attachment: true, attachment_filename: file.name } : e
      ));
      return result;
    } catch (err) {
      console.error('[ExpenseContext] Error uploading attachment:', err);
      throw err;
    }
  }, [doc.setItems]);

  const generateNextExpense = useCallback(async (expenseId: string) => {
    try {
      doc.setLoading(true);
      const newExpense = await expensesAPI.generateNext(expenseId);
      doc.setItems(prev => [newExpense, ...prev]);
      doc.refresh();
      return newExpense;
    } catch (err) {
      console.error('[ExpenseContext] Error generating next expense:', err);
      throw err;
    } finally {
      doc.setLoading(false);
    }
  }, [doc.setLoading, doc.setItems, doc.refresh]);

  const getRecurringChildren = useCallback(async (expenseId: string, params: unknown = {}) => {
    try {
      return await expensesAPI.getRecurringChildren(expenseId, params as Record<string, string>);
    } catch (err) {
      console.error('[ExpenseContext] Error fetching recurring children:', err);
      throw err;
    }
  }, []);

  const refreshCategories = useCallback(() => {
    setCategoriesLoaded(false);
  }, []);

  // -------------------------------------------------------------------------
  // Bulk selection helpers
  // -------------------------------------------------------------------------
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
    setSelectedExpenseIds(doc.items.map((e) => (e as Expense).id));
  }, [doc.items]);

  const clearSelection = useCallback(() => {
    setSelectedExpenseIds([]);
  }, []);

  const bulkUpdateExpenses = useCallback(async (expenseIds: string[], updates: unknown) => {
    try {
      setBulkActionLoading(true);
      await expensesAPI.bulkUpdate(expenseIds, updates);
      // Refresh expenses to get updated data
      await doc.fetchItems();
      clearSelection();
    } catch (err) {
      console.error('[ExpenseContext] Error bulk updating expenses:', err);
      throw err;
    } finally {
      setBulkActionLoading(false);
    }
  }, [doc.fetchItems, clearSelection]);

  // -------------------------------------------------------------------------
  // Context value - map shared doc state to ExpenseContext's existing API
  // -------------------------------------------------------------------------
  const value = useMemo(() => ({
    // State (aliased to match existing ExpenseContextValue interface)
    expenses: doc.items as Expense[],
    stats,
    categories,
    loading: doc.loading,
    error: doc.error,
    initialized: doc.initialized,
    categoriesLoaded,
    filters: doc.filters,
    pagination: doc.pagination,
    sortBy: doc.sortBy,
    sortOrder: doc.sortOrder,
    showExpenseModal: doc.showModal,
    editingExpense: doc.editingEntity as Expense | null,
    selectedExpense: doc.selectedEntity as Expense | null,
    selectedExpenseIds,
    bulkActionLoading,
    // Shared CRUD (aliased)
    fetchExpenses: doc.fetchItems,
    fetchCategories,
    createExpense: doc.createItem,
    updateExpense: doc.updateItem,
    deleteExpense: doc.deleteItem,
    // Expense-specific actions
    bulkDeleteExpenses,
    bulkUpdateExpenses,
    createCategory,
    updateCategory,
    deleteCategory,
    uploadAttachment,
    generateNextExpense,
    getRecurringChildren,
    // Shared UI actions (aliased)
    updateFilters: doc.updateFilters,
    updateSort: doc.updateSort,
    setPagination: doc.setPagination,
    refresh: doc.refresh,
    refreshCategories,
    openExpenseModal: doc.openModal,
    closeExpenseModal: doc.closeModal,
    selectExpense: doc.selectEntity,
    // Selection helpers
    toggleExpenseSelection,
    selectAllExpenses,
    clearSelection,
  }), [
    doc.items,
    stats,
    categories,
    doc.loading,
    doc.error,
    doc.initialized,
    categoriesLoaded,
    doc.filters,
    doc.pagination,
    doc.sortBy,
    doc.sortOrder,
    doc.showModal,
    doc.editingEntity,
    doc.selectedEntity,
    selectedExpenseIds,
    bulkActionLoading,
    doc.fetchItems,
    fetchCategories,
    doc.createItem,
    doc.updateItem,
    doc.deleteItem,
    bulkDeleteExpenses,
    bulkUpdateExpenses,
    createCategory,
    updateCategory,
    deleteCategory,
    uploadAttachment,
    generateNextExpense,
    getRecurringChildren,
    doc.updateFilters,
    doc.updateSort,
    doc.refresh,
    refreshCategories,
    doc.openModal,
    doc.closeModal,
    doc.selectEntity,
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
