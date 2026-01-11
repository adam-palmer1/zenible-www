import { useState, useEffect, useCallback } from 'react';
import companyAttributesAPI from '../../services/api/crm/companyAttributes';

// Module-level cache (shared across all hook instances)
let attributesCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes (attributes rarely change)

/**
 * Hook for managing company attributes (key-value settings)
 * Uses module-level caching to prevent duplicate API calls
 */
export const useCompanyAttributes = () => {
  const [attributes, setAttributes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all attributes
  const fetchAttributes = useCallback(async () => {
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
      const attributesObj = result.reduce((acc, attr) => {
        acc[attr.attribute_name] = attr.attribute_value;
        return acc;
      }, {});

      // Update cache
      attributesCache = attributesObj;
      cacheTimestamp = now;

      setAttributes(attributesObj);
    } catch (err) {
      setError(err.message);
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
    (name) => {
      return attributes[name] || null;
    },
    [attributes]
  );

  // Set or update attribute
  const setAttribute = useCallback(
    async (name, value, description = null) => {
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
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      }
    },
    []
  );

  // Batch update attributes
  const batchUpdate = useCallback(async (attributesArray) => {
    setError(null);
    try {
      await companyAttributesAPI.batchUpdate(attributesArray);
      // Invalidate cache before refresh
      attributesCache = null;
      cacheTimestamp = null;
      await fetchAttributes(); // Refresh all
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [fetchAttributes]);

  // Delete attribute
  const deleteAttribute = useCallback(
    async (name) => {
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
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      }
    },
    []
  );

  // Convenience methods for specific attributes
  const getIndustry = useCallback(() => {
    return getAttribute('industry');
  }, [getAttribute]);

  const setIndustry = useCallback(
    async (industryId) => {
      return await setAttribute('industry', industryId);
    },
    [setAttribute]
  );

  const getEmployeeCount = useCallback(() => {
    return getAttribute('employee_count');
  }, [getAttribute]);

  const setEmployeeCount = useCallback(
    async (employeeRangeId) => {
      return await setAttribute('employee_count', employeeRangeId);
    },
    [setAttribute]
  );

  const getNumberFormat = useCallback(() => {
    return getAttribute('number_format');
  }, [getAttribute]);

  const setNumberFormat = useCallback(
    async (formatId) => {
      return await setAttribute('number_format', formatId);
    },
    [setAttribute]
  );

  const getTimezone = useCallback(() => {
    return getAttribute('timezone');
  }, [getAttribute]);

  const setTimezone = useCallback(
    async (timezone) => {
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
export const invalidateCompanyAttributesCache = () => {
  attributesCache = null;
  cacheTimestamp = null;
};
