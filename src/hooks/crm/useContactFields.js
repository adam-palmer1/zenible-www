import { useState, useEffect, useCallback, useMemo } from 'react';
import contactsAPI from '../../services/api/crm/contacts';

// Cache the fields data to avoid repeated API calls
let fieldsCache = null;
let fieldsCachePromise = null;

/**
 * Custom hook for fetching and managing contact list field metadata
 * Used for dynamic column selection in the Clients tab
 *
 * @returns {Object} Fields state and methods
 */
export function useContactFields() {
  const [fields, setFields] = useState(fieldsCache?.fields || []);
  const [defaultFields, setDefaultFields] = useState(fieldsCache?.default_fields || []);
  const [allFieldNames, setAllFieldNames] = useState(fieldsCache?.all_field_names || []);
  const [loading, setLoading] = useState(!fieldsCache);
  const [error, setError] = useState(null);

  // Fetch fields from API
  const fetchFields = useCallback(async (forceRefresh = false) => {
    // Return cached data if available and not forcing refresh
    if (fieldsCache && !forceRefresh) {
      setFields(fieldsCache.fields);
      setDefaultFields(fieldsCache.default_fields);
      setAllFieldNames(fieldsCache.all_field_names);
      setLoading(false);
      return fieldsCache;
    }

    // If a fetch is already in progress, wait for it
    if (fieldsCachePromise && !forceRefresh) {
      try {
        const data = await fieldsCachePromise;
        setFields(data.fields);
        setDefaultFields(data.default_fields);
        setAllFieldNames(data.all_field_names);
        setLoading(false);
        return data;
      } catch (err) {
        setError(err.message);
        setLoading(false);
        throw err;
      }
    }

    try {
      setLoading(true);
      setError(null);

      // Create a promise that can be shared across components
      fieldsCachePromise = contactsAPI.getFields();
      const data = await fieldsCachePromise;

      // Cache the result
      fieldsCache = data;

      setFields(data.fields);
      setDefaultFields(data.default_fields);
      setAllFieldNames(data.all_field_names);

      return data;
    } catch (err) {
      console.error('[useContactFields] Failed to fetch fields:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
      fieldsCachePromise = null;
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchFields().catch(err => {
      console.error('[useContactFields] Error fetching fields:', err);
    });
  }, [fetchFields]);

  // Group fields by category for UI organization
  const fieldsByCategory = useMemo(() => {
    const grouped = {};
    fields.forEach(field => {
      const category = field.category || 'other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(field);
    });
    return grouped;
  }, [fields]);

  // Get field by name
  const getField = useCallback((fieldName) => {
    return fields.find(f => f.name === fieldName);
  }, [fields]);

  // Get fields that should be visible by default
  const defaultVisibleFields = useMemo(() => {
    return fields.filter(f => f.default_visible).map(f => f.name);
  }, [fields]);

  // Build default visibility object for preferences
  const defaultVisibility = useMemo(() => {
    const visibility = {};
    fields.forEach(field => {
      visibility[field.name] = field.default_visible || false;
    });
    return visibility;
  }, [fields]);

  // Clear cache (useful for testing or forced refresh)
  const clearCache = useCallback(() => {
    fieldsCache = null;
    fieldsCachePromise = null;
  }, []);

  return {
    fields,
    defaultFields,
    allFieldNames,
    fieldsByCategory,
    defaultVisibleFields,
    defaultVisibility,
    loading,
    error,
    fetchFields,
    getField,
    clearCache,
  };
}
