import { useState, useEffect, useCallback, useRef } from 'react';
import servicesAPI from '../../services/api/crm/services';
import type { ServiceEnumsResponse } from '../../types/crm';

interface ServiceStatus {
  value: string;
  label: string;
  description?: string;
  [key: string]: unknown;
}

// Cache the enums since they rarely change
let cachedEnums: ServiceEnumsResponse | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Hook for fetching service enums (statuses, etc.)
 * Caches results to avoid repeated API calls
 */
export function useServiceEnums() {
  const [serviceStatuses, setServiceStatuses] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef<boolean>(false);

  const fetchEnums = useCallback(async (force: boolean = false): Promise<ServiceEnumsResponse> => {
    // Return cached data if still valid
    const now = Date.now();
    if (!force && cachedEnums && (now - cacheTimestamp) < CACHE_TTL) {
      setServiceStatuses(cachedEnums.service_statuses || []);
      return cachedEnums;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await servicesAPI.getEnums() as ServiceEnumsResponse;

      // Update cache
      cachedEnums = data;
      cacheTimestamp = now;

      setServiceStatuses(data.service_statuses || []);
      return data;
    } catch (err: unknown) {
      console.error('[useServiceEnums] Failed to fetch enums:', err);
      setError((err as Error).message);
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
  const getStatusByValue = useCallback((value: string): ServiceStatus | undefined => {
    return serviceStatuses.find((s) => s.value === value);
  }, [serviceStatuses]);

  // Helper to get status label
  const getStatusLabel = useCallback((value: string): string => {
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
