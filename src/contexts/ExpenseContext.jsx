import React, { createContext, useState, useCallback, useMemo, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { usePreferences } from './PreferencesContext';
import expensesAPI from '../services/api/finance/expenses';

export const ExpenseContext = createContext(null);

export const ExpenseProvider = ({ children }) => {
  const { user } = useAuth();
  const { getPreference, updatePreference } = usePreferences();

  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);

  // Bulk selection state
  const [selectedExpenseIds, setSelectedExpenseIds] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    category_id: null,
    vendor_id: null,
    from_date: null,
    to_date: null,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });

  const [sortBy, setSortBy] = useState('expense_date');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    if (user) {
      const savedFilters = {
        search: getPreference('expense_search', ''),
        category_id: getPreference('expense_filter_category', null),
        vendor_id: getPreference('expense_filter_vendor', null),
      };
      const savedSort = getPreference('expense_sort_by', 'expense_date');
      const savedOrder = getPreference('expense_sort_order', 'desc');

      setFilters(savedFilters);
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
      const params = {
        skip: (pagination.page - 1) * pagination.limit,
        limit: pagination.limit,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      // Only add filter params if they have actual values
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params[key] = value;
        }
      });

      const response = await expensesAPI.list(params);
      setExpenses(response.items || response);
      setPagination(prev => ({
        ...prev,
        total: response.total || response.length,
      }));
      setInitialized(true);
    } catch (err) {
      console.error('[ExpenseContext] Error fetching expenses:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, pagination.page, pagination.limit, sortBy, sortOrder, filters]);

  const fetchCategories = useCallback(async () => {
    if (!user) return;

    try {
      const data = await expensesAPI.getCategories();
      // Handle both array and paginated response formats
      const categoriesArray = Array.isArray(data) ? data : (data?.items || []);
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

  const createExpense = useCallback(async (expenseData) => {
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

  const updateExpense = useCallback(async (expenseId, expenseData) => {
    try {
      setLoading(true);
      const updated = await expensesAPI.update(expenseId, expenseData);
      setExpenses(prev => prev.map(e => e.id === expenseId ? updated : e));
      return updated;
    } catch (err) {
      console.error('[ExpenseContext] Error updating expense:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteExpense = useCallback(async (expenseId) => {
    try {
      setLoading(true);
      await expensesAPI.delete(expenseId);
      setExpenses(prev => prev.filter(e => e.id !== expenseId));
    } catch (err) {
      console.error('[ExpenseContext] Error deleting expense:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkDeleteExpenses = useCallback(async (expenseIds) => {
    try {
      setLoading(true);
      await expensesAPI.bulkDelete(expenseIds);
      setExpenses(prev => prev.filter(e => !expenseIds.includes(e.id)));
    } catch (err) {
      console.error('[ExpenseContext] Error bulk deleting expenses:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createCategory = useCallback(async (categoryData) => {
    try {
      const created = await expensesAPI.createCategory(categoryData);
      setCategories(prev => [...prev, created]);
      return created;
    } catch (err) {
      console.error('[ExpenseContext] Error creating category:', err);
      throw err;
    }
  }, []);

  const updateCategory = useCallback(async (categoryId, categoryData) => {
    try {
      const updated = await expensesAPI.updateCategory(categoryId, categoryData);
      setCategories(prev => prev.map(c => c.id === categoryId ? updated : c));
      return updated;
    } catch (err) {
      console.error('[ExpenseContext] Error updating category:', err);
      throw err;
    }
  }, []);

  const deleteCategory = useCallback(async (categoryId) => {
    try {
      await expensesAPI.deleteCategory(categoryId);
      setCategories(prev => prev.filter(c => c.id !== categoryId));
    } catch (err) {
      console.error('[ExpenseContext] Error deleting category:', err);
      throw err;
    }
  }, []);

  const uploadAttachment = useCallback(async (expenseId, file) => {
    try {
      const result = await expensesAPI.uploadAttachment(expenseId, file);
      setExpenses(prev => prev.map(e =>
        e.id === expenseId ? { ...e, has_attachment: true, attachment_filename: file.name } : e
      ));
      return result;
    } catch (err) {
      console.error('[ExpenseContext] Error uploading attachment:', err);
      throw err;
    }
  }, []);

  const generateNextExpense = useCallback(async (expenseId) => {
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

  const getRecurringChildren = useCallback(async (expenseId, params = {}) => {
    try {
      return await expensesAPI.getRecurringChildren(expenseId, params);
    } catch (err) {
      console.error('[ExpenseContext] Error fetching recurring children:', err);
      throw err;
    }
  }, []);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 }));

    if (newFilters.category_id !== undefined) {
      updatePreference('expense_filter_category', newFilters.category_id, 'finance');
    }
    if (newFilters.vendor_id !== undefined) {
      updatePreference('expense_filter_vendor', newFilters.vendor_id, 'finance');
    }
    if (newFilters.search !== undefined) {
      updatePreference('expense_search', newFilters.search, 'finance');
    }
  }, [updatePreference]);

  const updateSort = useCallback((field, order) => {
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

  const openExpenseModal = useCallback((expense = null) => {
    setEditingExpense(expense);
    setShowExpenseModal(true);
  }, []);

  const closeExpenseModal = useCallback(() => {
    setShowExpenseModal(false);
    setEditingExpense(null);
  }, []);

  const selectExpense = useCallback((expense) => {
    setSelectedExpense(expense);
  }, []);

  const toggleExpenseSelection = useCallback((expenseId) => {
    setSelectedExpenseIds(prev => {
      if (prev.includes(expenseId)) {
        return prev.filter(id => id !== expenseId);
      } else {
        return [...prev, expenseId];
      }
    });
  }, []);

  const selectAllExpenses = useCallback(() => {
    setSelectedExpenseIds(expenses.map(e => e.id));
  }, [expenses]);

  const clearSelection = useCallback(() => {
    setSelectedExpenseIds([]);
  }, []);

  const bulkUpdateExpenses = useCallback(async (expenseIds, updates) => {
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
