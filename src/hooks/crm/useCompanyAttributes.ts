import { useState, useEffect, useCallback } from 'react';
import companyAttributesAPI from '../../services/api/crm/companyAttributes';

// Module-level cache (shared across all hook instances)
let attributesCache: Record<string, string> | null = null;
let cacheTimestamp: number | null = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes (attributes rarely change)

interface CompanyAttribute {
  attribute_name: string;
  attribute_value: string;
}

interface SetResult {
  success: boolean;
  error?: string;
}

/**
 * Hook for managing company attributes (key-value settings)
 * Uses module-level caching to prevent duplicate API calls
 */
export const useCompanyAttributes = () => {
  const [attributes, setAttributes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all attributes
  const fetchAttributes = useCallback(async (): Promise<void> => {
    // Check cache first
    const now = Date.now();
    if (attributesCache && cacheTimestamp && (now - cacheTimestamp < CACHE_TTL)) {
      setAttributes(attributesCache);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await companyAttributesAPI.getAll();
      // Convert array to object for easier access
      const attributesObj = (result as CompanyAttribute[]).reduce((acc: Record<string, string>, attr: CompanyAttribute) => {
        acc[attr.attribute_name] = attr.attribute_value;
        return acc;
      }, {} as Record<string, string>);

      // Update cache
      attributesCache = attributesObj;
      cacheTimestamp = now;

      setAttributes(attributesObj);
    } catch (err: unknown) {
      setError((err as Error).message);
      console.error('Failed to fetch company attributes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

  // Get specific attribute value
  const getAttribute = useCallback(
    (name: string): string | null => {
      return attributes[name] || null;
    },
    [attributes]
  );

  // Set or update attribute
  const setAttribute = useCallback(
    async (name: string, value: string, description: string | null = null): Promise<SetResult> => {
      setError(null);
      try {
        await companyAttributesAPI.set(name, value, description);
        // Invalidate cache
        attributesCache = null;
        cacheTimestamp = null;
        // Update local state
        setAttributes((prev) => ({
          ...prev,
          [name]: value,
        }));
        return { success: true };
      } catch (err: unknown) {
        setError((err as Error).message);
        return { success: false, error: (err as Error).message };
      }
    },
    []
  );

  // Batch update attributes
  const batchUpdate = useCallback(async (attributesArray: unknown[]): Promise<SetResult> => {
    setError(null);
    try {
      await companyAttributesAPI.batchUpdate(attributesArray);
      // Invalidate cache before refresh
      attributesCache = null;
      cacheTimestamp = null;
      await fetchAttributes(); // Refresh all
      return { success: true };
    } catch (err: unknown) {
      setError((err as Error).message);
      return { success: false, error: (err as Error).message };
    }
  }, [fetchAttributes]);

  // Delete attribute
  const deleteAttribute = useCallback(
    async (name: string): Promise<SetResult> => {
      setError(null);
      try {
        await companyAttributesAPI.delete(name);
        // Invalidate cache
        attributesCache = null;
        cacheTimestamp = null;
        // Remove from local state
        setAttributes((prev) => {
          const newAttributes = { ...prev };
          delete newAttributes[name];
          return newAttributes;
        });
        return { success: true };
      } catch (err: unknown) {
        setError((err as Error).message);
        return { success: false, error: (err as Error).message };
      }
    },
    []
  );

  // Convenience methods for specific attributes
  const getIndustry = useCallback((): string | null => {
    return getAttribute('industry');
  }, [getAttribute]);

  const setIndustry = useCallback(
    async (industryId: string): Promise<SetResult> => {
      return await setAttribute('industry', industryId);
    },
    [setAttribute]
  );

  const getEmployeeCount = useCallback((): string | null => {
    return getAttribute('employee_count');
  }, [getAttribute]);

  const setEmployeeCount = useCallback(
    async (employeeRangeId: string): Promise<SetResult> => {
      return await setAttribute('employee_count', employeeRangeId);
    },
    [setAttribute]
  );

  const getNumberFormat = useCallback((): string | null => {
    return getAttribute('number_format');
  }, [getAttribute]);

  const setNumberFormat = useCallback(
    async (formatId: string): Promise<SetResult> => {
      return await setAttribute('number_format', formatId);
    },
    [setAttribute]
  );

  const getTimezone = useCallback((): string | null => {
    return getAttribute('timezone');
  }, [getAttribute]);

  const setTimezone = useCallback(
    async (timezone: string): Promise<SetResult> => {
      return await setAttribute('timezone', timezone);
    },
    [setAttribute]
  );

  return {
    attributes,
    loading,
    error,
    getAttribute,
    setAttribute,
    batchUpdate,
    deleteAttribute,
    // Convenience methods
    getIndustry,
    setIndustry,
    getEmployeeCount,
    setEmployeeCount,
    getNumberFormat,
    setNumberFormat,
    getTimezone,
    setTimezone,
    refresh: fetchAttributes,
  };
};

/**
 * Manually invalidate the company attributes cache
 * Useful for external updates or testing
 */
export const invalidateCompanyAttributesCache = (): void => {
  attributesCache = null;
  cacheTimestamp = null;
};
