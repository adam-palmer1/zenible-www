import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import contactsAPI from '../../services/api/crm/contacts';
import { queryKeys } from '../../lib/query-keys';
import type { ContactFieldsResponse, ContactFieldMetadata } from '../../types';

/**
 * Custom hook for fetching and managing contact list field metadata
 * Uses React Query for caching and deduplication
 */
export function useContactFields() {
  const queryClient = useQueryClient();

  const fieldsQuery = useQuery({
    queryKey: queryKeys.contactFields.all,
    queryFn: () => contactsAPI.getFields(),
  });

  const data = fieldsQuery.data as ContactFieldsResponse | undefined;
  const fields = data?.fields || [];
  const defaultFields = data?.default_fields || [];
  const allFieldNames = data?.all_field_names || [];

  // Group fields by category for UI organization
  const fieldsByCategory = useMemo((): Record<string, ContactFieldMetadata[]> => {
    const grouped: Record<string, ContactFieldMetadata[]> = {};
    fields.forEach((field: ContactFieldMetadata) => {
      const category = field.category || 'other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(field);
    });
    return grouped;
  }, [fields]);

  // Get field by name
  const getField = useCallback((fieldName: string): ContactFieldMetadata | undefined => {
    return fields.find((f: ContactFieldMetadata) => f.name === fieldName);
  }, [fields]);

  // Get fields that should be visible by default
  const defaultVisibleFields = useMemo((): string[] => {
    return fields.filter((f: ContactFieldMetadata) => f.default_visible).map((f: ContactFieldMetadata) => f.name);
  }, [fields]);

  // Build default visibility object for preferences
  const defaultVisibility = useMemo((): Record<string, boolean> => {
    const visibility: Record<string, boolean> = {};
    fields.forEach((field: ContactFieldMetadata) => {
      visibility[field.name] = field.default_visible || false;
    });
    return visibility;
  }, [fields]);

  // Fetch fields (for backwards compat)
  const fetchFields = useCallback(async (forceRefresh: boolean = false): Promise<ContactFieldsResponse> => {
    if (forceRefresh) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.contactFields.all });
    }
    return data || { fields: [], default_fields: [], all_field_names: [] } as ContactFieldsResponse;
  }, [queryClient, data]);

  // Clear cache
  const clearCache = useCallback((): void => {
    queryClient.invalidateQueries({ queryKey: queryKeys.contactFields.all });
  }, [queryClient]);

  return {
    fields,
    defaultFields,
    allFieldNames,
    fieldsByCategory,
    defaultVisibleFields,
    defaultVisibility,
    loading: fieldsQuery.isLoading,
    error: fieldsQuery.error?.message || null,
    fetchFields,
    getField,
    clearCache,
  };
}
