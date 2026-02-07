import { useState, useEffect, useCallback, useMemo } from 'react';
import contactsAPI from '../../services/api/crm/contacts';

// Cache the fields data to avoid repeated API calls
let fieldsCache: Record<string, unknown> | null = null;
let fieldsCachePromise: Promise<unknown> | null = null;

/**
 * Custom hook for fetching and managing contact list field metadata
 * Used for dynamic column selection in the Clients tab
 */
export function useContactFields() {
  const [fields, setFields] = useState<unknown[]>((fieldsCache as any)?.fields || []);
  const [defaultFields, setDefaultFields] = useState<unknown[]>((fieldsCache as any)?.default_fields || []);
  const [allFieldNames, setAllFieldNames] = useState<string[]>((fieldsCache as any)?.all_field_names || []);
  const [loading, setLoading] = useState<boolean>(!fieldsCache);
  const [error, setError] = useState<string | null>(null);

  // Fetch fields from API
  const fetchFields = useCallback(async (forceRefresh: boolean = false): Promise<unknown> => {
    // Return cached data if available and not forcing refresh
    if (fieldsCache && !forceRefresh) {
      setFields((fieldsCache as any).fields);
      setDefaultFields((fieldsCache as any).default_fields);
      setAllFieldNames((fieldsCache as any).all_field_names);
      setLoading(false);
      return fieldsCache;
    }

    // If a fetch is already in progress, wait for it
    if (fieldsCachePromise && !forceRefresh) {
      try {
        const data = await fieldsCachePromise;
        setFields((data as any).fields);
        setDefaultFields((data as any).default_fields);
        setAllFieldNames((data as any).all_field_names);
        setLoading(false);
        return data;
      } catch (err: unknown) {
        setError((err as Error).message);
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
      fieldsCache = data as Record<string, unknown>;

      setFields((data as any).fields);
      setDefaultFields((data as any).default_fields);
      setAllFieldNames((data as any).all_field_names);

      return data;
    } catch (err: unknown) {
      console.error('[useContactFields] Failed to fetch fields:', err);
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
      fieldsCachePromise = null;
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchFields().catch((err: unknown) => {
      console.error('[useContactFields] Error fetching fields:', err);
    });
  }, [fetchFields]);

  // Group fields by category for UI organization
  const fieldsByCategory = useMemo((): Record<string, unknown[]> => {
    const grouped: Record<string, unknown[]> = {};
    fields.forEach((field: unknown) => {
      const category = (field as any).category || 'other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(field);
    });
    return grouped;
  }, [fields]);

  // Get field by name
  const getField = useCallback((fieldName: string): unknown => {
    return fields.find((f: unknown) => (f as any).name === fieldName);
  }, [fields]);

  // Get fields that should be visible by default
  const defaultVisibleFields = useMemo((): string[] => {
    return fields.filter((f: unknown) => (f as any).default_visible).map((f: unknown) => (f as any).name as string);
  }, [fields]);

  // Build default visibility object for preferences
  const defaultVisibility = useMemo((): Record<string, boolean> => {
    const visibility: Record<string, boolean> = {};
    fields.forEach((field: unknown) => {
      visibility[(field as any).name] = (field as any).default_visible || false;
    });
    return visibility;
  }, [fields]);

  // Clear cache (useful for testing or forced refresh)
  const clearCache = useCallback((): void => {
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
