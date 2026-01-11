import React, { createContext, useContext, useEffect } from 'react';
import { usePreferences as usePreferencesQuery } from '../hooks/queries/usePreferencesQuery';
import {
  useUpdatePreferenceMutation,
  useBulkUpdatePreferencesMutation,
  useDeletePreferenceMutation,
  useToggleDarkModeMutation,
  useUpdateCRMFiltersMutation,
} from '../hooks/mutations/usePreferenceMutations';
import { useAuth } from './AuthContext';

const PreferencesContext = createContext();

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};

/**
 * PreferencesProvider using React Query
 *
 * IMPROVEMENTS vs old version:
 * - No manual state management (194 lines → ~100 lines)
 * - Single source of truth (React Query cache)
 * - No race conditions (automatic cache coordination)
 * - No manual optimistic updates (built-in to mutations)
 * - Automatic refetch on window focus
 * - Better error handling with automatic rollback
 */
export const PreferencesProvider = ({ children }) => {
  const { user } = useAuth();

  // Use React Query hook for fetching preferences
  const {
    preferences,
    loading,
    initialized,
    darkMode,
    getPreference,
    getCRMFilters,
    refetch: reloadPreferences,
  } = usePreferencesQuery();

  // Mutations
  const updateMutation = useUpdatePreferenceMutation();
  const bulkUpdateMutation = useBulkUpdatePreferencesMutation();
  const deleteMutation = useDeletePreferenceMutation();
  const toggleDarkModeMutation = useToggleDarkModeMutation();
  const updateCRMFiltersMutation = useUpdateCRMFiltersMutation();

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Reset when user logs out
  useEffect(() => {
    if (!user) {
      document.documentElement.classList.remove('dark');
    }
  }, [user]);

  // Wrapper functions to maintain backward compatibility
  const updatePreference = async (key, value, category = null) => {
    return await updateMutation.mutateAsync({ key, value, category });
  };

  const bulkUpdatePreferences = async (updates, replaceAll = false) => {
    return await bulkUpdateMutation.mutateAsync({
      preferences: updates,
      replaceAll,
    });
  };

  const deletePreference = async (key) => {
    return await deleteMutation.mutateAsync(key);
  };

  const toggleDarkMode = () => {
    toggleDarkModeMutation.toggleDarkMode();
  };

  const setCRMFilters = (filters) => {
    updateCRMFiltersMutation.updateCRMFilters(filters);
  };

  const value = {
    preferences,
    loading,
    initialized,
    darkMode,
    toggleDarkMode,
    updatePreference,
    bulkUpdatePreferences,
    deletePreference,
    getPreference,
    reloadPreferences,
    // CRM helpers
    getCRMFilters,
    setCRMFilters,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};
