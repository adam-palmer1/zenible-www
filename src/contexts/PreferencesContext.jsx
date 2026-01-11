import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import adminAPI from '../services/adminAPI';
import { useAuth } from './AuthContext';

const PreferencesContext = createContext();

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};

export const PreferencesProvider = ({ children }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({});
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

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
    const themePrefs = preferences?.theme || {};
    const isDark = themePrefs.mode === 'dark' || themePrefs.darkMode === true;
    setDarkMode(isDark);

    // Apply dark mode class to document
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [preferences]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      console.log('[PreferencesContext] Fetching preferences from API...');
      const data = await adminAPI.getPreferencesDict();
      console.log('[PreferencesContext] Preferences fetched:', data);
      setPreferences(data || {});
      setInitialized(true);
    } catch (error) {
      console.error('[PreferencesContext] Error loading preferences:', error);
      // Set default preferences on error
      setPreferences({
        theme: { mode: 'light', darkMode: false }
      });
      setInitialized(true); // Still mark as initialized even on error
    } finally {
      setLoading(false);
      console.log('[PreferencesContext] Preferences loading complete');
    }
  };

  const updatePreference = async (key, value, category = null) => {
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
    } catch (error) {
      console.error('Error updating preference:', error);
      // Reload preferences on error to sync with server
      loadPreferences();
      throw error;
    }
  };

  const bulkUpdatePreferences = async (updates, replaceAll = false) => {
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
    } catch (error) {
      console.error('Error bulk updating preferences:', error);
      // Reload preferences on error to sync with server
      loadPreferences();
      throw error;
    }
  };

  const deletePreference = async (key) => {
    try {
      // Optimistically update local state
      const newPrefs = { ...preferences };
      delete newPrefs[key];
      setPreferences(newPrefs);

      // Delete on server
      await adminAPI.deletePreference(key);
    } catch (error) {
      console.error('Error deleting preference:', error);
      // Reload preferences on error to sync with server
      loadPreferences();
      throw error;
    }
  };

  const toggleDarkMode = async () => {
    const newDarkMode = !darkMode;
    await updatePreference('theme', {
      ...preferences.theme,
      mode: newDarkMode ? 'dark' : 'light',
      darkMode: newDarkMode
    }, 'ui');
  };

  const getPreference = useCallback((key, defaultValue = null) => {
    return preferences[key] !== undefined ? preferences[key] : defaultValue;
  }, [preferences]);

  // CRM-specific preference helpers
  const getCRMFilters = () => {
    return {
      search: getPreference('crm_search', ''),
      is_client: getPreference('crm_filter_is_client', null),
      is_vendor: getPreference('crm_filter_is_vendor', null),
      global_status_id: getPreference('crm_filter_status', null),
      is_active: getPreference('crm_filter_is_active', true),
      sort_by: getPreference('crm_sort_by', 'created_at_desc'),
    };
  };

  const setCRMFilters = async (filters) => {
    const updates = [
      { key: 'crm_search', value: filters.search || '', category: 'crm' },
      { key: 'crm_filter_is_client', value: filters.is_client, category: 'crm' },
      { key: 'crm_filter_is_vendor', value: filters.is_vendor, category: 'crm' },
      { key: 'crm_filter_status', value: filters.global_status_id, category: 'crm' },
      { key: 'crm_filter_is_active', value: filters.is_active, category: 'crm' },
      { key: 'crm_sort_by', value: filters.sort_by || 'created_at_desc', category: 'crm' },
    ];

    await bulkUpdatePreferences(updates);
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