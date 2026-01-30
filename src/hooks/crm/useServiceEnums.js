import { useState, useEffect, useCallback, useRef } from 'react';
import servicesAPI from '../../services/api/crm/services';

// Cache the enums since they rarely change
let cachedEnums = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Hook for fetching service enums (statuses, etc.)
 * Caches results to avoid repeated API calls
 */
export function useServiceEnums() {
  const [serviceStatuses, setServiceStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);

  const fetchEnums = useCallback(async (force = false) => {
    // Return cached data if still valid
    const now = Date.now();
    if (!force && cachedEnums && (now - cacheTimestamp) < CACHE_TTL) {
      setServiceStatuses(cachedEnums.service_statuses || []);
      return cachedEnums;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await servicesAPI.getEnums();

      // Update cache
      cachedEnums = data;
      cacheTimestamp = now;

      setServiceStatuses(data.service_statuses || []);
      return data;
    } catch (err) {
      console.error('[useServiceEnums] Failed to fetch enums:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchEnums();
    }
  }, [fetchEnums]);

  // Helper to get status by value
  const getStatusByValue = useCallback((value) => {
    return serviceStatuses.find(s => s.value === value);
  }, [serviceStatuses]);

  // Helper to get status label
  const getStatusLabel = useCallback((value) => {
    const status = getStatusByValue(value);
    return status?.label || value;
  }, [getStatusByValue]);

  return {
    serviceStatuses,
    loading,
    error,
    fetchEnums,
    getStatusByValue,
    getStatusLabel,
  };
}

export default useServiceEnums;
