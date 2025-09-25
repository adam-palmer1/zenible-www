import React, { createContext, useState, useContext, useEffect } from 'react';
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
      const data = await adminAPI.getPreferencesDict();
      setPreferences(data || {});
    } catch (error) {
      console.error('Error loading preferences:', error);
      // Set default preferences on error
      setPreferences({
        theme: { mode: 'light', darkMode: false }
      });
    } finally {
      setLoading(false);
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

  const getPreference = (key, defaultValue = null) => {
    return preferences[key] !== undefined ? preferences[key] : defaultValue;
  };

  const value = {
    preferences,
    loading,
    darkMode,
    toggleDarkMode,
    updatePreference,
    bulkUpdatePreferences,
    deletePreference,
    getPreference,
    reloadPreferences: loadPreferences
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};