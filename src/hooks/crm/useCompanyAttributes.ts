import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import companyAttributesAPI from '../../services/api/crm/companyAttributes';
import { queryKeys } from '../../lib/query-keys';

interface CompanyAttribute {
  attribute_name: string;
  attribute_value: string;
}

interface SetResult {
  success: boolean;
  error?: string;
}

const ATTRIBUTES_STALE_TIME = 10 * 60 * 1000; // 10 minutes (attributes rarely change)

/**
 * Hook for managing company attributes (key-value settings)
 * Uses React Query for caching and deduplication
 */
export const useCompanyAttributes = () => {
  const queryClient = useQueryClient();

  // Query for all attributes
  const attributesQuery = useQuery({
    queryKey: queryKeys.companyAttributes.all,
    queryFn: async () => {
      const result = await companyAttributesAPI.getAll();
      // Convert array to object for easier access
      return (result as CompanyAttribute[]).reduce((acc: Record<string, string>, attr: CompanyAttribute) => {
        acc[attr.attribute_name] = attr.attribute_value;
        return acc;
      }, {} as Record<string, string>);
    },
    staleTime: ATTRIBUTES_STALE_TIME,
  });

  const attributes = attributesQuery.data || {};

  // Get specific attribute value
  const getAttribute = useCallback(
    (name: string): string | null => {
      return attributes[name] || null;
    },
    [attributes]
  );

  // Set or update attribute mutation
  const setMutation = useMutation({
    mutationFn: ({ name, value, description }: { name: string; value: string; description: string | null }) =>
      companyAttributesAPI.set(name, value, description),
    onSuccess: (_data, { name, value }) => {
      // Optimistically update cache
      queryClient.setQueryData(queryKeys.companyAttributes.all, (old: Record<string, string> | undefined) => ({
        ...old,
        [name]: value,
      }));
    },
  });

  const setAttribute = useCallback(
    async (name: string, value: string, description: string | null = null): Promise<SetResult> => {
      try {
        await setMutation.mutateAsync({ name, value, description });
        return { success: true };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
    [setMutation]
  );

  // Batch update mutation
  const batchMutation = useMutation({
    mutationFn: (attributesArray: unknown[]) => companyAttributesAPI.batchUpdate(attributesArray),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companyAttributes.all });
    },
  });

  const batchUpdate = useCallback(async (attributesArray: unknown[]): Promise<SetResult> => {
    try {
      await batchMutation.mutateAsync(attributesArray);
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  }, [batchMutation]);

  // Delete attribute mutation
  const deleteMutation = useMutation({
    mutationFn: (name: string) => companyAttributesAPI.delete(name),
    onSuccess: (_data, name) => {
      // Optimistically update cache
      queryClient.setQueryData(queryKeys.companyAttributes.all, (old: Record<string, string> | undefined) => {
        if (!old) return {};
        const newAttributes = { ...old };
        delete newAttributes[name];
        return newAttributes;
      });
    },
  });

  const deleteAttribute = useCallback(
    async (name: string): Promise<SetResult> => {
      try {
        await deleteMutation.mutateAsync(name);
        return { success: true };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
    [deleteMutation]
  );

  // Convenience methods for specific attributes
  const getIndustry = useCallback((): string | null => getAttribute('industry'), [getAttribute]);
  const setIndustry = useCallback(async (industryId: string): Promise<SetResult> => setAttribute('industry', industryId), [setAttribute]);
  const getEmployeeCount = useCallback((): string | null => getAttribute('employee_count'), [getAttribute]);
  const setEmployeeCount = useCallback(async (employeeRangeId: string): Promise<SetResult> => setAttribute('employee_count', employeeRangeId), [setAttribute]);
  const getNumberFormat = useCallback((): string | null => getAttribute('number_format'), [getAttribute]);
  const setNumberFormat = useCallback(async (formatId: string): Promise<SetResult> => setAttribute('number_format', formatId), [setAttribute]);
  const getTimezone = useCallback((): string | null => getAttribute('timezone'), [getAttribute]);
  const setTimezone = useCallback(async (timezone: string): Promise<SetResult> => setAttribute('timezone', timezone), [setAttribute]);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.companyAttributes.all });
  }, [queryClient]);

  return {
    attributes,
    loading: attributesQuery.isLoading,
    error: attributesQuery.error?.message || null,
    getAttribute,
    setAttribute,
    batchUpdate,
    deleteAttribute,
    getIndustry,
    setIndustry,
    getEmployeeCount,
    setEmployeeCount,
    getNumberFormat,
    setNumberFormat,
    getTimezone,
    setTimezone,
    refresh,
  };
};

/**
 * Manually invalidate the company attributes cache
 */
export const invalidateCompanyAttributesCache = (): void => {
  // This is now a no-op; use queryClient.invalidateQueries() instead
};
