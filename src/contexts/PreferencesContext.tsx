import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import adminAPI from '../services/adminAPI';
import { useAuth } from './AuthContext';

interface PreferenceUpdate {
  key: string;
  value: unknown;
  category?: string | null;
}

interface CRMFilters {
  search: string;
  is_client: unknown;
  is_vendor: unknown;
  global_status_id: unknown;
  is_active: unknown;
  sort_by: string;
}

interface PreferencesContextValue {
  preferences: Record<string, unknown>;
  setPreferences: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  loading: boolean;
  initialized: boolean;
  darkMode: boolean;
  toggleDarkMode: () => Promise<void>;
  updatePreference: (key: string, value: unknown, category?: string | null) => Promise<void>;
  bulkUpdatePreferences: (updates: PreferenceUpdate[], replaceAll?: boolean) => Promise<void>;
  deletePreference: (key: string) => Promise<void>;
  getPreference: (key: string, defaultValue?: unknown) => unknown;
  reloadPreferences: () => Promise<void>;
  getCRMFilters: () => CRMFilters;
  setCRMFilters: (filters: Partial<CRMFilters>) => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export const usePreferences = (): PreferencesContextValue => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};

export const PreferencesProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [initialized, setInitialized] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const preferencesRef = useRef(preferences);
  preferencesRef.current = preferences;

  // Load all preferences when user is authenticated
  useEffect(() => {
    if (user) {
      loadPreferences();
    } else {
      // Reset preferences when user logs out
      setPreferences({});
      setDarkMode(false);
      setLoading(false);
      setInitialized(false);
      document.documentElement.classList.remove('dark');
    }
  }, [user]);

  // Update dark mode when preferences change
  useEffect(() => {
    const themePrefs = (preferences?.theme as Record<string, unknown>) || {};
    const isDark = themePrefs.mode === 'dark' || themePrefs.darkMode === true;
    setDarkMode(isDark);

    // Apply dark mode class to document
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [preferences]);

  const loadPreferences = async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await adminAPI.getPreferencesDict();
      setPreferences((data as Record<string, unknown>) || {});
      setInitialized(true);
    } catch (err) {
      console.error('[PreferencesContext] Error loading preferences:', err);
      // Set default preferences on error
      setPreferences({
        theme: { mode: 'light', darkMode: false }
      });
      setInitialized(true); // Still mark as initialized even on error
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: string, value: unknown, category: string | null = null): Promise<void> => {
    try {
      // Optimistically update local state
      setPreferences(prev => ({
        ...prev,
        [key]: value
      }));

      // Update on server
      await adminAPI.setPreference(key, {
        preference_value: value,
        category
      });
    } catch (err) {
      console.error('Error updating preference:', err);
      // Reload preferences on error to sync with server
      loadPreferences();
      throw err;
    }
  };

  const bulkUpdatePreferences = async (updates: PreferenceUpdate[], replaceAll: boolean = false): Promise<void> => {
    try {
      // Optimistically update local state
      const newPrefs = { ...preferences };
      updates.forEach(({ key, value }) => {
        newPrefs[key] = value;
      });
      setPreferences(newPrefs);

      // Update on server
      await adminAPI.bulkSetPreferences({
        preferences: updates.map(({ key, value, category }) => ({
          key,
          value,
          category: category || null
        })),
        replace_all: replaceAll
      });
    } catch (err) {
      console.error('Error bulk updating preferences:', err);
      // Reload preferences on error to sync with server
      loadPreferences();
      throw err;
    }
  };

  const deletePreference = async (key: string): Promise<void> => {
    try {
      // Optimistically update local state
      const newPrefs = { ...preferences };
      delete newPrefs[key];
      setPreferences(newPrefs);

      // Delete on server
      await adminAPI.deletePreference(key);
    } catch (err) {
      console.error('Error deleting preference:', err);
      // Reload preferences on error to sync with server
      loadPreferences();
      throw err;
    }
  };

  const toggleDarkMode = async (): Promise<void> => {
    const newDarkMode = !darkMode;
    await updatePreference('theme', {
      ...(preferences.theme as Record<string, unknown>),
      mode: newDarkMode ? 'dark' : 'light',
      darkMode: newDarkMode
    }, 'ui');
  };

  const getPreference = useCallback((key: string, defaultValue: unknown = null): unknown => {
    return preferencesRef.current[key] !== undefined ? preferencesRef.current[key] : defaultValue;
  }, []);

  // CRM-specific preference helpers
  const getCRMFilters = (): CRMFilters => {
    return {
      search: getPreference('crm_search', '') as string,
      is_client: getPreference('crm_filter_is_client', null),
      is_vendor: getPreference('crm_filter_is_vendor', null),
      global_status_id: getPreference('crm_filter_status', null),
      is_active: getPreference('crm_filter_is_active', true),
      sort_by: getPreference('crm_sort_by', 'created_at_desc') as string,
    };
  };

  const setCRMFilters = async (filters: Partial<CRMFilters>): Promise<void> => {
    const updates: PreferenceUpdate[] = [
      { key: 'crm_search', value: filters.search || '', category: 'crm' },
      { key: 'crm_filter_is_client', value: filters.is_client, category: 'crm' },
      { key: 'crm_filter_is_vendor', value: filters.is_vendor, category: 'crm' },
      { key: 'crm_filter_status', value: filters.global_status_id, category: 'crm' },
      { key: 'crm_filter_is_active', value: filters.is_active, category: 'crm' },
      { key: 'crm_sort_by', value: filters.sort_by || 'created_at_desc', category: 'crm' },
    ];

    await bulkUpdatePreferences(updates);
  };

  const value: PreferencesContextValue = {
    preferences,
    setPreferences,  // Needed by useDebouncedPreference for optimistic updates
    loading,
    initialized,
    darkMode,
    toggleDarkMode,
    updatePreference,
    bulkUpdatePreferences,
    deletePreference,
    getPreference,
    reloadPreferences: loadPreferences,
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
